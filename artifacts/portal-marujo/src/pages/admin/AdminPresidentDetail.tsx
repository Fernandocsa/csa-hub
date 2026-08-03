import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronLeft } from "lucide-react";
import { EntityPhoto } from "@/components/EntityPhoto";
import type { AdminPresident } from "./AdminPresidents";

export default function AdminPresidentDetail() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const isNew = params.id === "novo" || !params.id;
  const presidentId = isNew ? NaN : Number(params.id);

  const [name, setName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [termStart, setTermStart] = useState("");
  const [termEnd, setTermEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [linkedPlayerId, setLinkedPlayerId] = useState("");
  const [linkedManagerId, setLinkedManagerId] = useState("");
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const applySaved = (data: AdminPresident) => {
    setName(data.name);
    setPhotoUrl(data.photoUrl ?? "");
    setTermStart(data.termStart ?? "");
    setTermEnd(data.termEnd ?? "");
    setNotes(data.notes ?? "");
    setLinkedPlayerId(
      data.linkedPlayerId != null ? String(data.linkedPlayerId) : "",
    );
    setLinkedManagerId(
      data.linkedManagerId != null ? String(data.linkedManagerId) : "",
    );
  };

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
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        name: name.trim(),
        photoUrl: photoUrl.trim() || null,
        termStart: termStart.trim() || null,
        termEnd: termEnd.trim() || null,
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
      else applySaved(saved);
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Início do mandato
            </label>
            <Input
              type="date"
              value={termStart}
              onChange={(e) => setTermStart(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Fim do mandato
            </label>
            <Input
              type="date"
              value={termEnd}
              onChange={(e) => setTermEnd(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">Em branco = em andamento</p>
          </div>
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
