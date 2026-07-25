import { useGetBiggestAttendance } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

function fmtAttendance(n: number) {
  return n.toLocaleString("pt-BR");
}

function fmtRevenue(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("pt-BR");
}

export default function Publicos() {
  const { data: matches, isLoading } = useGetBiggestAttendance(100);

  return (
    <div className="space-y-5">
      <div className="border-b pb-3">
        <h1 className="text-xl font-bold">Maiores Públicos</h1>
        <p className="text-sm text-muted-foreground">Ranking histórico das partidas com maior público no Estádio Rei Pelé</p>
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2 w-8">#</TableHead>
              <TableHead className="py-2">Partida</TableHead>
              <TableHead className="py-2 hidden sm:table-cell">Competição</TableHead>
              <TableHead className="py-2 hidden md:table-cell">Data</TableHead>
              <TableHead className="py-2 text-right font-bold text-primary">Público</TableHead>
              <TableHead className="py-2 text-right hidden sm:table-cell">Pagante</TableHead>
              <TableHead className="py-2 text-right hidden lg:table-cell">Renda</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 12 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}><Skeleton className="h-4" /></TableCell>
                  </TableRow>
                ))
              : matches?.length === 0
                ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                      Nenhum dado disponível.
                    </TableCell>
                  </TableRow>
                )
                : matches?.map((m, i) => {
                    const isHome = m.homeAway === "home";
                    const home = isHome ? "CSA" : m.opponent;
                    const away = isHome ? m.opponent : "CSA";
                    return (
                      <TableRow key={m.id} className="text-sm">
                        <TableCell className="py-2 text-muted-foreground font-mono text-xs">{i + 1}</TableCell>
                        <TableCell className="py-2 font-medium">
                          {home} {m.goalsFor}–{m.goalsAgainst} {away}
                          <span className="ml-1.5 text-xs text-muted-foreground">({m.season})</span>
                        </TableCell>
                        <TableCell className="py-2 text-muted-foreground text-xs hidden sm:table-cell">{m.competition}</TableCell>
                        <TableCell className="py-2 text-muted-foreground text-xs hidden md:table-cell">{fmtDate(m.date)}</TableCell>
                        <TableCell className="py-2 text-right font-bold text-primary">
                          {fmtAttendance(m.attendance)}
                        </TableCell>
                        <TableCell className="py-2 text-right text-muted-foreground hidden sm:table-cell">
                          {m.attendancePaid != null ? fmtAttendance(m.attendancePaid) : <span className="text-xs">—</span>}
                        </TableCell>
                        <TableCell className="py-2 text-right text-muted-foreground hidden lg:table-cell">
                          {m.grossRevenue != null ? fmtRevenue(m.grossRevenue) : <span className="text-xs">—</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
