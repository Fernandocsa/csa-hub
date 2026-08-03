import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Check, Trash2 } from "lucide-react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";

interface AdminSuggestionRow {
  id: number;
  entityType: string;
  entityId: number | null;
  entityLabel: string;
  publicPath: string | null;
  adminPath: string | null;
  authorName: string;
  message: string;
  contact: string | null;
  status: string;
  createdAt: string;
}

interface Page {
  data: AdminSuggestionRow[];
  total: number;
  limit: number;
  offset: number;
}

const PAGE_SIZE = 50;

function entityTypeLabel(t: string): string {
  if (t === "player") return "Jogador";
  if (t === "manager") return "Técnico";
  if (t === "match") return "Partida";
  if (t === "opponent") return "Adversário";
  if (t === "stadium") return "Estádio";
  if (t === "referee") return "Árbitro";
  if (t === "season") return "Temporada";
  if (t === "general") return "Geral";
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

export default function AdminSuggestions() {
  const [page, setPage] = useState<Page | null>(null);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "reviewed">(
    "new",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: String(offset),
    });
    if (statusFilter !== "all") params.set("status", statusFilter);
    const r = await adminFetch(`/admin/suggestions?${params}`);
    if (!r.ok) {
      setError("Erro ao carregar sugestões");
      setPage(null);
      setLoading(false);
      return;
    }
    setPage((await r.json()) as Page);
    setLoading(false);
  }, [offset, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  async function markReviewed(id: number) {
    const r = await adminFetch(`/admin/suggestions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "reviewed" }),
    });
    if (!r.ok) {
      alert("Não foi possível marcar como revisada");
      return;
    }
    await load();
  }

  async function deleteSuggestion(id: number) {
    if (!confirm("Excluir esta sugestão?")) return;
    const r = await adminFetch(`/admin/suggestions/${id}`, { method: "DELETE" });
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

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Sugestões</h1>
          <p className="text-sm text-gray-500">
            Relatos privados de visitantes
            {total > 0 ? ` · ${total} nesta vista` : ""}
          </p>
        </div>
        <div className="flex gap-1">
          {(
            [
              ["new", "Novas"],
              ["reviewed", "Revisadas"],
              ["all", "Todas"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setOffset(0);
                setStatusFilter(value);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded border ${
                statusFilter === value
                  ? "bg-[#1B3A6B] text-white border-[#1B3A6B]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-sm text-gray-400">Carregando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="text-sm text-gray-400">Nenhuma sugestão nesta vista.</p>
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
                  Autor / contato
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Entidade
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Mensagem
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-2 w-20" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 align-top">
                  <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">
                    {fmtDate(row.createdAt)}
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-medium">{row.authorName}</div>
                    {row.contact && (
                      <div className="text-xs text-gray-500 break-all">
                        {row.contact}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="text-xs text-gray-400">
                      {entityTypeLabel(row.entityType)}
                    </div>
                    {row.adminPath ? (
                      <Link
                        href={row.adminPath}
                        className="text-[#1B3A6B] hover:underline"
                      >
                        {row.entityLabel}
                      </Link>
                    ) : (
                      <span className="text-gray-800">{row.entityLabel}</span>
                    )}
                    {row.publicPath && (
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
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-700 whitespace-pre-wrap break-words max-w-md">
                    {row.message}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {row.status === "reviewed" ? (
                      <span className="text-green-700">Revisada</span>
                    ) : (
                      <span className="text-amber-700">Nova</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex gap-1 justify-end">
                      {row.status !== "reviewed" && (
                        <button
                          type="button"
                          onClick={() => markReviewed(row.id)}
                          className="p-1 text-gray-400 hover:text-green-700"
                          title="Marcar como revisada"
                        >
                          <Check size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteSuggestion(row.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
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
