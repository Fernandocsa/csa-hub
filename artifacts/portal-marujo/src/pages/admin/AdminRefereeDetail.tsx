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

export default function AdminRefereeDetail() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const isNew = params.id === "novo" || !params.id;
  const refereeId = isNew ? NaN : Number(params.id);

  const [name, setName] = useState("");
  const [state, setState] = useState("");
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
    const data = (await r.json()) as Referee;
    setName(data.name);
    setState(data.state ?? "");
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
    <div className="space-y-4 max-w-xl">
      <Link
        href="/admin/arbitros"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800"
      >
        <ChevronLeft size={13} className="mr-0.5" /> Árbitros
      </Link>

      <h1 className="text-xl font-bold text-gray-900">
        {isNew ? "Novo árbitro" : name}
      </h1>

      <form onSubmit={submit} className="space-y-3">
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
    </div>
  );
}
