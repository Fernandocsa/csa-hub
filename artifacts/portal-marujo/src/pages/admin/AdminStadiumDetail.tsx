import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BRAZIL_UFS,
  lookupCitiesByName,
  uniqueUfsForCityName,
  type BrCity,
} from "@/lib/br-locations";
import {
  countryDisplayName,
  lookupCountriesByName,
  normalizeCountryName,
  type Country,
} from "@/lib/countries";
import { ChevronLeft, X } from "lucide-react";
import { EntityPhoto } from "@/components/EntityPhoto";

export type Stadium = {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  capacity: number | null;
  photoUrl: string | null;
};

type HomeClub = {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
};

type StadiumMatch = {
  id: number;
  matchDate: string;
  season: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  competitionName: string;
  opponentName: string;
  isFriendly: boolean;
};

type StadiumDetail = Stadium & {
  homeClubs: HomeClub[];
  matches: StadiumMatch[];
};

type OpponentOption = {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
};

type StadiumPayload = {
  name: string;
  city: string | null;
  state: string | null;
  country: string | null;
  capacity: number | null;
  photoUrl: string | null;
};

function locationLabel(o: {
  city?: string | null;
  state?: string | null;
  country?: string | null;
}) {
  if (o.country) {
    return [o.city, countryDisplayName(o.country)].filter(Boolean).join(" · ");
  }
  return [o.city, o.state].filter(Boolean).join(" · ");
}

type TabId = "perfil" | "clubes" | "jogos";

function fmtDate(d: string) {
  return new Date(d.includes("T") ? d : d + "T12:00:00").toLocaleDateString("pt-BR");
}

