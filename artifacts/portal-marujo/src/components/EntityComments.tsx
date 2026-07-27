import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type CommentEntityType = "player" | "manager" | "match";

export interface PublicComment {
  id: number;
  entityType: CommentEntityType;
  entityId: number;
  authorName: string;
  body: string;
  createdAt: string;
}

interface CommentsPage {
  data: PublicComment[];
  total: number;
  limit: number;
  offset: number;
}

const PAGE_SIZE = 20;

function commentsQueryKey(entityType: CommentEntityType, entityId: number, offset: number) {
  return ["comments", entityType, entityId, offset] as const;
}

async function fetchComments(
  entityType: CommentEntityType,
  entityId: number,
  offset: number,
): Promise<CommentsPage> {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    offset: String(offset),
  });
  const r = await fetch(`/api/comments/${entityType}/${entityId}?${params}`);
  if (!r.ok) throw new Error("Falha ao carregar comentários");
  return r.json();
}

async function postComment(
  entityType: CommentEntityType,
  entityId: number,
  payload: { authorName: string; body: string },
): Promise<PublicComment> {
  const r = await fetch(`/api/comments/${entityType}/${entityId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Erro ao enviar");
  }
  return r.json();
}

function fmtCommentDate(iso: string): string {
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

export function EntityComments({
  entityType,
  entityId,
}: {
  entityType: CommentEntityType;
  entityId: number;
}) {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [authorName, setAuthorName] = useState("");
  const [body, setBody] = useState("");
  const [formError, setFormError] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: commentsQueryKey(entityType, entityId, offset),
    queryFn: () => fetchComments(entityType, entityId, offset),
  });

  const mutation = useMutation({
    mutationFn: () =>
      postComment(entityType, entityId, {
        authorName: authorName.trim(),
        body: body.trim(),
      }),
    onSuccess: () => {
      setBody("");
      setFormError("");
      setOffset(0);
      queryClient.invalidateQueries({ queryKey: ["comments", entityType, entityId] });
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const total = data?.total ?? 0;
  const comments = data?.data ?? [];
  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < total;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!authorName.trim()) {
      setFormError("Informe um nome ou apelido.");
      return;
    }
    if (!body.trim()) {
      setFormError("Escreva um comentário.");
      return;
    }
    mutation.mutate();
  }

  return (
    <section className="space-y-4 border-t pt-6" data-testid="entity-comments">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Comentários
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {total === 0
            ? "Seja o primeiro a comentar."
            : `${total} comentário${total === 1 ? "" : "s"}`}
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-3 max-w-xl">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            Nome ou apelido *
          </label>
          <Input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            maxLength={80}
            placeholder="Como você quer aparecer"
            required
          />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">
            Comentário *
          </label>
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Deixe seu comentário…"
            required
          />
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? "Enviando…" : "Publicar comentário"}
        </Button>
      </form>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando comentários…</p>}
      {isError && (
        <p className="text-sm text-destructive">Não foi possível carregar os comentários.</p>
      )}

      {!isLoading && !isError && comments.length > 0 && (
        <ul className="space-y-3 max-w-xl">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-border/60 pb-3 last:border-0">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-sm font-semibold">{c.authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {fmtCommentDate(c.createdAt)}
                </span>
              </div>
              <p className="text-sm mt-1 whitespace-pre-wrap break-words">{c.body}</p>
            </li>
          ))}
        </ul>
      )}

      {total > PAGE_SIZE && (
        <div className="flex items-center gap-3 text-sm">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canPrev}
            onClick={() => setOffset((o) => Math.max(0, o - PAGE_SIZE))}
          >
            Mais recentes
          </Button>
          <span className="text-muted-foreground text-xs">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} de {total}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!canNext}
            onClick={() => setOffset((o) => o + PAGE_SIZE)}
          >
            Mais antigos
          </Button>
        </div>
      )}
    </section>
  );
}
