import { useState } from "react";
import { adminFetch, getAdminToken } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Download, Upload, CheckCircle, AlertCircle } from "lucide-react";

interface ImportResult {
  created: number;
  skipped: number;
}

function ExportSection() {
  const token = getAdminToken();

  function download(endpoint: string, filename: string) {
    const a = document.createElement("a");
    a.href = `/api/admin/export/${endpoint}?token=${encodeURIComponent(token ?? "")}`;
    a.download = filename;
    a.click();
  }

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

function ImportSection() {
  const [results, setResults] = useState<Record<string, ImportResult | string>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const imports = [
    {
      endpoint: "players",
      label: "Jogadores",
      desc: "Colunas: name, position, nationality, birth_year",
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
      desc: "Colunas: date (YYYY-MM-DD), season, opponent, goals_for, goals_against, own_goals_for_count, result (win/draw/loss), home_away (home/away/neutral), competition, phase, round, stadium, manager, referee, scorers, attendance. Escalação, gols individuais, cartões e substituições ficam na Ficha da partida.",
      template:
        "date,season,opponent,goals_for,goals_against,own_goals_for_count,result,home_away,competition,phase,round,stadium,manager,referee,scorers,attendance\n" +
        "2023-05-01,2023,Adversário FC,2,1,0,win,home,Campeonato Exemplo,1º Turno,5ª rodada,Estádio Rei Pelé,,Árbitro Exemplo,Nome Gol,5000",
    },
    {
      endpoint: "opponents",
      label: "Adversários",
      desc: "Colunas: name",
      template: "name\nAdversário FC\nOutro Clube SC",
    },
  ];

  function downloadTemplate(template: string, label: string) {
    const blob = new Blob([template], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `template_${label.toLowerCase().replace(/ /g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFile(endpoint: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading((prev) => ({ ...prev, [endpoint]: true }));
    setResults((prev) => ({ ...prev, [endpoint]: undefined as any }));
    try {
      const csv = await file.text();
      const r = await adminFetch(`/admin/import/${endpoint}`, {
        method: "POST",
        body: JSON.stringify({ csv }),
      });
      const data = await r.json();
      if (!r.ok) {
        setResults((prev) => ({ ...prev, [endpoint]: (data as any).error ?? "Erro" }));
      } else {
        setResults((prev) => ({ ...prev, [endpoint]: data as ImportResult }));
      }
    } catch {
      setResults((prev) => ({ ...prev, [endpoint]: "Erro ao ler arquivo" }));
    }
    setLoading((prev) => ({ ...prev, [endpoint]: false }));
    e.target.value = "";
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
                      {(result as ImportResult).created} importados, {(result as ImportResult).skipped} ignorados
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
    </div>
  );
}

export default function AdminImportExport() {
  return (
    <div>
      <h1 className="text-xl font-bold text-gray-900 mb-1">Importar / Exportar</h1>
      <p className="text-sm text-gray-500 mb-6">Troque dados com planilhas via CSV</p>
      <div className="space-y-8">
        <ExportSection />
        <hr />
        <ImportSection />
      </div>
    </div>
  );
}
