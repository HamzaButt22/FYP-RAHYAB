/**
 * Touch versions of the desktop modal dialogs. They never mutate engine state directly: every tap becomes an engine
 * input (selectIndex / confirm / number) that is journaled and applied on the next fixed step.
 */
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ChoiceDialog, CountPanel, MessageBox } from '../../game-engine/dialogs';
import { costText, ORDERS, PlannerPanel, QUOTA, RES, START_STOCK } from '../../levels/level2-planning';
import { Press } from '../../utils/inputController';
import { Btn } from '../primitives';
import { ABS_FILL, colors, HIT, radius, space } from '../theme';

export type Send = (p: Press) => void;

export function ModalFrame({ children, accent = colors.accent, wide = false }: { children: React.ReactNode; accent?: string; wide?: boolean }) {
  const { width, height } = useWindowDimensions();
  const maxW = Math.min(width - 24, wide ? 900 : 680);
  return (
    <View style={styles.shade} accessibilityViewIsModal>
      <View style={[styles.frame, { borderColor: accent, width: maxW, maxHeight: height - 24 }]}>{children}</View>
    </View>
  );
}

function Header({ speaker, title }: { speaker?: string | null; title: string }) {
  return (
    <View style={{ marginBottom: space(2) }}>
      {speaker ? <Text style={styles.speaker}>{speaker}</Text> : null}
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}

// ------------------------------------------------------------------------------------------- choice
export function ChoiceDialogView({ dlg, send }: { dlg: ChoiceDialog; send: Send }) {
  const { width, height } = useWindowDimensions();
  const twoCols = width > 760 && dlg.options.length > 4;
  const short = height < 430;
  return (
    <ModalFrame>
      <ScrollView style={{ flexGrow: 0 }} contentContainerStyle={{ paddingBottom: space(1) }}>
        <Header speaker={dlg.speaker} title={dlg.title} />
        <Text style={[styles.body, short && { fontSize: 14 }]}>{dlg.body}</Text>
        <View style={[styles.options, twoCols && { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
          {dlg.options.map((o, i) => {
            const sel = i === dlg.index;
            return (
              <Pressable
                key={o.key}
                onPress={() => send(sel ? { confirm: true } : { selectIndex: i })}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel, checked: sel }}
                accessibilityLabel={o.label}
                accessibilityHint={sel ? 'Tap again or press Choose to confirm' : 'Tap to select'}
                style={({ pressed }) => [
                  styles.option,
                  twoCols && { width: '49%' },
                  sel && styles.optionSel,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={[styles.optNum, sel && { color: colors.accent }]}>{i + 1}</Text>
                <Text style={styles.optText}>{o.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {dlg.footer ? <Text style={styles.footer}>{dlg.footer}</Text> : null}
      </ScrollView>
      <Btn
        label={dlg.index >= 0 ? 'Choose' : 'Select an option'}
        variant="primary"
        disabled={dlg.index < 0}
        onPress={() => send({ confirm: true })}
        style={{ marginTop: space(2) }}
        testID="choice-confirm"
      />
    </ModalFrame>
  );
}

// ------------------------------------------------------------------------------------------ message
export function MessageBoxView({ box, send }: { box: MessageBox; send: Send }) {
  return (
    <ModalFrame accent={colors.accent2}>
      <ScrollView style={{ flexGrow: 0 }}>
        <Header speaker={box.speaker} title={box.title} />
        {box.body ? <Text style={styles.body}>{box.body}</Text> : null}
        {box.lines.map((ln, i) => (
          <Text key={i} style={[styles.line, ln === '' && { height: space(2) }]}>
            {ln}
          </Text>
        ))}
      </ScrollView>
      <Btn label="Continue" variant="primary" disabled={!box.ready} onPress={() => send({ confirm: true })} style={{ marginTop: space(3) }} testID="message-continue" />
    </ModalFrame>
  );
}

// ------------------------------------------------------------------------------------------ pack (level 5)
export function CountPanelView({ panel, send }: { panel: CountPanel; send: Send }) {
  const used = panel.used();
  return (
    <ModalFrame>
      <ScrollView style={{ flexGrow: 0 }}>
        <Header title={panel.title} />
        <Text style={styles.muted}>{panel.hint} Tap an item to add one; tapping it at its maximum empties it.</Text>
        {panel.items.map((it, i) => {
          const n = panel.counts[it.key];
          return (
            <Pressable
              key={it.key}
              onPress={() => send({ number: i + 1 })}
              accessibilityRole="button"
              accessibilityLabel={`${it.label}, ${n} packed, weight ${it.weight} each`}
              style={({ pressed }) => [styles.option, n ? styles.optionOn : null, pressed && { opacity: 0.8 }]}
            >
              <Text style={styles.optNum}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.optText}>{it.label}</Text>
                {it.note ? <Text style={styles.muted}>{it.note}</Text> : null}
              </View>
              <Text style={styles.gold}>{`x${n}  (w ${it.weight})`}</Text>
            </Pressable>
          );
        })}
        <Text style={[styles.h3, { color: used >= panel.capacity ? colors.danger : colors.text }]}>{`Pack: ${used} / ${panel.capacity} ${panel.capacityLabel}`}</Text>
        {panel.flash ? <Text style={styles.footer}>{panel.flash}</Text> : null}
      </ScrollView>
      <Btn label="Done packing" variant="primary" disabled={!panel.ready} onPress={() => send({ confirm: true })} style={{ marginTop: space(2) }} />
    </ModalFrame>
  );
}

// ------------------------------------------------------------------------------------------ planner (level 2)
export function PlannerPanelView({ panel, send }: { panel: PlannerPanel; send: Send }) {
  const { cost, reward, feasible } = panel.totals();
  return (
    <ModalFrame>
      <ScrollView style={{ flexGrow: 0 }}>
        <Header title="Planning Table" />
        <Text style={styles.muted}>Tap orders to add or remove them from your plan. Nothing is built here.</Text>
        {ORDERS.map((o, i) => {
          const sel = panel.selected.has(o.id);
          return (
            <Pressable
              key={o.id}
              onPress={() => send({ number: i + 1 })}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: sel }}
              accessibilityLabel={`${o.name}, costs ${costText(o.cost)}, pays ${o.reward} coins`}
              style={({ pressed }) => [styles.option, sel && styles.optionOn, pressed && { opacity: 0.8 }]}
            >
              <Text style={[styles.optNum, sel && { color: colors.accent }]}>{i + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.optText}>{o.name}</Text>
                <Text style={styles.muted}>{costText(o.cost)}</Text>
              </View>
              <Text style={styles.gold}>{`${o.reward} coins`}</Text>
            </Pressable>
          );
        })}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: space(2) }}>
          {RES.map((k) => (
            <Text key={k} style={[styles.body, { marginRight: space(4), color: cost[k] > START_STOCK[k] ? colors.danger : colors.text }]}>{`${k}: ${cost[k]} / ${START_STOCK[k]}`}</Text>
          ))}
        </View>
        <Text style={[styles.h3, { color: feasible ? colors.gold : colors.danger }]}>{`Plan reward: ${reward}   (quota ${QUOTA})`}</Text>
        <Text style={{ color: feasible ? colors.accent2 : colors.danger, fontSize: 14 }}>
          {feasible ? 'Plan fits the stock' : 'Plan needs more material than you have!'}
        </Text>
      </ScrollView>
      <Btn label="Done planning" variant="primary" disabled={!panel.ready} onPress={() => send({ confirm: true })} style={{ marginTop: space(2) }} />
    </ModalFrame>
  );
}

export const styles = StyleSheet.create({
  shade: { ...ABS_FILL, backgroundColor: colors.shade, alignItems: 'center', justifyContent: 'center', padding: 12 },
  frame: { backgroundColor: colors.panel, borderRadius: radius.lg, borderWidth: 2, padding: space(4) },
  speaker: { color: colors.accent2, fontWeight: '700', fontSize: 14, marginBottom: 2 },
  title: { color: colors.text, fontSize: 22, fontWeight: '800' },
  body: { color: colors.text, fontSize: 15, lineHeight: 21, marginBottom: space(2) },
  line: { color: colors.text, fontSize: 14, lineHeight: 20, marginVertical: 1 },
  muted: { color: colors.textDim, fontSize: 13, lineHeight: 18, marginBottom: space(1) },
  h3: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: space(2) },
  gold: { color: colors.gold, fontWeight: '700', fontSize: 14, marginLeft: space(2) },
  options: { marginTop: space(1) },
  option: {
    minHeight: HIT,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.panelDim,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    paddingVertical: space(2),
    paddingHorizontal: space(3),
    marginVertical: space(1),
  },
  optionSel: { backgroundColor: colors.panelLight, borderColor: colors.accent },
  optionOn: { backgroundColor: colors.panelLight, borderColor: colors.accent2 },
  optNum: { color: colors.textDim, fontWeight: '800', fontSize: 16, width: 26 },
  optText: { color: colors.text, fontSize: 15, flexShrink: 1 },
  footer: { color: colors.warn, fontSize: 14, marginTop: space(2) },
});
