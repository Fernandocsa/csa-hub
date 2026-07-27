import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type SuggestionEntityType = "player" | "manager" | "match";

async function postSuggestion(
  entityType: SuggestionEntityType,
  entityId: number,
  payload: { authorName: string; message: string; contact?: string },
): Promise<void> {
  const r = await fetch(`/api/suggestions/${entityType}/${entityId}`, {
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
  entityId,
}: {
  entityType: SuggestionEntityType;
  entityId: number;
}) {
  const [open, setOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [saving, setSaving] = useState(false);

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

  return (
    <section className="space-y-3 border-t pt-6" data-testid="entity-suggestion">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Sugerir correção
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Encontrou um erro ou tem uma sugestão? Só a equipe do portal vê o
          envio.
        </p>
      </div>

      {!open && !sent && (
        <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
          Enviar sugestão
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
              Mensagem *
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={4000}
              rows={4}
              placeholder="Descreva o problema ou a sugestão…"
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
