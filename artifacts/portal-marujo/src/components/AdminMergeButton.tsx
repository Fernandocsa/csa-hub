import { GitMerge } from "lucide-react";
import { useState } from "react";
import { adminFetch } from "@/hooks/useAdminAuth";

type MergeMode =
  | { kind: "pair"; endpoint: string }
  | { kind: "stadium"; endpoint?: string };

/**
 * List-row merge control: keeps `keepId`, prompts for duplicate ID to absorb and delete.
 */
export function AdminMergeButton({
  keepId,
  keepName,
  mode,
  onDone,
}: {
  keepId: number;
  keepName: string;
  mode: MergeMode;
  onDone: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  async function run() {
    const raw = window.prompt(
      `Mesclar em "${keepName}" (id ${keepId}).\n\nInforme o ID do duplicado que será absorvido e excluído:`,
    );
    if (raw == null) return;
    const removeId = parseInt(raw.trim(), 10);
    if (!Number.isInteger(removeId) || removeId < 1) {
      alert("ID inválido");
      return;
    }
    if (removeId === keepId) {
      alert("O ID a absorver deve ser diferente do atual");
      return;
    }
    if (
      !confirm(
        `Mesclar id ${removeId} em "${keepName}" (id ${keepId})?\n\nO registro ${removeId} será excluído e os vínculos passam para ${keepId}.`,
      )
    ) {
      return;
    }

    setBusy(true);
    try {
      const endpoint =
        mode.kind === "stadium"
          ? mode.endpoint ?? "/admin/stadiums/merge"
          : mode.endpoint;
      const body =
        mode.kind === "stadium"
          ? { keepId, mergeIds: [removeId] }
          : { keepId, removeId };
      const r = await adminFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao mesclar");
      }
      await onDone();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Erro ao mesclar");
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        void run();
      }}
      disabled={busy}
      className="p-1 text-gray-400 hover:text-[#1B3A6B] rounded disabled:opacity-50"
      title="Mesclar duplicado neste registro"
    >
      <GitMerge size={14} />
    </button>
  );
}
