import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { AdminEntitySearch } from "@/components/AdminEntitySearch";
import {
  COMPETITION_TYPE_LABELS,
  type Competition,
} from "./AdminCompetitionDetail";
import { includesFolded } from "@/lib/accent-fold";

function typeLabel(type: string | null) {
  if (!type) return "Sem nível";
  return COMPETITION_TYPE_LABELS[type] ?? type;
}

export default function AdminCompetitions() {
  const [, setLocation] = useLocation();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const r = await adminFetch("/admin/competitions");
    if (r.ok) setCompetitions(await r.json());
    else setError("Erro ao carregar competições");
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function remove(id: number, matchCount: number) {
    if (matchCount > 0) {
      alert(
        `Não é possível excluir: há ${matchCount} partida(s) vinculada(s). Use Mesclar no detalhe se for duplicata.`,
      );
      return;
    }
    if (!confirm("Excluir esta competição?")) return;
    const r = await adminFetch(`/admin/competitions/${id}`, { method: "DELETE" });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      alert((err as { error?: string }).error ?? "Erro ao excluir");
      return;
    }
    await load();
  }

  const filtered = competitions.filter((c) => includesFolded(c.name, search));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Competições</h1>
          <p className="text-sm text-gray-500">{competitions.length} cadastradas</p>
        </div>
        <Button className="bg-[#1B3A6B]" asChild>
          <Link href="/admin/competicoes/novo">
            <Plus size={14} className="mr-1" /> Adicionar
          </Link>
        </Button>
      </div>

      <AdminEntitySearch
        items={competitions.map((c) => ({
          id: c.id,
          name: c.name,
          subtitle: `${typeLabel(c.type)}${c.matchCount != null ? ` · ${c.matchCount} partidas` : ""}`,
        }))}
        placeholder="Buscar competição…"
        value={search}
        onValueChange={setSearch}
        onSelect={(item) => setLocation(`/admin/competicoes/${item.id}`)}
      />

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

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
                  Nível
                </th>
                <th className="text-right px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Partidas
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400 font-mono text-xs">{c.id}</td>
                  <td className="px-4 py-2 font-medium">
                    <Link
                      href={`/admin/competicoes/${c.id}`}
                      className="text-[#1B3A6B] hover:underline"
                    >
                      {c.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600">{typeLabel(c.type)}</td>
                  <td className="px-4 py-2 text-right text-gray-600 tabular-nums">
                    {c.matchCount ?? 0}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => remove(c.id, c.matchCount ?? 0)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded disabled:opacity-30"
                        title={
                          (c.matchCount ?? 0) > 0
                            ? "Possui partidas — use Mesclar"
                            : "Excluir"
                        }
                        disabled={(c.matchCount ?? 0) > 0}
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
              Nenhuma competição encontrada
            </p>
          )}
        </div>
      )}
    </div>
  );
}
