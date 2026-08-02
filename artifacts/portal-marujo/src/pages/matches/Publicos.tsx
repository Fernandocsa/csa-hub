import { useState } from "react";
import {
  useGetBiggestAttendance,
  type AttendanceSortBy,
  type RevenueCurrency,
} from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MatchSidesLabel } from "@/components/MatchSidesLabel";
import { ListPagination } from "@/components/ListPagination";
import { useClientPage } from "@/hooks/useClientPage";
import { assignCompetitionRanks, formatCompetitionRank } from "@/lib/competition-rank";

function fmtNumber(n: number) {
  return n.toLocaleString("pt-BR");
}

function fmtRevenue(m: { grossRevenue: number | null; grossRevenueText?: string | null }) {
  if (m.grossRevenueText) return m.grossRevenueText.replace(/^["'\s]+/, "");
  if (m.grossRevenue != null)
    return m.grossRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return null;
}

/** Numeric value for ranking ties within the same currency family. */
function revenueRankValue(m: { grossRevenue: number | null; grossRevenueText?: string | null }) {
  if (m.grossRevenue != null) return m.grossRevenue;
  const raw = (m.grossRevenueText ?? "").replace(/[^0-9,.]/g, "").replace(/,[0-9]*$/, "").replace(/\./g, "");
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

type Tab = "attendance" | "attendance_paid" | "gross_revenue";

const TABS: { id: Tab; label: string }[] = [
  { id: "attendance",      label: "Público Total"   },
  { id: "attendance_paid", label: "Público Pagante" },
  { id: "gross_revenue",   label: "Renda"           },
];

const REVENUE_CURRENCIES: { id: RevenueCurrency; label: string; hint: string }[] = [
  { id: "real",     label: "Real",     hint: "R$" },
  { id: "cruzado",  label: "Cruzado",  hint: "Cz$ / NCz$" },
  { id: "cruzeiro", label: "Cruzeiro", hint: "Cr$ / NCr$" },
];

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}

function CurrencyChip({
  active,
  onClick,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-3 py-1.5 text-sm transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary font-medium"
          : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground",
      )}
    >
      <span>{label}</span>
      <span className="ml-1.5 text-xs opacity-70">{hint}</span>
    </button>
  );
}

function AttendanceTable({
  sortBy,
  currency,
}: {
  sortBy: Tab;
  currency: RevenueCurrency;
}) {
  const { data: matches, isLoading } = useGetBiggestAttendance(
    200,
    sortBy as AttendanceSortBy,
    sortBy === "gross_revenue" ? currency : undefined,
  );
  const rows = matches ?? [];
  const ranks = assignCompetitionRanks(rows, (m) =>
    sortBy === "attendance_paid"
      ? m.attendancePaid
      : sortBy === "gross_revenue"
        ? revenueRankValue(m)
        : m.attendance,
  );
  const { page, setPage, pageSize, total, slice, needsPagination, rankOffset } = useClientPage(rows);

  const colSpan = 5;

  return (
    <div className="space-y-3">
    <div className="border rounded">
      <Table>
        <TableHeader>
          <TableRow className="text-xs">
            <TableHead className="py-2 w-8">#</TableHead>
            <TableHead className="py-2">Partida</TableHead>
            <TableHead className="py-2 hidden sm:table-cell">Competição</TableHead>
            <TableHead className="py-2 hidden md:table-cell">Data</TableHead>
            {sortBy === "attendance" && (
              <TableHead className="py-2 text-right font-bold text-primary">Público</TableHead>
            )}
            {sortBy === "attendance_paid" && (
              <TableHead className="py-2 text-right font-bold text-primary">Pagante</TableHead>
            )}
            {sortBy === "gross_revenue" && (
              <TableHead className="py-2 text-right font-bold text-primary">Renda</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 12 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={colSpan}><Skeleton className="h-4" /></TableCell>
                </TableRow>
              ))
            : slice.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="h-20 text-center text-muted-foreground">
                    Nenhum dado disponível.
                  </TableCell>
                </TableRow>
              )
              : slice.map((m, i) => {
                  return (
                    <TableRow key={m.id} className="text-sm">
                      <TableCell className="py-2 text-muted-foreground font-mono text-xs">{formatCompetitionRank(ranks[rankOffset + i])}</TableCell>
                      <TableCell className="py-2 font-medium">
                        <MatchSidesLabel
                          homeAway={m.homeAway}
                          opponent={m.opponent}
                          opponentId={(m as { opponentId?: number }).opponentId}
                          matchId={m.id}
                          logoUrl={m.opponentLogoUrl}
                          separator={`${m.goalsFor}–${m.goalsAgainst}`}
                        />
                        <span className="text-xs text-muted-foreground ml-1.5">({m.season})</span>
                      </TableCell>
                      <TableCell className="py-2 text-muted-foreground text-xs hidden sm:table-cell">{m.competition}</TableCell>
                      <TableCell className="py-2 text-muted-foreground text-xs hidden md:table-cell">{fmtDate(m.date)}</TableCell>
                      {sortBy === "attendance" && (
                        <TableCell className="py-2 text-right font-bold text-primary">
                          {m.attendance != null ? fmtNumber(m.attendance) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                      )}
                      {sortBy === "attendance_paid" && (
                        <TableCell className="py-2 text-right font-bold text-primary">
                          {m.attendancePaid != null ? fmtNumber(m.attendancePaid) : <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                      )}
                      {sortBy === "gross_revenue" && (
                        <TableCell className="py-2 text-right font-bold text-primary">
                          {fmtRevenue(m) ?? <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
        </TableBody>
      </Table>
    </div>
    {needsPagination && (
      <ListPagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
    )}
    </div>
  );
}

export default function Publicos() {
  const [activeTab, setActiveTab] = useState<Tab>("attendance");
  const [revenueCurrency, setRevenueCurrency] = useState<RevenueCurrency>("real");

  const descriptions: Record<Tab, string> = {
    attendance:      "Ranking histórico de partidas com maior público total (pagante + gratuito) no Estádio Rei Pelé",
    attendance_paid: "Ranking histórico de partidas com maior público pagante no Estádio Rei Pelé",
    gross_revenue:   "Ranking de renda bruta no Estádio Rei Pelé, separado por moeda (valores de eras diferentes não são comparáveis)",
  };

  const currencyHint =
    revenueCurrency === "real"
      ? "Real (R$) — partidas modernas e registros em real"
      : revenueCurrency === "cruzeiro"
        ? "Cruzeiro (Cr$ / NCr$) — não inclui Real nem Cruzado"
        : "Cruzado (Cz$ / NCz$) — não inclui Real nem Cruzeiro";

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold">Maiores Públicos</h1>
        <p className="text-sm text-muted-foreground">
          {activeTab === "gross_revenue" ? `${descriptions.gross_revenue}. ${currencyHint}.` : descriptions[activeTab]}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b -mb-3">
        {TABS.map((t) => (
          <TabButton key={t.id} active={activeTab === t.id} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </TabButton>
        ))}
      </div>

      {activeTab === "gross_revenue" && (
        <div className="flex flex-wrap gap-2 pt-1">
          {REVENUE_CURRENCIES.map((c) => (
            <CurrencyChip
              key={c.id}
              active={revenueCurrency === c.id}
              onClick={() => setRevenueCurrency(c.id)}
              label={c.label}
              hint={c.hint}
            />
          ))}
        </div>
      )}

      <AttendanceTable sortBy={activeTab} currency={revenueCurrency} />
    </div>
  );
}
