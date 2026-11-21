import React, { useEffect, useState } from 'react';
import { Animated } from 'react-native';

/** Springs its child in whenever `id` changes (used when a piece "lands" in a slot). */
export function PopIn({ id, children }: { id: string | number | null; children: React.ReactNode }) {
  const [v] = useState(() => new Animated.Value(1));
  useEffect(() => {
    v.setValue(0.6);
    Animated.spring(v, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [id, v]);
  return <Animated.View style={{ transform: [{ scale: v }] }}>{children}</Animated.View>;
}
