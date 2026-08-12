import { Link, useParams } from "wouter";
import { useGetRefereesByStateDetail } from "@workspace/api-client-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft } from "lucide-react";
import { ufDisplayName } from "@/lib/br-locations";
import { EntityPhoto } from "@/components/EntityPhoto";

function pct(wins: number, total: number) {
  if (!total) return "–";
  return `${((wins / total) * 100).toFixed(1)}%`;
}

function MiniRecord({
  label,
  data: d,
}: {
  label: string;
  data: { matches: number; wins: number; draws: number; losses: number };
}) {
  return (
    <div className="text-sm">
      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-center gap-3">
        <span className="font-bold">{d.matches}J</span>
        <span className="text-green-600 font-medium">{d.wins}V</span>
        <span className="text-amber-600">{d.draws}E</span>
        <span className="text-red-600">{d.losses}D</span>
        <span className="text-muted-foreground ml-1">{pct(d.wins, d.matches)}</span>
      </div>
    </div>
  );
}

export default function RefereesByStateDetail() {
  const params = useParams<{ uf: string }>();
  const uf = params.uf ?? "";
  const isUnknown = uf.toLowerCase() === "sem-estado";
  const { data, isLoading, isError } = useGetRefereesByStateDetail(uf);

  const title = isUnknown
    ? "Árbitros sem UF"
    : data?.state
      ? `Árbitros de ${ufDisplayName(data.state)}`
      : `Árbitros · ${uf.toUpperCase()}`;

  if (isLoading) {
    return (
      <div className="space-y-5 max-w-4xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-60 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-3 max-w-4xl">
        <Link href="/arbitros/por-estado">
          <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer">
            <ChevronLeft className="h-4 w-4 mr-1" /> Por Estado
          </span>
        </Link>
        <p className="text-destructive">Estado não encontrado ou inválido.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <Link href="/arbitros/por-estado">
        <span className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground cursor-pointer">
          <ChevronLeft className="h-4 w-4 mr-1" /> Por Estado
        </span>
      </Link>

      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        {!isUnknown && data.state && (
          <p className="text-sm text-muted-foreground mt-1">{data.state}</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-border rounded overflow-hidden">
        {[
          { label: "Partidas", value: data.matches, highlight: true },
          { label: "Vitórias", value: data.wins, color: "text-green-600" },
          { label: "Empates", value: data.draws, color: "text-amber-600" },
          { label: "Derrotas", value: data.losses, color: "text-red-600" },
          {
            label: "Aproveit.",
            value: pct(data.wins, data.matches),
            highlight: true,
          },
        ].map(({ label, value, color, highlight }) => (
          <div key={label} className="bg-background p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
            <p
              className={`text-xl font-bold mt-0.5 ${color ?? (highlight ? "text-primary" : "")}`}
            >
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="border rounded p-4">
          <MiniRecord label="Casa" data={data.homeRecord} />
        </div>
        <div className="border rounded p-4">
          <MiniRecord label="Fora" data={data.awayRecord} />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Árbitros</p>
          <p className="text-lg font-bold mt-0.5">{data.refereeCount}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Gols pró</p>
          <p className="text-lg font-bold mt-0.5">{data.goalsFor}</p>
        </div>
        <div className="border rounded p-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Gols contra</p>
          <p className="text-lg font-bold mt-0.5">{data.goalsAgainst}</p>
        </div>
      </div>

      <div className="border rounded">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="py-2">Árbitro</TableHead>
              <TableHead className="py-2 text-right">J</TableHead>
              <TableHead className="py-2 text-right text-green-700">V</TableHead>
              <TableHead className="py-2 text-right text-amber-700">E</TableHead>
              <TableHead className="py-2 text-right text-red-700">D</TableHead>
              <TableHead className="py-2 text-right">Gols</TableHead>
              <TableHead className="py-2 text-right">Apr.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.referees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-20 text-center text-muted-foreground">
                  Nenhum árbitro neste filtro.
                </TableCell>
              </TableRow>
            ) : (
              data.referees.map((ref) => (
                <TableRow key={ref.id} className="text-sm">
                  <TableCell className="py-2 font-medium">
                    <Link
                      href={`/arbitros/${ref.id}`}
                      className="hover:text-primary hover:underline inline-flex items-center gap-2 min-w-0"
                    >
                      <EntityPhoto
                        url={ref.photoUrl}
                        name={ref.name}
                        size="sm"
                        className="h-7 w-7 text-[9px]"
                        label="Foto do árbitro"
                      />
                      <span className="truncate">{ref.name}</span>
                    </Link>
                  </TableCell>
                  <TableCell className="py-2 text-right font-semibold">{ref.matches}</TableCell>
                  <TableCell className="py-2 text-right text-green-600">{ref.wins}</TableCell>
                  <TableCell className="py-2 text-right text-amber-600">{ref.draws}</TableCell>
                  <TableCell className="py-2 text-right text-red-600">{ref.losses}</TableCell>
                  <TableCell className="py-2 text-right text-muted-foreground">
                    {ref.goalsFor}:{ref.goalsAgainst}
                  </TableCell>
                  <TableCell className="py-2 text-right">
                    {pct(ref.wins, ref.matches)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
