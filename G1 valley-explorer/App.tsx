/**
 * DEMO HOST — a stand-in for the RahYaab app, used only to run and test the Valley Explorer module.
 * It is NOT RahYaab's real login/consent flow (that source code was not available). In RahYaab, replace
 * this file with a screen that mounts <ValleyExplorer adapter={...} /> using the real participant id,
 * consent state, encrypted storage and ingestion endpoint. See docs/INTEGRATION.md.
 */
import { StatusBar } from 'expo-status-bar';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemoryEventSink, PrototypeBackendSink, ValleyExplorer, type AssessmentOutput, type EventSink, type RahYaabHostAdapter } from './src/valley';
import { Button, Card, Pill } from './src/valley/ui/components';
import { colors, space, type } from './src/valley/ui/theme';

// Optional: point the demo at the original Flask backend, e.g. EXPO_PUBLIC_VE_BACKEND_URL=http://192.168.1.20:5000
const BACKEND_URL = process.env.EXPO_PUBLIC_VE_BACKEND_URL;

function makeSink(): EventSink {
  if (!BACKEND_URL) return new MemoryEventSink();
  return new PrototypeBackendSink({
    baseUrl: BACKEND_URL,
    loadMapping: async () => { const v = await AsyncStorage.getItem('demo:server-mapping'); return v ? JSON.parse(v) : null; },
    saveMapping: async (m) => { await AsyncStorage.setItem('demo:server-mapping', JSON.stringify(m)); },
  });
}

export default function App() {
  const [code, setCode] = useState('');
  const [consent, setConsent] = useState(false);
  const [assent, setAssent] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [output, setOutput] = useState<AssessmentOutput | null>(null);
  const sink = useMemo(makeSink, []);

  const adapter: RahYaabHostAdapter = useMemo(() => ({
    studentId: code.trim(),
    consentGranted: consent && assent,
    language: 'en',
    mode: 'demo',
    eventSink: sink,
    onComplete: (o) => setOutput(o),
    onExit: () => setPlaying(false),
    appVersion: 'demo-host-1',
  }), [code, consent, assent, sink]);

  if (playing) return <ValleyExplorer adapter={adapter} />;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.parchment }}>
        <StatusBar style="dark" />
        <ScrollView contentContainerStyle={st.wrap}>
          <Pill text="DEMO HOST — NOT THE REAL RAHYAAB APP" tone="accent" />
          <Text style={type.display}>RahYaab</Text>
          <Text style={type.body}>Career guidance for Grades 9–12. This screen imitates RahYaab’s sign-in and consent steps so Valley Explorer can be tested on its own.</Text>
          <Card style={{ gap: space.md }}>
            <Text style={type.subtitle}>1. Participant code</Text>
            <Text style={type.small}>Use a code, never your real name.</Text>
            <TextInput value={code} onChangeText={setCode} placeholder="e.g. RY-7K3Q-92" autoCapitalize="characters" autoCorrect={false} style={st.input} accessibilityLabel="Participant code" testID="demo-code" />
            <Text style={type.subtitle}>2. Consent</Text>
            <Row label="A parent or guardian has given consent" value={consent} onChange={setConsent} testID="demo-consent" />
            <Row label="I agree to take part, and I know I can stop at any time" value={assent} onChange={setAssent} testID="demo-assent" />
          </Card>
          <Button label="Open Valley Explorer" disabled={!code.trim() || !consent || !assent} onPress={() => setPlaying(true)} testID="demo-open" />
          <Text style={type.small}>Events are sent to: {BACKEND_URL ? BACKEND_URL : 'memory only (demo)'}</Text>
          {output ? (
            <Card style={{ gap: space.sm }}>
              <Text style={type.subtitle}>What RahYaab receives (eligible outputs)</Text>
              <Text style={st.mono}>{JSON.stringify(output.eligible_outputs, null, 2)}</Text>
              <Text style={type.small}>Versions: {JSON.stringify(output.versions)}</Text>
            </Card>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function Row({ label, value, onChange, testID }: { label: string; value: boolean; onChange: (v: boolean) => void; testID: string }) {
  return (
    <View style={st.row}>
      <Text style={[type.body, { flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={label} testID={testID} trackColor={{ true: colors.primary, false: colors.border }} />
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { padding: space.lg, gap: space.md, maxWidth: 560, width: '100%', alignSelf: 'center' },
  input: { minHeight: 52, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: space.md, fontSize: 17, backgroundColor: colors.surface, color: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: 48 },
  mono: { fontFamily: 'monospace', fontSize: 12, color: colors.ink },
});
