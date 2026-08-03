import { useEffect, useState } from "react";
import { Link } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";

export type NameCheckMatch = {
  id: number;
  name: string;
  fullName: string | null;
  match: "exact" | "similar";
  matchedOn: "name" | "fullName";
};

type MergeConfig = {
  keepId: number;
  keepName: string;
  endpoint: string;
  onMerged: (result: { keptId: number; removedId: number }) => void;
};

/**
 * Debounced duplicate-name warning for player/manager create & edit forms.
 * Exact full-name matches block saving via onBlockChange(true).
 * When editing, offers merge into this profile or into the other one.
 */
export function AdminNameDuplicateWarning({
  kind,
  name,
  fullName,
  excludeId,
  hrefForId,
  onBlockChange,
  merge,
}: {
  kind: "player" | "manager";
  name: string;
  fullName: string;
  excludeId?: number | null;
  hrefForId: (id: number) => string;
  /** Called when an exact duplicate should block save. */
  onBlockChange?: (blocked: boolean) => void;
  /** When set (edit mode), show merge actions for each match. */
  merge?: MergeConfig;
}) {
  const [matches, setMatches] = useState<NameCheckMatch[]>([]);
  const [checking, setChecking] = useState(false);
  const [mergingId, setMergingId] = useState<number | null>(null);

  useEffect(() => {
    const q = name.trim();
    const fn = fullName.trim();
    if (q.length < 2 && fn.length < 2) {
      setMatches([]);
      setChecking(false);
      return;
    }

    let cancelled = false;
    setChecking(true);
    const timer = window.setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (q) params.set("q", q);
        if (fn) params.set("fullName", fn);
        if (excludeId != null) params.set("excludeId", String(excludeId));
        const path =
          kind === "player"
            ? `/admin/players/name-check?${params}`
            : `/admin/managers/name-check?${params}`;
        const r = await adminFetch(path);
        if (!r.ok || cancelled) return;
        const data = (await r.json()) as { matches?: NameCheckMatch[] };
        if (!cancelled) setMatches(data.matches ?? []);
      } catch {
        if (!cancelled) setMatches([]);
      } finally {
        if (!cancelled) setChecking(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [kind, name, fullName, excludeId]);

  const exactMatches = matches.filter((m) => m.match === "exact");
  const similarMatches = matches.filter((m) => m.match === "similar");
  const blocked = exactMatches.length > 0;

  useEffect(() => {
    onBlockChange?.(blocked);
  }, [blocked, onBlockChange]);

  async function runMerge(keepId: number, removeId: number, confirmMsg: string) {
    if (!merge) return;
    if (!confirm(confirmMsg)) return;
    setMergingId(removeId === merge.keepId ? keepId : removeId);
    try {
      const r = await adminFetch(merge.endpoint, {
        method: "POST",
        body: JSON.stringify({ keepId, removeId }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao mesclar");
      }
      merge.onMerged({ keptId: keepId, removedId: removeId });
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao mesclar");
    }
    setMergingId(null);
  }

  function MatchActions({ m }: { m: NameCheckMatch }) {
    if (!merge) return null;
    const busy = mergingId != null;
    return (
      <span className="inline-flex flex-wrap items-center gap-2 mt-1">
        <button
          type="button"
          disabled={busy}
          className="text-xs font-semibold text-[#1B3A6B] hover:underline disabled:opacity-50"
          onClick={() =>
            void runMerge(
              merge.keepId,
              m.id,
              `Absorver #${m.id} ${m.name} neste perfil (#${merge.keepId} ${merge.keepName})?\n\nO registro #${m.id} será excluído e os vínculos passam para #${merge.keepId}.`,
            )
          }
        >
          {mergingId === m.id ? "Mesclando…" : "Mesclar neste"}
        </button>
        <span className="text-gray-300">·</span>
        <button
          type="button"
          disabled={busy}
          className="text-xs font-semibold text-amber-800 hover:underline disabled:opacity-50"
          onClick={() =>
            void runMerge(
              m.id,
              merge.keepId,
              `Absorver este perfil (#${merge.keepId} ${merge.keepName}) em #${m.id} ${m.name}?\n\nO registro atual (#${merge.keepId}) será excluído e os vínculos passam para #${m.id}.`,
            )
          }
        >
          Mesclar no outro
        </button>
      </span>
    );
  }

  if (matches.length === 0 && !checking) return null;

  const label = kind === "player" ? "jogador" : "técnico";

  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm ${
        blocked
          ? "border-red-300 bg-red-50 text-red-950"
          : "border-sky-200 bg-sky-50 text-sky-950"
      }`}
      role="alert"
    >
      {checking && matches.length === 0 ? (
        <p className="text-xs text-gray-500">Verificando nomes parecidos…</p>
      ) : blocked ? (
        <>
          <p className="font-medium">
            Já existe {label} com esse nome completo no cadastro. Salvamento
            bloqueado — abra o perfil existente, ou mescle se for a mesma pessoa.
          </p>
          <ul className="mt-2 space-y-2">
            {exactMatches.map((m) => (
              <li key={m.id} className="text-sm">
                <Link
                  href={hrefForId(m.id)}
                  className="inline-flex items-center gap-1 font-semibold text-[#1B3A6B] hover:underline"
                >
                  #{m.id} {m.name}
                  {m.fullName ? ` (${m.fullName})` : ""} →
                </Link>
                <MatchActions m={m} />
              </li>
            ))}
          </ul>
          {similarMatches.length > 0 ? (
            <div className="mt-3 pt-2 border-t border-red-200/60">
              <p className="text-xs font-medium text-red-800/80 mb-1.5">
                Também há nomes parecidos:
              </p>
              <ul className="space-y-2">
                {similarMatches.map((m) => (
                  <li key={m.id} className="text-xs">
                    <Link
                      href={hrefForId(m.id)}
                      className="font-medium text-[#1B3A6B] hover:underline"
                    >
                      #{m.id} {m.name}
                      {m.fullName ? ` · ${m.fullName}` : ""} →
                    </Link>
                    <MatchActions m={m} />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p className="font-medium">
            {merge
              ? `Há ${label}(es) com nome parecido — confira se é a mesma pessoa e mescle se for o caso.`
              : `Há ${label}(es) com nome parecido — confira antes de criar outro.`}
          </p>
          <ul className="mt-1.5 space-y-2">
            {similarMatches.map((m) => (
              <li key={m.id} className="text-xs">
                <Link
                  href={hrefForId(m.id)}
                  className="font-medium text-[#1B3A6B] hover:underline"
                >
                  Abrir #{m.id} {m.name}
                  {m.fullName ? ` · ${m.fullName}` : ""} →
                </Link>
                <MatchActions m={m} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
