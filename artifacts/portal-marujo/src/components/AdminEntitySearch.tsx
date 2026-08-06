import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { includesFolded } from "@/lib/accent-fold";

export type SearchableEntity = {
  id: number;
  name: string;
  subtitle?: string | null;
};

/**
 * Typeahead search: typing filters suggestions; clicking selects the entity
 * (parent typically expands that row for badge editing).
 */
export function AdminEntitySearch({
  items,
  placeholder,
  onSelect,
  value,
  onValueChange,
  maxSuggestions = 12,
}: {
  items: SearchableEntity[];
  placeholder: string;
  onSelect: (item: SearchableEntity) => void;
  /** Controlled query (also used by parent to filter the table). */
  value?: string;
  onValueChange?: (value: string) => void;
  maxSuggestions?: number;
}) {
  const [inner, setInner] = useState("");
  const query = value !== undefined ? value : inner;
  const setQuery = (v: string) => {
    if (onValueChange) onValueChange(v);
    else setInner(v);
  };

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return items
      .filter((it) => includesFolded(it.name, q))
      .slice(0, maxSuggestions);
  }, [items, query, maxSuggestions]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function pick(item: SearchableEntity) {
    setQuery(item.name);
    setOpen(false);
    onSelect(item);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (e.key === "ArrowDown" && query.trim()) setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = suggestions[highlight];
      if (item) pick(item);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative mb-4 max-w-sm">
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim()) setOpen(true);
        }}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
      />
      {open && query.trim() && (
        <ul
          className="absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-md border bg-white shadow-md text-sm"
          role="listbox"
        >
          {suggestions.length === 0 ? (
            <li className="px-3 py-2 text-gray-400">Nenhum resultado</li>
          ) : (
            suggestions.map((it, i) => (
              <li key={it.id} role="option" aria-selected={i === highlight}>
                <button
                  type="button"
                  className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${
                    i === highlight ? "bg-gray-50" : ""
                  }`}
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => pick(it)}
                >
                  <span className="font-medium text-gray-900">{it.name}</span>
                  {it.subtitle ? (
                    <span className="block text-xs text-gray-500 truncate">
                      {it.subtitle}
                    </span>
                  ) : null}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
