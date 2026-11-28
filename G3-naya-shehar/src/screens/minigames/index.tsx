import { Riasec } from '@/assessment/types';
import { MiniGameProps } from './Shell';
import FixPipes from './FixPipes';
import FindClues from './FindClues';
import PaintMural from './PaintMural';
import RallyTeam from './RallyTeam';
import { HelpNeighbours, SortRecords } from './MatchGame';

/** One activity mini-game per kind of work. All are unscored and similar in length. */
export function MiniGame({ category, ...p }: MiniGameProps & { category: Riasec }) {
  switch (category) {
    case 'R': return <FixPipes {...p} />;
    case 'I': return <FindClues {...p} />;
    case 'A': return <PaintMural {...p} />;
    case 'S': return <HelpNeighbours {...p} />;
    case 'E': return <RallyTeam {...p} />;
    case 'C': return <SortRecords {...p} />;
  }
}
