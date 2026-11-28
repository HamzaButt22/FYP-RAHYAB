/**
 * Versioned, configurable pathway rules.
 *
 * IMPORTANT — eligibility data status:
 * The `requires` fields below describe the broad Matric-group structure of
 * Pakistani intermediate streams as commonly published by boards. They are
 * marked `verified: false` because no official source has been attached in
 * this build. Before real use, a reviewer must check each rule against the
 * relevant Board of Intermediate & Secondary Education (BISE), IBCC, TEVTA or
 * institution documents, add the source to `sources`, and set verified: true.
 * The app shows an "always confirm admission rules" notice while any rule is
 * unverified.
 */
import { AbilityFamily, Riasec } from '../types';

export type MatricGroup = 'science_biology' | 'science_computer' | 'humanities' | 'olevel' | 'not_yet';
export type ClassLevel = 8 | 9 | 10 | 11 | 12;
export type Track = 'academic' | 'technical';

export interface PathwayRule {
  id: string;
  name: string;
  short: string;
  track: Track;
  about: string;
  interests: Partial<Record<Riasec, number>>;
  abilities: Partial<Record<AbilityFamily, number>>;
  /** Matric groups that lead into this pathway. */
  requires: MatricGroup[];
  verified: boolean;
  sources: string[];
}

export const RULESET_VERSION = '2026.11-draft-1';

export const PATHWAYS: PathwayRule[] = [
  { id: 'fsc_pre_medical', name: 'FSc Pre-Medical', short: 'Pre-Medical', track: 'academic',
    about: 'Biology, chemistry and physics. Leads towards medicine, nursing, pharmacy and life sciences.',
    interests: { I: 0.5, S: 0.4, R: 0.1 }, abilities: { VRB: 0.3, LOG: 0.3, NUM: 0.2, ABS: 0.2 },
    requires: ['science_biology'], verified: false, sources: [] },
  { id: 'fsc_pre_engineering', name: 'FSc Pre-Engineering', short: 'Pre-Engineering', track: 'academic',
    about: 'Maths, physics and chemistry. Leads towards engineering and applied sciences.',
    interests: { R: 0.4, I: 0.5, C: 0.1 }, abilities: { NUM: 0.4, SPA: 0.3, LOG: 0.2, ABS: 0.1 },
    requires: ['science_biology', 'science_computer'], verified: false, sources: [] },
  { id: 'ics', name: 'ICS (Computer Science)', short: 'ICS', track: 'academic',
    about: 'Computer science with maths and physics or statistics. Leads towards software, data and IT.',
    interests: { I: 0.4, C: 0.3, R: 0.2, E: 0.1 }, abilities: { LOG: 0.35, NUM: 0.3, ABS: 0.25, PLN: 0.1 },
    requires: ['science_biology', 'science_computer'], verified: false, sources: [] },
  { id: 'icom', name: 'I.Com (Commerce)', short: 'I.Com', track: 'academic',
    about: 'Accounting, business and economics. Leads towards banking, business and finance.',
    interests: { E: 0.4, C: 0.5, S: 0.1 }, abilities: { NUM: 0.4, PLN: 0.3, VRB: 0.2, LOG: 0.1 },
    requires: ['science_biology', 'science_computer', 'humanities'], verified: false, sources: [] },
  { id: 'fa', name: 'FA (Humanities)', short: 'FA', track: 'academic',
    about: 'Languages, social sciences and arts subjects. Leads towards teaching, law, media and design.',
    interests: { A: 0.35, S: 0.35, E: 0.15, I: 0.15 }, abilities: { VRB: 0.6, LOG: 0.2, PLN: 0.2 },
    requires: ['science_biology', 'science_computer', 'humanities'], verified: false, sources: [] },
  { id: 'olevel_alevel', name: 'O/A-Level route', short: 'A-Levels', track: 'academic',
    about: 'Cambridge-style subjects you choose yourself. Suits students already studying O-Levels.',
    interests: { I: 0.3, A: 0.2, E: 0.2, S: 0.2, C: 0.1 }, abilities: { VRB: 0.3, LOG: 0.25, NUM: 0.25, ABS: 0.2 },
    requires: ['olevel'], verified: false, sources: [] },
  { id: 'dae', name: 'DAE (Diploma of Associate Engineer)', short: 'DAE', track: 'technical',
    about: 'A hands-on three-year engineering diploma in fields like electrical, civil or mechanical.',
    interests: { R: 0.6, I: 0.2, C: 0.2 }, abilities: { SPA: 0.4, NUM: 0.3, PLN: 0.3 },
    requires: ['science_biology', 'science_computer'], verified: false, sources: [] },
  { id: 'dcom', name: 'D.Com (Diploma of Commerce)', short: 'D.Com', track: 'technical',
    about: 'A practical commerce diploma: office work, accounts, computing and small business skills.',
    interests: { C: 0.5, E: 0.4, S: 0.1 }, abilities: { NUM: 0.4, PLN: 0.3, VRB: 0.3 },
    requires: ['science_biology', 'science_computer', 'humanities', 'olevel'], verified: false, sources: [] },
  { id: 'tevta_trades', name: 'Technical & vocational trades', short: 'Trades', track: 'technical',
    about: 'Short practical courses such as electrician, solar technician, tailoring or graphic design.',
    interests: { R: 0.5, A: 0.2, E: 0.2, S: 0.1 }, abilities: { SPA: 0.4, PLN: 0.3, NUM: 0.3 },
    requires: ['science_biology', 'science_computer', 'humanities', 'olevel'], verified: false, sources: [] },
];

export const INTEREST_PHRASES: Record<Riasec, string> = {
  R: 'You often chose to build, fix and make things work.',
  I: 'You often chose to investigate and find out why things happen.',
  A: 'You often chose to create, design and tell stories.',
  S: 'You often chose to help, teach and look after people.',
  E: 'You often chose to lead teams and persuade people.',
  C: 'You often chose to organise, record and keep things in order.',
};

export const ABILITY_PHRASES: Record<AbilityFamily, string> = {
  SPA: 'seeing how shapes turn and fit',
  ABS: 'spotting patterns',
  NUM: 'working with numbers',
  LOG: 'solving clue puzzles',
  PLN: 'planning smart routes',
  VRB: 'understanding words and notices',
};

export const ABILITY_NAMES: Record<AbilityFamily, string> = {
  SPA: 'Shapes & space', ABS: 'Patterns', NUM: 'Numbers', LOG: 'Clues & logic', PLN: 'Planning', VRB: 'Words',
};

export const INTEREST_NAMES: Record<Riasec, string> = {
  R: 'Builder', I: 'Investigator', A: 'Creator', S: 'Helper', E: 'Leader', C: 'Organiser',
};
