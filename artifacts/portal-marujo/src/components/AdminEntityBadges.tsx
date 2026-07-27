import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildManualBadgeLabel,
  deriveBadgeYearFromMatch,
  formatMatchBadgeOption,
  templateNeedsCompetition,
  templateNeedsMatch,
  templateNeedsYear,
  templatesForEntity,
  TEMPLATE_SELECT_LABELS,
  type BadgeEntityType,
  type ManualBadgeTemplate,
} from "@/lib/manual-badge-templates";
import { Plus, Trash2 } from "lucide-react";

export type { BadgeEntityType };

export type EntityBadgeRow = {
  id: number;
  entityType: string;
  entityId: number;
  label: string;
  source: string;
  autoKind: string | null;
  seasonYear: number | null;
  competitionId?: number | null;
  matchId?: number | null;
  template?: string | null;
  createdAt?: string;
};

type CompetitionOption = { id: number; name: string };

type MatchSearchResult = {
  id: number;
  matchDate: string;
  season: string;
  opponentName: string;
  competitionId: number;
  competitionName: string;
};

function AdminMatchSearch({
  value,
  onSelect,
  onClear,
}: {
  value: MatchSearchResult | null;
  onSelect: (match: MatchSearchResult) => void;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [results, setResults] = useState<MatchSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const term = query.trim();
    if (value && formatMatchBadgeOption(value) === query) {
      setResults([]);
      setLoading(false);
      return;
    }
    if (term.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const r = await adminFetch(
          `/admin/matches/search?q=${encodeURIComponent(term)}&limit=20`,
        );
        if (!r.ok || cancelled) return;
        const data = (await r.json()) as MatchSearchResult[];
        if (!cancelled) {
          setResults(Array.isArray(data) ? data : []);
          setHighlight(0);
          setOpen(true);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, value]);

  function pick(match: MatchSearchResult) {
    setQuery(formatMatchBadgeOption(match));
    setOpen(false);
    onSelect(match);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || results.length === 0) {
      if (e.key === "ArrowDown" && query.trim().length >= 2) setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = results[highlight];
      if (item) pick(item);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative min-w-[16rem] flex-1">
      <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">
        Partida
      </label>
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (value) onClear();
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= 2) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder="Buscar por adversário, data ou competição"
        className="h-8 text-xs"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open && results.length > 0}
      />
      {open && query.trim().length >= 2 && (
        <ul
          className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-white shadow-md text-xs"
          role="listbox"
        >
          {loading ? (
            <li className="px-3 py-2 text-gray-400">Buscando...</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-2 text-gray-400">Nenhuma partida</li>
          ) : (
            results.map((match, i) => (
              <li key={match.id} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                    i === highlight ? "bg-gray-50" : ""
                  }`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(match)}
                >
                  <span className="font-medium text-gray-900">
                    {formatMatchBadgeOption(match)}
                  </span>
                  <span className="block text-[10px] text-gray-500">
                    Temporada {match.season}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export function AdminEntityBadges({
  entityType,
  entityId,
}: {
  entityType: BadgeEntityType;
  entityId: number;
}) {
  const [badges, setBadges] = useState<EntityBadgeRow[] | null>(null);
  const [competitions, setCompetitions] = useState<CompetitionOption[]>([]);
  const [template, setTemplate] = useState<ManualBadgeTemplate | "">("");
  const [year, setYear] = useState("");
  const [competitionId, setCompetitionId] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<MatchSearchResult | null>(
    null,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const templateOptions = useMemo(
    () => templatesForEntity(entityType),
    [entityType],
  );

  const selectedCompetition = useMemo(
    () =>
      competitionId
        ? competitions.find((c) => String(c.id) === competitionId)
        : undefined,
    [competitionId, competitions],
  );

  const previewLabel = useMemo(() => {
    if (!template) return "";

    if (templateNeedsMatch(template)) {
      if (!selectedMatch) return "";
      const derivedYear = deriveBadgeYearFromMatch(
        selectedMatch.matchDate,
        selectedMatch.season,
      );
      if (derivedYear == null) return "";
      return buildManualBadgeLabel(template, {
        year: derivedYear,
        competitionName: selectedMatch.competitionName,
      });
    }

    const yearNum = year.trim() ? parseInt(year, 10) : undefined;
    if (templateNeedsYear(template) && !yearNum) return "";
    if (templateNeedsCompetition(template) && !selectedCompetition) return "";
    return buildManualBadgeLabel(template, {
      year: yearNum,
      competitionName: selectedCompetition?.name,
    });
  }, [template, year, selectedCompetition, selectedMatch]);

  const canSubmit =
    !!template &&
    !!previewLabel &&
    (!templateNeedsYear(template) || year.trim() !== "") &&
    (!templateNeedsCompetition(template) || competitionId !== "") &&
    (!templateNeedsMatch(template) || selectedMatch != null);

  const resetForm = () => {
    setTemplate("");
    setYear("");
    setCompetitionId("");
    setSelectedMatch(null);
  };

  const load = useCallback(async () => {
    const r = await adminFetch(`/admin/badges/${entityType}/${entityId}`);
    if (r.ok) setBadges(await r.json());
    else setBadges([]);
  }, [entityType, entityId]);

  useEffect(() => {
    setBadges(null);
    resetForm();
    load();
  }, [load]);

  useEffect(() => {
    adminFetch("/admin/lookup")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.competitions) {
          setCompetitions(
            (data.competitions as CompetitionOption[]).map((c) => ({
              id: c.id,
              name: c.name,
            })),
          );
        }
      })
      .catch(() => {});
  }, []);

  async function addBadge(e: React.FormEvent) {
    e.preventDefault();
    if (!template || !canSubmit) return;
    setSaving(true);
    setError("");
    try {
      const body: {
        template: ManualBadgeTemplate;
        year?: number;
        competitionId?: number;
        matchId?: number;
      } = { template };
      if (templateNeedsYear(template)) {
        body.year = parseInt(year, 10);
      }
      if (templateNeedsCompetition(template)) {
        body.competitionId = parseInt(competitionId, 10);
      }
      if (templateNeedsMatch(template) && selectedMatch) {
        body.matchId = selectedMatch.id;
      }
      const r = await adminFetch(`/admin/badges/${entityType}/${entityId}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao salvar");
      }
      resetForm();
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro");
    }
    setSaving(false);
  }

  async function removeBadge(id: number, source: string) {
    if (source !== "manual") return;
    if (!confirm("Remover este badge?")) return;
    await adminFetch(`/admin/badges/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="mt-4 pt-3 border-t border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase">
          Badges / Selos
        </span>
      </div>

      {!badges ? (
        <p className="text-xs text-gray-400">Carregando...</p>
      ) : badges.length === 0 ? (
        <p className="text-xs text-gray-400 mb-2">Nenhum badge</p>
      ) : (
        <ul className="space-y-1 mb-3">
          {badges.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-2 text-xs bg-white border rounded px-2 py-1.5"
            >
              <div className="min-w-0">
                <span className="font-medium">{b.label}</span>
                <span className="text-gray-400 ml-2">
                  {b.source === "auto" ? "automático" : "manual"}
                  {b.seasonYear != null ? ` · ${b.seasonYear}` : ""}
                </span>
              </div>
              {b.source === "manual" && (
                <button
                  type="button"
                  onClick={() => removeBadge(b.id, b.source)}
                  className="p-0.5 text-gray-400 hover:text-red-600 shrink-0"
                  title="Remover"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addBadge} className="space-y-2">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[10rem] flex-1">
            <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">
              Template
            </label>
            <Select
              value={template || undefined}
              onValueChange={(v) => {
                setTemplate(v as ManualBadgeTemplate);
                setYear("");
                setCompetitionId("");
                setSelectedMatch(null);
                setError("");
              }}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Escolher template" />
              </SelectTrigger>
              <SelectContent>
                {templateOptions.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">
                    {TEMPLATE_SELECT_LABELS[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {template && templateNeedsYear(template) && (
            <div className="w-24">
              <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">
                Ano
              </label>
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                className="h-8 text-xs"
                inputMode="numeric"
                required
              />
            </div>
          )}

          {template && templateNeedsCompetition(template) && (
            <div className="min-w-[10rem] flex-1">
              <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">
                Competição
              </label>
              <Select
                value={competitionId || undefined}
                onValueChange={setCompetitionId}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Escolher competição" />
                </SelectTrigger>
                <SelectContent>
                  {competitions.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {template && templateNeedsMatch(template) && (
            <AdminMatchSearch
              value={selectedMatch}
              onSelect={setSelectedMatch}
              onClear={() => setSelectedMatch(null)}
            />
          )}

          <Button
            type="submit"
            size="sm"
            className="bg-[#1B3A6B] h-8"
            disabled={saving || !canSubmit}
          >
            <Plus size={12} className="mr-1" />
            {saving ? "…" : "Adicionar"}
          </Button>
        </div>

        {previewLabel && (
          <p className="text-xs text-gray-600">
            Prévia: <span className="font-medium">{previewLabel}</span>
          </p>
        )}
      </form>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
