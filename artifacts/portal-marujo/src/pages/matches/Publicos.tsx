import { useState } from "react";
import { Link } from "wouter";
import { useGetBiggestAttendance, type AttendanceSortBy } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MatchSidesLabel } from "@/components/MatchSidesLabel";

function fmtNumber(n: number) {
  return n.toLocaleString("pt-BR");
}

function fmtRevenue(m: { grossRevenue: number | null; grossRevenueText?: string | null }) {
  if (m.grossRevenueText) return m.grossRevenueText;
  if (m.grossRevenue != null)
    return m.grossRevenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return null;
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

function AttendanceTable({ sortBy }: { sortBy: Tab }) {
  const { data: matches, isLoading } = useGetBiggestAttendance(100, sortBy as AttendanceSortBy);

  const colSpan = sortBy === "attendance" ? 5 : sortBy === "attendance_paid" ? 5 : 5;

  return (
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
            : !matches || matches.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={colSpan} className="h-20 text-center text-muted-foreground">
                    Nenhum dado disponível.
                  </TableCell>
                </TableRow>
              )
              : matches.map((m, i) => {
                  return (
                    <TableRow key={m.id} className="text-sm">
                      <TableCell className="py-2 text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
                      <TableCell className="py-2 font-medium">
                        <Link
                          href={`/partidas/${m.id}`}
                          className="hover:text-primary hover:underline inline-flex items-center gap-1.5 flex-wrap"
                        >
                          <MatchSidesLabel
                            homeAway={m.homeAway}
                            opponent={m.opponent}
                            logoUrl={m.opponentLogoUrl}
                            separator={`${m.goalsFor}–${m.goalsAgainst}`}
                          />
                          <span className="text-xs text-muted-foreground">({m.season})</span>
                        </Link>
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
  );
}

export default function Publicos() {
  const [activeTab, setActiveTab] = useState<Tab>("attendance");

  const descriptions: Record<Tab, string> = {
    attendance:      "Ranking histórico de partidas com maior público total (pagante + gratuito) no Estádio Rei Pelé",
    attendance_paid: "Ranking histórico de partidas com maior público pagante no Estádio Rei Pelé",
    gross_revenue:   "Ranking histórico de partidas com maior renda bruta no Estádio Rei Pelé",
  };

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold">Maiores Públicos</h1>
        <p className="text-sm text-muted-foreground">{descriptions[activeTab]}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b -mb-3">
        {TABS.map((t) => (
          <TabButton key={t.id} active={activeTab === t.id} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </TabButton>
        ))}
      </div>

      <AttendanceTable sortBy={activeTab} />
    </div>
  );
}
