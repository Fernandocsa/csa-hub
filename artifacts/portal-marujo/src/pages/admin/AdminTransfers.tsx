import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { AdminEntitySearch } from "@/components/AdminEntitySearch";
import { formatDateBr } from "@/lib/utils";
import { includesFolded } from "@/lib/accent-fold";

export type AdminTransferRow = {
  id: number;
  playerId: number;
  playerName: string;
  direction: string;
  club: string | null;
  transferDate: string | null;
  season: string;
  transferType: string | null;
  notes: string | null;
};

export default function AdminTransfers() {
  const [, setLocation] = useLocation();
  const [rows, setRows] = useState<AdminTransferRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch("/admin/transfers");
    if (r.ok) setRows(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number) {
    if (!confirm("Excluir esta transferência?")) return;
    await adminFetch(`/admin/transfers/${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = rows.filter((t) => {
    if (!search.trim()) return true;
    return (
      includesFolded(t.playerName, search) ||
      includesFolded(t.season, search) ||
      includesFolded(t.club, search)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transferências</h1>
          <p className="text-sm text-gray-500">{rows.length} cadastradas</p>
        </div>
        <Button className="bg-[#1B3A6B]" asChild>
          <Link href="/admin/transferencias/novo">
            <Plus size={14} className="mr-1" /> Adicionar
          </Link>
        </Button>
      </div>

      <AdminEntitySearch
        items={rows.map((t) => ({
          id: t.id,
          name: t.playerName,
          subtitle: `${t.direction === "in" ? "Chegada" : "Saída"} · ${t.season}${
            t.club ? ` · ${t.club}` : ""
          }`,
        }))}
        placeholder="Buscar jogador, clube ou temporada…"
        value={search}
        onValueChange={setSearch}
        onSelect={(item) => setLocation(`/admin/transferencias/${item.id}`)}
      />

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Temporada
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Direção
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Jogador
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Clube
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Data
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 tabular-nums">{t.season}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        t.direction === "in" ? "text-green-700" : "text-red-700"
                      }
                    >
                      {t.direction === "in" ? "Chegada" : "Saída"}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-medium">
                    <Link
                      href={`/admin/transferencias/${t.id}`}
                      className="text-[#1B3A6B] hover:underline"
                    >
                      {t.playerName}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{t.club ?? "—"}</td>
                  <td className="px-4 py-2 text-gray-600 tabular-nums">
                    {t.transferDate ? formatDateBr(t.transferDate) : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => remove(t.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    Nenhuma transferência
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
