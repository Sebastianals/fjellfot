import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { radius, font } from '../theme/theme';

export function tap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Subtle fade + rise entrance. Uses the built-in Animated API (works in Snack). */
export function FadeIn({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: ViewStyle }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: 1, duration: 450, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { c } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: c.surface,
          borderColor: c.stoneLine,
          borderWidth: 1,
          borderRadius: radius.lg,
          overflow: 'hidden',
          shadowColor: '#16120F',
          shadowOpacity: c.isDark ? 0 : 0.05,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: c.isDark ? 0 : 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  const { c } = useTheme();
  return (
    <View style={styles.sec}>
      <Text style={{ fontFamily: font.heading, fontSize: 17, color: c.ink, letterSpacing: -0.3 }}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: c.ember }}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Avatar({ initial, size = 48, c1 = '#FF8A47', c2 = '#E2480A', style, icon }: { initial: string; size?: number; c1?: string; c2?: string; style?: ViewStyle; icon?: any }) {
  return (
    <LinearGradient
      colors={[c1, c2]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[{ width: size, height: size, borderRadius: size * 0.33, alignItems: 'center', justifyContent: 'center' }, style]}
    >
      {icon ? (
        <Ionicons name={icon} size={size * 0.5} color="#fff" />
      ) : (
        <Text style={{ fontFamily: font.heading, color: '#fff', fontSize: size * 0.4 }}>{initial}</Text>
      )}
    </LinearGradient>
  );
}

export function Pill({ label, bg, color, style }: { label: string; bg: string; color: string; style?: ViewStyle }) {
  return (
    <View style={[{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }, style]}>
      <Text style={{ fontSize: 11, fontFamily: font.bodyBold, color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
    </View>
  );
}

export function Segmented({ items, value, onChange }: { items: string[]; value: number; onChange: (i: number) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.stone, borderRadius: 15, padding: 4 }}>
      {items.map((it, i) => {
        const on = i === value;
        return (
          <Pressable
            key={it}
            onPress={() => {
              tap();
              onChange(i);
            }}
            style={[
              { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
              on && { backgroundColor: c.surface, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
            ]}
          >
            <Text style={{ fontFamily: font.semi, fontSize: 13, color: on ? c.ink : c.inkSoft }}>{it}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function ProgressRing({ size = 136, stroke = 13, pct, track = 'rgba(255,255,255,0.12)', children }: { size?: number; stroke?: number; pct: number; track?: string; children?: React.ReactNode }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct));
  const offset = circ * (1 - clamped / 100);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Defs>
          <SvgGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#FF8A47" />
            <Stop offset="1" stopColor="#E2480A" />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  sec: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 24, marginBottom: 13 },
});
