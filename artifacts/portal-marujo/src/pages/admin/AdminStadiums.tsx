import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { AdminEntitySearch } from "@/components/AdminEntitySearch";
import { AdminMergeButton } from "@/components/AdminMergeButton";
import type { Stadium } from "./AdminStadiumDetail";
import { countryDisplayName } from "@/lib/countries";

function stadiumSubtitle(s: Stadium) {
  if (s.country) {
    return [s.city, countryDisplayName(s.country)].filter(Boolean).join(" · ") || null;
  }
  return [s.city, s.state].filter(Boolean).join(" · ") || null;
}

export default function AdminStadiums() {
  const [, setLocation] = useLocation();
  const [stadiums, setStadiums] = useState<Stadium[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch("/admin/stadiums");
    if (r.ok) setStadiums(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number) {
    if (!confirm("Excluir este estádio? Só é possível se não houver partidas vinculadas.")) {
      return;
    }
    const r = await adminFetch(`/admin/stadiums/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert((err as { error?: string }).error ?? "Erro ao excluir");
      return;
    }
    await load();
  }

  const filtered = stadiums.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Estádios</h1>
          <p className="text-sm text-gray-500">{stadiums.length} cadastrados</p>
        </div>
        <Button className="bg-[#1B3A6B]" asChild>
          <Link href="/admin/estadios/novo">
            <Plus size={14} className="mr-1" /> Adicionar
          </Link>
        </Button>
      </div>

      <AdminEntitySearch
        items={stadiums.map((s) => ({
          id: s.id,
          name: s.name,
          subtitle: stadiumSubtitle(s),
        }))}
        placeholder="Buscar estádio…"
        value={search}
        onValueChange={setSearch}
        onSelect={(item) => setLocation(`/admin/estadios/${item.id}`)}
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
                  Localização
                </th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Capacidade
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400 font-mono text-xs">{s.id}</td>
                  <td className="px-4 py-2 font-medium">
                    <Link
                      href={`/admin/estadios/${s.id}`}
                      className="text-[#1B3A6B] hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {stadiumSubtitle(s) || "—"}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {s.capacity != null ? s.capacity.toLocaleString("pt-BR") : "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      <AdminMergeButton
                        keepId={s.id}
                        keepName={s.name}
                        mode={{ kind: "stadium" }}
                        onDone={load}
                      />
                      <button
                        type="button"
                        onClick={() => remove(s.id)}
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
              Nenhum estádio encontrado
            </p>
          )}
        </div>
      )}
    </div>
  );
}
