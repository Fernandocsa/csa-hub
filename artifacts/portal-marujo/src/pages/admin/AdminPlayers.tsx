import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { AdminEntitySearch } from "@/components/AdminEntitySearch";
import type { Player } from "./AdminPlayerDetail";

export default function AdminPlayers() {
  const [, setLocation] = useLocation();
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch("/admin/players");
    if (r.ok) setPlayers(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function deletePlayer(id: number) {
    if (!confirm("Excluir este jogador e todas as suas estatísticas?")) return;
    await adminFetch(`/admin/players/${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = players.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jogadores</h1>
          <p className="text-sm text-gray-500">{players.length} cadastrados</p>
        </div>
        <Button className="bg-[#1B3A6B]" asChild>
          <Link href="/admin/jogadores/novo">
            <Plus size={14} className="mr-1" /> Adicionar
          </Link>
        </Button>
      </div>

      <AdminEntitySearch
        items={players.map((p) => ({
          id: p.id,
          name: p.name,
          subtitle: [p.position, p.nationality].filter(Boolean).join(" · ") || null,
        }))}
        placeholder="Buscar jogador…"
        value={search}
        onValueChange={setSearch}
        onSelect={(item) => setLocation(`/admin/jogadores/${item.id}`)}
      />

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Nome
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Posição
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Nacionalidade
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Nasc.
                </th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((player) => (
                <tr key={player.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium">
                    <Link
                      href={`/admin/jogadores/${player.id}`}
                      className="text-[#1B3A6B] hover:underline"
                    >
                      {player.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{player.position ?? "–"}</td>
                  <td className="px-4 py-2 text-gray-600">{player.nationality ?? "–"}</td>
                  <td className="px-4 py-2 text-gray-600">{player.birthYear ?? "–"}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => deletePlayer(player.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum jogador encontrado</p>
          )}
        </div>
      )}
    </div>
  );
}
