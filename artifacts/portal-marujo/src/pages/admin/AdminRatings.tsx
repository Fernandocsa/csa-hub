import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Star, Trash2 } from "lucide-react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";

interface AdminRatingRow {
  id: number;
  entityType: string;
  entityId: number;
  entityLabel: string;
  publicPath: string;
  adminPath: string;
  stars: number;
  label: string | null;
  createdAt: string;
}

interface Page {
  data: AdminRatingRow[];
  total: number;
  limit: number;
  offset: number;
}

const PAGE_SIZE = 50;

type TypeFilter = "all" | "player" | "manager" | "match";

function entityTypeLabel(t: string): string {
  if (t === "player") return "Jogador";
  if (t === "manager") return "Técnico";
  if (t === "match") return "Partida";
  return t;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StarsDisplay({ stars }: { stars: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" title={`${stars} de 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < stars
              ? "fill-[#F5A623] text-[#F5A623]"
              : "fill-transparent text-gray-300"
          }
        />
      ))}
    </span>
  );
}

export default function AdminRatings() {
  const [page, setPage] = useState<Page | null>(null);
  const [offset, setOffset] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (typeFilter !== "all") params.set("entityType", typeFilter);
    const r = await adminFetch(`/admin/ratings?${params}`);
    if (!r.ok) {
      setError("Erro ao carregar avaliações");
      setPage(null);
      setLoading(false);
      return;
    }
    setPage((await r.json()) as Page);
    setLoading(false);
  }, [offset, typeFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteRating(id: number) {
    if (!confirm("Excluir esta avaliação?")) return;
    const r = await adminFetch(`/admin/ratings/${id}`, { method: "DELETE" });
    if (!r.ok) {
      alert("Não foi possível excluir");
      return;
    }
    await load();
  }

  const total = page?.total ?? 0;
  const rows = page?.data ?? [];
  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < total;

  const filters: { id: TypeFilter; label: string }[] = [
    { id: "all", label: "Todas" },
    { id: "player", label: "Jogadores" },
    { id: "manager", label: "Técnicos" },
    { id: "match", label: "Partidas" },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Avaliações</h1>
          <p className="text-sm text-gray-500">
            Notas do público (estrelas) — mais recentes primeiro
            {total > 0 ? ` · ${total} no total` : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setTypeFilter(f.id);
                setOffset(0);
              }}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                typeFilter === f.id
                  ? "bg-[#1B3A6B] text-white"
                  : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400">Carregando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="text-sm text-gray-400">Nenhuma avaliação ainda.</p>
      )}

      {!loading && rows.length > 0 && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Data
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Nota
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Entidade
                </th>
                <th className="px-4 py-2 w-12" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 align-top">
                  <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                    {fmtDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <StarsDisplay stars={row.stars} />
                      <span className="text-xs font-semibold text-gray-700">
                        {row.stars}/5
                      </span>
                    </div>
                    {row.label && (
                      <div className="text-xs text-gray-400 mt-0.5">{row.label}</div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-xs text-gray-400">
                      {entityTypeLabel(row.entityType)}
                    </div>
                    <Link
                      href={row.adminPath}
                      className="text-[#1B3A6B] hover:underline"
                    >
                      {row.entityLabel}
                    </Link>
                    <div>
                      <a
                        href={row.publicPath}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-gray-400 hover:underline"
                      >
                        ver no portal
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => deleteRating(row.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center gap-3 mt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canPrev || loading}
            onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          >
            Anterior
          </Button>
          <span className="text-xs text-gray-500">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} de {total}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canNext || loading}
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  );
}
