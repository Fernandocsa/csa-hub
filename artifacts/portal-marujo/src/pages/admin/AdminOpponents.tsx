import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { AdminEntitySearch } from "@/components/AdminEntitySearch";
import { AdminMergeButton } from "@/components/AdminMergeButton";
import { OpponentCrest } from "@/components/OpponentCrest";
import type { Opponent } from "./AdminOpponentDetail";
import { countryDisplayName } from "@/lib/countries";
import { includesFolded } from "@/lib/accent-fold";

function opponentSubtitle(o: Opponent) {
  if (o.country) {
    return [o.city, countryDisplayName(o.country)].filter(Boolean).join(" · ") || null;
  }
  return [o.city, o.state].filter(Boolean).join(" · ") || null;
}

export default function AdminOpponents() {
  const [, setLocation] = useLocation();
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch("/admin/opponents");
    if (r.ok) setOpponents(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number) {
    if (!confirm("Excluir este adversário? Partidas associadas podem ficar inconsistentes.")) {
      return;
    }
    await adminFetch(`/admin/opponents/${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = opponents.filter((o) => includesFolded(o.name, search));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Adversários</h1>
          <p className="text-sm text-gray-500">{opponents.length} cadastrados</p>
        </div>
        <Button className="bg-[#1B3A6B]" asChild>
          <Link href="/admin/adversarios/novo">
            <Plus size={14} className="mr-1" /> Adicionar
          </Link>
        </Button>
      </div>

      <AdminEntitySearch
        items={opponents.map((o) => ({
          id: o.id,
          name: o.name,
          subtitle: opponentSubtitle(o),
        }))}
        placeholder="Buscar adversário…"
        value={search}
        onValueChange={setSearch}
        onSelect={(item) => setLocation(`/admin/adversarios/${item.id}`)}
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
                  Cidade / UF
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400 font-mono text-xs">{o.id}</td>
                  <td className="px-4 py-2 font-medium">
                    <Link
                      href={`/admin/adversarios/${o.id}`}
                      className="inline-flex items-center gap-2 text-[#1B3A6B] hover:underline"
                    >
                      <OpponentCrest url={o.logoUrl} name={o.name} size="sm" fallback />
                      {o.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600">
                    {opponentSubtitle(o) || "—"}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-1">
                      <AdminMergeButton
                        keepId={o.id}
                        keepName={o.name}
                        mode={{ kind: "pair", endpoint: "/admin/opponents/merge" }}
                        onDone={load}
                      />
                      <button
                        type="button"
                        onClick={() => remove(o.id)}
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
              Nenhum adversário encontrado
            </p>
          )}
        </div>
      )}
    </div>
  );
}
