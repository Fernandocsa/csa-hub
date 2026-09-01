import type { Competition } from "@workspace/api-client-react";

export type CompetitionVariant = {
  id: number;
  name: string;
  type?: string | null;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  lastParticipation?: string | null;
};

export type CompetitionWithVariants = Competition & {
  variants?: CompetitionVariant[];
};

export type CompetitionSeasonRow = {
  year: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsScored: number;
  goalsConceded: number;
  competitionId?: number;
  competitionName?: string | null;
};

export type CompetitionParentRef = {
  id: number;
  name: string;
};
