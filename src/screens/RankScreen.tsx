import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { Card, SectionHeader, tap } from '../components/UI';
import { achievements, ladder, tierForLevel } from '../data/content';
import { useAuth } from '../lib/AuthContext';

const PER_LEVEL = 50000; // steps per level (simple progression)

export default function RankScreen({ navigation }: any) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const level = profile?.level ?? 1;
  const tier = profile?.tier ?? tierForLevel(level);
  const totalSteps = profile?.totalSteps ?? 0;

  const into = Math.max(0, totalSteps - (level - 1) * PER_LEVEL);
  const pct = Math.min(100, Math.round((into / PER_LEVEL) * 100));
  const remaining = Math.max(0, level * PER_LEVEL - totalSteps);

  const unlocked = achievements.filter((a) => totalSteps >= a.need).length;
  const currentTierIdx = ladder.findIndex((t) => t.name === tier);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.snow }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <View style={{ alignItems: 'center', paddingTop: 18, paddingHorizontal: 22 }}>
        <LinearGradient colors={['#2c241d', '#43332a']} style={styles.emblem}>
          <Ionicons name="triangle" size={54} color={c.ember} />
        </LinearGradient>
        <Text style={{ fontSize: 11, letterSpacing: 2.5, color: c.ember, fontFamily: font.bodyBold, textTransform: 'uppercase' }}>Nivå {level}</Text>
        <Text style={{ fontFamily: font.display, fontSize: 27, color: c.ink, marginVertical: 4, letterSpacing: -0.5 }}>{tier}</Text>
        <Text style={{ fontSize: 13, color: c.inkSoft }}>{profile?.name ?? ''}</Text>
        <Pressable onPress={() => { tap(); navigation.navigate('Toppliste'); }} style={[styles.boardBtn, { backgroundColor: c.ember }]}>
          <Ionicons name="trophy" size={16} color="#fff" />
          <Text style={{ color: '#fff', fontFamily: font.heading, fontSize: 14 }}>Se toppliste</Text>
        </Pressable>
      </View>

      <View style={{ paddingHorizontal: 22, marginTop: 18 }}>
        <Card style={{ padding: 18 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: c.ink }}>{totalSteps.toLocaleString('nb-NO')} totale skritt</Text>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: c.ember }}>{pct}%</Text>
          </View>
          <View style={{ height: 12, backgroundColor: c.stone, borderRadius: 99, overflow: 'hidden', marginVertical: 12 }}>
            <LinearGradient colors={['#FF8A47', c.emberDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${pct}%`, height: '100%', borderRadius: 99 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 12, color: c.inkSoft, fontFamily: font.bodyBold }}>Nivå {level}</Text>
            <Text style={{ fontSize: 12, color: c.inkSoft, fontFamily: font.bodyBold }}><Text style={{ color: c.ink }}>{remaining.toLocaleString('nb-NO')}</Text> skritt til nivå {level + 1}</Text>
          </View>
        </Card>
      </View>

      <View style={{ paddingHorizontal: 22 }}>
        <SectionHeader title="Prestasjoner" action={`${unlocked} av ${achievements.length}`} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 22, gap: 12 }}>
        {achievements.map((a, i) => {
          const isUnlocked = totalSteps >= a.need;
          return (
            <View key={i} style={{ width: 82, alignItems: 'center' }}>
              {isUnlocked ? (
                <LinearGradient colors={[a.c1, a.c2]} style={styles.badge}>
                  <Ionicons name={a.icon as any} size={28} color="#fff" />
                </LinearGradient>
              ) : (
                <View style={[styles.badge, { backgroundColor: c.stone }]}>
                  <Ionicons name="lock-closed" size={26} color={c.inkFaint} />
                </View>
              )}
              <Text style={{ fontSize: 10.5, fontFamily: font.body, color: c.inkSoft, textAlign: 'center', marginTop: 8 }}>{a.name}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={{ paddingHorizontal: 22 }}>
        <SectionHeader title="Nivåstigen" />
        <Card>
          {ladder.map((t, i) => {
            const isCurrent = i === currentTierIdx;
            const isDone = i < currentTierIdx;
            const isLocked = i > currentTierIdx;
            return (
              <View key={t.name} style={[styles.ti, i > 0 && { borderTopWidth: 1, borderTopColor: c.stoneLine }, isLocked && { opacity: 0.45 }]}>
                <View style={[styles.tic, { backgroundColor: isCurrent ? c.emberGlow : c.stone }, isCurrent && { borderWidth: 2, borderColor: c.ember }]}>
                  <Ionicons name={isLocked ? 'lock-closed' : 'triangle'} size={20} color={isCurrent ? c.ember : c.inkSoft} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: font.heading, fontSize: 15, color: c.ink }}>{t.name}</Text>
                  <Text style={{ fontSize: 11, color: c.inkSoft, marginTop: 1 }}>{t.range}</Text>
                </View>
                {isDone && <Ionicons name="checkmark-circle" size={22} color={c.ember} />}
                {isCurrent && (
                  <View style={{ backgroundColor: c.emberGlow, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 11, fontFamily: font.bodyBold, color: c.ember, textTransform: 'uppercase' }}>Nå</Text>
                  </View>
                )}
                {isLocked && <Ionicons name="lock-closed" size={18} color={c.inkFaint} />}
              </View>
            );
          })}
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  emblem: { width: 128, height: 128, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 18, borderWidth: 2, borderColor: 'rgba(255,107,26,0.5)' },
  boardBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 14 },
  badge: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  ti: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15 },
  tic: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
