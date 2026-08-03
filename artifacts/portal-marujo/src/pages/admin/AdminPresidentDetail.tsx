import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import { EntityPhoto } from "@/components/EntityPhoto";
import type { AdminPresident } from "./AdminPresidents";
import {
  inferTermEndMode,
  inferTermStartMode,
  serializeTermDate,
  type TermDateMode,
} from "@/lib/president-term";

function TermDateFields({
  label,
  mode,
  year,
  exact,
  allowOngoing,
  onModeChange,
  onYearChange,
  onExactChange,
  hint,
}: {
  label: string;
  mode: TermDateMode;
  year: string;
  exact: string;
  allowOngoing?: boolean;
  onModeChange: (m: TermDateMode) => void;
  onYearChange: (v: string) => void;
  onExactChange: (v: string) => void;
  hint?: string;
}) {
  const sel = "w-full border rounded px-3 py-2 text-sm bg-white";
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-gray-500 uppercase block">
        {label}
      </label>
      <select
        className={sel}
        value={mode}
        onChange={(e) => onModeChange(e.target.value as TermDateMode)}
      >
        <option value="unknown">Desconhecido</option>
        {allowOngoing ? <option value="ongoing">Em andamento</option> : null}
        <option value="year">Só o ano</option>
        <option value="exact">Data completa</option>
      </select>
      {mode === "year" ? (
        <Input
          type="number"
          value={year}
          onChange={(e) => onYearChange(e.target.value)}
          placeholder="1973"
          min={1850}
          max={2100}
        />
      ) : null}
      {mode === "exact" ? (
        <Input
          type="date"
          value={exact}
          onChange={(e) => onExactChange(e.target.value)}
        />
      ) : null}
      {hint ? <p className="text-xs text-gray-400">{hint}</p> : null}
    </div>
  );
}

