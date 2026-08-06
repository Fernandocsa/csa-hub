import { cn } from "@/lib/utils";

type Result = "win" | "draw" | "loss";

const labels: Record<Result, string> = { win: "V", draw: "E", loss: "D" };
const styles: Record<Result, string> = {
  win: "bg-green-600 text-white",
  draw: "bg-zinc-500 text-white",
  loss: "bg-red-600 text-white",
};

export function ResultBadge({ result, className }: { result: string; className?: string }) {
  const r = result as Result;
  return (
    <span
      data-testid={`badge-result-${result}`}
      className={cn(
        "inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold",
        styles[r] ?? "bg-muted text-muted-foreground",
        className
      )}
    >
      {labels[r] ?? result}
    </span>
  );
}

/** Compact W.O. (walkover) seal for match lists. */
export function WalkoverBadge({ className }: { className?: string }) {
  return (
    <span
      data-testid="badge-walkover"
      title="Vitória/derrota por W.O. (walkover)"
      className={cn(
        "inline-flex items-center justify-center text-[10px] font-semibold tracking-wide",
        "border border-muted-foreground/35 text-muted-foreground rounded px-1.5 py-0.5 leading-none",
        className,
      )}
    >
      W.O.
    </span>
  );
}
