import { EntitySuggestionForm } from "@/components/EntitySuggestionForm";

/** Public entry for general suggestions (not tied to a specific entity). */
export default function Contribua() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight" data-testid="heading-contribua">
          Ajude a completar o acervo
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Tem uma correção, uma fonte, um público, uma escalação ou qualquer
          dado que falte no Portal Marujo? Envie aqui. Só a equipe do portal vê
          o envio — revisamos manualmente antes de publicar qualquer mudança.
        </p>
      </div>

      <EntitySuggestionForm entityType="general" />
    </div>
  );
}
