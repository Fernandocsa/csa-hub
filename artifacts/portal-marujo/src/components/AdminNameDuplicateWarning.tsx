import { useEffect, useState } from "react";
import { Link } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { EntityPhoto } from "@/components/EntityPhoto";

export type NameCheckMatch = {
  id: number;
  name: string;
  fullName: string | null;
  photoUrl?: string | null;
  match: "exact" | "similar";
  matchedOn: "name" | "fullName";
};

type MergeConfig = {
  keepId: number;
  keepName: string;
  keepPhotoUrl?: string | null;
  endpoint: string;
  onMerged: (result: { keptId: number; removedId: number }) => void;
};

function hasPhoto(url: string | null | undefined): boolean {
  return Boolean(url?.trim());
}

/**
 * Debounced duplicate-name warning for player/manager create & edit forms.
 * Exact full-name matches block saving via onBlockChange(true).
 * When editing, offers merge into this profile or into the other one,
 * prioritizing the side that already has a photo.
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

  function MatchRow({ m, strong }: { m: NameCheckMatch; strong?: boolean }) {
    const otherHasPhoto = hasPhoto(m.photoUrl);
    const currentHasPhoto = hasPhoto(merge?.keepPhotoUrl);
    // Prefer keeping the profile that already has a photo.
    const preferOther = Boolean(merge && otherHasPhoto && !currentHasPhoto);
    const preferCurrent = Boolean(merge && currentHasPhoto && !otherHasPhoto);
    const busy = mergingId != null;

    const absorbHere = merge ? (
      <button
        type="button"
        disabled={busy}
        className={`text-xs font-semibold hover:underline disabled:opacity-50 ${
          preferCurrent ? "text-emerald-800" : "text-[#1B3A6B]"
        }`}
        onClick={() =>
          void runMerge(
            merge.keepId,
            m.id,
            `Absorver #${m.id} ${m.name} neste perfil (#${merge.keepId} ${merge.keepName})?\n\nO registro #${m.id} será excluído e os vínculos passam para #${merge.keepId}.${
              preferCurrent ? "\n\nRecomendado: este perfil já tem foto." : ""
            }`,
          )
        }
      >
        {mergingId === m.id
          ? "Mesclando…"
          : preferCurrent
            ? "Mesclar neste (recomendado — tem foto)"
            : "Mesclar neste"}
      </button>
    ) : null;

    const absorbOther = merge ? (
      <button
        type="button"
        disabled={busy}
        className={`text-xs font-semibold hover:underline disabled:opacity-50 ${
          preferOther ? "text-emerald-800" : "text-amber-800"
        }`}
        onClick={() =>
          void runMerge(
            m.id,
            merge.keepId,
            `Absorver este perfil (#${merge.keepId} ${merge.keepName}) em #${m.id} ${m.name}?\n\nO registro atual (#${merge.keepId}) será excluído e os vínculos passam para #${m.id}.${
              preferOther ? "\n\nRecomendado: o outro perfil já tem foto." : ""
            }`,
          )
        }
      >
        {preferOther
          ? "Mesclar no outro (recomendado — tem foto)"
          : "Mesclar no outro"}
      </button>
    ) : null;

    return (
      <li className={strong ? "text-sm" : "text-xs"}>
        <div className="flex items-start gap-2 min-w-0">
          <EntityPhoto
            url={m.photoUrl}
            name={m.name}
            size="sm"
            shape="circle"
            label={`Foto de ${m.name}`}
          />
          <div className="min-w-0 flex-1">
            <Link
              href={hrefForId(m.id)}
              className={`inline-flex flex-wrap items-center gap-1.5 font-semibold text-[#1B3A6B] hover:underline ${
                strong ? "" : "font-medium"
              }`}
            >
              <span>
                #{m.id} {m.name}
                {m.fullName ? (strong ? ` (${m.fullName})` : ` · ${m.fullName}`) : ""}
              </span>
              {otherHasPhoto ? (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5">
                  com foto
                </span>
              ) : (
                <span className="text-[10px] font-medium text-gray-400">sem foto</span>
              )}
              <span aria-hidden>→</span>
            </Link>
            {merge ? (
              <span className="flex flex-wrap items-center gap-2 mt-1">
                {preferOther ? (
                  <>
                    {absorbOther}
                    <span className="text-gray-300">·</span>
                    {absorbHere}
                  </>
                ) : (
                  <>
                    {absorbHere}
                    <span className="text-gray-300">·</span>
                    {absorbOther}
                  </>
                )}
              </span>
            ) : null}
          </div>
        </div>
      </li>
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
            Quem tem foto aparece primeiro.
          </p>
          <ul className="mt-2 space-y-2.5">
            {exactMatches.map((m) => (
              <MatchRow key={m.id} m={m} strong />
            ))}
          </ul>
          {similarMatches.length > 0 ? (
            <div className="mt-3 pt-2 border-t border-red-200/60">
              <p className="text-xs font-medium text-red-800/80 mb-1.5">
                Também há nomes parecidos:
              </p>
              <ul className="space-y-2.5">
                {similarMatches.map((m) => (
                  <MatchRow key={m.id} m={m} />
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p className="font-medium">
            {merge
              ? `Há ${label}(es) com nome parecido — confira se é a mesma pessoa e mescle se for o caso. Quem tem foto aparece primeiro.`
              : `Há ${label}(es) com nome parecido — confira antes de criar outro.`}
          </p>
          <ul className="mt-1.5 space-y-2.5">
            {similarMatches.map((m) => (
              <MatchRow key={m.id} m={m} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