function StadiumMatches({ matches }: { matches: StadiumMatch[] }) {
  const [, setLocation] = useLocation();
  if (matches.length === 0) {
    return (
      <p className="text-sm text-gray-400">Nenhuma partida cadastrada neste estádio.</p>
    );
  }

  return (
    <div className="bg-white border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Data
            </th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Adversário
            </th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Competição
            </th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
              Placar
            </th>
          </tr>
        </thead>
        <tbody>
          {matches.map((m) => (
            <tr
              key={m.id}
              className="border-b hover:bg-gray-50 cursor-pointer"
              onClick={() => setLocation(`/admin/partidas/${m.id}`)}
            >
              <td className="px-3 py-2 whitespace-nowrap">
                <Link
                  href={`/admin/partidas/${m.id}`}
                  className="text-[#1B3A6B] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {fmtDate(m.matchDate)}
                </Link>
                <span className="block text-[10px] text-gray-400">{m.season}</span>
              </td>
              <td className="px-3 py-2 font-medium">{m.opponentName}</td>
              <td className="px-3 py-2">
                {m.competitionName}
                {m.isFriendly ? (
                  <span className="ml-1 text-[10px] text-amber-600">amistoso</span>
                ) : null}
              </td>
              <td className="px-3 py-2 font-medium">
                {m.goalsFor ?? "–"}–{m.goalsAgainst ?? "–"}
                <span className="ml-2 text-xs text-gray-400 uppercase">{m.result}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {m.homeAway === "home" ? "Casa" : m.homeAway === "away" ? "Fora" : m.homeAway}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StadiumProfileForm({
  initial,
  onSave,
  isNew,
}: {
  initial?: Partial<Stadium>;
  onSave: (data: StadiumPayload) => Promise<void>;
  isNew: boolean;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [city, setCity] = useState(initial?.city ?? "");
  const [state, setState] = useState(initial?.state ?? "");
  const [countryQuery, setCountryQuery] = useState(
    initial?.country ? countryDisplayName(initial.country) : "",
  );
  const [countryCode, setCountryCode] = useState<string | null>(initial?.country ?? null);
  const [countrySuggestions, setCountrySuggestions] = useState<Country[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<BrCity[]>([]);
  const [cityAmbiguity, setCityAmbiguity] = useState<string[]>([]);
  const [capacity, setCapacity] = useState(
    initial?.capacity != null ? String(initial.capacity) : "",
  );
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const isForeign = countryCode != null;

  useEffect(() => {
    setName(initial?.name ?? "");
    setCity(initial?.city ?? "");
    setState(initial?.state ?? "");
    setCountryCode(initial?.country ?? null);
    setCountryQuery(initial?.country ? countryDisplayName(initial.country) : "");
    setCapacity(initial?.capacity != null ? String(initial.capacity) : "");
    setPhotoUrl(initial?.photoUrl ?? "");
    setCitySuggestions([]);
    setCityAmbiguity([]);
    setCountrySuggestions([]);
  }, [initial]);

  useEffect(() => {
    const matches = lookupCountriesByName(countryQuery, 12);
    setCountrySuggestions(matches);
    const q = normalizeCountryName(countryQuery);
    if (!q) {
      setCountryCode(null);
      return;
    }
    const exact = matches.find((c) => normalizeCountryName(c.name) === q);
    if (exact) {
      if (exact.code === "BRA") {
        setCountryCode(null);
      } else {
        setCountryCode(exact.code);
        setState("");
        setCityAmbiguity([]);
      }
    }
  }, [countryQuery]);

  useEffect(() => {
    if (isForeign) {
      setCitySuggestions([]);
      setCityAmbiguity([]);
      return;
    }
    const matches = lookupCitiesByName(city, 12);
    setCitySuggestions(matches);
    const ufs = uniqueUfsForCityName(city);
    setCityAmbiguity(ufs.length > 1 ? ufs : []);
    if (ufs.length === 1 && !state) {
      setState(ufs[0]);
    }
  }, [city, isForeign]); // eslint-disable-line react-hooks/exhaustive-deps

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      let cap: number | null = null;
      if (capacity.trim()) {
        const n = parseInt(capacity, 10);
        if (!Number.isInteger(n) || n < 0) throw new Error("Capacidade inválida");
        cap = n;
      }
      await onSave({
        name: name.trim(),
        city: city.trim() || null,
        state: isForeign ? null : state.trim() ? state.trim().toUpperCase() : null,
        country: isForeign ? countryCode : null,
        capacity: cap,
        photoUrl: photoUrl.trim() || null,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    }
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-xl">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Foto
        </label>
        <div className="flex items-start gap-3">
          <EntityPhoto
            url={photoUrl.trim() || null}
            name={name || "Estádio"}
            size="md"
            shape="rounded"
            label="Foto do estádio"
          />
          <div className="flex-1 min-w-0">
            <Input
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              placeholder="https://… ou /stadiums/id.jpg"
              className="h-9"
            />
            <p className="text-xs text-gray-400 mt-1">
              URL HTTPS ou caminho local em public. Sem upload nesta tela.
            </p>
          </div>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Nome *
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="h-9"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          País
        </label>
        <Input
          value={countryQuery}
          onChange={(e) => setCountryQuery(e.target.value)}
          list="stadium-country-suggestions"
          placeholder="ex: Brasil, Argentina (vazio = Brasil)"
          className="h-9"
        />
        <datalist id="stadium-country-suggestions">
          {countrySuggestions.map((c) => (
            <option key={c.code} value={c.name} />
          ))}
        </datalist>
        <p className="text-[11px] text-gray-500 mt-1">
          {isForeign
            ? `Estádio estrangeiro (${countryCode})`
            : "Deixe vazio para estádio brasileiro."}
        </p>
      </div>

      <div className={`grid grid-cols-1 gap-3 ${isForeign ? "" : "sm:grid-cols-2"}`}>
        <div>
          <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
            Cidade
          </label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            list={isForeign ? undefined : "stadium-br-city-suggestions"}
            placeholder={isForeign ? "ex: Buenos Aires" : "ex: Maceió"}
            className="h-9"
          />
          {!isForeign && (
            <datalist id="stadium-br-city-suggestions">
              {citySuggestions.map((c) => (
                <option key={`${c.name}-${c.uf}`} value={c.name}>
                  {c.uf}
                </option>
              ))}
            </datalist>
          )}
          {!isForeign && cityAmbiguity.length > 1 && (
            <div className="mt-2">
              <p className="text-[11px] text-amber-700 mb-1">
                Cidade existe em mais de um estado — escolha a UF:
              </p>
              <Select value={state || undefined} onValueChange={setState}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Desambiguar UF" />
                </SelectTrigger>
                <SelectContent>
                  {cityAmbiguity.map((uf) => (
                    <SelectItem key={uf} value={uf} className="text-xs">
                      {city.trim()}-{uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {!isForeign && (
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
              Estado (UF)
            </label>
            <Select
              value={state || "__none__"}
              onValueChange={(v) => setState(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="UF" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">—</SelectItem>
                {BRAZIL_UFS.map((uf) => (
                  <SelectItem key={uf} value={uf}>
                    {uf}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Capacidade
        </label>
        <Input
          type="number"
          min={0}
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
          placeholder="ex: 19000"
          className="h-9"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" className="bg-[#1B3A6B]" disabled={saving}>
        {saving ? "Salvando…" : isNew ? "Criar estádio" : "Salvar"}
      </Button>
    </form>
  );
}

function StadiumClubsSection({
  stadiumId,
  linked,
  onSaved,
}: {
  stadiumId: number;
  linked: HomeClub[];
  onSaved: () => Promise<void>;
}) {
  const [selected, setSelected] = useState<number[]>(linked.map((c) => c.id));
  const [allOpponents, setAllOpponents] = useState<OpponentOption[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelected(linked.map((c) => c.id));
  }, [linked]);

  useEffect(() => {
    adminFetch("/admin/opponents").then(async (r) => {
      if (r.ok) setAllOpponents(await r.json());
    });
  }, []);

  const selectedClubs = useMemo(() => {
    const map = new Map(allOpponents.map((o) => [o.id, o]));
    return selected
      .map((id) => map.get(id))
      .filter((o): o is OpponentOption => o != null);
  }, [selected, allOpponents]);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allOpponents
      .filter((o) => !selected.includes(o.id))
      .filter((o) => !q || o.name.toLowerCase().includes(q))
      .slice(0, 12);
  }, [allOpponents, query, selected]);

  function addClub(id: number) {
    setSelected((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setQuery("");
  }

  function removeClub(id: number) {
    setSelected((prev) => prev.filter((x) => x !== id));
  }

  async function save() {
    setSaving(true);
    setError("");
    const r = await adminFetch(`/admin/stadiums/${stadiumId}/home-clubs`, {
      method: "PUT",
      body: JSON.stringify({ opponentIds: selected }),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      setError((err as { error?: string }).error ?? "Erro ao salvar vínculos");
      setSaving(false);
      return;
    }
    await onSaved();
    setSaving(false);
  }

  return (
    <div className="space-y-4 max-w-xl">
      <p className="text-sm text-gray-600">
        Adversários que usam este estádio como sede ({selected.length}).
      </p>

      {selectedClubs.length > 0 && (
        <ul className="space-y-2">
          {selectedClubs.map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-2 border rounded px-3 py-2 bg-white text-sm"
            >
              <div>
                <span className="font-medium">{c.name}</span>
                {locationLabel(c) && (
                  <span className="text-gray-500 ml-2 text-xs">{locationLabel(c)}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeClub(c.id)}
                className="text-gray-400 hover:text-red-600 p-1"
                title="Remover vínculo"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">
          Adicionar clube
        </label>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar adversário…"
          className="h-9"
        />
        {query.trim() && (
          <ul className="mt-1 border rounded bg-white max-h-48 overflow-auto">
            {suggestions.length === 0 ? (
              <li className="px-3 py-2 text-xs text-gray-400">Nenhum resultado</li>
            ) : (
              suggestions.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50"
                    onClick={() => addClub(o.id)}
                  >
                    {o.name}
                    {locationLabel(o) && (
                      <span className="text-gray-400 ml-2 text-xs">{locationLabel(o)}</span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="button" className="bg-[#1B3A6B]" disabled={saving} onClick={save}>
        {saving ? "Salvando…" : "Salvar vínculos"}
      </Button>
    </div>
  );
}

export default function AdminStadiumDetail() {
  const params = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const isNew = !params.id;
  const stadiumId = isNew ? null : parseInt(params.id ?? "", 10);

  const [tab, setTab] = useState<TabId>("perfil");
  const [detail, setDetail] = useState<StadiumDetail | null>(null);
  const [loading, setLoading] = useState(!isNew);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (stadiumId == null || Number.isNaN(stadiumId)) return;
    setLoading(true);
    setError("");
    const r = await adminFetch(`/admin/stadiums/${stadiumId}`);
    if (!r.ok) {
      setError("Estádio não encontrado");
      setDetail(null);
    } else {
      setDetail(await r.json());
    }
    setLoading(false);
  }, [stadiumId]);

  useEffect(() => {
    if (isNew) {
      setDetail(null);
      setLoading(false);
      setTab("perfil");
      return;
    }
    load();
  }, [isNew, load]);

  async function save(data: StadiumPayload) {
    if (isNew) {
      const r = await adminFetch("/admin/stadiums", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Erro ao criar");
      }
      const created = (await r.json()) as Stadium;
      setLocation(`/admin/estadios/${created.id}`);
      return;
    }
    const r = await adminFetch(`/admin/stadiums/${stadiumId}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error ?? "Erro ao salvar");
    }
    await load();
  }

  const tabs = useMemo(() => {
    const base: { id: TabId; label: string }[] = [{ id: "perfil", label: "Perfil" }];
    if (!isNew) {
      base.push({ id: "clubes", label: "Clubes" });
      base.push({
        id: "jogos",
        label: `Jogos${detail ? ` (${detail.matches?.length ?? 0})` : ""}`,
      });
    }
    return base;
  }, [isNew, detail]);

  if (loading) {
    return <p className="text-sm text-gray-400">Carregando...</p>;
  }

  if (!isNew && (error || !detail)) {
    return (
      <div>
        <Link
          href="/admin/estadios"
          className="text-sm text-gray-500 hover:text-gray-800 inline-flex items-center mb-3"
        >
          <ChevronLeft size={14} className="mr-1" /> Estádios
        </Link>
        <p className="text-sm text-red-600">{error || "Não encontrado"}</p>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/admin/estadios"
        className="text-sm text-gray-500 hover:text-gray-800 inline-flex items-center mb-3"
      >
        <ChevronLeft size={14} className="mr-1" /> Estádios
      </Link>

      <h1 className="text-xl font-bold text-gray-900 mb-1">
        {isNew ? "Novo estádio" : detail?.name}
      </h1>
      {!isNew && detail && (
        <p className="text-sm text-gray-500 mb-4">
          {locationLabel(detail) || "Sem localização"}
          {detail.capacity != null && ` · Cap. ${detail.capacity.toLocaleString("pt-BR")}`}
          {detail.homeClubs.length > 0 &&
            ` · ${detail.homeClubs.length} clube(s) sede`}
        </p>
      )}

      <div className="flex gap-1 border-b mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-[#1B3A6B] text-[#1B3A6B]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "perfil" && (
        <StadiumProfileForm
          key={isNew ? "new" : detail!.id}
          initial={isNew ? undefined : detail!}
          isNew={isNew}
          onSave={save}
        />
      )}

      {tab === "clubes" && !isNew && detail && (
        <StadiumClubsSection
          stadiumId={detail.id}
          linked={detail.homeClubs}
          onSaved={load}
        />
      )}

      {tab === "jogos" && !isNew && detail && (
        <StadiumMatches matches={detail.matches ?? []} />
      )}
    </div>
  );
}
