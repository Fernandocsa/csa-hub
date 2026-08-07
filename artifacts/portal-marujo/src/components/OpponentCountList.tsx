import { Link } from "wouter";
import { OpponentCrest } from "@/components/OpponentCrest";

export type OpponentCountItem = {
  opponentId: number;
  opponentName: string;
  logoUrl?: string | null;
  value: number;
};

/** Compact ranking of opponents (most faced / scored / beaten). */
export function OpponentCountList({
  title,
  rows,
  valueLabel,
  testId,
}: {
  title: string;
  rows: OpponentCountItem[];
  valueLabel: (value: number) => string;
  testId?: string;
}) {
  if (rows.length === 0) return null;
  return (
    <div data-testid={testId}>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
        {title}
      </h2>
      <ol className="space-y-1.5 text-sm">
        {rows.map((r, i) => (
          <li
            key={r.opponentId}
            className="flex items-center justify-between gap-3"
          >
            <span className="min-w-0 flex items-center gap-2 truncate">
              <span className="text-muted-foreground tabular-nums w-4 shrink-0">
                {i + 1}.
              </span>
              <OpponentCrest
                url={r.logoUrl}
                name={r.opponentName}
                size="sm"
                fallback
              />
              <Link
                href={`/adversarios/${r.opponentId}`}
                className="truncate font-medium hover:text-primary hover:underline"
              >
                {r.opponentName}
              </Link>
            </span>
            <span className="tabular-nums font-semibold shrink-0 text-foreground">
              {valueLabel(r.value)}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
