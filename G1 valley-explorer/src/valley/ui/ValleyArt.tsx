/** Shared landscape illustration (pure vector, scales to any width). */
import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from './theme';

export function ValleyBackdrop({ width, height }: { width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 360 300" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F7DDBB" />
          <Stop offset="0.55" stopColor={colors.sky} />
        </LinearGradient>
      </Defs>
      <Path d="M0 0 H360 V300 H0z" fill="url(#sky)" />
      <Circle cx={292} cy={52} r={22} fill="#FCE7B5" />
      <Path d="M0 120 L60 52 L104 98 L160 36 L222 104 L268 64 L360 128 V300 H0z" fill={colors.mountain} />
      <Path d="M148 50 L160 36 L174 52 L166 50 L160 56z" fill="#FFFFFF" opacity={0.85} />
      <Path d="M0 160 Q80 110 170 150 T360 140 V300 H0z" fill={colors.hill} />
      <Path d="M0 210 Q100 170 200 205 T360 196 V300 H0z" fill={colors.hillDark} />
      <Path d="M250 300 C240 250 300 230 280 190 C268 168 300 150 330 140" stroke={colors.river} strokeWidth={14} fill="none" strokeLinecap="round" />
      <Path d="M40 300 C80 260 150 268 170 236 C190 204 130 190 160 166 C185 146 230 150 250 132" stroke={colors.path} strokeWidth={9} fill="none" strokeDasharray="2 10" strokeLinecap="round" />
    </Svg>
  );
}
