import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Cake } from "lucide-react";
import { adminFetch } from "@/hooks/useAdminAuth";
import { EntityPhoto } from "@/components/EntityPhoto";
import { PlayerFlag } from "@/components/PlayerFlag";
import { Input } from "@/components/ui/input";

type BirthdayPerson = {
  id: number;
  name: string;
  nationality: string | null;
  photoUrl: string | null;
  birthDate: string;
  age: number | null;
  isDeceased: boolean;
  kind: "player" | "manager";
  position?: string | null;
  nationalityFlag?: string | null;
};

type BirthdaysPayload = {
  date: string;
  players: BirthdayPerson[];
  managers: BirthdayPerson[];
};

function todayLocalIso() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtBirth(d: string) {
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function PersonRow({
  person,
  href,
  role,
}: {
  person: BirthdayPerson;
  href: string;
  role: string;
}) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5 border-b last:border-0">
      <EntityPhoto url={person.photoUrl} name={person.name} size="sm" shape="circle" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <PlayerFlag
            flag={person.nationalityFlag}
            nationality={person.nationality}
            size="sm"
          />
          <Link href={href} className="font-medium text-sm text-[#1B3A6B] hover:underline truncate">
            {person.name}
          </Link>
          {person.isDeceased && (
            <span className="text-[10px] uppercase tracking-wide text-gray-400">falecido</span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {role}
          {person.age != null ? ` · ${person.age} anos` : ""}
          {` · nasc. ${fmtBirth(person.birthDate)}`}
        </p>
      </div>
    </li>
  );
}

export default function AdminBirthdays() {
  const [date, setDate] = useState(todayLocalIso);
  const [data, setData] = useState<BirthdaysPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (d: string) => {
    setLoading(true);
    setError("");
    const r = await adminFetch(`/admin/birthdays?date=${encodeURIComponent(d)}`);
    if (!r.ok) {
      setError("Não foi possível carregar aniversariantes");
      setData(null);
    } else {
      setData(await r.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(date);
  }, [date, load]);

  const total = (data?.players.length ?? 0) + (data?.managers.length ?? 0);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900 inline-flex items-center gap-2">
            <Cake size={20} className="text-[#F5A623]" />
            Aniversariantes
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Jogadores e técnicos com data de nascimento cadastrada
          </p>
        </div>
        <div className="w-44">
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Data
          </label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value || todayLocalIso())}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {loading ? (
        <p className="text-sm text-gray-400">Carregando...</p>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-gray-500">
            {total === 0
              ? "Nenhum aniversariante nesta data."
              : `${total} aniversariante${total === 1 ? "" : "s"}`}
          </p>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Jogadores ({data?.players.length ?? 0})
            </h2>
            {(data?.players.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-400 border rounded-lg bg-white px-3 py-6 text-center">
                Nenhum jogador
              </p>
            ) : (
              <ul className="bg-white border rounded-lg overflow-hidden">
                {data!.players.map((p) => (
                  <PersonRow
                    key={`p-${p.id}`}
                    person={p}
                    href={`/admin/jogadores/${p.id}`}
                    role={p.position ?? "Jogador"}
                  />
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Técnicos ({data?.managers.length ?? 0})
            </h2>
            {(data?.managers.length ?? 0) === 0 ? (
              <p className="text-sm text-gray-400 border rounded-lg bg-white px-3 py-6 text-center">
                Nenhum técnico
              </p>
            ) : (
              <ul className="bg-white border rounded-lg overflow-hidden">
                {data!.managers.map((m) => (
                  <PersonRow
                    key={`m-${m.id}`}
                    person={m}
                    href={`/admin/tecnicos/${m.id}`}
                    role="Técnico"
                  />
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
