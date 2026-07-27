import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";

export type BadgeEntityType = "player" | "manager";

export type EntityBadgeRow = {
  id: number;
  entityType: string;
  entityId: number;
  label: string;
  source: string;
  autoKind: string | null;
  seasonYear: number | null;
  createdAt?: string;
};

export function AdminEntityBadges({
  entityType,
  entityId,
}: {
  entityType: BadgeEntityType;
  entityId: number;
}) {
  const [badges, setBadges] = useState<EntityBadgeRow[] | null>(null);
  const [label, setLabel] = useState("");
  const [seasonYear, setSeasonYear] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await adminFetch(`/admin/badges/${entityType}/${entityId}`);
    if (r.ok) setBadges(await r.json());
    else setBadges([]);
  }, [entityType, entityId]);

  useEffect(() => {
    setBadges(null);
    load();
  }, [load]);

  async function addBadge(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body: { label: string; seasonYear?: number | null } = {
        label: label.trim(),
      };
      if (seasonYear.trim()) body.seasonYear = parseInt(seasonYear, 10);
      const r = await adminFetch(`/admin/badges/${entityType}/${entityId}`, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao salvar");
      }
      setLabel("");
      setSeasonYear("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro");
    }
    setSaving(false);
  }

  async function removeBadge(id: number, source: string) {
    if (source !== "manual") return;
    if (!confirm("Remover este badge?")) return;
    await adminFetch(`/admin/badges/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="mt-4 pt-3 border-t border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase">
          Badges / Selos
        </span>
      </div>

      {!badges ? (
        <p className="text-xs text-gray-400">Carregando...</p>
      ) : badges.length === 0 ? (
        <p className="text-xs text-gray-400 mb-2">Nenhum badge</p>
      ) : (
        <ul className="space-y-1 mb-3">
          {badges.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-2 text-xs bg-white border rounded px-2 py-1.5"
            >
              <div className="min-w-0">
                <span className="font-medium">{b.label}</span>
                <span className="text-gray-400 ml-2">
                  {b.source === "auto" ? "automático" : "manual"}
                  {b.seasonYear != null ? ` · ${b.seasonYear}` : ""}
                </span>
              </div>
              {b.source === "manual" && (
                <button
                  type="button"
                  onClick={() => removeBadge(b.id, b.source)}
                  className="p-0.5 text-gray-400 hover:text-red-600 shrink-0"
                  title="Remover"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={addBadge} className="flex flex-wrap items-end gap-2">
        <div className="flex-1 min-w-[12rem]">
          <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">
            Novo badge (nome livre)
          </label>
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder={
              entityType === "player"
                ? "ex: Cria do Mutange"
                : "ex: Campeão Alagoano 2023"
            }
            required
            maxLength={120}
            className="h-8 text-xs"
          />
        </div>
        <div className="w-24">
          <label className="text-[10px] font-semibold text-gray-500 uppercase block mb-0.5">
            Ano (opc.)
          </label>
          <Input
            value={seasonYear}
            onChange={(e) => setSeasonYear(e.target.value)}
            placeholder="2024"
            className="h-8 text-xs"
            inputMode="numeric"
          />
        </div>
        <Button
          type="submit"
          size="sm"
          className="bg-[#1B3A6B] h-8"
          disabled={saving || !label.trim()}
        >
          <Plus size={12} className="mr-1" />
          {saving ? "…" : "Adicionar"}
        </Button>
      </form>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
