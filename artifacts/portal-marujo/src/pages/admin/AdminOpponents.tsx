import { useState, useEffect, useCallback } from "react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";

interface Opponent {
  id: number;
  name: string;
}

export default function AdminOpponents() {
  const [opponents, setOpponents] = useState<Opponent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOpponent, setEditOpponent] = useState<Opponent | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch("/admin/opponents");
    if (r.ok) setOpponents(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditOpponent(null);
    setName("");
    setError("");
    setDialogOpen(true);
  }

  function openEdit(o: Opponent) {
    setEditOpponent(o);
    setName(o.name);
    setError("");
    setDialogOpen(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const r = await adminFetch(
        editOpponent ? `/admin/opponents/${editOpponent.id}` : "/admin/opponents",
        { method: editOpponent ? "PUT" : "POST", body: JSON.stringify({ name: name.trim() }) }
      );
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        setError((err as any).error ?? "Erro ao salvar");
      } else {
        setDialogOpen(false);
        await load();
      }
    } catch {
      setError("Erro ao salvar");
    }
    setSaving(false);
  }

  async function remove(id: number) {
    if (!confirm("Excluir este adversário? Partidas associadas ficam sem adversário.")) return;
    await adminFetch(`/admin/opponents/${id}`, { method: "DELETE" });
    await load();
  }

  const filtered = opponents.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Adversários</h1>
          <p className="text-sm text-gray-500">{opponents.length} cadastrados</p>
        </div>
        <Button className="bg-[#1B3A6B]" onClick={openAdd}>
          <Plus size={14} className="mr-1" /> Adicionar
        </Button>
      </div>

      <Input
        placeholder="Buscar adversário..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-xs"
      />

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase w-12">ID</th>
                <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr key={o.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-400 font-mono text-xs">{o.id}</td>
                  <td className="px-4 py-2 font-medium">{o.name}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(o)} className="p-1 text-gray-400 hover:text-[#1B3A6B] rounded">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => remove(o.id)} className="p-1 text-gray-400 hover:text-red-600 rounded">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">Nenhum adversário encontrado</p>
          )}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editOpponent ? "Editar Adversário" : "Novo Adversário"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Nome *</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" className="bg-[#1B3A6B]" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
