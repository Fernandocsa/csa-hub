import { useMemo } from "react";
import { useSearch } from "wouter";

/** Only allow in-app admin return paths (blocks open redirects). */
export function safeAdminReturnPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let path = raw.trim();
  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const u = new URL(path);
      path = u.pathname + u.search;
    }
  } catch {
    return null;
  }
  if (!path.startsWith("/admin")) return null;
  if (path.startsWith("//")) return null;
  return path;
}

export function adminReturnLabel(path: string, fallback = "Voltar"): string {
  const season = path.match(/^\/admin\/temporadas\/(\d{4})\b/);
  if (season) return `Temporada ${season[1]}`;
  if (path === "/admin/jogadores" || path.startsWith("/admin/jogadores?")) {
    return "Jogadores";
  }
  if (path === "/admin/tecnicos" || path.startsWith("/admin/tecnicos?")) {
    return "Técnicos";
  }
  if (path.startsWith("/admin/comissao/auxiliares")) return "Auxiliares";
  if (path.startsWith("/admin/comissao/preparadores")) return "Preparadores";
  if (path.startsWith("/admin/comissao/medicos")) return "Médicos";
  if (path.startsWith("/admin/comissao/massagistas")) return "Massagistas";
  if (path.startsWith("/admin/divergencias")) return "Divergências";
  const partidasSeason = path.match(/^\/admin\/partidas\/?\?season=(\d{4})\b/);
  if (partidasSeason) return `Partidas ${partidasSeason[1]}`;
  if (path.startsWith("/admin/partidas")) return "Partidas";
  return fallback;
}

/** Read ?from= for admin back-navigation (e.g. season roster → player). */
export function useAdminReturnTo(fallback: string) {
  const search = useSearch();
  return useMemo(() => {
    const qs = search.startsWith("?") ? search.slice(1) : search;
    const from = safeAdminReturnPath(new URLSearchParams(qs).get("from"));
    return {
      returnTo: from ?? fallback,
      from,
      label: adminReturnLabel(from ?? fallback),
    };
  }, [search, fallback]);
}

export function withAdminFrom(href: string, fromPath: string): string {
  const from = safeAdminReturnPath(fromPath);
  if (!from) return href;
  const join = href.includes("?") ? "&" : "?";
  return `${href}${join}from=${encodeURIComponent(from)}`;
}
