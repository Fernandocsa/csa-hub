import { Button } from "@/components/ui/button";

type Props = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  /** Optional noun after the total, e.g. " adversários" */
  label?: string;
};

/** Anterior / Próxima — same pattern as PlayersList / MatchesList. */
export function ListPagination({ page, pageSize, total, onPageChange, label = "" }: Props) {
  if (total <= pageSize) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">
        {from}–{to} de {total}
        {label}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          data-testid="button-prev"
        >
          Anterior
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page * pageSize >= total}
          onClick={() => onPageChange(page + 1)}
          data-testid="button-next"
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
