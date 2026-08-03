import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { adminFetch } from "@/hooks/useAdminAuth";
import {
  parseOgolPaste,
  pairSubstitutions,
  normalizeOgolPlayerName,
  type OgolParseResult,
  type OgolSubPair,
} from "@/lib/ogol-paste";
import { positionGroup } from "@/lib/position-groups";

export type OgolRosterPlayer = {
  id: number;
  name: string;
  position: string | null;
  photoUrl?: string | null;
};

export type OgolManagerOption = {
  id: number;
  name: string;
};

export type OgolApplyPayload = {
  starters: { playerId: number; playerName: string; shirtNumber: number | null; position: string | null }[];
  bench: { playerId: number; playerName: string; shirtNumber: number | null; position: string | null }[];
  captainPlayerId: number | null;
  managerId: number | null;
  /** Players not in season roster — inject locally */
  extraPlayers: OgolRosterPlayer[];
  goals: { playerId: number; minute: string }[];
  assists: { playerId: number; minute: string }[];
  yellows: { playerId: number; minute: string }[];
  reds: { playerId: number; minute: string }[];
  penalties: { playerId: number; minute: string; eventType: "missed" | "saved" }[];
  substitutions: { playerOutId: number | null; playerInId: number | null; minute: string }[];
};

type NameResolution =
  | { status: "matched"; playerId: number; playerName: string; position: string | null; outsideRoster: boolean }
  | { status: "pending"; candidates: OgolRosterPlayer[]; createName: string };

type Divergence = {
  id: string;
  label: string;
  choice: "keep" | "ogol";
};

type Props = {
  open: boolean;
  onClose: () => void;
  roster: OgolRosterPlayer[];
  managers: OgolManagerOption[];
  allManagers: OgolManagerOption[];
  /** Current ficha values for divergence detection */
  current: {
    shirtByPlayerId: Record<number, string>;
    starterIds: Set<number>;
    benchIds: Set<number>;
    captainPlayerId: number | null;
    managerId: number | null;
  };
  onApply: (payload: OgolApplyPayload) => void;
};

function findLocalMatches(name: string, roster: OgolRosterPlayer[]): OgolRosterPlayer[] {
  const key = normalizeOgolPlayerName(name);
  const exact = roster.filter((p) => normalizeOgolPlayerName(p.name) === key);
  if (exact.length) return exact;
  return roster.filter((p) => {
    const n = normalizeOgolPlayerName(p.name);
    return n.includes(key) || key.includes(n);
  });
}

