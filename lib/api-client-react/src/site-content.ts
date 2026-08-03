import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export interface SiteContentBlock {
  key: string;
  content: string;
  updatedAt: string;
}

export const DEFAULT_HOME_INTRO = `# Portal Marujo — Base de dados do CSA

Um projeto feito pra registrar, com precisão, mais de cem anos de história do CSA — cada partida, jogador, técnico, árbitro, adversário e presidente que já vestiu ou representou o Azulão.

O selo ✓ aparece em qualquer registro do site — jogador, técnico, árbitro, adversário, presidente, o que for — e indica dados totalmente conferidos. O resto do acervo é confiável, mas cresce sempre que encontramos (ou recebemos) mais informação.

Você conhece um dado que falta, uma partida sem escalação, uma foto antiga? A torcida é parte desse trabalho. [Ajude a completar o acervo →](/sugestoes)`;

export const getSiteContent = async (key: string): Promise<SiteContentBlock> =>
  customFetch<SiteContentBlock>(`/api/site-content/${encodeURIComponent(key)}`);

export const getSiteContentQueryKey = (key: string) =>
  ["/api/site-content", key] as const;

export const useGetSiteContent = (key: string) =>
  useQuery({
    queryKey: getSiteContentQueryKey(key),
    queryFn: () => getSiteContent(key),
    staleTime: 60_000,
  });
