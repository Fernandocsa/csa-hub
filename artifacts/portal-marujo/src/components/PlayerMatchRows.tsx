import type { PlayerSheetMatch } from "@workspace/api-client-react";
import { MatchRows } from "@/components/MatchRows";

export function PlayerMatchRows({ matches }: { matches: PlayerSheetMatch[] }) {
  return <MatchRows matches={matches} />;
}
