import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export type SuggestionEntityType =
  | "player"
  | "manager"
  | "match"
  | "opponent"
  | "stadium"
  | "referee"
  | "season"
  | "general";

async function postSuggestion(
  entityType: SuggestionEntityType,
  entityId: number | null,
  payload: { authorName: string; message: string; contact?: string },
): Promise<void> {
  const url =
    entityType === "general"
      ? "/api/suggestions/general"
      : `/api/suggestions/${entityType}/${entityId}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!r.ok) {
    const err = await r.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? "Erro ao enviar");
  }
}

export function EntitySuggestionForm({
  entityType,
  entityId = null,
  variant = "default",
  defaultOpen = false,
  heading,
  description,
  messagePlaceholder,
  ctaLabel,
  id,
}: {
  entityType: SuggestionEntityType;
  /** Required except when entityType is "general". For season, pass the year. */
  entityId?: number | null;
  /** Emphasized card for unknown match scores. */
  variant?: "default" | "score";
  defaultOpen?: boolean;
  heading?: string;
  description?: string;
  messagePlaceholder?: string;
  ctaLabel?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!defaultOpen) return;
    setOpen(true);
    const t = window.setTimeout(() => {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [defaultOpen]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!authorName.trim()) {
      setError("Informe seu nome.");
      return;
    }
    if (!message.trim()) {
      setError("Descreva a sugestão ou o erro.");
      return;
    }
    if (entityType !== "general" && (entityId == null || entityId < 1)) {
      setError("Entidade inválida para envio.");
      return;
    }
    setSaving(true);
    try {
      await postSuggestion(entityType, entityId, {
        authorName: authorName.trim(),
        message: message.trim(),
        contact: contact.trim() || undefined,
      });
      setSent(true);
      setMessage("");
      setContact("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao enviar");
    }
    setSaving(false);
  }

  const isScore = variant === "score";
  const title =
    heading ?? (isScore ? "Sugerir placar" : "Sugerir correção");
  const blurb =
    description ??
    (isScore
      ? "Sabe o resultado deste jogo? Envie o placar e, se puder, a fonte (jornal, site, livro)."
      : "Encontrou um erro ou tem uma sugestão? Só a equipe do portal vê o envio.");
  const placeholder =
    messagePlaceholder ??
    (isScore
      ? "Ex.: CSA 2–1 Remo · fonte: Gazeta de Alagoas, 15/03/1980"
      : "Descreva o problema ou a sugestão…");
  const buttonLabel = ctaLabel ?? (isScore ? "Sugerir placar" : "Enviar sugestão");

  return (
    <section
      ref={rootRef}
      id={id}
      className={cn(
        "space-y-3",
        isScore
          ? "rounded-lg border-2 border-primary/30 bg-primary/5 px-4 py-4"
          : "border-t pt-6",
      )}
      data-testid="entity-suggestion"
    >
      <div>
        <h2
          className={cn(
            "font-semibold tracking-wider text-muted-foreground",
            isScore ? "text-base uppercase text-foreground" : "text-sm uppercase",
          )}
        >
          {title}
        </h2>
        <p className="text-xs text-muted-foreground mt-1">{blurb}</p>
      </div>

      {!open && !sent && (
        <Button
          type="button"
          variant={isScore ? "default" : "outline"}
          size="sm"
          onClick={() => setOpen(true)}
        >
          {buttonLabel}
        </Button>
      )}

      {sent && (
        <p className="text-sm text-green-700">
          Obrigado! Sua sugestão foi enviada.
          <button
            type="button"
            className="ml-2 underline text-muted-foreground"
            onClick={() => {
              setSent(false);
              setOpen(true);
            }}
          >
            Enviar outra
          </button>
        </p>
      )}

      {open && !sent && (
        <form onSubmit={onSubmit} className="space-y-3 max-w-xl">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Nome *
            </label>
            <Input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={80}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              {isScore ? "Placar / detalhes *" : "Mensagem *"}
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={4000}
              rows={4}
              placeholder={placeholder}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">
              Contato (e-mail ou rede social, opcional)
            </label>
            <Input
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              maxLength={200}
              placeholder="Opcional"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Enviando…" : "Enviar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={() => {
                setOpen(false);
                setError("");
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
