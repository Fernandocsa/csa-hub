import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { useState } from "react";
import {
  fetchRating,
  getLocalVote,
  submitRating,
  type RatingEntityType,
  type RatingSummary,
} from "@/lib/ratings";
import { cn } from "@/lib/utils";

function ratingsQueryKey(entityType: RatingEntityType, entityId: number) {
  return ["ratings", entityType, entityId] as const;
}

function StarRow({
  value,
  interactive,
  onSelect,
  disabled,
  size = "md",
}: {
  value: number;
  interactive?: boolean;
  onSelect?: (stars: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
}) {
  const [hover, setHover] = useState(0);
  const display = interactive && hover > 0 ? hover : value;
  const iconClass = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div
      className="inline-flex items-center gap-0.5"
      onMouseLeave={() => interactive && setHover(0)}
      role={interactive ? "radiogroup" : "img"}
      aria-label={
        interactive
          ? "Escolha de 1 a 5 estrelas"
          : `Média ${value.toFixed(1)} de 5`
      }
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = display >= n;
        const half =
          !interactive && !filled && display >= n - 0.5 && display < n;
        const btn = (
          <Star
            className={cn(
              iconClass,
              filled || half
                ? "text-amber-500 fill-amber-500"
                : "text-muted-foreground/35",
              half && "opacity-60",
            )}
          />
        );
        if (!interactive) {
          return (
            <span key={n} className="inline-flex">
              {btn}
            </span>
          );
        }
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            disabled={disabled}
            className={cn(
              "p-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              disabled ? "cursor-default opacity-80" : "cursor-pointer hover:scale-105",
            )}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onClick={() => onSelect?.(n)}
          >
            {btn}
          </button>
        );
      })}
    </div>
  );
}

function countLabel(n: number): string {
  if (n === 1) return "1 avaliação";
  return `${n} avaliações`;
}

export function StarRating({
  entityType,
  entityId,
  className,
}: {
  entityType: RatingEntityType;
  entityId: number;
  className?: string;
}) {
  const queryClient = useQueryClient();
  const localVote = getLocalVote(entityType, entityId);

  const { data, isLoading, isError } = useQuery({
    queryKey: ratingsQueryKey(entityType, entityId),
    queryFn: () => fetchRating(entityType, entityId),
    enabled: Number.isFinite(entityId) && entityId > 0,
  });

  const mutation = useMutation({
    mutationFn: (stars: number) => submitRating(entityType, entityId, stars),
    onSuccess: (result) => {
      const summary: RatingSummary = {
        average: result.average,
        count: result.count,
        label: result.label,
        myRating: result.myRating ?? result.stars,
      };
      queryClient.setQueryData(ratingsQueryKey(entityType, entityId), summary);
    },
    onError: async (err) => {
      const msg = (err as Error)?.message ?? "";
      if (/já avaliou/i.test(msg)) {
        await queryClient.invalidateQueries({
          queryKey: ratingsQueryKey(entityType, entityId),
        });
      }
    },
  });

  const myRating = data?.myRating ?? localVote;
  const alreadyVoted = myRating != null;
  const average = data?.average ?? null;
  const label = data?.label ?? null;
  const count = data?.count ?? 0;

  return (
    <div
      className={cn("space-y-2", className)}
      data-testid={`star-rating-${entityType}`}
    >
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Avaliação da torcida
      </h2>

      {isLoading && (
        <p className="text-sm text-muted-foreground">Carregando avaliação…</p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          Não foi possível carregar a avaliação.
        </p>
      )}

      {!isLoading && !isError && (
        <>
          {count > 0 && average != null ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <StarRow value={average} size="md" />
              <div className="text-sm">
                <span className="font-semibold tabular-nums">{average.toFixed(1)}</span>
                {label && (
                  <>
                    <span className="text-muted-foreground mx-1.5">·</span>
                    <span className="font-medium">{label}</span>
                  </>
                )}
                <span className="text-muted-foreground mx-1.5">·</span>
                <span className="text-muted-foreground">{countLabel(count)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Seja o primeiro a avaliar
            </p>
          )}

          <div className="pt-1">
            {alreadyVoted ? (
              <p className="text-sm text-muted-foreground">
                Você avaliou com{" "}
                <span className="font-medium text-foreground">
                  {myRating} estrela{myRating! > 1 ? "s" : ""}
                </span>
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">Sua nota:</span>
                <StarRow
                  value={0}
                  interactive
                  disabled={mutation.isPending}
                  onSelect={(stars) => mutation.mutate(stars)}
                />
              </div>
            )}
            {mutation.isError && (
              <p className="text-sm text-destructive mt-1">
                {(mutation.error as Error)?.message ?? "Erro ao enviar"}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
