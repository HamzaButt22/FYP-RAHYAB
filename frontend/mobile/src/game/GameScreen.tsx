// Shows one game module for one run. Whoever starts the run (the week loop, the game lab) creates it with
// createRun() and owns it: its onFinish hears when the module finishes, the student leaves (run.abandon())
// or the module crashes. This screen starts the run, gives the module its host, and closes the run with
// quit if it is taken off screen before the module finished. A crashing module shows a calm message
// instead of a crashed app.

import { Component, useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import type { GameContext, GameModule } from './contract.ts';
import type { Run } from './run.ts';

interface Props {
  run: Run;
  module: GameModule;
  context: GameContext;
  crashMessage: string;
}

export function GameScreen({ run, module, context, crashMessage }: Props) {
  useEffect(() => {
    run.start();
    return () => run.abandon(); // does nothing if the run already ended
  }, [run]);

  const Screen = module.Screen;
  return (
    <ModuleBoundary message={crashMessage} onCrash={() => run.abandon()}>
      <Screen context={context} host={run.host} saved={run.saved} />
    </ModuleBoundary>
  );
}

class ModuleBoundary extends Component<
  { children: ReactNode; message: string; onCrash: () => void },
  { crashed: boolean }
> {
  state = { crashed: false };

  static getDerivedStateFromError() {
    return { crashed: true };
  }

  componentDidCatch(error: unknown) {
    if (__DEV__) console.error('game module crashed', error);
    this.props.onCrash();
  }

  render() {
    if (!this.state.crashed) return this.props.children;
    return (
      <View style={styles.crash}>
        <AppText variant="title">{this.props.message}</AppText>
      </View>
    );
  }
}

const styles = StyleSheet.create({ crash: { padding: 16 } });
