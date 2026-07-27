import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type SeasonRow = {
  year: number;
  statsFullyVerified: boolean;
  statsVerifiedAt: string | null;
};

export default function AdminSeasons() {
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyYear, setBusyYear] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch("/admin/seasons");
    if (r.ok) setSeasons(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function setVerified(year: number, verified: boolean) {
    setBusyYear(year);
    setError("");
    setMessage("");
    const r = await adminFetch(`/admin/seasons/${year}/verification`, {
      method: "PUT",
      body: JSON.stringify({ verified }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError((data as { error?: string }).error ?? "Erro ao atualizar");
      setBusyYear(null);
      return;
    }
    if (verified) {
      const b = (data as { badges?: { created?: number; topScorerIds?: number[]; topAssisterIds?: number[] } })
        .badges;
      setMessage(
        `${year}: verificada. Badges auto criados: ${b?.created ?? 0}` +
          (b?.topScorerIds?.length
            ? ` · Artilheiros: ${b.topScorerIds.length}`
            : "") +
          (b?.topAssisterIds?.length
            ? ` · Garçons: ${b.topAssisterIds.length}`
            : ""),
      );
    } else {
      const cleared =
        (data as { badges?: { cleared?: number } }).badges?.cleared ?? 0;
      setMessage(`${year}: verificação removida. Badges auto apagados: ${cleared}`);
    }
    await load();
    setBusyYear(null);
  }

  async function recalculate(year: number) {
    setBusyYear(year);
    setError("");
    setMessage("");
    const r = await adminFetch(`/admin/seasons/${year}/recalculate-badges`, {
      method: "POST",
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      setError((data as { error?: string }).error ?? "Erro ao recalcular");
      setBusyYear(null);
      return;
    }
    const d = data as {
      created?: number;
      topScorerIds?: number[];
      topAssisterIds?: number[];
      topScorerGoals?: number;
      topAssisterAssists?: number;
    };
    setMessage(
      `${year} recalculado: ${d.created ?? 0} badges` +
        (d.topScorerIds?.length
          ? ` · Artilheiro (${d.topScorerGoals} gols): ${d.topScorerIds.length} jogador(es)`
          : " · sem Artilheiro") +
        (d.topAssisterIds?.length
          ? ` · Garçom (${d.topAssisterAssists} assists): ${d.topAssisterIds.length} jogador(es)`
          : " · sem Garçom"),
    );
    setBusyYear(null);
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Temporadas</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Marque como completamente verificada para gerar Artilheiro / Garçom
          automáticos (empates recebem o badge).
        </p>
      </div>

      {message && (
        <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-3 py-2 mb-3">
          {message}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-3">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                <th className="text-left px-3 py-2">Ano</th>
                <th className="text-left px-3 py-2">Stats verificadas</th>
                <th className="text-left px-3 py-2">Verificado em</th>
                <th className="text-right px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => {
                const busy = busyYear === s.year;
                return (
                  <tr key={s.year} className="border-b">
                    <td className="px-3 py-2.5 font-semibold">{s.year}</td>
                    <td className="px-3 py-2.5">
                      <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={s.statsFullyVerified}
                          disabled={busy}
                          onChange={(e) =>
                            setVerified(s.year, e.target.checked)
                          }
                          className="rounded border-gray-300"
                        />
                        <span
                          className={
                            s.statsFullyVerified
                              ? "text-emerald-700 font-medium"
                              : "text-gray-500"
                          }
                        >
                          {s.statsFullyVerified ? "Sim" : "Não"}
                        </span>
                      </label>
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 text-xs">
                      {s.statsVerifiedAt
                        ? new Date(s.statsVerifiedAt).toLocaleString("pt-BR")
                        : "–"}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy || !s.statsFullyVerified}
                        onClick={() => recalculate(s.year)}
                        className="h-8"
                      >
                        <RefreshCw size={13} className="mr-1" />
                        Recalcular badges
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {seasons.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Nenhuma temporada cadastrada
            </p>
          )}
        </div>
      )}
    </div>
  );
}
