export type ResolveStatus = "exact" | "fuzzy" | "ambiguous" | "missing" | "resolved";

export type NameCandidate = { id: number; name: string };

export type ResolvedName = {
  raw: string;
  status: ResolveStatus;
  id: number | null;
  name: string | null;
  candidates: NameCandidate[];
  /** User chose to create on commit */
  createNew?: boolean;
  /** User picked candidate id */
  selectedId?: number | null;
};

export type ClaudeSeasonGame = {
  date: string;
  homeAway: "home" | "away" | "neutral";
  opponentName: string;
  competitionName: string;
  phase?: string | null;
  round?: string | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result?: "win" | "draw" | "loss" | "unknown" | null;
  penaltiesFor?: number | null;
  penaltiesAgainst?: number | null;
  managerName?: string | null;
  refereeName?: string | null;
  attendance?: number | null;
  attendancePaid?: number | null;
  ownGoalsForCount?: number;
  csaStarters?: string[];
  csaBench?: string[];
  csaSubstitutions?: Array<{
    playerOut: string;
    playerIn: string;
    minuteRaw?: number | null;
    half?: 1 | 2 | null;
  }>;
  csaGoals?: Array<{
    scorerName?: string | null;
    assistName?: string | null;
    minuteRaw: number;
    half: 1 | 2;
    isOwnGoal?: boolean;
  }>;
  csaCards?: Array<{
    playerName: string;
    cardType: "yellow" | "red";
    minuteRaw?: number | null;
    half?: 1 | 2 | null;
  }>;
  notes?: string[];
  ambiguities?: Array<{ field: string; raw: string; reason: string }>;
};

export type PreviewPlayerRef = ResolvedName & {
  role?: "starter" | "bench";
  sortOrder?: number;
};

export type PreviewGoal = {
  isOwnGoal: boolean;
  scorer: ResolvedName | null;
  assist: ResolvedName | null;
  minuteRaw: number;
  half: 1 | 2;
  minute: number;
  injuryTimeMinute: number | null;
};

export type PreviewSub = {
  playerOut: ResolvedName;
  playerIn: ResolvedName;
  minuteRaw: number;
  half: 1 | 2 | null;
  minute: number;
  injuryTimeMinute: number | null;
};

export type PreviewCard = {
  player: ResolvedName;
  cardType: "yellow" | "red";
  minute: number;
  injuryTimeMinute: number | null;
};

export type ExistingMatchSnap = {
  id: number;
  matchDate: string;
  season: string;
  opponentId: number;
  opponentName: string;
  competitionId: number;
  competitionName: string;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  homeAway: string;
  managerId: number | null;
  managerName: string | null;
  refereeId: number | null;
  refereeName: string | null;
  phase: string | null;
  round: string | null;
  attendance: number | null;
  ownGoalsForCount: number;
  sheetLineupCount: number;
};

export type FieldDiff = {
  field: string;
  label: string;
  current: string | number | null;
  proposed: string | number | null;
  apply: boolean;
};

export type PreviewGame = {
  key: string;
  include: boolean;
  date: string;
  homeAway: "home" | "away" | "neutral";
  opponent: ResolvedName;
  competition: ResolvedName;
  phase: string | null;
  round: string | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  result: string;
  penaltiesFor: number | null;
  penaltiesAgainst: number | null;
  manager: ResolvedName | null;
  referee: ResolvedName | null;
  attendance: number | null;
  attendancePaid: number | null;
  ownGoalsForCount: number;
  starters: PreviewPlayerRef[];
  bench: PreviewPlayerRef[];
  goals: PreviewGoal[];
  substitutions: PreviewSub[];
  cards: PreviewCard[];
  notes: string[];
  scoreConsistencyWarning: string | null;
  existingMatch: ExistingMatchSnap | null;
  overwriteSheet: boolean;
  fieldDiffs: FieldDiff[];
  unresolvedCount: number;
};

export type SeasonPreview = {
  seasonYear: number;
  games: PreviewGame[];
  summary: {
    total: number;
    unresolved: number;
    existing: number;
    create: number;
  };
};
