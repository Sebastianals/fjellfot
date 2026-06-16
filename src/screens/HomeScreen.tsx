import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { Card, SectionHeader, Avatar, Pill, ProgressRing, FadeIn, tap } from '../components/UI';
import { MountainChart } from '../components/MountainChart';
import { usePedometer } from '../hooks/usePedometer';
import { useAuth } from '../lib/AuthContext';
import { useSettings } from '../lib/SettingsContext';
import { subscribeGroups, subscribeLeaderboard, saveDailySteps, Group, LbRow } from '../lib/db';

export default function HomeScreen({ navigation }: any) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const { fmtDistance } = useSettings();
  const { steps, available, week } = usePedometer(0);
  const goal = profile?.goal ?? 10000;
  const weekTotal = week.reduce((s, d) => s + d.steps, 0);
  const weekMax = Math.max(1, ...week.map((d) => d.steps));
  const pct = goal ? Math.round((steps / goal) * 100) : 0;

  const [groups, setGroups] = useState<Group[]>([]);
  useEffect(() => subscribeGroups(setGroups), []);

  const [board, setBoard] = useState<LbRow[]>([]);
  useEffect(() => { if (!user) return; return subscribeLeaderboard('national', user.uid, setBoard); }, [user?.uid]);
  const myIdx = board.findIndex((r) => r.you);
  const rank = myIdx >= 0 ? myIdx + 1 : null;
  const ahead = myIdx > 0 ? board[myIdx - 1] : null;
  const gap = ahead ? ahead.steps - board[myIdx].steps : 0;

  const lastSaved = useRef(-1);
  useEffect(() => {
    if (!user) return;
    if (Math.abs(steps - lastSaved.current) < 25) return;
    lastSaved.current = steps;
    saveDailySteps(user.uid, steps).catch(() => {});
  }, [steps, user?.uid]);

  const potGroup = groups.find((g) => (g.potTotal ?? 0) > 0);
  const today = new Date().toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.snow }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 22, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <View style={styles.greeting}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: font.display, fontSize: 25, color: c.ink, letterSpacing: -0.6 }}>Hei, {profile?.first ?? 'der'}</Text>
          <Text style={{ fontFamily: font.body, fontSize: 13, color: c.inkSoft, marginTop: 5, textTransform: 'capitalize' }}>{today}</Text>
        </View>
        <Pressable onPress={() => { tap(); navigation.navigate('Rang'); }}>
          <Avatar initial={profile?.initial ?? '🙂'} size={48} />
        </Pressable>
      </View>

      <FadeIn>
      <LinearGradient colors={['#211C18', '#2E2620', '#3d2f24']} start={{ x: 0, y: 0 }} end={{ x: 0.4, y: 1 }} style={styles.hero}>
        <Svg width="100%" height={76} style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} viewBox="0 0 390 76" preserveAspectRatio="none">
          <Path d="M0,76 L0,48 L55,30 L110,44 L165,18 L220,40 L280,16 L335,36 L390,24 L390,76 Z" fill="rgba(255,107,26,0.13)" />
          <Path d="M0,76 L0,58 L60,46 L120,54 L180,36 L240,52 L300,34 L360,48 L390,40 L390,76 Z" fill="rgba(255,107,26,0.07)" />
        </Svg>
        <View style={styles.heroTop}>
          <Text style={styles.heroLabel}>I DAG</Text>
          {(profile?.streak ?? 0) > 0 && (
            <View style={styles.streak}>
              <Ionicons name="flame" size={13} color="#FF8A47" />
              <Text style={{ color: '#FF8A47', fontSize: 12, fontFamily: font.bodyBold }}>{profile?.streak} dager</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 20, marginTop: 16 }}>
          <ProgressRing size={136} pct={pct}>
            <Text style={{ fontFamily: font.display, fontSize: 30, color: '#fff', letterSpacing: -1.2 }}>{steps.toLocaleString('nb-NO')}</Text>
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>av {goal.toLocaleString('nb-NO')}</Text>
          </ProgressRing>
          <View style={{ flex: 1, gap: 13 }}>
            <HStat v={fmtDistance(steps * 0.00072)} label="Distanse" />
            <HStat v={`${Math.round(steps * 0.05)} kcal`} label="Forbrent" />
            <HStat v={`+${Math.round(steps / 24)} p`} label="Poeng i dag" />
          </View>
        </View>
        {available === false && (
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 12 }}>Skritteller utilgjengelig på denne enheten.</Text>
        )}
      </LinearGradient>
      </FadeIn>

      {/* National rank — the competitive hook */}
      <FadeIn delay={60}>
      <Pressable onPress={() => { tap(); navigation.navigate('Toppliste'); }}>
        <LinearGradient colors={[c.emberDeep, '#FF8A47']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.rankCard}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: font.bodyBold, fontSize: 11, color: 'rgba(255,255,255,0.85)', letterSpacing: 1, textTransform: 'uppercase' }}>Din plass i Norge</Text>
            <Text style={{ fontFamily: font.display, fontSize: 34, color: '#fff', marginTop: 4, letterSpacing: -1 }}>
              {rank ? `#${rank}` : '—'}<Text style={{ fontFamily: font.body, fontSize: 14, color: 'rgba(255,255,255,0.85)' }}>  av {board.length || '—'}</Text>
            </Text>
            <Text style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.92)', marginTop: 4 }}>
              {ahead ? `${gap.toLocaleString('nb-NO')} skritt bak ${ahead.name}` : board.length ? 'Du leder i Norge denne uka! 🏆' : 'Gå en tur for å komme på topplisten'}
            </Text>
          </View>
          <Ionicons name="trophy" size={30} color="rgba(255,255,255,0.9)" />
        </LinearGradient>
      </Pressable>
      </FadeIn>

      {week.length > 0 && (
        <>
          <SectionHeader title="Denne uka" action="Mer statistikk" onAction={() => navigation.navigate('Stats')} />
          <Pressable onPress={() => { tap(); navigation.navigate('Stats'); }}>
            <Card style={{ padding: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <Text style={{ fontFamily: font.display, fontSize: 24, color: c.ink }}>{weekTotal.toLocaleString('nb-NO')}<Text style={{ fontSize: 13, color: c.inkSoft, fontFamily: font.body }}>  skritt</Text></Text>
                <Text style={{ fontSize: 12, color: c.inkSoft, fontFamily: font.bodyBold }}>{fmtDistance(weekTotal * 0.00072)}</Text>
              </View>
              <MountainChart data={week} goal={goal} height={104} />
              <Text style={{ fontSize: 11, color: c.inkFaint, textAlign: 'center', marginTop: 8 }}>Hver topp er en dag · snø = mål nådd · trykk for detaljer</Text>
            </Card>
          </Pressable>
        </>
      )}

      {potGroup && (
        <>
          <SectionHeader title="Din pengepott" action="Detaljer" onAction={() => navigation.navigate('GroupDetail', { id: potGroup.id })} />
          <Pressable onPress={() => { tap(); navigation.navigate('GroupDetail', { id: potGroup.id }); }}>
            <LinearGradient colors={['#1d1814', '#2c241d']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pot}>
              <View style={styles.potBadge}>
                <Ionicons name="trophy" size={12} color={c.gold} />
                <Text style={{ color: c.gold, fontSize: 11, fontFamily: font.bodyBold, textTransform: 'uppercase', letterSpacing: 1 }}>Vinner tar alt</Text>
              </View>
              <Text style={styles.potAmount}><Text style={{ fontSize: 22, color: c.gold }}>kr </Text>{(potGroup.potTotal ?? 0).toLocaleString('nb-NO')}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>{potGroup.name} · {potGroup.members ?? 1} medlemmer</Text>
            </LinearGradient>
          </Pressable>
        </>
      )}

      <SectionHeader title="Dine grupper" action="Alle" onAction={() => navigation.navigate('Grupper')} />
      {groups.length === 0 ? (
        <Card style={{ padding: 22, alignItems: 'center' }}>
          <Ionicons name="people-outline" size={34} color={c.inkFaint} />
          <Text style={{ color: c.inkSoft, marginTop: 10, textAlign: 'center', lineHeight: 19 }}>Ingen grupper ennå.{'\n'}Opprett en og inviter venner.</Text>
          <Pressable onPress={() => { tap(); navigation.navigate('Grupper'); }} style={[styles.cta, { backgroundColor: c.ember }]}>
            <Text style={{ color: '#fff', fontFamily: font.heading, fontSize: 14 }}>Opprett gruppe</Text>
          </Pressable>
        </Card>
      ) : (
        <Card>
          {groups.slice(0, 4).map((g, i) => (
            <Pressable key={g.id} onPress={() => { tap(); navigation.navigate('GroupDetail', { id: g.id }); }} style={[styles.grow, i > 0 && { borderTopWidth: 1, borderTopColor: c.stoneLine }]}>
              <Avatar initial="" icon={g.type === 'team' ? 'people' : 'trending-up'} size={46} c1={g.c1} c2={g.c2} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.heading, fontSize: 15, color: c.ink }}>{g.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Pill label={g.type === 'team' ? 'Lagkamp' : 'Konkurranse'} bg={g.type === 'team' ? 'rgba(91,141,239,0.15)' : c.emberGlow} color={g.type === 'team' ? '#5b8def' : c.emberDeep} />
                  <Text style={{ fontSize: 12, color: c.inkSoft }}>· {g.sub}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.inkFaint} />
            </Pressable>
          ))}
        </Card>
      )}

      <Pressable onPress={() => { tap(); navigation.navigate('Toppliste'); }} style={[styles.boardLink, { backgroundColor: c.surface, borderColor: c.stoneLine }]}>
        <Ionicons name="trophy" size={18} color={c.ember} />
        <Text style={{ flex: 1, fontFamily: font.heading, fontSize: 14, color: c.ink }}>Se nasjonal toppliste</Text>
        <Ionicons name="chevron-forward" size={18} color={c.inkFaint} />
      </Pressable>
    </ScrollView>
  );
}

