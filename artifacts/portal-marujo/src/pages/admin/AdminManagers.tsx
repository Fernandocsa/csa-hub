import { useState, useEffect, useCallback, Fragment } from "react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AdminEntityBadges } from "@/components/AdminEntityBadges";
import { AdminEntitySearch } from "@/components/AdminEntitySearch";

interface Manager {
  id: number;
  name: string;
  nationality: string | null;
  startYear: number | null;
  endYear: number | null;
  seasons: string | null;
}

export default function AdminManagers() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch("/admin/managers");
    if (r.ok) setManagers(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function selectManager(id: number) {
    setExpandedId(id);
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-manager-row="${id}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  const filtered = managers.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Técnicos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Badges manuais (ex.: Campeão Alagoano 2023)
          </p>
        </div>
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
        onSelect={(item) => selectManager(item.id)}
      />

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                <th className="text-left px-3 py-2 w-8"></th>
                <th className="text-left px-3 py-2">Nome</th>
                <th className="text-left px-3 py-2">Nacionalidade</th>
                <th className="text-left px-3 py-2">Período</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <Fragment key={m.id}>
                  <tr
                    className="border-b hover:bg-gray-50/80"
                    data-manager-row={m.id}
                  >
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId((id) => (id === m.id ? null : m.id))
                        }
                        className="text-gray-400 hover:text-[#1B3A6B]"
                      >
                        {expandedId === m.id ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronRight size={16} />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2 font-medium">{m.name}</td>
                    <td className="px-3 py-2 text-gray-500">
                      {m.nationality ?? "–"}
                    </td>
                    <td className="px-3 py-2 text-gray-500">
                      {m.startYear != null || m.endYear != null
                        ? `${m.startYear ?? "?"}–${m.endYear ?? "?"}`
                        : (m.seasons ?? "–")}
                    </td>
                  </tr>
                  {expandedId === m.id && (
                    <tr>
                      <td colSpan={4} className="bg-gray-50 px-4 py-3 border-b">
                        <AdminEntityBadges
                          entityType="manager"
                          entityId={m.id}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Nenhum técnico encontrado
            </p>
          )}
        </div>
      )}
    </div>
  );
}
