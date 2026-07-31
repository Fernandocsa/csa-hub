import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { ChevronDown, ChevronRight } from "lucide-react";

type Campaign = {
  id: number;
  season: string;
  competitionId: number;
  competitionName: string;
  classification: string | null;
  finalMatchId: number | null;
  finalMatchDate: string | null;
  finalOpponentName: string | null;
  playerCount: number;
  managerCount: number;
};

type Holders = {
  id: number;
  season: string;
  competitionName: string;
  players: { id: number; name: string }[];
  managers: { id: number; name: string }[];
};

function fmtDate(d: string | null) {
  if (!d) return null;
  const [y, m, day] = d.slice(0, 10).split("-");
  return `${day}/${m}/${y}`;
}

export default function AdminTitles() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);
  const [holders, setHolders] = useState<Record<number, Holders | "loading" | "error">>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const r = await adminFetch("/admin/titles");
    if (!r.ok) {
      setError("Falha ao carregar títulos");
      setLoading(false);
      return;
    }
    const data = await r.json();
    setTotal(data.total ?? 0);
    setCampaigns(data.campaigns ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleHolders(id: number) {
    if (openId === id) {
      setOpenId(null);
      return;
    }
    setOpenId(id);
    if (holders[id] && holders[id] !== "error") return;
    setHolders((prev) => ({ ...prev, [id]: "loading" }));
    const r = await adminFetch(`/admin/titles/${id}/holders`);
    if (!r.ok) {
      setHolders((prev) => ({ ...prev, [id]: "error" }));
      return;
    }
    const data = (await r.json()) as Holders;
    setHolders((prev) => ({ ...prev, [id]: data }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[#1B3A6B]">Títulos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Campanhas marcadas como campeãs. Crédito: qualquer jogador relacionado em qualquer
          ficha da campanha (banco incluso); técnico com ≥1 partida oficial na campanha.
        </p>
      </div>

      <div className="bg-white border rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-400">Total</p>
          <p className="text-3xl font-black text-[#1B3A6B]">{total}</p>
        </div>
        <p className="text-xs text-gray-500 max-w-md">
          Para marcar/desmarcar um título, use a coluna “Título” no resumo da{" "}
          <Link href="/admin/temporadas" className="text-[#1B3A6B] hover:underline">
            temporada
          </Link>
          .
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando…</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : campaigns.length === 0 ? (
        <p className="text-sm text-gray-400">
          Nenhum título marcado ainda. Marque o checkbox “Título” na temporada/competição.
        </p>
      ) : (
        <ul className="bg-white border rounded-lg divide-y">
          {campaigns.map((c) => {
            const open = openId === c.id;
            const h = holders[c.id];
            const finalLabel =
              c.finalMatchId && c.finalMatchDate
                ? `${fmtDate(c.finalMatchDate)}${
                    c.finalOpponentName ? ` × ${c.finalOpponentName}` : ""
                  }`
                : null;
            return (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => toggleHolders(c.id)}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50"
                >
                  {open ? (
                    <ChevronDown size={16} className="mt-1 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronRight size={16} className="mt-1 text-gray-400 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-semibold text-[#1B3A6B]">{c.season}</span>
                      <span className="text-sm">{c.competitionName}</span>
                      {c.classification ? (
                        <span className="text-xs text-gray-400">({c.classification})</span>
                      ) : null}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {c.playerCount} jogador{c.playerCount === 1 ? "" : "es"} ·{" "}
                      {c.managerCount} técnico{c.managerCount === 1 ? "" : "s"}
                      {finalLabel ? ` · Final: ${finalLabel}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/admin/temporadas/${c.season}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs text-[#1B3A6B] hover:underline shrink-0 mt-1"
                  >
                    Editar
                  </Link>
                </button>
                {open && (
                  <div className="px-4 pb-4 pl-11 grid sm:grid-cols-2 gap-4 text-sm">
                    {h === "loading" ? (
                      <p className="text-gray-400">Carregando elenco…</p>
                    ) : h === "error" ? (
                      <p className="text-red-600">Erro ao carregar.</p>
                    ) : h ? (
                      <>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1.5">
                            Jogadores ({h.players.length})
                          </p>
                          {h.players.length === 0 ? (
                            <p className="text-gray-400 text-xs">
                              Nenhuma ficha encontrada nesta campanha.
                            </p>
                          ) : (
                            <ul className="space-y-0.5 max-h-64 overflow-y-auto">
                              {h.players.map((p) => (
                                <li key={p.id}>
                                  <Link
                                    href={`/admin/jogadores/${p.id}`}
                                    className="hover:underline text-[#1B3A6B]"
                                  >
                                    {p.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1.5">
                            Técnicos ({h.managers.length})
                          </p>
                          {h.managers.length === 0 ? (
                            <p className="text-gray-400 text-xs">Nenhum técnico vinculado.</p>
                          ) : (
                            <ul className="space-y-0.5">
                              {h.managers.map((m) => (
                                <li key={m.id}>
                                  <Link
                                    href={`/admin/tecnicos/${m.id}`}
                                    className="hover:underline text-[#1B3A6B]"
                                  >
                                    {m.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
