import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import { BRAZIL_UFS, BRAZIL_UF_NAMES, type BrazilUf } from "@/lib/br-locations";

export type Referee = {
  id: number;
  name: string;
  state: string | null;
};

type RefereeMatch = {
  id: number;
  matchDate: string;
  season: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  opponentName: string;
  competitionName: string;
  stadiumName: string | null;
  phase: string | null;
  round: string | null;
};

function fmtDate(d: string) {
  return new Date(d.includes("T") ? d : d + "T12:00:00").toLocaleDateString("pt-BR");
}

export default function AdminRefereeDetail() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const isNew = params.id === "novo" || !params.id;
  const refereeId = isNew ? NaN : Number(params.id);

  const [name, setName] = useState("");
  const [state, setState] = useState("");
  const [matches, setMatches] = useState<RefereeMatch[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (isNew || Number.isNaN(refereeId)) return;
    setLoading(true);
    setError("");
    const r = await adminFetch(`/admin/referees/${refereeId}`);
    if (!r.ok) {
      setError("Árbitro não encontrado");
      setLoading(false);
      return;
    }
    const data = (await r.json()) as Referee & { matches?: RefereeMatch[] };
    setName(data.name);
    setState(data.state ?? "");
    setMatches(Array.isArray(data.matches) ? data.matches : []);
    setLoading(false);
  }, [isNew, refereeId]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        name: name.trim(),
        state: state.trim() || null,
      };
      const r = await adminFetch(
        isNew ? "/admin/referees" : `/admin/referees/${refereeId}`,
        {
          method: isNew ? "POST" : "PUT",
          body: JSON.stringify(body),
        },
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao salvar");
      }
      const saved = (await r.json()) as Referee;
      if (isNew) setLocation(`/admin/arbitros/${saved.id}`);
      else {
        setName(saved.name);
        setState(saved.state ?? "");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Excluir este árbitro? Partidas vinculadas ficarão sem árbitro.")) {
      return;
    }
    const r = await adminFetch(`/admin/referees/${refereeId}`, { method: "DELETE" });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      setError((err as { error?: string }).error ?? "Erro ao excluir");
      return;
    }
    setLocation("/admin/arbitros");
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando...</p>;
  }

  if (!isNew && error && !name) {
    return (
      <div>
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href="/admin/arbitros"
          className="text-sm text-[#1B3A6B] hover:underline mt-2 inline-block"
        >
          Voltar aos árbitros
        </Link>
      </div>
    );
  }

  const sel = "w-full border rounded px-3 py-2 text-sm bg-white";

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin/arbitros"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800"
      >
        <ChevronLeft size={13} className="mr-0.5" /> Árbitros
      </Link>

      <h1 className="text-xl font-bold text-gray-900">
        {isNew ? "Novo árbitro" : name}
      </h1>

      <form onSubmit={submit} className="space-y-3 max-w-xl">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Nome *
          </label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            UF da federação
          </label>
          <select
            className={sel}
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="">— sem UF (opcional) —</option>
            {BRAZIL_UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf} · {BRAZIL_UF_NAMES[uf as BrazilUf]}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Opcional — pode cadastrar sem federação e preencher depois.
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <Button type="submit" className="bg-[#1B3A6B]" disabled={saving}>
            {saving ? "Salvando..." : isNew ? "Criar árbitro" : "Salvar"}
          </Button>
          <Link href="/admin/arbitros">
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </Link>
          {!isNew && (
            <Button type="button" variant="outline" onClick={handleDelete}>
              Excluir
            </Button>
          )}
        </div>
      </form>

      {!isNew && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Histórico de partidas ({matches.length})
          </h2>
          {matches.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma partida vinculada a este árbitro.</p>
          ) : (
            <div className="bg-white border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Data
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Adversário
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Competição
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Placar
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Local
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {matches.map((m) => (
                    <tr key={m.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Link
                          href={`/admin/partidas/${m.id}`}
                          className="text-[#1B3A6B] hover:underline font-medium"
                        >
                          {fmtDate(m.matchDate)}
                        </Link>
                        <span className="block text-[10px] text-gray-400">{m.season}</span>
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/partidas/${m.id}`}
                          className="hover:text-[#1B3A6B] hover:underline"
                        >
                          {m.opponentName}
                        </Link>
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {m.competitionName}
                        {m.phase || m.round ? (
                          <span className="block text-[10px] text-gray-400">
                            {[m.phase, m.round].filter(Boolean).join(" · ")}
                          </span>
                        ) : null}
                      </td>
                      <td className="px-3 py-2 font-medium whitespace-nowrap">
                        {m.goalsFor ?? "–"}–{m.goalsAgainst ?? "–"}
                        <span className="ml-2 text-xs text-gray-400 uppercase">{m.result}</span>
                      </td>
                      <td className="px-3 py-2 text-gray-600">
                        {m.homeAway === "home"
                          ? "Casa"
                          : m.homeAway === "away"
                            ? "Fora"
                            : m.homeAway}
                        {m.stadiumName ? ` · ${m.stadiumName}` : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
