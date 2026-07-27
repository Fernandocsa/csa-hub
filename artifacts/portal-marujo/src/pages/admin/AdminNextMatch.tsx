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
}

const emptyForm: NextMatchForm = {
  opponent: "",
  matchDate: "",
  competition: "",
  homeAway: "home",
  stadium: "",
};

export default function AdminNextMatch() {
  const [form, setForm] = useState<NextMatchForm>(emptyForm);
  const [hasMatch, setHasMatch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const r = await adminFetch("/admin/next-match");
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

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const r = await adminFetch("/admin/next-match", {
        method: "PUT",
        body: JSON.stringify({
          opponent: form.opponent.trim(),
          matchDate: form.matchDate,
          competition: form.competition.trim(),
          homeAway: form.homeAway,
          stadium: form.stadium.trim() || null,
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
          {hasMatch ? "" : " Nenhum jogo cadastrado no momento."}
        </p>
      </div>

      <form onSubmit={save} className="bg-white border rounded-lg p-5 space-y-4 max-w-lg">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
            Adversário *
          </label>
          <Input
            value={form.opponent}
            onChange={(e) => setField("opponent", e.target.value)}
            placeholder="Ex: São Luiz de Ijuí-RS"
            required
          />
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
