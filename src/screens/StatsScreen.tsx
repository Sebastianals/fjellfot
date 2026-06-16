import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { Card, tap } from '../components/UI';
import { usePedometer } from '../hooks/usePedometer';
import { useSettings } from '../lib/SettingsContext';
import { useAuth } from '../lib/AuthContext';

export default function StatsScreen({ navigation }: any) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { week } = usePedometer(0);
  const { fmtDistance } = useSettings();
  const { profile } = useAuth();
  const goal = profile?.goal ?? 10000;

  const total = week.reduce((s, d) => s + d.steps, 0);
  const max = Math.max(1, ...week.map((d) => d.steps));
  const active = week.filter((d) => d.steps > 0).length;
  const avg = active ? Math.round(total / active) : 0;
  const best = week.reduce((m, d) => Math.max(m, d.steps), 0);
  const goalDays = week.filter((d) => d.steps >= goal).length;
  const km = total * 0.00072;
  const kcal = Math.round(total * 0.05);

  return (
    <View style={{ flex: 1, backgroundColor: c.snow }}>
      <View style={[styles.head, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => { tap(); navigation.goBack(); }} hitSlop={8} style={[styles.back, { borderColor: c.stoneLine }]}>
          <Ionicons name="chevron-down" size={22} color={c.ink} />
        </Pressable>
        <Text style={{ fontFamily: font.display, fontSize: 20, color: c.ink }}>Statistikk</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontFamily: font.bodyBold, fontSize: 12, color: c.inkSoft, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10 }}>Siste 7 dager</Text>
        <Card style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140 }}>
            {week.map((d, i) => {
              const h = Math.max(8, Math.round((d.steps / max) * 110));
              const hit = d.steps >= goal;
              return (
                <View key={i} style={{ alignItems: 'center', flex: 1, gap: 6 }}>
                  <Text style={{ fontSize: 9, color: c.inkFaint, fontFamily: font.bodyBold }}>{d.steps >= 1000 ? `${(d.steps / 1000).toFixed(1).replace('.', ',')}k` : d.steps}</Text>
                  <View style={{ width: 20, height: h, borderRadius: 6, backgroundColor: hit ? c.gold : c.ember, opacity: d.steps === 0 ? 0.25 : 1 }} />
                  <Text style={{ fontSize: 10, color: c.inkSoft, fontFamily: font.bodyBold }}>{d.label}</Text>
                </View>
              );
            })}
          </View>
        </Card>

        <View style={styles.grid}>
          <Stat c={c} v={total.toLocaleString('nb-NO')} l="Skritt totalt" />
          <Stat c={c} v={avg.toLocaleString('nb-NO')} l="Snitt aktiv dag" />
          <Stat c={c} v={best.toLocaleString('nb-NO')} l="Beste dag" />
          <Stat c={c} v={`${goalDays} / 7`} l="Mål nådd" gold />
          <Stat c={c} v={fmtDistance(km)} l="Distanse" />
          <Stat c={c} v={`${kcal} kcal`} l="Forbrent" />
        </View>

        {week.length === 0 && (
          <Text style={{ color: c.inkSoft, textAlign: 'center', marginTop: 24 }}>Ingen skrittdata ennå — gå en tur!</Text>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ c, v, l, gold }: any) {
  return (
    <View style={{ width: '47%', backgroundColor: c.surface, borderWidth: 1, borderColor: c.stoneLine, borderRadius: 18, padding: 16 }}>
      <Text style={{ fontFamily: font.display, fontSize: 22, color: gold ? c.gold : c.ink }}>{v}</Text>
      <Text style={{ fontSize: 12, color: c.inkSoft, marginTop: 3 }}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 12 },
  back: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 16 },
});
