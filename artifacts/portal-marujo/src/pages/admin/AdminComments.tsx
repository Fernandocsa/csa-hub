import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Trash2 } from "lucide-react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";

interface AdminCommentRow {
  id: number;
  entityType: string;
  entityId: number;
  entityLabel: string;
  publicPath: string;
  adminPath: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface Page {
  data: AdminCommentRow[];
  total: number;
  limit: number;
  offset: number;
}

const PAGE_SIZE = 50;

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

export default function AdminComments() {
  const [page, setPage] = useState<Page | null>(null);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const r = await adminFetch(
      `/admin/comments?limit=${PAGE_SIZE}&offset=${offset}`,
    );
    if (!r.ok) {
      setError("Erro ao carregar comentários");
      setPage(null);
      setLoading(false);
      return;
    }
    setPage((await r.json()) as Page);
    setLoading(false);
  }, [offset]);

  useEffect(() => {
    load();
  }, [load]);

  async function deleteComment(id: number) {
    if (!confirm("Excluir este comentário?")) return;
    const r = await adminFetch(`/admin/comments/${id}`, { method: "DELETE" });
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
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Comentários</h1>
        <p className="text-sm text-gray-500">
          Moderação — mais recentes primeiro
          {total > 0 ? ` · ${total} no total` : ""}
        </p>
      </div>

      {loading && <p className="text-sm text-gray-400">Carregando...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && rows.length === 0 && (
        <p className="text-sm text-gray-400">Nenhum comentário ainda.</p>
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
                  Autor
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Entidade
                </th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                  Comentário
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
                  <td className="px-4 py-2 font-medium">{row.authorName}</td>
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
                  <td className="px-4 py-2 text-gray-700 whitespace-pre-wrap break-words max-w-md">
                    {row.body}
                  </td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => deleteComment(row.id)}
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
