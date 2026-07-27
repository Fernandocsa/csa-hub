import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AdminEntitySearch } from "@/components/AdminEntitySearch";
import type { Manager } from "./AdminManagerDetail";

export default function AdminManagers() {
  const [, setLocation] = useLocation();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch("/admin/managers");
    if (r.ok) setManagers(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = managers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Técnicos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Perfil, temporadas e badges em página dedicada
          </p>
        </div>
        <Button className="bg-[#1B3A6B]" asChild>
          <Link href="/admin/tecnicos/novo">
            <Plus size={14} className="mr-1" /> Adicionar
          </Link>
        </Button>
      </div>

      <AdminEntitySearch
        items={managers.map((m) => ({
          id: m.id,
          name: m.name,
          subtitle: m.nationality,
        }))}
        placeholder="Buscar técnico…"
        value={search}
        onValueChange={setSearch}
        onSelect={(item) => setLocation(`/admin/tecnicos/${item.id}`)}
      />

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                <th className="text-left px-3 py-2">Nome</th>
                <th className="text-left px-3 py-2">Nacionalidade</th>
                <th className="text-left px-3 py-2">Período</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b hover:bg-gray-50/80">
                  <td className="px-3 py-2 font-medium">
                    <Link
                      href={`/admin/tecnicos/${m.id}`}
                      className="text-[#1B3A6B] hover:underline"
                    >
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-gray-500">{m.nationality ?? "–"}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {m.startYear != null || m.endYear != null
                      ? `${m.startYear ?? "?"}–${m.endYear ?? "?"}`
                      : m.storedGames != null
                        ? `${m.storedGames} jogos`
                        : "–"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum técnico encontrado</p>
          )}
        </div>
      )}
    </div>
  );
}
