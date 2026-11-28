import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Screen, Panel } from '@/ui/Layout';
import { GText } from '@/ui/Text';
import { GameButton } from '@/ui/Button';
import { ScreenHeader } from '@/ui/Game';
import { Segmented } from '@/ui/Controls';
import { useGame } from '@/state/GameProvider';
import { ClassLevel, MatricGroup } from '@/assessment/recommendations/rules';

/** Two taps of study information, needed so suggestions respect which streams are open. No free text. */
export default function AboutYou() {
  const { s, act } = useGame();
  const router = useRouter();
  const [cls, setCls] = useState<ClassLevel>(s.student?.classLevel ?? 9);
  const [grp, setGrp] = useState<MatricGroup>(s.student?.matricGroup ?? 'not_yet');
  return (
    <Screen footer={<GameButton label="Show my paths" icon="trophy" size="lg" onPress={() => { act((e) => e.setStudent({ classLevel: cls, matricGroup: grp })); router.replace('/results'); }} testID="about-save" />}>
      <ScreenHeader title="About your studies" speak="About your studies. Pick your class and your Matric group, so we only suggest paths that are open to you." />
      <Panel>
        <GText>So we only suggest paths that are open to you, tell us two things. This stays on your phone.</GText>
      </Panel>
      <Panel>
        <Segmented label="Which class are you in?" value={cls} onChange={setCls} options={[8, 9, 10, 11, 12].map((v) => ({ value: v as ClassLevel, label: String(v) }))} />
      </Panel>
      <Panel>
        <GText variant="bodyBold">Your Matric group (or O-Levels)</GText>
        <Segmented label="Science" value={grp} onChange={setGrp} options={[{ value: 'science_biology', label: 'With Biology' }, { value: 'science_computer', label: 'With Computer' }]} />
        <Segmented label="Other" value={grp} onChange={setGrp} options={[{ value: 'humanities', label: 'Arts' }, { value: 'olevel', label: 'O-Levels' }, { value: 'not_yet', label: 'Not chosen' }]} />
      </Panel>
    </Screen>
  );
}
