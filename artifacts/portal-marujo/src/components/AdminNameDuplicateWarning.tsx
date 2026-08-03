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
 */
export function AdminNameDuplicateWarning({
  kind,
  name,
  fullName,
  excludeId,
  hrefForId,
}: {
  kind: "player" | "manager";
  name: string;
  fullName: string;
  excludeId?: number | null;
  hrefForId: (id: number) => string;
}) {
  const [matches, setMatches] = useState<NameCheckMatch[]>([]);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const q = name.trim();
    const fn = fullName.trim();
    if (q.length < 2 && fn.length < 2) {
      setMatches([]);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setChecking(true);
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

  if (matches.length === 0 && !checking) return null;

  const label = kind === "player" ? "jogador" : "técnico";
  const hasExact = matches.some((m) => m.match === "exact");

  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm ${
        hasExact
          ? "border-amber-300 bg-amber-50 text-amber-950"
          : "border-sky-200 bg-sky-50 text-sky-950"
      }`}
      role="status"
    >
      {checking && matches.length === 0 ? (
        <p className="text-xs text-gray-500">Verificando nomes parecidos…</p>
      ) : (
        <>
          <p className="font-medium">
            {hasExact
              ? `Já existe ${label} com esse nome (ou nome completo) no cadastro.`
              : `Há ${label}(es) com nome parecido no cadastro — confira antes de criar outro.`}
          </p>
          <ul className="mt-1.5 space-y-1">
            {matches.map((m) => (
              <li key={m.id} className="text-xs">
                <Link
                  href={hrefForId(m.id)}
                  className="font-medium text-[#1B3A6B] hover:underline"
                >
                  #{m.id} {m.name}
                </Link>
                {m.fullName ? (
                  <span className="text-gray-600"> · {m.fullName}</span>
                ) : null}
                <span className="text-gray-500">
                  {" "}
                  ({m.match === "exact" ? "nome igual" : "parecido"}
                  {m.matchedOn === "fullName" ? " no nome completo" : ""})
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
