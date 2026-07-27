import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  applyNameUfSuffix,
  BRAZIL_UFS,
  lookupCitiesByName,
  nameAlreadyHasUfSuffix,
  uniqueUfsForCityName,
  type BrCity,
} from "@/lib/br-locations";
import { ChevronLeft } from "lucide-react";

export type Opponent = {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  homeStadiumId?: number | null;
};

type HomeStadium = {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  capacity: number | null;
};

type OpponentMatch = {
  id: number;
  matchDate: string;
  season: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  competitionName: string;
  stadiumName: string | null;
  isFriendly: boolean;
};

type OpponentDetail = Opponent & {
  matches: OpponentMatch[];
  homeStadium?: HomeStadium | null;
};

type OpponentPayload = {
  name: string;
  city: string | null;
  state: string | null;
  homeStadiumId?: number | null;
};

type TabId = "perfil" | "historico";

function fmtDate(d: string) {
  return new Date(d.includes("T") ? d : `${d}T12:00:00`).toLocaleDateString("pt-BR");
}

function OpponentProfileForm({
  initial,
  onSave,
  isNew,
}: {
  initial?: Partial<Opponent>;
  onSave: (data: OpponentPayload) => Promise<void>;
  isNew: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [citySuggestions, setCitySuggestions] = useState<BrCity[]>([]);
  const [cityAmbiguity, setCityAmbiguity] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [suffixNote, setSuffixNote] = useState("");

  useEffect(() => {
    setName(initial?.name ?? "");
    setCity(initial?.city ?? "");
    setState(initial?.state ?? "");
    setCitySuggestions([]);
    setCityAmbiguity([]);
    setSuffixNote("");
  }, [initial]);

  useEffect(() => {
    const matches = lookupCitiesByName(city, 12);
    setCitySuggestions(matches);
    const ufs = uniqueUfsForCityName(city);
    setCityAmbiguity(ufs.length > 1 ? ufs : []);
    if (ufs.length === 1 && !state) {
      setState(ufs[0]);
    }
  }, [city]); // eslint-disable-line react-hooks/exhaustive-deps -- only react to city typing

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    setSuffixNote("");
    try {
      await onSave({
        name: name.trim(),
        city: city.trim() || null,
        state: state.trim() ? state.trim().toUpperCase() : null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
    setSaving(false);
  }

  function applySuffix() {
    if (!state.trim()) {
      setError("Defina a UF antes de aplicar o sufixo");
      return;
    }
    if (!name.trim()) {
      setError("Defina o nome antes de aplicar o sufixo");
      return;
    }
    const next = applyNameUfSuffix(name, state);
    setName(next);
    setSuffixNote(`Sufixo aplicado: ${next}. Clique em Salvar para gravar no banco.`);
    setError("");
  }

  const canApplySuffix =
    !!name.trim()
    && !!state.trim()
    && !nameAlreadyHasUfSuffix(name, state);

  return (
    <form onSubmit={submit} className="space-y-4 max-w-xl">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Nome *
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-9"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Cidade
          </label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            list="br-city-suggestions"
            placeholder="ex: Maceió"
            className="h-9"
          />
          <datalist id="br-city-suggestions">
            {citySuggestions.map((c) => (
              <option key={`${c.name}-${c.uf}`} value={c.name}>
                {c.uf}
              </option>
            ))}
          </datalist>
          {cityAmbiguity.length > 1 && (
            <div className="mt-2">
              <p className="text-[11px] text-amber-700 mb-1">
                Cidade existe em mais de um estado — escolha a UF:
              </p>
              <Select value={state || undefined} onValueChange={setState}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Desambiguar UF" />
                </SelectTrigger>
                <SelectContent>
                  {cityAmbiguity.map((uf) => (
                    <SelectItem key={uf} value={uf} className="text-xs">
                      {city.trim()}-{uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Estado (UF)
          </label>
          <Select
            value={state || "__none__"}
            onValueChange={(v) => setState(v === "__none__" ? "" : v)}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="UF" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {BRAZIL_UFS.map((uf) => (
                <SelectItem key={uf} value={uf}>
                  {uf}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canApplySuffix}
          onClick={applySuffix}
        >
          Aplicar sufixo ao nome
        </Button>
        {state && (
          <span className="text-xs text-gray-500">
            Ex.: {applyNameUfSuffix(name || "Nome", state)}
          </span>
        )}
      </div>
      {suffixNote && <p className="text-xs text-green-700">{suffixNote}</p>}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="bg-[#1B3A6B]" disabled={saving}>
        {saving ? "Salvando…" : isNew ? "Criar adversário" : "Salvar"}
      </Button>
    </form>
  );
}

function formatStadiumLabel(s: {
  name: string;
  city?: string | null;
  state?: string | null;
  capacity?: number | null;
}) {
  const bits = [s.name];
  const place = [s.city, s.state].filter(Boolean).join("/");
  if (place) bits.push(place);
  if (s.capacity != null) bits.push(`cap. ${s.capacity.toLocaleString("pt-BR")}`);
  return bits.join(" · ");
}

function HomeStadiumSection({
  opponentId,
  opponentName,
  current,
  defaultCity,
  defaultState,
  onChanged,
}: {
  opponentId: number;
  opponentName: string;
  current: HomeStadium | null | undefined;
  defaultCity: string | null;
  defaultState: string | null;
  onChanged: () => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<HomeStadium[]>([]);
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [stadiumName, setStadiumName] = useState("");
  const [stadiumCity, setStadiumCity] = useState(defaultCity ?? "");
  const [stadiumState, setStadiumState] = useState(defaultState ?? "");
  const [stadiumCapacity, setStadiumCapacity] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      const r = await adminFetch(
        `/admin/stadiums/search?q=${encodeURIComponent(term)}&limit=15`,
      );
      if (!r.ok || cancelled) return;
      const data = (await r.json()) as HomeStadium[];
      if (!cancelled) {
        setResults(Array.isArray(data) ? data : []);
        setOpen(true);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query]);

  async function linkStadium(stadiumId: number | null) {
    setBusy(true);
    setError("");
    try {
      const r = await adminFetch(`/admin/opponents/${opponentId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: opponentName,
          city: defaultCity,
          state: defaultState,
          homeStadiumId: stadiumId,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao vincular");
      }
      setQuery("");
      setCreating(false);
      await onChanged();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro");
    }
    setBusy(false);
  }

  async function createAndLink(e: React.FormEvent) {
    e.preventDefault();
    if (!stadiumName.trim()) return;
    setBusy(true);
    setError("");
    try {
      const body: {
        name: string;
        city?: string | null;
        state?: string | null;
        capacity?: number | null;
      } = {
        name: stadiumName.trim(),
        city: stadiumCity.trim() || null,
        state: stadiumState.trim() ? stadiumState.trim().toUpperCase() : null,
      };
      if (stadiumCapacity.trim()) {
        body.capacity = parseInt(stadiumCapacity, 10);
      }
      const created = await adminFetch("/admin/stadiums", {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!created.ok) {
        const err = await created.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao criar estádio");
      }
      const stadium = (await created.json()) as HomeStadium;
      await linkStadium(stadium.id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro");
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 pt-6 border-t max-w-xl space-y-3">
      <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
        Estádio sede
      </h2>

      {current ? (
        <div className="rounded border bg-white px-3 py-2 text-sm">
          <p className="font-medium">{formatStadiumLabel(current)}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            <Link
              href={`/estadios/${current.id}`}
              className="text-xs text-[#1B3A6B] hover:underline"
            >
              Ver página pública
            </Link>
            <button
              type="button"
              className="text-xs text-red-600 hover:underline"
              disabled={busy}
              onClick={() => linkStadium(null)}
            >
              Remover vínculo
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-500">Nenhum estádio sede vinculado.</p>
      )}

      <div ref={rootRef} className="relative">
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Buscar estádio existente
        </label>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nome, cidade ou UF"
          className="h-8 text-xs"
          autoComplete="off"
        />
        {open && query.trim().length >= 2 && (
          <ul className="absolute z-30 mt-1 w-full max-h-56 overflow-auto rounded-md border bg-white shadow-md text-xs">
            {results.length === 0 ? (
              <li className="px-3 py-2 text-gray-400">Nenhum estádio</li>
            ) : (
              results.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                    disabled={busy}
                    onClick={() => linkStadium(s.id)}
                  >
                    {formatStadiumLabel(s)}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {!creating ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setCreating(true);
            setStadiumName("");
            setStadiumCity(defaultCity ?? "");
            setStadiumState(defaultState ?? "");
            setStadiumCapacity("");
          }}
        >
          Criar estádio sede
        </Button>
      ) : (
        <form onSubmit={createAndLink} className="space-y-2 rounded border p-3 bg-gray-50">
          <p className="text-xs font-semibold text-gray-600 uppercase">Novo estádio</p>
          <Input
            value={stadiumName}
            onChange={(e) => setStadiumName(e.target.value)}
            placeholder="Nome do estádio *"
            className="h-8 text-xs"
            required
          />
          <div className="grid grid-cols-3 gap-2">
            <Input
              value={stadiumCity}
              onChange={(e) => setStadiumCity(e.target.value)}
              placeholder="Cidade"
              className="h-8 text-xs"
            />
            <Select
              value={stadiumState || "__none__"}
              onValueChange={(v) => setStadiumState(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {BRAZIL_UFS.map((uf) => (
                  <SelectItem key={uf} value={uf} className="text-xs">
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={stadiumCapacity}
              onChange={(e) => setStadiumCapacity(e.target.value)}
              placeholder="Capacidade"
              className="h-8 text-xs"
              inputMode="numeric"
            />
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="bg-[#1B3A6B]" disabled={busy}>
              {busy ? "…" : "Criar e vincular"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setCreating(false)}
              disabled={busy}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function OpponentHistory({ matches }: { matches: OpponentMatch[] }) {
  if (matches.length === 0) {
    return <p className="text-sm text-gray-400">Nenhuma partida cadastrada contra este adversário.</p>;
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Data</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Competição</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Placar</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Local</th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <tr key={m.id} className="border-b hover:bg-gray-50">
              <td className="px-3 py-2 whitespace-nowrap">
                <Link href={`/admin/partidas`} className="text-[#1B3A6B] hover:underline">
                  {fmtDate(m.matchDate)}
                </Link>
                <span className="block text-[10px] text-gray-400">{m.season}</span>
              </td>
              <td className="px-3 py-2">
                {m.competitionName}
                {m.isFriendly ? (
                  <span className="ml-1 text-[10px] text-amber-600">amistoso</span>
                ) : null}
              </td>
              <td className="px-3 py-2 font-medium">
                {m.goalsFor ?? "–"}–{m.goalsAgainst ?? "–"}
                <span className="ml-2 text-xs text-gray-400 uppercase">{m.result}</span>
              </td>
              <td className="px-3 py-2 text-gray-600">
                {m.homeAway === "home" ? "Casa" : m.homeAway === "away" ? "Fora" : m.homeAway}
                {m.stadiumName ? ` · ${m.stadiumName}` : ""}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminOpponentDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isNew = params.id === "novo";
  const opponentId = isNew ? null : parseInt(params.id ?? "", 10);

  const [tab, setTab] = useState<TabId>("perfil");
  const [detail, setDetail] = useState<OpponentDetail | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (opponentId == null || Number.isNaN(opponentId)) return;
    setLoading(true);
    setError("");
    const r = await adminFetch(`/admin/opponents/${opponentId}`);
    if (!r.ok) {
      setError("Adversário não encontrado");
      setDetail(null);
    } else {
      setDetail(await r.json());
    }
    setLoading(false);
  }, [opponentId]);

  useEffect(() => {
    if (isNew) {
      setDetail(null);
      setLoading(false);
      setTab("perfil");
      return;
    }
    load();
  }, [isNew, load]);

  async function save(data: OpponentPayload) {
    if (isNew) {
      const r = await adminFetch("/admin/opponents", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao criar");
      }
      const created = (await r.json()) as Opponent;
      setLocation(`/admin/adversarios/${created.id}`);
      return;
    }
    const r = await adminFetch(`/admin/opponents/${opponentId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Erro ao salvar");
    }
    await load();
  }

  const tabs = useMemo(() => {
    const base: { id: TabId; label: string }[] = [{ id: "perfil", label: "Perfil" }];
    if (!isNew) base.push({ id: "historico", label: "Histórico" });
    return base;
  }, [isNew]);

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando...</p>;
  }

  if (!isNew && (error || !detail)) {
    return (
      <div>
        <Link href="/admin/adversarios" className="text-sm text-gray-500 hover:text-gray-800 inline-flex items-center mb-3">
          <ChevronLeft size={14} className="mr-1" /> Adversários
        </Link>
        <p className="text-sm text-red-600">{error || "Não encontrado"}</p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/adversarios"
        className="text-sm text-gray-500 hover:text-gray-800 inline-flex items-center mb-3"
      >
        <ChevronLeft size={14} className="mr-1" /> Adversários
      </Link>

      <h1 className="text-xl font-bold text-gray-900 mb-1">
        {isNew ? "Novo adversário" : detail?.name}
      </h1>
      {!isNew && detail && (
        <p className="text-sm text-gray-500 mb-4">
          {[detail.city, detail.state].filter(Boolean).join(" · ") || "Sem cidade/UF"}
          {" · "}
          {detail.matches.length} partida(s)
        </p>
      )}

      <div className="flex gap-1 border-b mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id
                ? "border-[#1B3A6B] text-[#1B3A6B]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "perfil" && (
        <>
          <OpponentProfileForm
            key={isNew ? "new" : String(detail?.id)}
            initial={isNew ? undefined : detail ?? undefined}
            onSave={save}
            isNew={isNew}
          />
          {!isNew && detail && (
            <HomeStadiumSection
              opponentId={detail.id}
              opponentName={detail.name}
              current={detail.homeStadium}
              defaultCity={detail.city}
              defaultState={detail.state}
              onChanged={load}
            />
          )}
        </>
      )}

      {tab === "historico" && detail && <OpponentHistory matches={detail.matches} />}
    </div>
  );
}