export function OgolPasteDialog({
  open,
  onClose,
  roster,
  managers,
  allManagers,
  current,
  onApply,
}: Props) {
  const [step, setStep] = useState<"paste" | "review">("paste");
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<OgolParseResult | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, NameResolution>>({});
  const [managerRes, setManagerRes] = useState<{
    status: "matched" | "pending" | "none";
    managerId?: number;
    candidates?: OgolManagerOption[];
    createName?: string;
  }>({ status: "none" });
  const [divergences, setDivergences] = useState<Divergence[]>([]);
  const [subs, setSubs] = useState<OgolSubPair[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const rosterById = useMemo(() => {
    const m = new Map<number, OgolRosterPlayer>();
    for (const p of roster) m.set(p.id, p);
    return m;
  }, [roster]);

  if (!open) return null;

  async function searchPlayers(name: string): Promise<OgolRosterPlayer[]> {
    const r = await adminFetch(
      `/admin/players/name-check?q=${encodeURIComponent(name)}`,
    );
    if (!r.ok) return [];
    const data = await r.json();
    const list = Array.isArray(data.matches) ? data.matches : [];
    return list.map(
      (p: {
        id: number;
        name: string;
        position?: string | null;
        photoUrl?: string | null;
      }) => ({
        id: p.id,
        name: p.name,
        position: p.position ?? null,
        photoUrl: p.photoUrl ?? null,
      }),
    );
  }

  async function createPlayer(name: string): Promise<OgolRosterPlayer> {
    const r = await adminFetch("/admin/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, verificationStatus: "unverified" }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error ?? "Falha ao criar jogador");
    }
    const p = await r.json();
    return {
      id: p.id,
      name: p.name,
      position: p.position ?? null,
      photoUrl: p.photoUrl ?? null,
    };
  }

  async function createManager(name: string): Promise<OgolManagerOption> {
    const r = await adminFetch("/admin/managers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, verificationStatus: "unverified" }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.error ?? "Falha ao criar técnico");
    }
    const m = await r.json();
    return { id: m.id, name: m.name };
  }

  async function interpret() {
    setError("");
    setBusy(true);
    try {
      const result = parseOgolPaste(text);
      setParsed(result);

      const resMap: Record<string, NameResolution> = {};
      for (const p of result.players) {
        const key = normalizeOgolPlayerName(p.name);
        const local = findLocalMatches(p.name, roster);
        if (local.length === 1) {
          resMap[key] = {
            status: "matched",
            playerId: local[0].id,
            playerName: local[0].name,
            position: local[0].position,
            outsideRoster: false,
          };
        } else {
          const remote = await searchPlayers(p.name);
          const merged = [
            ...local,
            ...remote.filter((r) => !local.some((l) => l.id === r.id)),
          ];
          if (merged.length === 1) {
            const hit = merged[0];
            resMap[key] = {
              status: "matched",
              playerId: hit.id,
              playerName: hit.name,
              position: hit.position,
              outsideRoster: !roster.some((r) => r.id === hit.id),
            };
          } else {
            resMap[key] = {
              status: "pending",
              candidates: merged.slice(0, 12),
              createName: p.name,
            };
          }
        }
      }
      setResolutions(resMap);

      // Manager
      if (result.managerName) {
        const mk = normalizeOgolPlayerName(result.managerName);
        const pool = [...managers, ...allManagers];
        const hits = pool.filter(
          (m) => normalizeOgolPlayerName(m.name) === mk,
        );
        const soft = hits.length
          ? hits
          : pool.filter((m) => {
              const n = normalizeOgolPlayerName(m.name);
              return n.includes(mk) || mk.includes(n);
            });
        const uniq = [...new Map(soft.map((m) => [m.id, m])).values()];
        if (uniq.length === 1) {
          setManagerRes({ status: "matched", managerId: uniq[0].id });
        } else {
          setManagerRes({
            status: "pending",
            candidates: uniq.slice(0, 12),
            createName: result.managerName,
          });
        }
      } else {
        setManagerRes({ status: "none" });
      }

      // Re-pair subs with positions once we have local matches
      const posMap = new Map<string, string | null>();
      for (const p of result.players) {
        const key = normalizeOgolPlayerName(p.name);
        const r = resMap[key];
        if (r?.status === "matched") posMap.set(key, r.position);
      }
      // Rebuild outs/ins from parsed substitutions unpaired + paired
      // Simpler: re-parse raw outs/ins from result by splitting unpaired notes
      // Actually parseOgolPaste already paired without positions. Re-run pair from scratch:
      const outs = result.substitutions
        .filter((s) => s.playerOutName)
        .map((s) => ({ playerName: s.playerOutName, minute: s.minute }));
      const ins = result.substitutions
        .filter((s) => s.playerInName)
        .map((s) => ({ playerName: s.playerInName, minute: s.minute }));
      // Dedupe outs/ins that were duplicated when unpaired
      const dedupe = <T extends { playerName: string; minute: number }>(arr: T[]) => {
        const seen = new Set<string>();
        return arr.filter((x) => {
          const k = `${x.minute}|${normalizeOgolPlayerName(x.playerName)}`;
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
      };
      const { pairs } = pairSubstitutions(
        dedupe(outs),
        dedupe(ins),
        posMap,
        (pos) => positionGroup(pos),
      );
      setSubs(pairs);

      // Divergences vs current ficha (shirts / captain / manager) — only when matched
      const divs: Divergence[] = [];
      for (const p of result.players) {
        const key = normalizeOgolPlayerName(p.name);
        const r = resMap[key];
        if (r?.status !== "matched") continue;
        const curShirt = current.shirtByPlayerId[r.playerId]?.trim() ?? "";
        const ogolShirt = p.shirtNumber != null ? String(p.shirtNumber) : "";
        if (curShirt && ogolShirt && curShirt !== ogolShirt) {
          divs.push({
            id: `shirt-${r.playerId}`,
            label: `${r.playerName} — camisa: ficha tem ${curShirt}, Ogol diz ${ogolShirt}`,
            choice: "keep",
          });
        }
      }
      if (
        current.captainPlayerId != null &&
        result.captainName &&
        resMap[normalizeOgolPlayerName(result.captainName)]?.status === "matched"
      ) {
        const ogolCap =
          resMap[normalizeOgolPlayerName(result.captainName)] as Extract<
            NameResolution,
            { status: "matched" }
          >;
        if (ogolCap.playerId !== current.captainPlayerId) {
          const curName =
            rosterById.get(current.captainPlayerId)?.name ??
            `#${current.captainPlayerId}`;
          divs.push({
            id: "captain",
            label: `Capitão: ficha tem ${curName}, Ogol diz ${ogolCap.playerName}`,
            choice: "keep",
          });
        }
      }
      setDivergences(divs);
      setStep("review");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao interpretar");
    }
    setBusy(false);
  }

  function resolveName(key: string, player: OgolRosterPlayer, outsideRoster: boolean) {
    setResolutions((prev) => ({
      ...prev,
      [key]: {
        status: "matched",
        playerId: player.id,
        playerName: player.name,
        position: player.position,
        outsideRoster,
      },
    }));
  }

  async function resolveCreate(key: string, name: string) {
    setBusy(true);
    setError("");
    try {
      const p = await createPlayer(name);
      resolveName(key, p, true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao criar jogador");
    }
    setBusy(false);
  }

  async function resolveManagerCreate(name: string) {
    setBusy(true);
    setError("");
    try {
      const m = await createManager(name);
      setManagerRes({ status: "matched", managerId: m.id });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao criar técnico");
    }
    setBusy(false);
  }

  function idForName(name: string): number | null {
    const r = resolutions[normalizeOgolPlayerName(name)];
    return r?.status === "matched" ? r.playerId : null;
  }

  function apply() {
    if (!parsed) return;
    const pending = Object.values(resolutions).some((r) => r.status === "pending");
    if (pending || managerRes.status === "pending") {
      setError("Resolva todos os nomes pendentes antes de aplicar.");
      return;
    }

    const divChoice = (id: string) =>
      divergences.find((d) => d.id === id)?.choice ?? "ogol";

    const starters: OgolApplyPayload["starters"] = [];
    const bench: OgolApplyPayload["bench"] = [];
    const extraPlayers: OgolRosterPlayer[] = [];
    const seenExtra = new Set<number>();

    for (const p of parsed.players) {
      const key = normalizeOgolPlayerName(p.name);
      const r = resolutions[key];
      if (r?.status !== "matched") continue;
      const shirtDiv = divergences.find((d) => d.id === `shirt-${r.playerId}`);
      let shirt = p.shirtNumber;
      if (shirtDiv?.choice === "keep") {
        const cur = current.shirtByPlayerId[r.playerId];
        shirt = cur ? Number(cur) : shirt;
      }
      // Only fill empty shirts / roles — but starters/bench from Ogol always proposed;
      // parent apply logic fills only empty checkboxes.
      const row = {
        playerId: r.playerId,
        playerName: r.playerName,
        shirtNumber: shirt,
        position: r.position,
      };
      if (p.role === "starter") starters.push(row);
      else bench.push(row);
      if (r.outsideRoster && !seenExtra.has(r.playerId)) {
        extraPlayers.push({
          id: r.playerId,
          name: r.playerName,
          position: r.position,
        });
        seenExtra.add(r.playerId);
      }
    }

    let captainPlayerId: number | null = current.captainPlayerId;
    if (parsed.captainName) {
      const ogolCapId = idForName(parsed.captainName);
      const capDiv = divergences.find((d) => d.id === "captain");
      if (capDiv?.choice === "keep") {
        captainPlayerId = current.captainPlayerId;
      } else if (ogolCapId != null) {
        // Only set if empty OR user chose ogol on divergence OR no current
        if (current.captainPlayerId == null || capDiv?.choice === "ogol") {
          captainPlayerId = ogolCapId;
        } else if (current.captainPlayerId === ogolCapId) {
          captainPlayerId = ogolCapId;
        }
        // if current set and different and no divergence choice kept default keep — already handled
        if (current.captainPlayerId != null && current.captainPlayerId !== ogolCapId && !capDiv) {
          // shouldn't happen — we always create divergence
          captainPlayerId = current.captainPlayerId;
        }
        if (capDiv?.choice === "ogol") captainPlayerId = ogolCapId;
      }
    }

    let managerId: number | null = current.managerId;
    if (managerRes.status === "matched" && managerRes.managerId != null) {
      if (current.managerId == null) managerId = managerRes.managerId;
      else if (current.managerId !== managerRes.managerId) {
        // treat as auto-ogol only if empty; if conflict without UI div, keep ficha
        managerId = current.managerId;
      } else {
        managerId = current.managerId;
      }
    }

    const goals = parsed.goals
      .map((g) => {
        const id = idForName(g.playerName);
        return id != null ? { playerId: id, minute: String(g.minute) } : null;
      })
      .filter(Boolean) as { playerId: number; minute: string }[];

    const assists = parsed.assists
      .map((a) => {
        const id = idForName(a.playerName);
        return id != null ? { playerId: id, minute: String(a.minute) } : null;
      })
      .filter(Boolean) as { playerId: number; minute: string }[];

    const yellows = parsed.cards
      .filter((c) => c.cardType === "yellow")
      .map((c) => {
        const id = idForName(c.playerName);
        return id != null ? { playerId: id, minute: String(c.minute) } : null;
      })
      .filter(Boolean) as { playerId: number; minute: string }[];

    const reds = parsed.cards
      .filter((c) => c.cardType === "red")
      .map((c) => {
        const id = idForName(c.playerName);
        return id != null ? { playerId: id, minute: String(c.minute) } : null;
      })
      .filter(Boolean) as { playerId: number; minute: string }[];

    const penalties = parsed.penalties
      .map((pe) => {
        const id = idForName(pe.playerName);
        return id != null
          ? { playerId: id, minute: String(pe.minute), eventType: pe.eventType }
          : null;
      })
      .filter(Boolean) as OgolApplyPayload["penalties"];

    const substitutions = subs.map((s) => ({
      playerOutId: s.playerOutName ? idForName(s.playerOutName) : null,
      playerInId: s.playerInName ? idForName(s.playerInName) : null,
      minute: String(s.minute),
    }));

    // Silence unused
    void divChoice;

    onApply({
      starters,
      bench,
      captainPlayerId,
      managerId,
      extraPlayers,
      goals,
      assists,
      yellows,
      reds,
      penalties,
      substitutions,
    });
    onClose();
    setStep("paste");
    setText("");
    setParsed(null);
  }

  const pendingNames = Object.entries(resolutions).filter(
    ([, r]) => r.status === "pending",
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl my-6 border">
        <div className="px-4 py-3 border-b flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-[#1B3A6B]">Colar do Ogol</h2>
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-800"
            onClick={() => {
              onClose();
              setStep("paste");
            }}
          >
            Fechar
          </button>
        </div>

        <div className="p-4 space-y-4">
          {error && <p className="text-sm text-red-600">{error}</p>}

          {step === "paste" && (
            <>
              <p className="text-xs text-gray-500">
                Cole o texto da ficha do Ogol (lado CSA). Nada é salvo até você
                gravar Escalação / Eventos / Subs depois de aplicar.
              </p>
              <textarea
                className="w-full min-h-[220px] border rounded-md p-3 text-sm font-mono"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="CSA&#10;1&#10;Wellerson&#10;R&#10;63'&#10;…"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-[#1B3A6B]"
                  disabled={!text.trim() || busy}
                  onClick={interpret}
                >
                  {busy ? "Interpretando…" : "Interpretar"}
                </Button>
              </div>
            </>
          )}

          {step === "review" && parsed && (
            <>
              {parsed.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded px-3 py-2 text-xs text-amber-900 space-y-0.5">
                  {parsed.warnings.map((w, i) => (
                    <p key={i}>⚠ {w}</p>
                  ))}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="border rounded p-3 space-y-1">
                  <p className="text-[11px] uppercase text-gray-500 font-semibold">
                    Escalação
                  </p>
                  <p className="text-xs text-gray-500">
                    {parsed.players.filter((p) => p.role === "starter").length}{" "}
                    titulares ·{" "}
                    {parsed.players.filter((p) => p.role === "bench").length} reservas
                    {parsed.captainName ? ` · C: ${parsed.captainName}` : ""}
                  </p>
                  <ul className="text-xs max-h-40 overflow-y-auto space-y-0.5">
                    {parsed.players.map((p) => (
                      <li key={`${p.role}-${p.shirtNumber}-${p.name}`}>
                        <span className="text-gray-400 tabular-nums w-6 inline-block">
                          {p.shirtNumber ?? "–"}
                        </span>{" "}
                        {p.name}
                        {p.isCaptain ? " (C)" : ""}{" "}
                        <span className="text-gray-400">
                          {p.role === "starter" ? "Tit." : "Res."}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {parsed.managerName && (
                    <p className="text-xs pt-1 border-t mt-1">
                      Técnico: <strong>{parsed.managerName}</strong>
                    </p>
                  )}
                </div>
                <div className="border rounded p-3 space-y-1">
                  <p className="text-[11px] uppercase text-gray-500 font-semibold">
                    Eventos
                  </p>
                  <ul className="text-xs max-h-40 overflow-y-auto space-y-0.5">
                    {parsed.goals.map((g, i) => (
                      <li key={`g-${i}`}>
                        ⚽ {g.playerName} {g.minute}&apos;
                      </li>
                    ))}
                    {parsed.assists.map((a, i) => (
                      <li key={`a-${i}`}>
                        B {a.playerName} {a.minute}&apos;
                      </li>
                    ))}
                    {parsed.cards.map((c, i) => (
                      <li key={`c-${i}`}>
                        {c.cardType === "yellow" ? "🟨" : "🟥"} {c.playerName}{" "}
                        {c.minute}&apos;
                      </li>
                    ))}
                    {parsed.penalties.map((pe, i) => (
                      <li key={`p-${i}`}>
                        {pe.eventType === "missed" ? "A" : "C"} {pe.playerName}{" "}
                        {pe.minute}&apos;
                      </li>
                    ))}
                    {subs.map((s, i) => (
                      <li key={`s-${i}`} className={s.paired ? "" : "text-amber-700"}>
                        {s.minute}&apos;{" "}
                        {s.playerOutName || "?"} → {s.playerInName || "?"}
                        {!s.paired ? " (solto)" : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {pendingNames.length > 0 && (
                <div className="border border-amber-200 bg-amber-50 rounded p-3 space-y-3">
                  <p className="text-xs font-semibold text-amber-900">
                    ⚠ Nomes sem match no elenco ({pendingNames.length})
                  </p>
                  {pendingNames.map(([key, r]) => {
                    if (r.status !== "pending") return null;
                    return (
                      <div key={key} className="text-sm space-y-1">
                        <p className="font-medium">&quot;{r.createName}&quot;</p>
                        <div className="flex flex-wrap gap-2 items-center">
                          <select
                            className="border rounded px-2 py-1 text-sm bg-white min-w-[12rem]"
                            defaultValue=""
                            onChange={(e) => {
                              const id = Number(e.target.value);
                              const hit = r.candidates.find((c) => c.id === id);
                              if (hit) {
                                resolveName(
                                  key,
                                  hit,
                                  !roster.some((x) => x.id === hit.id),
                                );
                              }
                            }}
                          >
                            <option value="">Escolher existente…</option>
                            {r.candidates.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name} #{c.id}
                              </option>
                            ))}
                          </select>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={busy}
                            onClick={() => resolveCreate(key, r.createName)}
                          >
                            Criar novo
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {managerRes.status === "pending" && (
                <div className="border border-amber-200 bg-amber-50 rounded p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-900">
                    ⚠ Técnico sem match
                  </p>
                  <p className="text-sm font-medium">
                    &quot;{managerRes.createName}&quot;
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <select
                      className="border rounded px-2 py-1 text-sm bg-white min-w-[12rem]"
                      defaultValue=""
                      onChange={(e) => {
                        const id = Number(e.target.value);
                        if (id)
                          setManagerRes({ status: "matched", managerId: id });
                      }}
                    >
                      <option value="">Escolher existente…</option>
                      {(managerRes.candidates ?? []).map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} #{m.id}
                        </option>
                      ))}
                    </select>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        managerRes.createName &&
                        resolveManagerCreate(managerRes.createName)
                      }
                    >
                      Criar novo
                    </Button>
                  </div>
                </div>
              )}

              {divergences.length > 0 && (
                <div className="border border-orange-200 bg-orange-50 rounded p-3 space-y-2">
                  <p className="text-xs font-semibold text-orange-900">
                    ⚠ Divergências (já preenchido ≠ Ogol)
                  </p>
                  {divergences.map((d) => (
                    <div
                      key={d.id}
                      className="flex flex-wrap items-center justify-between gap-2 text-sm"
                    >
                      <span>{d.label}</span>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          variant={d.choice === "keep" ? "default" : "outline"}
                          className={d.choice === "keep" ? "bg-[#1B3A6B]" : ""}
                          onClick={() =>
                            setDivergences((prev) =>
                              prev.map((x) =>
                                x.id === d.id ? { ...x, choice: "keep" } : x,
                              ),
                            )
                          }
                        >
                          Manter ficha
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={d.choice === "ogol" ? "default" : "outline"}
                          className={d.choice === "ogol" ? "bg-[#1B3A6B]" : ""}
                          onClick={() =>
                            setDivergences((prev) =>
                              prev.map((x) =>
                                x.id === d.id ? { ...x, choice: "ogol" } : x,
                              ),
                            )
                          }
                        >
                          Usar Ogol
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-between gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep("paste")}
                >
                  Voltar ao texto
                </Button>
                <Button
                  type="button"
                  className="bg-[#1B3A6B]"
                  disabled={busy}
                  onClick={apply}
                >
                  Aplicar na ficha
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
