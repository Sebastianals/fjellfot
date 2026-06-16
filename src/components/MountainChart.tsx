import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Polygon, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';

export type Day = { label: string; steps: number };

/**
 * "Denne uka" as a mountain range — each day is a peak, snow-capped when the
 * goal was reached, with a faint back-range for depth. Pure SVG (react-native-svg).
 */
export function MountainChart({ data, goal, height = 120, showLabels = true }: { data: Day[]; goal: number; height?: number; showLabels?: boolean }) {
  const { c } = useTheme();
  const W = 320;
  const H = height;
  const pad = 14;
  const max = Math.max(goal, ...data.map((d) => d.steps), 1);
  const n = data.length || 1;
  const x = (i: number) => pad + (i / (n - 1)) * (W - pad * 2);
  const y = (v: number) => H - 6 - (v / max) * (H - 24);

  const peaks = data.map((d, i) => ({ px: x(i), py: y(d.steps), hit: d.steps >= goal, steps: d.steps }));
  // Front range path (jagged peaks → baseline, closed for fill)
  const front = `M ${pad},${H} ` + peaks.map((p) => `L ${p.px.toFixed(1)},${p.py.toFixed(1)}`).join(' ') + ` L ${W - pad},${H} Z`;
  // Faint back range: same peaks lifted + softened for depth
  const back = `M ${pad},${H} ` + peaks.map((p, i) => `L ${(p.px + (i % 2 ? 10 : -10)).toFixed(1)},${(Math.min(H - 8, p.py + 14)).toFixed(1)}`).join(' ') + ` L ${W - pad},${H} Z`;

  return (
    <View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="mc-front" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FF8A47" />
            <Stop offset="1" stopColor={c.emberDeep} />
          </LinearGradient>
          <LinearGradient id="mc-goal" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#F4D58A" />
            <Stop offset="1" stopColor={c.gold} />
          </LinearGradient>
        </Defs>
        {/* back range for depth */}
        <Path d={back} fill={c.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(22,18,15,0.06)'} />
        {/* front range */}
        <Path d={front} fill={data.some((d) => d.steps >= goal) ? 'url(#mc-front)' : 'url(#mc-front)'} opacity={0.95} />
        {/* snow caps + dots on each peak */}
        {peaks.map((p, i) => (
          <React.Fragment key={i}>
            {p.hit && p.steps > 0 && (
              <Polygon points={`${p.px - 7},${p.py + 9} ${p.px},${p.py} ${p.px + 7},${p.py + 9}`} fill="#fff" />
            )}
            {p.steps > 0 && <Circle cx={p.px} cy={p.py} r={2.6} fill={p.hit ? '#fff' : '#fff'} opacity={0.9} />}
          </React.Fragment>
        ))}
      </Svg>
      {showLabels && (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginTop: 4 }}>
          {data.map((d, i) => (
            <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontFamily: font.bodyBold, color: i === data.length - 1 ? c.ember : c.inkSoft }}>{d.label}</Text>
          ))}
        </View>
      )}
    </View>
  );
}
