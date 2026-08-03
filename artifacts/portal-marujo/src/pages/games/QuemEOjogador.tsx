import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { listPlayers } from "@workspace/api-client-react";
import { PlayerPhoto } from "@/components/PlayerPhoto";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

type TodayPayload = {
  date: string;
  gameNumber: number;
  maxAttempts: number;
};

type AttrResult = "match" | "miss" | "higher" | "lower";

type Comparison = {
  position: { value: string; result: AttrResult };
  birthState: { value: string | null; result: AttrResult };
  nationality: { value: string | null; result: AttrResult };
  debutDecade: { value: number; result: AttrResult };
  appearances: { value: number; result: AttrResult };
  goals: { value: number; result: AttrResult };
};

type Answer = {
  id: number;
  name: string;
  fullName: string;
  position: string;
  birthState: string | null;
  nationality: string | null;
  photoUrl: string | null;
  debutYear: number;
  debutDecade: number;
  appearances: number;
  goals: number;
};

type GuessRow = {
  playerId: number;
  playerName: string;
  comparison: Comparison;
  correct: boolean;
};

type StoredState = {
  date: string;
  gameNumber: number;
  guesses: GuessRow[];
  status: "playing" | "won" | "lost";
  answer?: Answer;
};

const STORAGE_KEY = "portal-marujo:quem-e-o-jogador";

