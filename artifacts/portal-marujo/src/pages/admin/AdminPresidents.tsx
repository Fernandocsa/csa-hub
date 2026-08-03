import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { AdminEntitySearch } from "@/components/AdminEntitySearch";
import { presidentTermLabel } from "@/lib/president-term";

export type AdminPresident = {
  id: number;
  name: string;
  photoUrl: string | null;
  termStart: string | null;
  termEnd: string | null;
  isCurrent?: boolean;
  personKey?: number | null;
  notes: string | null;
  linkedPlayerId?: number | null;
  linkedManagerId?: number | null;
};

function termShort(p: AdminPresident) {
  return presidentTermLabel(p.termStart, p.termEnd, !!p.isCurrent);
}

export default function AdminPresidents() {
  const [, setLocation] = useLocation();
  const [rows, setRows] = useState<AdminPresident[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch("/admin/presidents");
    if (r.ok) setRows(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number) {
    if (!confirm("Excluir este presidente?")) return;
    await adminFetch(`/admin/presidents/${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = rows.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Presidentes</h1>
          <p className="text-sm text-gray-500">{rows.length} cadastrados</p>
        </div>
        <Button className="bg-[#1B3A6B]" asChild>
          <Link href="/admin/presidentes/novo">
            <Plus size={14} className="mr-1" /> Adicionar
          </Link>
        </Button>
      </div>

      <AdminEntitySearch
        items={rows.map((p) => ({
          id: p.id,
          name: p.name,
          subtitle: termShort(p),
        }))}
        placeholder="Buscar presidente…"
        value={search}
        onValueChange={setSearch}
        onSelect={(item) => setLocation(`/admin/presidentes/${item.id}`)}
      />

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase w-12">
                  ID
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Nome
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Mandato
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400 font-mono text-xs">{p.id}</td>
                  <td className="px-4 py-2 font-medium">
                    <Link
                      href={`/admin/presidentes/${p.id}`}
                      className="text-[#1B3A6B] hover:underline"
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {presidentTermLabel(p.termStart, p.termEnd, !!p.isCurrent)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
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
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                    Nenhum presidente
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
