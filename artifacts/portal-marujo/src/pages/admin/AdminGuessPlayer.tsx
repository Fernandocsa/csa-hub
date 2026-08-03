import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Ban, Puzzle, RefreshCw, Unlock } from "lucide-react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { EntityPhoto } from "@/components/EntityPhoto";

type QueueRow = {
  date: string;
  gameNumber: number;
  player: {
    id: number;
    name: string;
    photoUrl: string | null;
    position: string;
  };
  previousAppearances: string[];
};

type BlockedRow = {
  playerId: number;
  name: string;
  photoUrl: string | null;
  position: string;
  note: string | null;
  createdAt: string;
};

function formatBr(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export default function AdminGuessPlayer() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [blocked, setBlocked] = useState<BlockedRow[]>([]);
  const [poolSize, setPoolSize] = useState<number | null>(null);
  const [noRepeatDays, setNoRepeatDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const applyQueue = useCallback(
    (data: {
      poolSize?: number;
      noRepeatDays?: number;
      blocked?: BlockedRow[];
      data?: QueueRow[];
    }) => {
      setRows(data.data ?? []);
      setBlocked(data.blocked ?? []);
      setPoolSize(data.poolSize ?? null);
      setNoRepeatDays(data.noRepeatDays ?? null);
    },
    [],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await adminFetch("/admin/quem-e-o-jogador?days=30");
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "Falha ao carregar fila",
        );
      }
      const data = (await r.json()) as {
        days: number;
        poolSize?: number;
        noRepeatDays?: number;
        blocked?: BlockedRow[];
        data: QueueRow[];
      };
      applyQueue(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar fila");
    } finally {
      setLoading(false);
    }
  }, [applyQueue]);

  useEffect(() => {
    void load();
  }, [load]);

  const runAction = async (
    key: string,
    action: () => Promise<Response>,
    confirmMsg?: string,
  ) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setBusyKey(key);
    setError("");
    try {
      const r = await action();
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "Falha na ação",
        );
      }
      const data = (await r.json()) as {
        poolSize?: number;
        noRepeatDays?: number;
        blocked?: BlockedRow[];
        data?: QueueRow[];
      };
      applyQueue(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha na ação");
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Puzzle size={20} className="text-[#1B3A6B]" />
            Quem é o Jogador?
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fila dos próximos 30 dias (horário de Brasília). Pool exige foto
            cadastrada
            {poolSize != null ? ` · ${poolSize} elegíveis` : ""}
            {noRepeatDays != null
              ? ` · sem repetir por ${noRepeatDays} dias`
              : ""}
            . Use <strong className="font-medium text-gray-700">Trocar</strong>{" "}
            para sortear outro na data, ou{" "}
            <strong className="font-medium text-gray-700">Bloquear</strong> para
            tirar o jogador do pool.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm text-[#1B3A6B] hover:underline shrink-0"
        >
          Atualizar
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Carregando fila…</p>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left text-[11px] uppercase text-gray-500">
                <th className="px-3 py-2 w-28">Data</th>
                <th className="px-3 py-2 w-16">#</th>
                <th className="px-3 py-2">Jogador</th>
                <th className="px-3 py-2">Histórico</th>
                <th className="px-3 py-2 w-40 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const key = row.date;
                const prev = row.previousAppearances;
                const expanded = openId === key;
                const busy = busyKey === `replace:${key}` || busyKey === `block:${row.player.id}`;
                return (
                  <tr key={key} className="border-t align-top">
                    <td className="px-3 py-2 tabular-nums text-gray-700">
                      {formatBr(row.date)}
                    </td>
                    <td className="px-3 py-2 text-gray-500">#{row.gameNumber}</td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/jogadores/${row.player.id}`}
                        className="flex items-center gap-2 hover:text-[#1B3A6B]"
                      >
                        <EntityPhoto
                          url={row.player.photoUrl}
                          name={row.player.name}
                          size="sm"
                          shape="circle"
                        />
                        <span>
                          <span className="font-medium">{row.player.name}</span>
                          <span className="block text-xs text-gray-400">
                            {row.player.position}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {prev.length === 0 ? (
                        <span className="inline-flex text-[11px] uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-100 rounded px-1.5 py-0.5">
                          Inédito
                        </span>
                      ) : (
                        <div className="space-y-1">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide text-amber-800 bg-amber-50 border border-amber-100 rounded px-1.5 py-0.5 hover:bg-amber-100"
                            onClick={() =>
                              setOpenId(expanded ? null : key)
                            }
                            title={prev.map(formatBr).join(", ")}
                          >
                            Já saiu {prev.length}x
                          </button>
                          {(expanded || prev.length <= 3) && (
                            <p className="text-xs text-gray-500">
                              {prev.map(formatBr).join(" · ")}
                            </p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <button
                          type="button"
                          disabled={!!busyKey}
                          title="Sortear outro jogador nesta data"
                          onClick={() =>
                            void runAction(
                              `replace:${key}`,
                              () =>
                                adminFetch("/admin/quem-e-o-jogador/replace", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ date: row.date }),
                                }),
                              `Trocar ${row.player.name} em ${formatBr(row.date)}?`,
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          <RefreshCw
                            size={12}
                            className={
                              busyKey === `replace:${key}` ? "animate-spin" : ""
                            }
                          />
                          Trocar
                        </button>
                        <button
                          type="button"
                          disabled={!!busyKey}
                          title="Remover do pool (não sorteia mais)"
                          onClick={() =>
                            void runAction(
                              `block:${row.player.id}`,
                              () =>
                                adminFetch("/admin/quem-e-o-jogador/block", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    playerId: row.player.id,
                                  }),
                                }),
                              `Bloquear ${row.player.name} do jogo? Ele sai da fila futura e não volta ao sorteio até desbloquear.`,
                            )
                          }
                          className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Ban size={12} />
                          Bloquear
                        </button>
                      </div>
                      {busy && (
                        <p className="text-[10px] text-gray-400 text-right mt-1">
                          Atualizando…
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
          <Ban size={14} className="text-red-600" />
          Bloqueados ({blocked.length})
        </h2>
        {blocked.length === 0 ? (
          <p className="text-sm text-gray-400">
            Nenhum jogador bloqueado. Eles continuam no pool de sorteio.
          </p>
        ) : (
          <ul className="border rounded-lg divide-y bg-white">
            {blocked.map((b) => (
              <li
                key={b.playerId}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <Link
                  href={`/admin/jogadores/${b.playerId}`}
                  className="flex items-center gap-2 min-w-0 hover:text-[#1B3A6B]"
                >
                  <EntityPhoto
                    url={b.photoUrl}
                    name={b.name}
                    size="sm"
                    shape="circle"
                  />
                  <span className="min-w-0">
                    <span className="font-medium text-sm block truncate">
                      {b.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {b.position}
                      {b.note ? ` · ${b.note}` : ""}
                    </span>
                  </span>
                </Link>
                <button
                  type="button"
                  disabled={!!busyKey}
                  onClick={() =>
                    void runAction(
                      `unblock:${b.playerId}`,
                      () =>
                        adminFetch(
                          `/admin/quem-e-o-jogador/block/${b.playerId}`,
                          { method: "DELETE" },
                        ),
                      `Desbloquear ${b.name}?`,
                    )
                  }
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-emerald-200 text-emerald-800 hover:bg-emerald-50 disabled:opacity-50 shrink-0"
                >
                  <Unlock size={12} />
                  Desbloquear
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
