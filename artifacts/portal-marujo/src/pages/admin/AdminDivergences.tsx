import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import {
  RefreshCw,
  ExternalLink,
  Check,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminHomeTabs } from "./AdminHomeTabs";

type DivergenceItem = {
  id: number;
  name: string;
  href: string;
  summary: string;
  seasonHint?: string | null;
};

type DivergenceGroup = {
  kind: string;
  entityType: "player" | "manager";
  title: string;
  description: string;
  count: number;
  items: DivergenceItem[];
};

function EntityBadge({ type }: { type: "player" | "manager" }) {
  return (
    <span
      className={`text-[11px] px-1.5 py-0.5 rounded border ${
        type === "player"
          ? "bg-blue-50 text-blue-700 border-blue-200"
          : "bg-violet-50 text-violet-700 border-violet-200"
      }`}
    >
      {type === "player" ? "Jogador" : "Técnico"}
    </span>
  );
}

export default function AdminDivergences() {
  const [groups, setGroups] = useState<DivergenceGroup[]>([]);
  const [dismissedGroups, setDismissedGroups] = useState<DivergenceGroup[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [dismissedTotal, setDismissedTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDismissed, setShowDismissed] = useState(false);

  const applyPayload = useCallback(
    (data: {
      groups?: DivergenceGroup[];
      totalItems?: number;
      dismissedGroups?: DivergenceGroup[];
      dismissedTotal?: number;
    }) => {
      setGroups(data.groups ?? []);
      setTotalItems(data.totalItems ?? 0);
      setDismissedGroups(data.dismissedGroups ?? []);
      setDismissedTotal(data.dismissedTotal ?? 0);
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/admin/data-divergences");
      if (!res.ok) throw new Error("Falha ao carregar divergências");
      applyPayload(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [applyPayload]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (key: string, action: () => Promise<Response>) => {
    setBusyKey(key);
    setError(null);
    try {
      const res = await action();
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "Falha na ação",
        );
      }
      applyPayload(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na ação");
    } finally {
      setBusyKey(null);
    }
  };

  const renderGroup = (
    g: DivergenceGroup,
    mode: "active" | "dismissed",
  ) => (
    <section key={`${mode}-${g.kind}`} className="border rounded-lg overflow-hidden bg-gray-50/80">
      <header className="px-4 py-2.5 bg-white border-b space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-gray-900">{g.title}</h2>
          <EntityBadge type={g.entityType} />
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
            {g.count} {g.count === 1 ? "item" : "itens"}
          </span>
        </div>
        <p className="text-xs text-gray-500">{g.description}</p>
      </header>
      <div className="p-3 grid gap-2 sm:grid-cols-2">
        {g.items.map((item, idx) => {
          const key = `${g.kind}:${item.id}`;
          const busy = busyKey === key;
          return (
            <div
              key={`${g.kind}-${item.id}-${idx}`}
              className="border rounded-lg bg-white p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-900 truncate">
                  {item.name}
                  {item.seasonHint ? (
                    <span className="ml-1.5 font-mono text-sm font-semibold text-[#1B3A6B]">
                      {item.seasonHint}
                    </span>
                  ) : null}
                </p>
                <span className="shrink-0 text-[11px] text-gray-400 font-mono">
                  #{item.id}
                </span>
              </div>
              <p className="text-sm text-gray-600">{item.summary}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <Link
                  href={item.href}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 text-[#1B3A6B] hover:bg-gray-50"
                >
                  Abrir perfil
                  <ExternalLink size={11} />
                </Link>
                {mode === "active" ? (
                  <button
                    type="button"
                    disabled={!!busyKey}
                    onClick={() =>
                      void runAction(key, () =>
                        adminFetch("/admin/data-divergences/dismiss", {
                          method: "POST",
                          body: JSON.stringify({
                            kind: g.kind,
                            entityId: item.id,
                          }),
                        }),
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-emerald-200 text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"
                    title="Homônimo, já revisado ou falso positivo"
                  >
                    <Check size={12} className={busy ? "animate-pulse" : ""} />
                    Não é problema
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!!busyKey}
                    onClick={() =>
                      void runAction(key, () =>
                        adminFetch(
                          `/admin/data-divergences/dismiss/${encodeURIComponent(g.kind)}/${item.id}`,
                          { method: "DELETE" },
                        ),
                      )
                    }
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-amber-200 text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                  >
                    <RotateCcw size={12} className={busy ? "animate-pulse" : ""} />
                    Voltar à lista
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Painel de Administração</h1>
      <p className="text-sm text-gray-500 mb-4">Gerencie os dados do Portal Marujo</p>

      <AdminHomeTabs divergenceCount={loading ? null : totalItems} />

      <div className="flex items-start justify-between gap-3 mb-4">
        <p className="text-sm text-gray-500">
          Possíveis inconsistências em jogadores e técnicos. Marque{" "}
          <strong className="font-medium text-gray-700">Não é problema</strong>{" "}
          quando for homônimo ou já revisado. A lista permanece nesta aba ao
          abrir e voltar do perfil. Revisão de partidas em{" "}
          <Link href="/admin/partidas-duplicadas" className="text-[#1B3A6B] hover:underline">
            Revisão Partidas
          </Link>
          .
        </p>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={14} className={`mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      {loading && groups.length === 0 ? (
        <p className="text-sm text-gray-400">Detectando divergências...</p>
      ) : groups.length === 0 ? (
        <div className="bg-white border rounded-lg px-4 py-10 text-center text-sm text-gray-400">
          Nenhuma divergência ativa.
        </div>
      ) : (
        <div className="space-y-5">{groups.map((g) => renderGroup(g, "active"))}</div>
      )}

      {dismissedTotal > 0 && (
        <div className="mt-8 space-y-3">
          <button
            type="button"
            onClick={() => setShowDismissed((v) => !v)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {showDismissed ? "▾" : "▸"} Marcados como OK ({dismissedTotal})
          </button>
          {showDismissed && (
            <div className="space-y-5 opacity-90">
              {dismissedGroups.map((g) => renderGroup(g, "dismissed"))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
