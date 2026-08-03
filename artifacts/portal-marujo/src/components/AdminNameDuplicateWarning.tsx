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

/**
 * Debounced duplicate-name warning for player/manager create & edit forms.
 * Exact matches block saving via onBlockChange(true).
 */
export function AdminNameDuplicateWarning({
  kind,
  name,
  fullName,
  excludeId,
  hrefForId,
  onBlockChange,
}: {
  kind: "player" | "manager";
  name: string;
  fullName: string;
  excludeId?: number | null;
  hrefForId: (id: number) => string;
  /** Called when an exact duplicate should block save. */
  onBlockChange?: (blocked: boolean) => void;
}) {
  const [matches, setMatches] = useState<NameCheckMatch[]>([]);
  const [checking, setChecking] = useState(false);

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
            bloqueado — abra o perfil existente para editar.
          </p>
          <ul className="mt-2 space-y-1.5">
            {exactMatches.map((m) => (
              <li key={m.id} className="text-sm">
                <Link
                  href={hrefForId(m.id)}
                  className="inline-flex items-center gap-1 font-semibold text-[#1B3A6B] hover:underline"
                >
                  Editar #{m.id} {m.name}
                  {m.fullName ? ` (${m.fullName})` : ""} →
                </Link>
              </li>
            ))}
          </ul>
          {similarMatches.length > 0 ? (
            <p className="mt-2 text-xs text-red-800/80">
              Também há nomes parecidos:{" "}
              {similarMatches
                .map((m) => `#${m.id} ${m.name}`)
                .join(", ")}
              .
            </p>
          ) : null}
        </>
      ) : (
        <>
          <p className="font-medium">
            Há {label}(es) com nome parecido — confira antes de criar outro.
          </p>
          <ul className="mt-1.5 space-y-1">
            {similarMatches.map((m) => (
              <li key={m.id} className="text-xs">
                <Link
                  href={hrefForId(m.id)}
                  className="font-medium text-[#1B3A6B] hover:underline"
                >
                  Abrir #{m.id} {m.name}
                  {m.fullName ? ` · ${m.fullName}` : ""} →
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