function loadStored(date: string): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredState;
    if (parsed?.date !== date) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStored(state: StoredState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function resultEmoji(r: AttrResult): string {
  if (r === "match") return "🟩";
  if (r === "higher" || r === "lower") return "🟨";
  return "🟥";
}

function resultArrow(r: AttrResult): string {
  if (r === "higher") return "🔼";
  if (r === "lower") return "🔽";
  if (r === "match") return "✅";
  return "❌";
}

function attrLabel(key: keyof Comparison): string {
  switch (key) {
    case "position":
      return "Posição";
    case "birthState":
      return "UF";
    case "nationality":
      return "Nacionalidade";
    case "debutDecade":
      return "Década estreia";
    case "appearances":
      return "Jogos";
    case "goals":
      return "Gols";
  }
}

function formatAttrValue(key: keyof Comparison, value: string | number | null) {
  if (key === "debutDecade" && typeof value === "number") return `${value}s`;
  if (value == null || value === "") return "—";
  return String(value);
}

function shareText(state: StoredState): string {
  const lines = state.guesses.map((g) => {
    const c = g.comparison;
    return [
      resultEmoji(c.position.result),
      resultEmoji(c.birthState.result),
      resultEmoji(c.nationality.result),
      resultEmoji(c.debutDecade.result),
      resultEmoji(c.appearances.result),
      resultEmoji(c.goals.result),
    ].join("");
  });
  const attemptsLabel =
    state.status === "won" ? `${state.guesses.length}/5` : "X/5";
  return [
    `Quem é o Jogador? #${state.gameNumber} ${attemptsLabel}`,
    "",
    ...lines,
  ].join("\n");
}

type Suggest = { id: number; name: string; position?: string | null };

export default function QuemEOjogadorPage() {
  const [today, setToday] = useState<TodayPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggest[]>([]);
  const [selected, setSelected] = useState<Suggest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [state, setState] = useState<StoredState | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/quem-e-o-jogador/today");
        if (!r.ok) throw new Error("Falha ao carregar o jogo");
        const data = (await r.json()) as TodayPayload;
        if (cancelled) return;
        setToday(data);
        const stored = loadStored(data.date);
        setState(
          stored ?? {
            date: data.date,
            gameNumber: data.gameNumber,
            guesses: [],
            status: "playing",
          },
        );
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erro ao carregar");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    const t = window.setTimeout(() => {
      listPlayers({ search: query.trim(), limit: 8 }, { signal: ac.signal })
        .then((res) => {
          setSuggestions(
            (res.data ?? []).map((p) => ({
              id: p.id,
              name: p.name,
              position: p.position,
            })),
          );
        })
        .catch(() => {});
    }, 200);
    return () => {
      window.clearTimeout(t);
      ac.abort();
    };
  }, [query]);

  const usedIds = useMemo(
    () => new Set(state?.guesses.map((g) => g.playerId) ?? []),
    [state],
  );

  const finished = state?.status === "won" || state?.status === "lost";
  const attemptsLeft = today
    ? Math.max(0, today.maxAttempts - (state?.guesses.length ?? 0))
    : 0;

  const onPick = useCallback((s: Suggest) => {
    setSelected(s);
    setQuery(s.name);
    setSuggestions([]);
  }, []);

  async function submitGuess() {
    if (!today || !state || state.status !== "playing" || submitting) return;
    const pick =
      selected && selected.name === query.trim()
        ? selected
        : suggestions.find(
            (s) => s.name.toLowerCase() === query.trim().toLowerCase(),
          );
    if (!pick) {
      setError("Escolha um jogador da lista de sugestões.");
      return;
    }
    if (usedIds.has(pick.id)) {
      setError("Você já chutou esse jogador hoje.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const attempt = state.guesses.length + 1;
      const r = await fetch("/api/quem-e-o-jogador/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: pick.id,
          attempt,
          date: today.date,
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Erro no palpite");

      const row: GuessRow = {
        playerId: pick.id,
        playerName: pick.name,
        comparison: data.comparison,
        correct: Boolean(data.correct),
      };
      const next: StoredState = {
        ...state,
        guesses: [...state.guesses, row],
        status: data.correct
          ? "won"
          : attempt >= today.maxAttempts
            ? "lost"
            : "playing",
        answer: data.answer ?? state.answer,
      };
      setState(next);
      saveStored(next);
      setQuery("");
      setSelected(null);
      setSuggestions([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar palpite");
    } finally {
      setSubmitting(false);
    }
  }

  async function onShare() {
    if (!state || !finished) return;
    const text = shareText(state);
    try {
      if (navigator.share) {
        await navigator.share({ text });
        return;
      }
    } catch {
      /* fall through to copy */
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!today || !state) {
    return (
      <div className="max-w-xl mx-auto">
        <p className="text-sm text-destructive">{error || "Jogo indisponível."}</p>
      </div>
    );
  }

  const keys: (keyof Comparison)[] = [
    "position",
    "birthState",
    "nationality",
    "debutDecade",
    "appearances",
    "goals",
  ];

  return (
    <div className="max-w-xl mx-auto space-y-6" data-testid="page-quem-e-o-jogador">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quem é o Jogador?</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Desafio #{today.gameNumber} · {today.date} · até {today.maxAttempts}{" "}
          tentativas
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Adivinhe o jogador do dia do CSA. Cada palpite compara posição, UF,
          nacionalidade, década de estreia, jogos e gols.
        </p>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {!finished && (
        <div className="relative space-y-2">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submitGuess();
              }
            }}
            placeholder="Digite o nome do jogador…"
            autoComplete="off"
            disabled={submitting}
            data-testid="guess-input"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-20 w-full border rounded-md bg-background shadow-md max-h-56 overflow-auto">
              {suggestions.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-muted disabled:opacity-40"
                    disabled={usedIds.has(s.id)}
                    onClick={() => onPick(s)}
                  >
                    <span className="font-medium">{s.name}</span>
                    {s.position && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        {s.position}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              Restam {attemptsLeft} tentativa{attemptsLeft === 1 ? "" : "s"}
            </p>
            <Button
              type="button"
              onClick={() => void submitGuess()}
              disabled={submitting || !query.trim()}
              data-testid="guess-submit"
            >
              {submitting ? "Enviando…" : "Chutar"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {state.guesses.length === 0 && !finished && (
          <p className="text-sm text-muted-foreground border rounded p-4">
            Nenhum palpite ainda. Use o autocomplete e chute um jogador real do
            acervo.
          </p>
        )}
        {state.guesses.map((g, idx) => (
          <div
            key={`${g.playerId}-${idx}`}
            className="border rounded-lg p-3 space-y-2"
            data-testid={`guess-row-${idx + 1}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                #{idx + 1} · {g.playerName}
                {g.correct ? " ✓" : ""}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {keys.map((k) => {
                const cell = g.comparison[k];
                return (
                  <div
                    key={k}
                    className="rounded border bg-muted/30 px-2 py-1.5 text-xs"
                  >
                    <div className="text-muted-foreground">{attrLabel(k)}</div>
                    <div className="font-medium mt-0.5 flex items-center gap-1">
                      <span>{resultArrow(cell.result)}</span>
                      <span>{formatAttrValue(k, cell.value)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {finished && state.answer && (
        <div
          className="border rounded-lg p-4 space-y-3 bg-primary/5"
          data-testid="guess-result"
        >
          {state.status === "won" ? (
            <p className="font-semibold text-primary">
              Acertou em {state.guesses.length} tentativa
              {state.guesses.length === 1 ? "" : "s"}!
            </p>
          ) : (
            <p className="font-semibold">Não foi dessa vez.</p>
          )}
          <div className="flex items-center gap-3">
            <PlayerPhoto
              url={state.answer.photoUrl}
              name={state.answer.name}
              size="md"
            />
            <div className="min-w-0">
              <Link
                href={`/jogadores/${state.answer.id}`}
                className="font-semibold hover:text-primary hover:underline"
              >
                {state.answer.name}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">
                {state.answer.position}
                {state.answer.birthState ? ` · ${state.answer.birthState}` : ""}
                {state.answer.nationality
                  ? ` · ${state.answer.nationality}`
                  : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Estreia {state.answer.debutYear} · {state.answer.appearances}{" "}
                jogos · {state.answer.goals} gols
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void onShare()}>
              {copied ? "Copiado!" : "Compartilhar resultado"}
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link href={`/jogadores/${state.answer.id}`}>Ver perfil</Link>
            </Button>
          </div>
          <pre className="text-xs bg-muted/40 rounded p-2 whitespace-pre-wrap font-mono">
            {shareText(state)}
          </pre>
        </div>
      )}
    </div>
  );
}
