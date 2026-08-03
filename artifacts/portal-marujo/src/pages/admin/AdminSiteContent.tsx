import { useEffect, useState } from "react";
import { Link } from "wouter";
import { adminFetch } from "@/hooks/useAdminAuth";
import { Button } from "@/components/ui/button";
import { MarkdownText, parseMarkdownTitle } from "@/components/MarkdownText";
import { DEFAULT_HOME_INTRO } from "@workspace/api-client-react";

type SiteBlock = {
  key: string;
  content: string;
  updatedAt: string;
};

const KNOWN_BLOCKS: { key: string; label: string; hint: string }[] = [
  {
    key: "home_intro",
    label: "Introdução da home",
    hint: "Texto no topo da Visão Geral. Markdown simples: # título, **negrito**, [link](/caminho).",
  },
];

export default function AdminSiteContent() {
  const [blocks, setBlocks] = useState<SiteBlock[]>([]);
  const [selectedKey, setSelectedKey] = useState("home_intro");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const r = await adminFetch("/admin/site-content");
      if (!cancelled) {
        if (r.ok) {
          const list = (await r.json()) as SiteBlock[];
          setBlocks(list);
          const current =
            list.find((b) => b.key === selectedKey)?.content ??
            (selectedKey === "home_intro" ? DEFAULT_HOME_INTRO : "");
          setDraft(current);
        } else {
          setError("Erro ao carregar conteúdos");
          if (selectedKey === "home_intro") setDraft(DEFAULT_HOME_INTRO);
        }
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  function selectKey(key: string) {
    setSelectedKey(key);
    setMsg("");
    setError("");
    const found = blocks.find((b) => b.key === key);
    setDraft(
      found?.content ?? (key === "home_intro" ? DEFAULT_HOME_INTRO : ""),
    );
  }

  async function save() {
    setSaving(true);
    setMsg("");
    setError("");
    const r = await adminFetch(`/admin/site-content/${encodeURIComponent(selectedKey)}`, {
      method: "PUT",
      body: JSON.stringify({ content: draft }),
    });
    setSaving(false);
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      setError((err as { error?: string }).error ?? "Erro ao salvar");
      return;
    }
    const saved = (await r.json()) as SiteBlock;
    setBlocks((prev) => {
      const others = prev.filter((b) => b.key !== saved.key);
      return [...others, saved].sort((a, b) => a.key.localeCompare(b.key));
    });
    setDraft(saved.content);
    setMsg("Salvo.");
  }

  const meta = KNOWN_BLOCKS.find((b) => b.key === selectedKey);
  const { title, body } = parseMarkdownTitle(draft);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Conteúdo do site</h1>
        <p className="text-sm text-gray-500 mt-1">
          Blocos de texto editáveis (CMS simples). Hoje: introdução da home.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {KNOWN_BLOCKS.map((b) => (
          <button
            key={b.key}
            type="button"
            onClick={() => selectKey(b.key)}
            className={`px-3 py-1.5 text-sm rounded border ${
              selectedKey === b.key
                ? "bg-[#1B3A6B] text-white border-[#1B3A6B]"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">Carregando…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-800">{meta?.label ?? selectedKey}</p>
              <p className="text-xs text-gray-500 mt-0.5">{meta?.hint}</p>
              <p className="text-xs text-gray-400 mt-1 font-mono">key: {selectedKey}</p>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={18}
              className="w-full border rounded-md px-3 py-2 text-sm font-mono leading-relaxed"
              spellCheck
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                className="bg-[#1B3A6B]"
                onClick={save}
                disabled={saving}
              >
                {saving ? "Salvando…" : "Salvar"}
              </Button>
              {msg && <span className="text-sm text-green-700">{msg}</span>}
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
            <p className="text-xs text-gray-500">
              <Link href="/" className="text-[#1B3A6B] hover:underline">
                Ver home pública →
              </Link>
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-800">Preview</p>
            <div className="border rounded-lg p-4 bg-white space-y-2">
              {title && (
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              )}
              <MarkdownText content={body} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