export default function AdminPresidentDetail() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const isNew = params.id === "novo" || !params.id;
  const presidentId = isNew ? NaN : Number(params.id);

  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [startMode, setStartMode] = useState<TermDateMode>("unknown");
  const [startYear, setStartYear] = useState("");
  const [startExact, setStartExact] = useState("");
  const [endMode, setEndMode] = useState<TermDateMode>("unknown");
  const [endYear, setEndYear] = useState("");
  const [endExact, setEndExact] = useState("");
  const [notes, setNotes] = useState("");
  const [linkedPlayerId, setLinkedPlayerId] = useState("");
  const [linkedManagerId, setLinkedManagerId] = useState("");
  const [samePersonAsId, setSamePersonAsId] = useState("");
  const [allPresidents, setAllPresidents] = useState<AdminPresident[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const applySaved = (data: AdminPresident) => {
    setName(data.name);
    setPhotoUrl(data.photoUrl ?? "");
    const sm = inferTermStartMode(data.termStart);
    setStartMode(sm);
    setStartYear(data.termStart ? data.termStart.slice(0, 4) : "");
    setStartExact(sm === "exact" && data.termStart ? data.termStart : "");
    const em = inferTermEndMode(data.termEnd, !!data.isCurrent);
    setEndMode(em);
    setEndYear(data.termEnd ? data.termEnd.slice(0, 4) : "");
    setEndExact(em === "exact" && data.termEnd ? data.termEnd : "");
    setNotes(data.notes ?? "");
    setLinkedPlayerId(
      data.linkedPlayerId != null ? String(data.linkedPlayerId) : "",
    );
    setLinkedManagerId(
      data.linkedManagerId != null ? String(data.linkedManagerId) : "",
    );
    // Prefer a sibling in the same person group (not self) for the select value.
    if (data.personKey != null) {
      setSamePersonAsId(String(data.personKey === data.id ? "" : data.personKey));
    } else {
      setSamePersonAsId("");
    }
  };

  const loadList = useCallback(async () => {
    const r = await adminFetch("/admin/presidents");
    if (r.ok) setAllPresidents((await r.json()) as AdminPresident[]);
  }, []);

  const load = useCallback(async () => {
    if (isNew || Number.isNaN(presidentId)) return;
    setLoading(true);
    setError("");
    const r = await adminFetch(`/admin/presidents/${presidentId}`);
    if (!r.ok) {
      setError("Presidente não encontrado");
      setLoading(false);
      return;
    }
    applySaved((await r.json()) as AdminPresident);
    setLoading(false);
  }, [isNew, presidentId]);

  useEffect(() => {
    load();
    loadList();
  }, [load, loadList]);

  // After list loads, pick a sibling id if personKey points at self (canonical).
  useEffect(() => {
    if (isNew || Number.isNaN(presidentId) || allPresidents.length === 0) return;
    const self = allPresidents.find((p) => p.id === presidentId);
    if (!self?.personKey) return;
    const sibling = allPresidents.find(
      (p) => p.id !== presidentId && (p.personKey ?? p.id) === self.personKey,
    );
    if (sibling) setSamePersonAsId(String(sibling.id));
  }, [allPresidents, isNew, presidentId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (startMode === "year" && !/^\d{4}$/.test(startYear.trim())) {
        throw new Error("Informe o ano de início do mandato");
      }
      if (startMode === "exact" && !startExact.trim()) {
        throw new Error("Informe a data de início do mandato");
      }
      if (endMode === "year" && !/^\d{4}$/.test(endYear.trim())) {
        throw new Error("Informe o ano de fim do mandato");
      }
      if (endMode === "exact" && !endExact.trim()) {
        throw new Error("Informe a data de fim do mandato");
      }

      const start = serializeTermDate(startMode, startYear, startExact);
      const end = serializeTermDate(endMode, endYear, endExact);

      const body = {
        name: name.trim(),
        photoUrl: photoUrl.trim() || null,
        termStart: start.date,
        termEnd: end.isCurrent ? null : end.date,
        isCurrent: end.isCurrent,
        samePersonAsId: samePersonAsId.trim()
          ? Number(samePersonAsId.trim())
          : null,
        notes: notes.trim() || null,
        linkedPlayerId: linkedPlayerId.trim()
          ? Number(linkedPlayerId.trim())
          : null,
        linkedManagerId: linkedManagerId.trim()
          ? Number(linkedManagerId.trim())
          : null,
      };
      const r = await adminFetch(
        isNew ? "/admin/presidents" : `/admin/presidents/${presidentId}`,
        {
          method: isNew ? "POST" : "PUT",
          body: JSON.stringify(body),
        },
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao salvar");
      }
      const saved = (await r.json()) as AdminPresident;
      if (isNew) setLocation(`/admin/presidentes/${saved.id}`);
      else {
        applySaved(saved);
        await loadList();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm("Excluir este presidente?")) return;
    const r = await adminFetch(`/admin/presidents/${presidentId}`, {
      method: "DELETE",
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      setError((err as { error?: string }).error ?? "Erro ao excluir");
      return;
    }
    setLocation("/admin/presidentes");
  }

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando...</p>;
  }

  if (!isNew && error && !name) {
    return (
      <div>
        <p className="text-sm text-red-600">{error}</p>
        <Link
          href="/admin/presidentes"
          className="text-sm text-[#1B3A6B] hover:underline mt-2 inline-block"
        >
          Voltar aos presidentes
        </Link>
      </div>
    );
  }

  const sel = "w-full border rounded px-3 py-2 text-sm bg-white";

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        href="/admin/presidentes"
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800"
      >
        <ChevronLeft size={13} className="mr-0.5" /> Presidentes
      </Link>

      <h1 className="text-xl font-bold text-gray-900">
        {isNew ? "Novo presidente" : name}
      </h1>

      <form onSubmit={submit} className="space-y-3 max-w-xl">
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Foto
          </label>
          <div className="flex items-start gap-3">
            <EntityPhoto
              url={photoUrl.trim() || null}
              name={name || "Presidente"}
              size="md"
              label="Foto do presidente"
            />
            <div className="flex-1 min-w-0">
              <Input
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="https://… ou /presidents/id.jpg"
              />
              <p className="text-xs text-gray-400 mt-1">
                URL HTTPS ou caminho local em public.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Nome *
          </label>
          <Input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <TermDateFields
            label="Início do mandato"
            mode={startMode}
            year={startYear}
            exact={startExact}
            onModeChange={setStartMode}
            onYearChange={setStartYear}
            onExactChange={setStartExact}
          />
          <TermDateFields
            label="Fim do mandato"
            mode={endMode}
            year={endYear}
            exact={endExact}
            allowOngoing
            onModeChange={setEndMode}
            onYearChange={setEndYear}
            onExactChange={setEndExact}
            hint="Desconhecido ≠ em andamento"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Mesma pessoa que
          </label>
          <select
            className={sel}
            value={samePersonAsId}
            onChange={(e) => setSamePersonAsId(e.target.value)}
          >
            <option value="">— Pessoa única / outro mandato —</option>
            {allPresidents
              .filter((p) => p.id !== presidentId)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  #{p.id} {p.name}
                  {p.termStart ? ` (${p.termStart.slice(0, 4)})` : ""}
                </option>
              ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">
            Use para vincular passagens distintas da mesma pessoa (ex.: Rafael
            Tenório). A lista pública continua em ordem de mandato.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Jogador vinculado (ID)
            </label>
            <Input
              type="number"
              min={1}
              value={linkedPlayerId}
              onChange={(e) => setLinkedPlayerId(e.target.value)}
              placeholder="ex.: 1101"
            />
            {linkedPlayerId.trim() && (
              <Link
                href={`/jogadores/${linkedPlayerId.trim()}`}
                className="text-xs text-[#1B3A6B] hover:underline mt-1 inline-block"
                target="_blank"
              >
                Ver perfil do jogador →
              </Link>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Técnico vinculado (ID)
            </label>
            <Input
              type="number"
              min={1}
              value={linkedManagerId}
              onChange={(e) => setLinkedManagerId(e.target.value)}
              placeholder="opcional"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Observações
          </label>
          <textarea
            className={sel + " min-h-[100px]"}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Destaques do mandato…"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="submit" className="bg-[#1B3A6B]" disabled={saving}>
            {saving ? "Salvando…" : "Salvar"}
          </Button>
          {!isNew && (
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
