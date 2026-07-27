import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CalendarDays } from "lucide-react";

interface NextMatchForm {
  opponent: string;
  matchDate: string;
  competition: string;
  homeAway: "home" | "away";
  stadium: string;
  opponentId: string;
  matchId: string;
}

const emptyForm: NextMatchForm = {
  opponent: "",
  matchDate: "",
  competition: "",
  homeAway: "home",
  stadium: "",
  opponentId: "",
  matchId: "",
};

export default function AdminNextMatch() {
  const [form, setForm] = useState<NextMatchForm>(emptyForm);
  const [opponents, setOpponents] = useState<{ id: number; name: string }[]>([]);
  const [hasMatch, setHasMatch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const [r, lookupR] = await Promise.all([
      adminFetch("/admin/next-match"),
      adminFetch("/admin/lookup"),
    ]);
    if (lookupR.ok) {
      const lookup = await lookupR.json();
      setOpponents(lookup.opponents ?? []);
    }
    if (r.ok) {
      const data = await r.json();
      if (data) {
        setHasMatch(true);
        setForm({
          opponent: data.opponent ?? "",
          matchDate: data.matchDate ?? "",
          competition: data.competition ?? "",
          homeAway: data.homeAway === "away" ? "away" : "home",
          stadium: data.stadium ?? "",
          opponentId: data.opponentId != null ? String(data.opponentId) : "",
          matchId: data.matchId != null ? String(data.matchId) : "",
        });
      } else {
        setHasMatch(false);
        setForm(emptyForm);
      }
    } else {
      setError("Erro ao carregar próxima partida");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function setField<K extends keyof NextMatchForm>(key: K, value: NextMatchForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSavedMsg("");
  }

  function onOpponentSelect(id: string) {
    const opp = opponents.find((o) => String(o.id) === id);
    setForm((prev) => ({
      ...prev,
      opponentId: id,
      opponent: opp?.name ?? prev.opponent,
    }));
    setSavedMsg("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const opponentId = form.opponentId.trim()
        ? parseInt(form.opponentId, 10)
        : null;
      const matchId = form.matchId.trim() ? parseInt(form.matchId, 10) : null;
      if (form.opponentId.trim() && !Number.isInteger(opponentId)) {
        setError("Adversário inválido");
        setSaving(false);
        return;
      }
      if (form.matchId.trim() && !Number.isInteger(matchId)) {
        setError("ID de partida inválido");
        setSaving(false);
        return;
      }
      const r = await adminFetch("/admin/next-match", {
        method: "PUT",
        body: JSON.stringify({
          opponent: form.opponent.trim(),
          matchDate: form.matchDate,
          competition: form.competition.trim(),
          homeAway: form.homeAway,
          stadium: form.stadium.trim() || null,
          opponentId,
          matchId,
        }),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        setError((err as { error?: string }).error ?? "Erro ao salvar");
      } else {
        setHasMatch(true);
        setSavedMsg("Salvo — o card da Home já usa esses dados.");
        await load();
      }
    } catch {
      setError("Erro ao salvar");
    }
    setSaving(false);
  }

  async function clearMatch() {
    if (!confirm("Remover a próxima partida do card da Home?")) return;
    setSaving(true);
    setError("");
    setSavedMsg("");
    const r = await adminFetch("/admin/next-match", {
      method: "PUT",
      body: JSON.stringify({ clear: true }),
    });
    if (!r.ok) {
      setError("Erro ao limpar");
    } else {
      setHasMatch(false);
      setForm(emptyForm);
      setSavedMsg("Card da Home mostrará “A definir”.");
    }
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando...</p>;
  }

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <CalendarDays size={20} className="text-[#1B3A6B]" />
          Próximo Jogo
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Edita o card “Próxima Partida” da Home. Não cria partida no histórico.
          Com partida vinculada, o card abre `/partidas/:id`; senão, com adversário
          vinculado, abre `/adversarios/:id`.
          {hasMatch ? "" : " Nenhum jogo cadastrado no momento."}
        </p>
      </div>

      <form onSubmit={save} className="bg-white border rounded-lg p-5 space-y-4 max-w-lg">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Adversário (cadastro) *
          </label>
          <select
            value={form.opponentId}
            onChange={(e) => onOpponentSelect(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm mb-2"
          >
            <option value="">— escolher adversário —</option>
            {opponents.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <Input
            value={form.opponent}
            onChange={(e) => setField("opponent", e.target.value)}
            placeholder="Nome exibido no card"
            required
          />
          <p className="text-[10px] text-gray-400 mt-1">
            O select preenche o nome; você pode ajustar o texto do card.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Partida vinculada (opcional)
          </label>
          <Input
            type="number"
            min={1}
            value={form.matchId}
            onChange={(e) => setField("matchId", e.target.value)}
            placeholder="ID em /admin/partidas/:id"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            Se preenchido, a Home prioriza o link para essa partida.
          </p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Data *
          </label>
          <Input
            type="date"
            value={form.matchDate}
            onChange={(e) => setField("matchDate", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Competição *
          </label>
          <Input
            value={form.competition}
            onChange={(e) => setField("competition", e.target.value)}
            placeholder="Ex: Campeonato Brasileiro Série D"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Mando *
          </label>
          <select
            value={form.homeAway}
            onChange={(e) => setField("homeAway", e.target.value as "home" | "away")}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
          >
            <option value="home">Casa (CSA mandante)</option>
            <option value="away">Fora (CSA visitante)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Estádio
          </label>
          <Input
            value={form.stadium}
            onChange={(e) => setField("stadium", e.target.value)}
            placeholder="Opcional"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {savedMsg && <p className="text-sm text-green-700">{savedMsg}</p>}

        <div className="flex items-center gap-2 pt-1">
          <Button type="submit" className="bg-[#1B3A6B]" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
          {hasMatch && (
            <Button type="button" variant="outline" onClick={clearMatch} disabled={saving}>
              Limpar card
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
