// The student's profile (S-05, FR-101, FR-104) as GET /v1/me/profile returns it, and the small rules the
// "Your details" screen needs. Pure functions, tested with `pnpm test` (profile.test.ts).

export const BOARDS = ['FBISE', 'PUNJAB', 'SINDH', 'KPK', 'BALOCHISTAN', 'AJK', 'CAMBRIDGE', 'OTHER'] as const;
export type Board = (typeof BOARDS)[number];

export const SITUATIONS = [
  'repeating_class',
  'private_candidate',
  'returning_learner',
  'changed_board',
  'o_a_level',
  'dae',
  'madrassa_or_foreign',
] as const;
export type Situation = (typeof SITUATIONS)[number];

export interface Profile {
  student_id: string;
  nickname: string;
  grade: number;
  board: string | null;
  current_group: string | null;
  district: string | null;
  age_band: string;
  situation: Situation | null;
  /** The current-group ids this student's class can choose from (empty for class 8). */
  groups: string[];
}

/** The fields the screen edits. */
export type Details = Pick<Profile, 'board' | 'current_group' | 'situation'>;

/** What kind of group a class chooses from: none yet (class 8), a Matric group, or an Intermediate stream. */
export function groupKind(grade: number): 'none' | 'matric' | 'intermediate' {
  if (grade >= 11) return 'intermediate';
  if (grade >= 9) return 'matric';
  return 'none';
}

/** Translation key for a group id: Matric groups have their own names; Intermediate streams reuse stream.*. */
export function groupLabelKey(grade: number, id: string): string {
  return groupKind(grade) === 'matric' ? `profile.group.${id}` : `stream.${id}`;
}

/** Only what changed goes in the merge patch, so saving twice changes nothing. */
export function changedFields(before: Details, after: Details): Partial<Details> {
  const out: Partial<Details> = {};
  for (const key of ['board', 'current_group', 'situation'] as const) {
    if (before[key] !== after[key]) (out as Record<string, unknown>)[key] = after[key];
  }
  return out;
}

/** Home asks a class 9-12 student for their group until it is set (the results need it for Biology). */
export function needsGroup(profile: Pick<Profile, 'grade' | 'current_group' | 'groups'> | null): boolean {
  return !!profile && profile.groups.length > 0 && profile.current_group === null;
}
