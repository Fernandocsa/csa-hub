import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { AdminEntitySearch } from "@/components/AdminEntitySearch";
import { ufDisplayName } from "@/lib/br-locations";
import type { Referee } from "./AdminRefereeDetail";

function refereeSubtitle(r: Referee) {
  return r.state ? ufDisplayName(r.state) : "Sem UF";
}

export default function AdminReferees() {
  const [, setLocation] = useLocation();
  const [referees, setReferees] = useState<Referee[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch("/admin/referees");
    if (r.ok) setReferees(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number) {
    if (
      !confirm(
        "Excluir este árbitro? Partidas vinculadas ficarão sem árbitro.",
      )
    ) {
      return;
    }
    await adminFetch(`/admin/referees/${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = referees.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Árbitros</h1>
          <p className="text-sm text-gray-500">{referees.length} cadastrados</p>
        </div>
        <Button className="bg-[#1B3A6B]" asChild>
          <Link href="/admin/arbitros/novo">
            <Plus size={14} className="mr-1" /> Adicionar
          </Link>
        </Button>
      </div>

      <AdminEntitySearch
        items={referees.map((r) => ({
          id: r.id,
          name: r.name,
          subtitle: refereeSubtitle(r),
        }))}
        placeholder="Buscar árbitro…"
        value={search}
        onValueChange={setSearch}
        onSelect={(item) => setLocation(`/admin/arbitros/${item.id}`)}
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
                  UF
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400 font-mono text-xs">{r.id}</td>
                  <td className="px-4 py-2 font-medium">
                    <Link
                      href={`/admin/arbitros/${r.id}`}
                      className="text-[#1B3A6B] hover:underline"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {r.state ? `${r.state} · ${ufDisplayName(r.state)}` : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => remove(r.id)}
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
            <p className="text-sm text-gray-400 text-center py-8">
              Nenhum árbitro encontrado
            </p>
          )}
        </div>
      )}
    </div>
  );
}
