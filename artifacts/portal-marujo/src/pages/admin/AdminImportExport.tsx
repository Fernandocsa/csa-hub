import { useMemo, useState } from "react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Download, Upload, CheckCircle, AlertCircle } from "lucide-react";

interface ImportResult {
  created: number;
  skipped: number;
  needsConfirmation?: NameConflict[];
}

type NameConflict = {
  rowIndex: number;
  date: string;
  opponent: string;
  kind: "player" | "manager";
  rawName: string;
  matchType: "exact" | "similar";
  candidates: Array<{
    id: number;
    name: string;
    yearFrom: number | null;
    yearTo: number | null;
  }>;
  importYear: number | null;
  message: string;
};

type ConflictDecision = {
  action: "use" | "create";
  entityId?: number;
};

function ExportSection() {
  async function downloadWithAuth(endpoint: string) {
    const r = await adminFetch(`/admin/export/${endpoint}`);
    if (!r.ok) return;
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const cd = r.headers.get("Content-Disposition") ?? "";
    const match = cd.match(/filename="([^"]+)"/);
    a.download = match?.[1] ?? `${endpoint}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const exports = [
    { endpoint: "players", label: "Jogadores", desc: "ID, nome, posição, nacionalidade, ano de nascimento" },
    { endpoint: "player-stats", label: "Estatísticas de Jogadores", desc: "ID do jogador, nome, temporada, partidas, gols, assistências" },
    { endpoint: "matches", label: "Partidas", desc: "Todas as partidas com adversário, resultado, competição, etc." },
    { endpoint: "opponents", label: "Adversários", desc: "ID e nome de todos os adversários" },
  ];

  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-1">Exportar CSV</h2>
      <p className="text-sm text-gray-500 mb-4">Baixe os dados em formato CSV para edição em planilhas.</p>
      <div className="space-y-2">
        {exports.map((exp) => (
          <div key={exp.endpoint} className="flex items-center justify-between bg-white border rounded-lg px-4 py-3">
            <div>
              <p className="font-medium text-sm text-gray-900">{exp.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{exp.desc}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadWithAuth(exp.endpoint)}
              className="shrink-0 ml-4"
            >
              <Download size={13} className="mr-1" /> Baixar
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

const MATCHES_TEMPLATE_HEADER =
  "date,season,opponent,goals_for,goals_against,result,home_away,competition,stadium,manager,scorers,attendance,referee,penalty_shootout,lineup,substitutions,scorer_minutes,own_goal,own_goals_for_count,cards,attendance_paid,phase,round";

const MATCHES_TEMPLATE_EXAMPLE =
  "1992-03-15,1992,Adversário FC,2,1,win,home,Campeonato Alagoano,Estádio Rei Pelé,Técnico Exemplo,Café;Ivan,8500,Árbitro Exemplo,5x4,Goleiro;Zagueiro A;Zagueiro B;Lateral Dir;Lateral Esq;Volante A;Volante B;Meia A;Meia B;Ponta;Centroavante,Meia A->Reserva (60'2T),37'2T;34'1T,,0,Volante A (amarelo) 20'1T,7200,1º Turno,5ª rodada";

function conflictKey(c: Pick<NameConflict, "rowIndex" | "kind" | "rawName">) {
  return `${c.rowIndex}|${c.kind}|${c.rawName.trim().toLowerCase()}`;
}

function ImportSection() {
  const [results, setResults] = useState<Record<string, ImportResult | string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [pendingCsv, setPendingCsv] = useState<string | null>(null);
  const [pendingEndpoint, setPendingEndpoint] = useState<"matches" | "players" | null>(null);
  const [conflicts, setConflicts] = useState<NameConflict[]>([]);
  const [decisions, setDecisions] = useState<Record<string, ConflictDecision>>({});
  const [resolving, setResolving] = useState(false);

  const imports = [
    {
      endpoint: "players",
      label: "Jogadores",
      desc: "Colunas: name, position, nationality, birth_year. Nomes exact/similar pedem confirmação (Usar existente sobrescreve campos preenchidos do CSV).",
      template: "name,position,nationality,birth_year\nJogador Exemplo,Atacante,Brasileiro,1995",
    },
    {
      endpoint: "player-stats",
      label: "Estatísticas de Jogadores",
      desc: "Colunas: player_id, season, appearances, goals, assists",
      template: "player_id,season,appearances,goals,assists\n1,2023,30,10,5",
    },
    {
      endpoint: "matches",
      label: "Partidas",
      desc: "Colunas base: date, season, opponent, goals_for, goals_against, result, home_away, competition, stadium, manager, scorers, attendance. Opcionais: referee, penalty_shootout (ex: 5x4), lineup (;), substitutions (Out->In (minuto)), scorer_minutes (alinhado a scorers), own_goal, own_goals_for_count, cards (Nome (amarelo|vermelho) minuto), attendance_paid, phase, round. Campos compostos usam ; (sem vírgula). Nomes ambíguos pausam a linha e pedem confirmação.",
      template: `${MATCHES_TEMPLATE_HEADER}\n${MATCHES_TEMPLATE_EXAMPLE}`,
    },
    {
      endpoint: "opponents",
      label: "Adversários",
      desc: "Colunas: name",
      template: "name\nAdversário FC\nOutro Clube SC",
    },
  ];

  const allDecided = useMemo(() => {
    if (!conflicts.length) return false;
    return conflicts.every((c) => {
      const d = decisions[conflictKey(c)];
      if (!d) return false;
      if (d.action === "use" && d.entityId == null) return false;
      return true;
    });
  }, [conflicts, decisions]);

  function downloadTemplate(template: string, label: string) {
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_${label.toLowerCase().replace(/ /g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function applyImportResponse(endpoint: string, data: ImportResult) {
    const nextConflicts = data.needsConfirmation ?? [];
    const confirmable = endpoint === "matches" || endpoint === "players";
    if (confirmable && nextConflicts.length) {
      setConflicts(nextConflicts);
      setDecisions({});
      setPendingEndpoint(endpoint);
      setResults((prev) => ({
        ...prev,
        [endpoint]: {
          created: data.created,
          skipped: data.skipped,
          needsConfirmation: nextConflicts,
        },
      }));
    } else {
      setConflicts([]);
      setPendingCsv(null);
      setPendingEndpoint(null);
      setDecisions({});
      setResults((prev) => ({
        ...prev,
        [endpoint]: {
          created: data.created,
          skipped: data.skipped,
        },
      }));
    }
  }

  async function handleFile(endpoint: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading((prev) => ({ ...prev, [endpoint]: true }));
    setResults((prev) => ({ ...prev, [endpoint]: undefined as any }));
    try {
      const csv = await file.text();
      if (endpoint === "matches" || endpoint === "players") {
        setPendingCsv(csv);
        setPendingEndpoint(endpoint);
      }
      const r = await adminFetch(`/admin/import/${endpoint}`, {
        method: "POST",
        body: JSON.stringify({ csv }),
      });
      const data = await r.json();
      if (!r.ok) {
        setResults((prev) => ({ ...prev, [endpoint]: (data as any).error ?? "Erro" }));
        setConflicts([]);
      } else {
        applyImportResponse(endpoint, data as ImportResult);
      }
    } catch {
      setResults((prev) => ({ ...prev, [endpoint]: "Erro ao ler arquivo" }));
    }
    setLoading((prev) => ({ ...prev, [endpoint]: false }));
    e.target.value = "";
  }

  async function continueNameConfirmation() {
    if (!pendingCsv || !pendingEndpoint || !allDecided) return;
    setResolving(true);
    try {
      const resolutions = conflicts.map((c) => {
        const d = decisions[conflictKey(c)];
        return {
          rowIndex: c.rowIndex,
          kind: c.kind,
          rawName: c.rawName,
          action: d.action,
          entityId: d.action === "use" ? d.entityId : undefined,
        };
      });
      const r = await adminFetch(`/admin/import/${pendingEndpoint}/resolve`, {
        method: "POST",
        body: JSON.stringify({ csv: pendingCsv, resolutions }),
      });
      const data = await r.json();
      if (!r.ok) {
        setResults((prev) => ({
          ...prev,
          [pendingEndpoint]: (data as any).error ?? "Erro",
        }));
      } else {
        applyImportResponse(pendingEndpoint, data as ImportResult);
      }
    } catch {
      setResults((prev) => ({
        ...prev,
        [pendingEndpoint]: "Erro ao resolver nomes",
      }));
    }
    setResolving(false);
  }

  function setDecisionForConflict(c: NameConflict, decision: ConflictDecision) {
    setDecisions((prev) => {
      const next = { ...prev };
      for (const other of conflicts) {
        if (
          other.kind === c.kind &&
          other.rawName.trim().toLowerCase() === c.rawName.trim().toLowerCase()
        ) {
          next[conflictKey(other)] = decision;
        }
      }
      return next;
    });
  }

  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-1">Importar CSV</h2>
      <p className="text-sm text-gray-500 mb-4">
        Selecione um arquivo CSV para importar dados. Baixe o template para ver o formato esperado.
        Para lote de temporada com IA, use{" "}
        <a href="/admin/importar-ia" className="text-[#1B3A6B] hover:underline">
          Importação IA
        </a>
        .
      </p>
      <div className="space-y-3">
        {imports.map((imp) => {
          const result = results[imp.endpoint];
          return (
            <div key={imp.endpoint} className="bg-white border rounded-lg px-4 py-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900">{imp.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{imp.desc}</p>
                  {result !== undefined && typeof result === "string" && (
                    <div className="flex items-center gap-1.5 mt-2 text-red-600 text-xs">
                      <AlertCircle size={12} /> {result}
                    </div>
                  )}
                  {result !== undefined && typeof result === "object" && (
                    <div className="flex items-center gap-1.5 mt-2 text-green-700 text-xs">
                      <CheckCircle size={12} />
                      {(result as ImportResult).created} importados, {(result as ImportResult).skipped}{" "}
                      ignorados
                      {(result as ImportResult).needsConfirmation?.length
                        ? ` · ${(result as ImportResult).needsConfirmation!.length} nome(s) aguardando confirmação`
                        : ""}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-gray-500"
                    onClick={() => downloadTemplate(imp.template, imp.label)}
                  >
                    <Download size={11} className="mr-1" /> Template
                  </Button>
                  <label>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="sr-only"
                      onChange={(e) => handleFile(imp.endpoint, e)}
                      disabled={loading[imp.endpoint]}
                    />
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium border rounded cursor-pointer hover:bg-gray-50 transition-colors">
                      <Upload size={11} className="mr-1" />
                      {loading[imp.endpoint] ? "Importando..." : "Importar"}
                    </span>
                  </label>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {conflicts.length > 0 && (
        <div className="mt-6 border border-amber-300 bg-amber-50 rounded-lg p-4">
          <h3 className="font-semibold text-sm text-amber-950 mb-1">Confirmação de nomes</h3>
          <p className="text-xs text-amber-900 mb-4">
            Algumas linhas foram pausadas porque o nome bateu exato ou parece prenome de um cadastro
            composto. Confirme se é a mesma pessoa (o contexto de anos ajuda; a decisão é sua).
          </p>
          <div className="space-y-4">
            {conflicts.map((c) => {
              const key = conflictKey(c);
              const d = decisions[key];
              return (
                <div key={key} className="bg-white border rounded-md p-3 text-sm">
                  <p className="text-xs text-gray-500 mb-1">
                    Linha {c.rowIndex + 1}
                    {c.date ? ` · ${c.date}` : ""}
                    {c.opponent ? ` · ${c.opponent}` : ""}
                    {" · "}
                    {c.kind === "player" ? "jogador" : "técnico"} · {c.matchType}
                    {pendingEndpoint === "players"
                      ? " · Usar existente sobrescreve position/nationality/birth_year preenchidos"
                      : ""}
                  </p>
                  <pre className="whitespace-pre-wrap text-xs text-gray-800 mb-3 font-sans">
                    {c.message}
                  </pre>
                  <div className="flex flex-wrap gap-2 items-center">
                    {c.candidates.map((cand) => (
                      <Button
                        key={cand.id}
                        size="sm"
                        variant={d?.action === "use" && d.entityId === cand.id ? "default" : "outline"}
                        onClick={() => setDecisionForConflict(c, { action: "use", entityId: cand.id })}
                      >
                        Usar #{cand.id} {cand.name}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant={d?.action === "create" ? "default" : "outline"}
                      onClick={() => setDecisionForConflict(c, { action: "create" })}
                    >
                      Criar novo &quot;{c.rawName}&quot;
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={continueNameConfirmation} disabled={!allDecided || resolving}>
              {resolving ? "Continuando..." : "Continuar importação"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminImportExport() {
  return (
    <div className="space-y-10">
      <ExportSection />
      <ImportSection />
    </div>
  );
}
