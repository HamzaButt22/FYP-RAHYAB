/**
 * Level 7 activity panels (desktop: full-screen panel with a scene on the left and numbered actions on the right,
 * driven by number keys). Mobile: the same scene + the same numbered actions as large buttons; landscape shows them
 * side by side, portrait stacks them.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, G, Path, Polygon, Rect, Text as SvgText } from 'react-native-svg';
import {
  ActivityPanel,
  BACKGROUNDS,
  BRIEFS,
  DealPanel,
  EXTRAS,
  LabPanel,
  LearnerPanel,
  MOTIFS,
  PART_NAMES,
  PumpPanel,
  RecordsPanel,
  SHELVES,
  SLOT_NAMES,
  StudioPanel,
  TASK_NAME,
  TOPICS,
  WorkshopLevel,
} from '../../levels/level7-workshop';
import { Bar } from '../primitives';
import { ABS_FILL, colors, HIT, radius, space } from '../theme';
import { Send } from './Dialogs';

export function ActivityPanelView({ panel, level, send }: { panel: ActivityPanel; level: WorkshopLevel; send: Send }) {
  const { width, height } = useWindowDimensions();
  const side = width > height && width > 640;
  const menu = panel.menu();
  return (
    <View style={styles.shade} accessibilityViewIsModal>
      <View style={[styles.box, { maxHeight: height - 16, width: Math.min(width - 16, 1100) }]}>
        <View style={styles.head}>
          <Text style={styles.title} numberOfLines={2} accessibilityRole="header">{`${TASK_NAME[panel.taskId]} - ${panel.title}  (round ${panel.roundNo + 1})`}</Text>
          <Text style={styles.blocks}>{`Time blocks left: ${level.blocks}`}</Text>
        </View>
        <ScrollView contentContainerStyle={[side && { flexDirection: 'row' }]}>
          {panel.stage !== 'confirm_leave' ? (
            <View style={[styles.scene, side ? { flex: 1.1, marginRight: space(3) } : { marginBottom: space(3) }]}>
              <Scene panel={panel} />
            </View>
          ) : null}
          <View style={[side && { flex: 1 }]}>
            {menu.heading ? <Text style={[styles.heading, panel.stage === 'confirm_leave' && { color: colors.warn }]}>{menu.heading}</Text> : null}
            {menu.prompt ? <Text style={styles.prompt}>{menu.prompt}</Text> : null}
            {menu.entries.map((e) => (
              <Pressable
                key={e.num}
                disabled={!e.enabled}
                onPress={() => send({ number: e.num })}
                accessibilityRole="button"
                accessibilityState={{ disabled: !e.enabled }}
                accessibilityLabel={e.text}
                style={({ pressed }) => [styles.entry, !e.enabled && styles.entryOff, pressed && { opacity: 0.75 }]}
              >
                <Text style={[styles.num, !e.enabled && { color: colors.disabledText }]}>{e.num}</Text>
                <Text style={[styles.entryText, !e.enabled && { color: colors.disabledText }]}>{e.text}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        {panel.flash ? (
          <Text style={styles.flash} accessibilityLiveRegion="polite">
            {panel.flash}
          </Text>
        ) : null}
        <Text style={styles.hint}>Tap an action. Nothing here is timed.</Text>
      </View>
    </View>
  );
}

function Scene({ panel }: { panel: ActivityPanel }) {
  if (panel instanceof PumpPanel) return <PumpScene p={panel} />;
  if (panel instanceof LabPanel) return <LabScene p={panel} />;
  if (panel instanceof StudioPanel) return <StudioScene p={panel} />;
  if (panel instanceof LearnerPanel) return <LearnerScene p={panel} />;
  if (panel instanceof DealPanel) return <DealScene p={panel} />;
  if (panel instanceof RecordsPanel) return <RecordsScene p={panel} />;
  return null;
}

function PumpScene({ p }: { p: PumpPanel }) {
  return (
    <View>
      <Svg width="100%" height={150} viewBox="0 0 560 220">
        <SvgText x={280} y={30} fontSize={22} fill={colors.textDim} textAnchor="middle" fontWeight="bold">
          PUMP
        </SvgText>
        <Rect x={60} y={190 - 40} width={440} height={30} rx={8} fill="rgb(90,110,150)" />
        <Rect x={240} y={50} width={80} height={110} rx={10} fill="rgb(150,120,80)" />
        <Rect x={270} y={10} width={20} height={50} rx={6} fill="rgb(180,180,190)" />
      </Svg>
      <View style={styles.slots}>
        {SLOT_NAMES.map((s, i) => {
          const ch = p.choice[i];
          let bg = 'rgb(60,70,100)';
          if (p.lastTest && ch !== null) bg = p.lastTest[i] ? 'rgb(40,120,90)' : 'rgb(140,60,60)';
          const active = p.mode === 'parts' && p.slot === i;
          return (
            <View key={s} style={[styles.slot, { backgroundColor: bg, borderColor: active ? colors.accent : 'transparent' }]}>
              <Text style={styles.slotName}>{s}</Text>
              <Text style={styles.slotPart}>{ch !== null ? PART_NAMES[i][ch] : '-'}</Text>
            </View>
          );
        })}
      </View>
      <Text style={styles.sceneMuted}>{`Test runs: ${p.tests}`}</Text>
    </View>
  );
}

function LabScene({ p }: { p: LabPanel }) {
  const hdr = ['', 'light / heat', 'water / input', 'material', 'result'];
  return (
    <View>
      <Text style={styles.sceneTitle}>{p.sc.title}</Text>
      <View style={styles.tableRow}>
        {hdr.map((h, j) => (
          <Text key={j} style={[styles.cell, styles.sceneMuted]}>
            {h}
          </Text>
        ))}
      </View>
      {p.sc.rows.map((row, i) => (
        <View key={i} style={styles.tableRow}>
          {row.map((v, j) => (
            <Text key={j} style={[styles.cell, { color: j < 4 ? colors.text : colors.gold }]}>
              {v}
            </Text>
          ))}
        </View>
      ))}
      <Text style={[styles.sceneMuted, { marginTop: space(2) }]}>Experiments run so far:</Text>
      {p.run.map((idx) => (
        <Text key={idx} style={styles.sceneText}>{`- ${p.sc.experiments[idx][0]}: ${p.sc.experiments[idx][1]}`}</Text>
      ))}
    </View>
  );
}

function StudioScene({ p }: { p: StudioPanel }) {
  const col = BACKGROUNDS[p.bg][1];
  const dark = `rgb(${col.map((v) => Math.max(0, v - 70)).join(',')})`;
  const light = `rgb(${col.map((v) => Math.min(255, v + 60)).join(',')})`;
  const m = MOTIFS[p.motif];
  const cx = 210;
  const cy = 210;
  const shapes: React.ReactElement[] = [];
  for (let i = 0; i < 3; i++) {
    const ox = (i - 1) * 110;
    if (m === 'circles') shapes.push(<Circle key={i} cx={cx + ox} cy={cy + 30} r={44} fill={dark} />);
    else if (m === 'triangles') shapes.push(<Polygon key={i} points={`${cx + ox},${cy - 20} ${cx + ox - 44},${cy + 70} ${cx + ox + 44},${cy + 70}`} fill={dark} />);
    else if (m === 'waves')
      for (let k = 0; k < 4; k++) shapes.push(<Path key={`${i}-${k}`} d={`M ${cx + ox - 50} ${cy + 35 + k * 18} q 50 -30 100 0`} stroke={dark} strokeWidth={4} fill="none" />);
    else {
      const pts = Array.from({ length: 10 }, (_, j) => {
        const rr = j % 2 === 0 ? 30 : 14;
        return `${cx + ox + rr * Math.cos(j * 0.628 - 1.57)},${cy + 30 + rr * Math.sin(j * 0.628 - 1.57)}`;
      }).join(' ');
      shapes.push(<Polygon key={i} points={pts} fill={dark} />);
    }
  }
  const title = BRIEFS[p.roundNo % 3].toUpperCase();
  const size = ({ 0: 54, 1: 44, 2: 50 } as Record<number, number>)[p.titleStyle] * 0.72;
  return (
    <View>
      <Svg width="100%" height={240} viewBox="0 0 420 420" accessibilityLabel={`Poster preview: ${BACKGROUNDS[p.bg][0]} background, ${m}`}>
        <Rect x={0} y={0} width={420} height={420} rx={8} fill={`rgb(${col.join(',')})`} />
        <G>{shapes}</G>
        {p.extras.has(0) ? <Rect x={4} y={4} width={412} height={412} rx={8} fill="none" stroke={light} strokeWidth={8} /> : null}
        {p.extras.has(1) ? Array.from({ length: 14 }, (_, k) => <Circle key={k} cx={30 + ((k * 53) % 360)} cy={40 + ((k * 91) % 330)} r={4} fill={light} />) : null}
        {p.extras.has(2) ? Array.from({ length: 11 }, (_, k) => <Path key={k} d={`M ${k * 40} 0 L ${k * 40 + 60} 420`} stroke={light} strokeWidth={3} />) : null}
        {p.extras.has(3) ? (
          <SvgText x={213} y={72} fontSize={size} fill="black" textAnchor="middle" fontWeight={p.titleStyle !== 1 ? 'bold' : 'normal'}>
            {title}
          </SvgText>
        ) : null}
        <SvgText x={210} y={70} fontSize={size} fill="rgb(250,250,250)" textAnchor="middle" fontWeight={p.titleStyle !== 1 ? 'bold' : 'normal'}>
          {title}
        </SvgText>
      </Svg>
      <Text style={styles.sceneMuted}>{`Changes: ${p.changes}   Variations tried: ${p.variations.size}   Extras: ${[...p.extras].sort().map((i) => EXTRAS[i]).join(', ') || 'none'}`}</Text>
    </View>
  );
}

function LearnerScene({ p }: { p: LearnerPanel }) {
  const sad = p.conf < 40;
  return (
    <View>
      <Text style={styles.sceneTitle}>{`Teaching: ${TOPICS[p.roundNo % 3]}`}</Text>
      <Svg width="100%" height={110} viewBox="0 0 200 110" accessibilityLabel={sad ? 'Noor looks unsure' : 'Noor looks happy'}>
        <Circle cx={100} cy={55} r={44} fill="rgb(230,190,150)" />
        <Circle cx={86} cy={47} r={5} fill="rgb(40,40,60)" />
        <Circle cx={114} cy={47} r={5} fill="rgb(40,40,60)" />
        <Path d={sad ? 'M 86 78 Q 100 66 114 78' : 'M 86 70 Q 100 84 114 70'} stroke="rgb(40,40,60)" strokeWidth={3} fill="none" />
      </Svg>
      <Text style={styles.sceneMuted}>{`Understanding  (turn ${p.turns}/8)`}</Text>
      <Bar frac={p.und / 100} color={colors.accent} height={14} />
      <Text style={[styles.sceneMuted, { marginTop: space(2) }]}>Confidence</Text>
      <Bar frac={p.conf / 100} color={colors.accent2} height={14} />
      {p.logLines.slice(-4).map((ln, i) => (
        <Text key={i} style={styles.sceneText}>
          {ln}
        </Text>
      ))}
    </View>
  );
}

function DealScene({ p }: { p: DealPanel }) {
  const lines = [
    `Vendor asking price: ${p.ask}`,
    `Agreed price: ${p.price !== null ? p.price : '-'}`,
    `Sponsor funding: ${p.sponsorDone ? p.funding : '-'}`,
    `Team style: ${p.teamStyle ?? '-'}`,
  ];
  return (
    <View>
      <Text style={styles.sceneTitle}>Open-day food stall - budget 100</Text>
      {lines.map((ln) => (
        <Text key={ln} style={[styles.sceneText, { fontSize: 16, marginVertical: 3 }]}>
          {ln}
        </Text>
      ))}
      {p.mode === 'sponsor' ? (
        <Text style={styles.sceneMuted}>The sponsor is deciding who to fund. Choose up to two arguments (tap again to remove).</Text>
      ) : null}
      {p.mode === 'vendor' ? <Text style={styles.sceneMuted}>The vendor listens. Counter-offers are allowed, but lowballing may fail.</Text> : null}
    </View>
  );
}

function RecordsScene({ p }: { p: RecordsPanel }) {
  return (
    <View>
      <Text style={styles.sceneTitle}>Delivery records</Text>
      {p.rs.items.map(([code], i) => {
        const bad = p.checks > 0 && p.lastWrong.includes(i);
        return (
          <View key={code} style={[styles.record, { backgroundColor: bad ? 'rgb(110,50,60)' : 'rgb(44,52,78)' }]}>
            <Text style={styles.sceneText}>{`Code ${code}`}</Text>
            <Text style={[styles.slotPart, { fontSize: 17 }]}>{`Shelf ${p.assign[i] !== null ? SHELVES[p.assign[i] as number] : '?'}`}</Text>
          </View>
        );
      })}
      <Text style={styles.sceneMuted}>{`Checks submitted: ${p.checks}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shade: { ...ABS_FILL, backgroundColor: 'rgba(8,10,20,0.75)', alignItems: 'center', justifyContent: 'center', padding: 8 },
  box: { backgroundColor: colors.panel, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.accent2, padding: space(3) },
  head: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: space(2) },
  title: { color: colors.text, fontSize: 19, fontWeight: '800', flexShrink: 1, marginRight: space(2) },
  blocks: { color: colors.gold, fontWeight: '800', fontSize: 15 },
  scene: { backgroundColor: 'rgb(24,28,44)', borderRadius: radius.md, padding: space(3) },
  heading: { color: colors.accent2, fontWeight: '800', fontSize: 16, marginBottom: space(1) },
  prompt: { color: colors.text, fontSize: 15, marginBottom: space(2) },
  entry: {
    minHeight: HIT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panelLight,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.accent,
    paddingHorizontal: space(3),
    paddingVertical: space(2),
    marginVertical: 3,
  },
  entryOff: { backgroundColor: colors.disabledBg, borderColor: 'transparent' },
  num: { color: colors.accent, fontWeight: '800', fontSize: 16, width: 22 },
  entryText: { color: colors.text, fontSize: 14, flexShrink: 1 },
  flash: { color: colors.warn, fontSize: 14, marginTop: space(2) },
  hint: { color: colors.textDim, fontSize: 12, textAlign: 'center', marginTop: space(1) },
  slots: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  slot: { width: '48%', borderRadius: 10, borderWidth: 2, padding: space(2), marginVertical: 3, alignItems: 'center' },
  slotName: { color: colors.text, fontSize: 13 },
  slotPart: { color: colors.gold, fontSize: 16, fontWeight: '800' },
  sceneTitle: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: space(2) },
  sceneText: { color: colors.text, fontSize: 14, marginVertical: 2 },
  sceneMuted: { color: colors.textDim, fontSize: 13, marginTop: space(1) },
  tableRow: { flexDirection: 'row' },
  cell: { flex: 1, fontSize: 12, color: colors.text, paddingVertical: 3 },
  record: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 10, padding: space(2.5), marginVertical: 3 },
});
