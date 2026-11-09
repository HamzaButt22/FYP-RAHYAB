/** Menu, instructions, level select, consent, name entry and resume prompts (desktop: draw_menu, draw_name, ...). */
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { INSTRUCTION_PAGES, PROTOTYPE_NOTICE, TRACKS, TrackKey } from '../assessment/content';
import { LEVEL_TITLES, LEVEL_TRACK } from '../levels';
import { Backdrop, Body, Btn, Bullet, Card, H1, H2, Muted } from '../components/primitives';
import { colors, space } from '../components/theme';
import { ControlMode } from './GameScreen';

function Page({ children, tint }: { children: React.ReactNode; tint?: string }) {
  return (
    <View style={styles.fill}>
      <Backdrop tint={tint} />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

export function MenuScreen({
  onTrack,
  onLevelSelect,
  onInstructions,
  onExit,
  controlMode,
  onControlMode,
  exitLabel,
}: {
  onTrack: (t: TrackKey) => void;
  onLevelSelect: () => void;
  onInstructions: () => void;
  onExit: () => void;
  controlMode: ControlMode;
  onControlMode: (m: ControlMode) => void;
  exitLabel: string;
}) {
  return (
    <Page>
      <Text style={styles.logo} accessibilityRole="header">
        RahYaab
      </Text>
      <Text style={styles.subtitle}>Behavioral Personality Assessment Game</Text>
      <Muted style={{ textAlign: 'center', marginBottom: space(5) }}>Play short scenarios. Your choices - not a questionnaire - are the evidence.</Muted>
      {TRACKS.map((t, i) => (
        <Btn key={t.key} label={t.label} variant={i === 0 ? 'primary' : 'secondary'} onPress={() => onTrack(t.key)} accessibilityHint={t.detail} style={styles.menuBtn} testID={`track-${t.key}`} />
      ))}
      <Btn label="Level Select" onPress={onLevelSelect} style={styles.menuBtn} />
      <Btn label="Instructions" onPress={onInstructions} style={styles.menuBtn} />
      <View style={styles.setting}>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingTitle}>Arrow buttons instead of joystick</Text>
          <Muted>Easier with screen readers, switch access or for small hands.</Muted>
        </View>
        <Switch
          value={controlMode === 'dpad'}
          onValueChange={(v) => onControlMode(v ? 'dpad' : 'joystick')}
          accessibilityLabel="Use arrow buttons instead of joystick"
          trackColor={{ true: colors.accent2, false: colors.panelLight }}
        />
      </View>
      <Btn label={exitLabel} variant="ghost" onPress={onExit} style={styles.menuBtn} />
      <Muted style={{ textAlign: 'center', marginTop: space(4) }}>{PROTOTYPE_NOTICE}</Muted>
    </Page>
  );
}

export function InstructionsScreen({ onBack }: { onBack: () => void }) {
  const [page, setPage] = useState(0);
  const p = INSTRUCTION_PAGES[page];
  return (
    <Page>
      <H1 style={{ textAlign: 'center', marginBottom: space(4) }}>Instructions</H1>
      <Card accent={colors.accent}>
        <H2 style={{ color: colors.accent, marginBottom: space(3) }}>{p.title}</H2>
        {p.lines.map((ln) => (
          <Bullet key={ln}>{ln}</Bullet>
        ))}
      </Card>
      <Muted style={{ textAlign: 'center', marginTop: space(3) }}>{`Page ${page + 1} / ${INSTRUCTION_PAGES.length}`}</Muted>
      <View style={styles.row}>
        <Btn label="Previous" disabled={page === 0} onPress={() => setPage(page - 1)} style={{ flex: 1, marginRight: space(2) }} />
        {page < INSTRUCTION_PAGES.length - 1 ? (
          <Btn label="Next" variant="primary" onPress={() => setPage(page + 1)} style={{ flex: 1 }} />
        ) : (
          <Btn label="Back to menu" variant="primary" onPress={onBack} style={{ flex: 1 }} />
        )}
      </View>
      {page < INSTRUCTION_PAGES.length - 1 ? <Btn label="Back to menu" variant="ghost" onPress={onBack} style={{ marginTop: space(3) }} /> : null}
    </Page>
  );
}

export function LevelSelectScreen({ onPick, onBack }: { onPick: (lid: number) => void; onBack: () => void }) {
  return (
    <Page>
      <H1 style={{ textAlign: 'center' }}>Level Select</H1>
      <Muted style={{ textAlign: 'center', marginBottom: space(4) }}>Play one level on its own. Results then cover only that level.</Muted>
      {[1, 2, 3, 4, 5, 6, 7, 8].map((lid) => (
        <Btn
          key={lid}
          label={`${lid}.  ${LEVEL_TITLES[lid]}`}
          onPress={() => onPick(lid)}
          accessibilityHint={`${LEVEL_TRACK[lid]} level`}
          style={styles.menuBtn}
          left={<Text style={[styles.trackTag, { color: lid <= 6 ? colors.accent2 : colors.warn }]}>{LEVEL_TRACK[lid]}</Text>}
        />
      ))}
      <Btn label="Back" variant="ghost" onPress={onBack} style={styles.menuBtn} />
    </Page>
  );
}

export function ConsentScreen({ text, onAgree, onBack }: { text: string; onAgree: () => void; onBack: () => void }) {
  const [ok, setOk] = useState(false);
  return (
    <Page>
      <H1 style={{ textAlign: 'center', marginBottom: space(4) }}>Before you start</H1>
      <Card>
        <Body>{text}</Body>
        <View style={[styles.setting, { marginTop: space(4) }]}>
          <Text style={[styles.settingTitle, { flex: 1 }]}>I understand and agree to take part</Text>
          <Switch value={ok} onValueChange={setOk} accessibilityLabel="I understand and agree to take part" trackColor={{ true: colors.accent2, false: colors.panelLight }} />
        </View>
      </Card>
      <Btn label="Continue" variant="primary" disabled={!ok} onPress={onAgree} style={{ marginTop: space(5) }} />
      <Btn label="Back" variant="ghost" onPress={onBack} style={{ marginTop: space(3) }} />
    </Page>
  );
}

export function NameScreen({ initial, onSubmit, onBack, busy, error }: { initial: string; onSubmit: (name: string) => void; onBack: () => void; busy: boolean; error: string | null }) {
  const [name, setName] = useState(initial.slice(0, 18));
  const clean = name.replace(/[\r\n\t]/g, '').trim();
  return (
    <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Page>
        <H1 style={{ textAlign: 'center', marginTop: space(6) }}>New Assessment</H1>
        <Muted style={{ textAlign: 'center', marginVertical: space(3) }}>Enter a name or nickname for this session</Muted>
        <TextInput
          value={name}
          onChangeText={(t) => setName(t.replace(/[\r\n\t]/g, '').slice(0, 18))}
          maxLength={18}
          placeholder="Player"
          placeholderTextColor={colors.textDim}
          autoCorrect={false}
          autoCapitalize="words"
          returnKeyType="go"
          onSubmitEditing={() => !busy && onSubmit(clean || 'Player')}
          accessibilityLabel="Name or nickname"
          style={styles.input}
        />
        {error ? <Text style={[styles.warn, { textAlign: 'center' }]}>{error}</Text> : null}
        <Btn label="Continue" variant="primary" busy={busy} onPress={() => onSubmit(clean || 'Player')} style={{ marginTop: space(5) }} testID="name-continue" />
        <Btn label="Back" variant="ghost" onPress={onBack} style={{ marginTop: space(3) }} />
        <Muted style={{ textAlign: 'center', marginTop: space(6) }}>
          Only this name and your in-game actions are stored (on this phone until uploaded, then on the RahYaab server). Use a nickname if you prefer.
        </Muted>
      </Page>
    </KeyboardAvoidingView>
  );
}

export function ResumeScreen({
  playerName,
  levelLabel,
  pendingUpload,
  onResume,
  onAbandon,
  busy,
}: {
  playerName: string;
  levelLabel: string;
  pendingUpload: boolean;
  onResume: () => void;
  onAbandon: () => void;
  busy: boolean;
}) {
  const [confirm, setConfirm] = useState(false);
  return (
    <Page>
      <H1 style={{ textAlign: 'center', marginTop: space(8) }}>{pendingUpload ? 'Results waiting' : 'Welcome back!'}</H1>
      <Card style={{ marginTop: space(5) }}>
        <Body>
          {pendingUpload
            ? `${playerName}'s assessment is finished but not yet uploaded. Connect to the internet to get the results.`
            : `${playerName} has an unfinished assessment (${levelLabel}). It will continue exactly where you left off, paused.`}
        </Body>
      </Card>
      <Btn label={pendingUpload ? 'Upload and see results' : 'Resume'} variant="primary" onPress={onResume} style={{ marginTop: space(5) }} testID="resume-session" />
      {!pendingUpload ? (
        !confirm ? (
          <Btn label="Abandon it and start over" variant="ghost" onPress={() => setConfirm(true)} style={{ marginTop: space(3) }} />
        ) : (
          <Card accent={colors.danger} style={{ marginTop: space(3) }}>
            <Body>The unfinished assessment will not be scored and cannot be resumed.</Body>
            <View style={styles.row}>
              <Btn label="Keep it" onPress={() => setConfirm(false)} style={{ flex: 1, marginRight: space(2) }} />
              <Btn label="Abandon" variant="danger" busy={busy} onPress={onAbandon} style={{ flex: 1 }} />
            </View>
          </Card>
        )
      ) : null}
    </Page>
  );
}

export function IncompatibleScreen({ onDiscard, onExit }: { onDiscard: () => void; onExit: () => void }) {
  return (
    <Page>
      <H1 style={{ textAlign: 'center', marginTop: space(8) }}>Saved game from an older version</H1>
      <Card style={{ marginTop: space(5) }}>
        <Body>
          This phone has an unfinished assessment that was saved by a different version of the game. It cannot be continued safely, because replaying it with the new version could change what was recorded.
        </Body>
      </Card>
      <Btn label="Remove it and continue" variant="primary" onPress={onDiscard} style={{ marginTop: space(5) }} />
      <Btn label="Not now" variant="ghost" onPress={onExit} style={{ marginTop: space(3) }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  page: { padding: space(5), paddingTop: space(10), paddingBottom: space(10), maxWidth: 620, width: '100%', alignSelf: 'center' },
  logo: { color: colors.text, fontSize: 52, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: colors.accent, fontSize: 18, textAlign: 'center', marginBottom: space(2) },
  menuBtn: { marginVertical: space(1.5) },
  row: { flexDirection: 'row', marginTop: space(3) },
  setting: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.panel, borderRadius: 12, padding: space(3), marginVertical: space(2) },
  settingTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  trackTag: { fontSize: 11, fontWeight: '800', marginRight: space(2) },
  input: {
    backgroundColor: colors.panel,
    borderColor: colors.accent,
    borderWidth: 2,
    borderRadius: 14,
    color: colors.text,
    fontSize: 24,
    textAlign: 'center',
    paddingVertical: space(3),
    minHeight: 56,
  },
  warn: { color: colors.warn, marginTop: space(2) },
});
