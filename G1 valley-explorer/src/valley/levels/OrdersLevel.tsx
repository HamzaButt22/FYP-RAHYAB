/** Level 3 — Workshop Orders (planning & numerical reasoning). */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { workshopOrders } from '../core/levels/abilityLevel';
import { MATERIALS, optimum, ORDERS_ITEMS, totalReward, usage } from '../core/items/workshopOrders';
import { AbilityFrame } from '../ui/AbilityFrame';
import { Banner, Card, Tap } from '../ui/components';
import { CheckIcon, CoinIcon, MaterialIcon } from '../ui/icons';
import { colors, radius, space, TOUCH, type } from '../ui/theme';
import { useLevel } from '../ui/useLevel';
import type { LevelProps } from './types';

const NAMES = { wood: 'Wood', metal: 'Metal', cloth: 'Cloth' } as const;

export function OrdersLevel({ session, onComplete, onBack, coins }: LevelProps) {
  const { state, dispatch } = useLevel(session, workshopOrders, onComplete);
  if (!state) return null;
  const item = ORDERS_ITEMS[state.index];
  const chosen = (state.draft as string[]) ?? [];
  const used = usage(item, chosen);
  const mats = MATERIALS.filter((m) => item.stock[m] !== undefined);
  const over = mats.some((m) => used[m] > (item.stock[m] ?? 0));
  const best = optimum(item);
  const bestNames = best.sets[0].map((id) => item.orders.find((o) => o.id === id)!.label).join(' + ');
  const toggle = (id: string) => dispatch({ type: 'DRAFT', draft: chosen.includes(id) ? chosen.filter((x) => x !== id) : [...chosen, id] });

  return (
    <AbilityFrame coins={coins} scene="#EAD9BD" submitLabel="Build these orders" title="Workshop Orders" state={state} scoredCount={ORDERS_ITEMS.length - 1} practice={item.practice} hint={item.hint}
      intro="Customers want things made. Pick the orders you will make. You cannot use more material than is on the shelf. Try to earn the most coins."
      canSubmit={chosen.length > 0 && !over} onSubmit={() => dispatch({ type: 'SUBMIT', response: chosen })} onHint={() => dispatch({ type: 'HINT' })}
      onSkip={() => dispatch({ type: 'SKIP' })} onNext={() => dispatch({ type: 'NEXT' })} onRetry={() => dispatch({ type: 'RETRY' })} onBack={onBack}
      explanation={`The most you can earn is ${best.value} coins, with ${bestNames}.`}>
      <Card>
        <Text style={[type.label, { marginBottom: space.sm }]}>ON THE SHELF</Text>
        {mats.map((m) => {
          const cap = item.stock[m] ?? 0;
          const u = used[m];
          return (
            <View key={m} style={st.matRow} accessibilityLabel={`${NAMES[m]}: using ${u} of ${cap}`}>
              <MaterialIcon material={m} size={22} />
              <Text style={[type.body, { width: 56 }]}>{NAMES[m]}</Text>
              <View style={st.matTrack}>
                {Array.from({ length: cap }, (_, i) => <View key={i} style={[st.matCell, i < u && { backgroundColor: colors.primary }]} />)}
              </View>
              <Text style={[type.subtitle, { width: 54, textAlign: 'right' }, u > cap && { color: colors.caution }]}>{u}/{cap}</Text>
            </View>
          );
        })}
      </Card>
      {item.orders.map((o) => {
        const sel = chosen.includes(o.id);
        return (
          <Tap key={o.id} testID={`order-${o.id}`} onPress={() => toggle(o.id)} accessibilityState={{ checked: sel }}
            accessibilityLabel={`${o.label}, ${o.reward} coins, needs ${mats.filter((m) => o.cost[m]).map((m) => `${o.cost[m]} ${NAMES[m]}`).join(', ')}${sel ? ', chosen' : ''}`}
            style={[st.order, sel && st.orderSel]}>
            <View style={[st.box, sel && st.boxSel]}>{sel ? <CheckIcon size={18} color="#FFF" /> : null}</View>
            <View style={{ flex: 1 }}>
              <Text style={type.subtitle}>{o.label}</Text>
              <View style={st.costs}>
                {mats.filter((m) => o.cost[m]).map((m) => (
                  <View key={m} style={st.cost}><MaterialIcon material={m} size={16} /><Text style={type.small}>{o.cost[m]}</Text></View>
                ))}
              </View>
            </View>
            <View style={st.reward}><CoinIcon /><Text style={type.subtitle}>{o.reward}</Text></View>
          </Tap>
        );
      })}
      <View style={st.total}>
        <Text style={type.subtitle}>Coins: {over ? '—' : totalReward(item, chosen)}</Text>
        {over ? <Banner text="Too much material — remove an order." /> : null}
      </View>
    </AbilityFrame>
  );
}

const st = StyleSheet.create({
  matRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, marginVertical: 3 },
  matTrack: { flex: 1, flexDirection: 'row', gap: 3 },
  matCell: { flex: 1, height: 14, borderRadius: 3, backgroundColor: colors.border },
  order: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 2, borderColor: colors.border, padding: space.md, minHeight: TOUCH + 16 },
  orderSel: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  box: { width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: colors.locked, alignItems: 'center', justifyContent: 'center' },
  boxSel: { backgroundColor: colors.primary, borderColor: colors.primary },
  costs: { flexDirection: 'row', gap: space.md, marginTop: 4 },
  cost: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reward: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  total: { gap: space.sm, alignItems: 'flex-start' },
});
