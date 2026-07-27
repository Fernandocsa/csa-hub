import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Link } from "wouter";

type SeasonRow = {
  year: number;
  statsFullyVerified: boolean;
  statsVerifiedAt: string | null;
};

export default function AdminSeasons() {
  const [seasons, setSeasons] = useState<SeasonRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch("/admin/seasons");
    if (r.ok) setSeasons(await r.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Temporadas</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Abra o ano para editar verificação, badges, resumo, elenco e técnicos.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                <th className="text-left px-3 py-2">Ano</th>
                <th className="text-left px-3 py-2">Stats verificadas</th>
                <th className="text-left px-3 py-2">Verificado em</th>
                <th className="text-right px-3 py-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s.year} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2.5 font-semibold">
                    <Link
                      href={`/admin/temporadas/${s.year}`}
                      className="text-[#1B3A6B] hover:underline"
                    >
                      {s.year}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={
                        s.statsFullyVerified
                          ? "text-emerald-700 font-medium"
                          : "text-gray-500"
                      }
                    >
                      {s.statsFullyVerified ? "Sim" : "Não"}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-gray-500 text-xs">
                    {s.statsVerifiedAt
                      ? new Date(s.statsVerifiedAt).toLocaleString("pt-BR")
                      : "–"}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Link
                      href={`/admin/temporadas/${s.year}`}
                      className="text-xs font-medium text-[#1B3A6B] hover:underline"
                    >
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {seasons.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Nenhuma temporada cadastrada
            </p>
          )}
        </div>
      )}
    </div>
  );
}
