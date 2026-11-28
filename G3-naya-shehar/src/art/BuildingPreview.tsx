import Svg, { Ellipse, G, Path } from 'react-native-svg';
import { Building } from './Building';
import { Tree } from './Scenery';
import { buildingById, BuildingId } from '@/game/world/buildings';
import { diamond } from './iso';

/** A single building on its own little plot of land, for cards and construction scenes. */
export function BuildingPreview({ id, stage, size = 160, night }: { id: BuildingId; stage: 0 | 1 | 2 | 3 | 4; size?: number; night?: boolean }) {
  const def = buildingById(id);
  return (
    <Svg width={size} height={size * 0.8} viewBox="0 0 160 128">
      <Ellipse cx={80} cy={104} rx={74} ry={20} fill="#000" opacity={0.08} />
      <Path d={diamond(80, 96, 70, 35)} fill="#A6D57E" />
      <Path d={diamond(80, 96, 52, 26)} fill="#C2E39C" />
      <Path d={`M10 96 L80 131 L150 96 L150 102 L80 137 L10 102 Z`} fill="#8CB868" />
      <G transform="translate(80 96) scale(1.75) translate(-80 -96)">
        <Building def={def} stage={stage} cx={80} cy={96} night={night} />
      </G>
      {stage === 4 ? <G><Tree x={28} y={98} kind={2} /><Tree x={134} y={100} kind={0} /></G> : null}
    </Svg>
  );
}
