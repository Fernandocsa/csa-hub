import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Puzzle } from "lucide-react";
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

function formatBr(iso: string) {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export default function AdminGuessPlayer() {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

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
      const data = (await r.json()) as { days: number; data: QueueRow[] };
      setRows(data.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao carregar fila");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Puzzle size={20} className="text-[#1B3A6B]" />
            Quem é o Jogador?
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fila dos próximos 30 dias (horário de Brasília). A página pública
            existe em{" "}
            <code className="text-xs bg-gray-100 px-1 rounded">
              /quem-e-o-jogador
            </code>{" "}
            mas ainda não está linkada no site.
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
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const key = row.date;
                const prev = row.previousAppearances;
                const expanded = openId === key;
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