function HStat({ v, label }: { v: string; label: string }) {
  return (
    <View>
      <Text style={{ fontFamily: font.heading, fontSize: 18, color: '#fff' }}>{v}</Text>
      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontFamily: font.bodyBold, textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 1 }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  greeting: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: 6, marginBottom: 22 },
  hero: { borderRadius: 34, padding: 24, marginBottom: 4, overflow: 'hidden' },
  rankCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 24, padding: 20, marginTop: 16 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 30 },
  heroLabel: { fontSize: 11, fontFamily: font.bodyBold, letterSpacing: 1.4, color: 'rgba(255,255,255,0.55)' },
  streak: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,107,26,0.18)', borderWidth: 1, borderColor: 'rgba(255,107,26,0.45)', paddingHorizontal: 13, paddingVertical: 7, borderRadius: 99 },
  pot: { borderRadius: 28, padding: 22, borderWidth: 1, borderColor: 'rgba(232,177,76,0.25)' },
  potBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(232,177,76,0.18)', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 8, alignSelf: 'flex-start' },
  potAmount: { fontFamily: font.display, fontSize: 42, color: '#E8B14C', letterSpacing: -2, marginTop: 12, marginBottom: 2 },
  grow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 15 },
  cta: { paddingHorizontal: 18, paddingVertical: 11, borderRadius: 14, marginTop: 14 },
  boardLink: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 18, borderWidth: 1, marginTop: 22 },
});
