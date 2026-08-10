import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useLocation } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AdminEntitySearch } from "@/components/AdminEntitySearch";
import { AdminMergeButton } from "@/components/AdminMergeButton";
import { EntityPhoto } from "@/components/EntityPhoto";
import type { Manager } from "./AdminManagerDetail";
import { includesFolded } from "@/lib/accent-fold";
import {
  COMMISSION_ROLES,
  STAFF_ROLE_META,
  staffRoleFromAdminPath,
  type StaffRole,
} from "@/lib/staff-roles";

/** Tabs only among commission roles — never includes Técnico. */
function CommissionTabs({ active }: { active: StaffRole }) {
  return (
    <div className="flex flex-wrap gap-1 mb-4 border-b">
      {COMMISSION_ROLES.map((role) => {
        const meta = STAFF_ROLE_META[role];
        return (
          <Link
            key={role}
            href={meta.adminPath}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px ${
              active === role
                ? "border-[#1B3A6B] text-[#1B3A6B]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {meta.labelPlural}
          </Link>
        );
      })}
    </div>
  );
}

export default function AdminManagers() {
  const [location, setLocation] = useLocation();
  const staffRole = staffRoleFromAdminPath(location);
  const isCommission = staffRole !== "manager";
  const meta = STAFF_ROLE_META[staffRole];
  const [managers, setManagers] = useState<Manager[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await adminFetch(`/admin/managers?role=${encodeURIComponent(staffRole)}`);
    if (r.ok) setManagers(await r.json());
    setLoading(false);
  }, [staffRole]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setSearch("");
  }, [staffRole]);

  const filtered = useMemo(
    () =>
      managers.filter(
        (m) =>
          includesFolded(m.name, search) ||
          includesFolded(m.fullName, search) ||
          includesFolded(m.registrationNumber, search),
      ),
    [managers, search],
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {isCommission ? "Comissão técnica" : meta.labelPlural}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isCommission
              ? `${meta.labelPlural} — cadastro, temporadas e registro profissional`
              : "Perfil, temporadas e badges dos treinadores"}
          </p>
        </div>
        <Button className="bg-[#1B3A6B]" asChild>
          <Link href={`${meta.adminPath}/novo`}>
            <Plus size={14} className="mr-1" /> Adicionar
          </Link>
        </Button>
      </div>

      {isCommission ? <CommissionTabs active={staffRole} /> : null}

      <AdminEntitySearch
        items={managers.map((m) => ({
          id: m.id,
          name: m.name,
          searchExtra: [m.fullName, m.registrationNumber].filter(Boolean).join(" "),
          subtitle:
            [
              m.registrationType && m.registrationNumber
                ? `${m.registrationType} ${m.registrationNumber}`
                : m.registrationNumber,
              m.nationality,
            ]
              .filter(Boolean)
              .join(" · ") || null,
        }))}
        placeholder={`Buscar ${meta.label.toLowerCase()}…`}
        value={search}
        onValueChange={setSearch}
        onSelect={(item) => setLocation(`${meta.adminPath}/${item.id}`)}
      />

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs text-gray-500 uppercase border-b">
                <th className="text-left px-3 py-2">Nome</th>
                {isCommission ? (
                  <th className="text-left px-3 py-2">Registro</th>
                ) : null}
                <th className="text-left px-3 py-2">Nacionalidade</th>
                <th className="text-left px-3 py-2">Período</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b hover:bg-gray-50/80">
                  <td className="px-3 py-2 font-medium">
                    <Link
                      href={`${meta.adminPath}/${m.id}`}
                      className="inline-flex items-center gap-2 min-w-0 text-[#1B3A6B] hover:underline"
                    >
                      <EntityPhoto
                        url={m.photoUrl}
                        name={m.name}
                        size="sm"
                        className="h-7 w-7 text-[9px]"
                        label={`Foto do ${meta.label.toLowerCase()}`}
                      />
                      <span className="truncate">{m.name}</span>
                    </Link>
                  </td>
                  {isCommission ? (
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {m.registrationType || m.registrationNumber
                        ? [m.registrationType, m.registrationNumber].filter(Boolean).join(" ")
                        : "–"}
                    </td>
                  ) : null}
                  <td className="px-3 py-2 text-gray-500">{m.nationality ?? "–"}</td>
                  <td className="px-3 py-2 text-gray-500">
                    {m.startYear != null || m.endYear != null
                      ? `${m.startYear ?? "?"}–${m.endYear ?? "?"}`
                      : m.storedGames != null
                        ? `${m.storedGames} jogos`
                        : "–"}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex justify-end">
                      <AdminMergeButton
                        keepId={m.id}
                        keepName={m.name}
                        mode={{ kind: "pair", endpoint: "/admin/managers/merge" }}
                        onDone={load}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Nenhum {meta.label.toLowerCase()} encontrado
            </p>
          )}
        </div>
      )}
    </div>
  );
}
