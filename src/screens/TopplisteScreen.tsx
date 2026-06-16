import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { Card, Avatar, Segmented } from '../components/UI';
import { useAuth } from '../lib/AuthContext';
import { subscribeLeaderboard, subscribeTeamboard, LbRow, TeamRow } from '../lib/db';

const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);

export default function TopplisteScreen({ navigation }: any) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [tab, setTab] = useState(0);
  const [national, setNational] = useState<LbRow[] | null>(null);
  const [friends, setFriends] = useState<LbRow[] | null>(null);
  const [teams, setTeams] = useState<TeamRow[] | null>(null);

  useEffect(() => {
    if (!user) return;
    const a = subscribeLeaderboard('national', user.uid, setNational);
    const b = subscribeLeaderboard('friends', user.uid, setFriends);
    const t = subscribeTeamboard(setTeams);
    return () => { a(); b(); t(); };
  }, [user?.uid]);

  return (
    <View style={{ flex: 1, backgroundColor: c.snow }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 22 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={[styles.back, { borderColor: c.stoneLine }]}>
            <Ionicons name="chevron-back" size={20} color={c.ink} />
          </Pressable>
          <View>
            <Text style={{ fontFamily: font.display, fontSize: 25, color: c.ink, letterSpacing: -0.6 }}>Toppliste</Text>
            <Text style={{ fontSize: 13, color: c.inkSoft, marginTop: 2 }}>Flest skritt denne uka</Text>
          </View>
        </View>
        <Segmented items={['Norge', 'Lag', 'Venner']} value={tab} onChange={setTab} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 18, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {tab === 0 && <Board rows={national} c={c} empty="Ingen på topplisten ennå — gå en tur for å komme på!" />}
        {tab === 1 && <TeamBoard rows={teams} c={c} />}
        {tab === 2 && <Board rows={friends} c={c} hideRegion empty="Ingen venner ennå. Inviter noen så dukker de opp her." />}
      </ScrollView>
    </View>
  );
}

function Board({ rows, c, hideRegion, empty }: { rows: LbRow[] | null; c: any; hideRegion?: boolean; empty: string }) {
  if (rows === null) return <ActivityIndicator color={c.ember} style={{ marginTop: 40 }} />;
  if (rows.length === 0) return <Empty c={c} msg={empty} />;
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  // [2nd, 1st, 3rd] visual order
  const order = [podium[1], podium[0], podium[2]].filter(Boolean);

  return (
    <>
      <View style={styles.podium}>
        {order.map((r) => {
          const place = r.id === podium[0]?.id ? 1 : r.id === podium[1]?.id ? 2 : 3;
          const first = place === 1;
          const h = first ? 66 : place === 2 ? 50 : 38;
          const colors = first ? ['#FF8A47', '#E2480A'] : place === 2 ? [c.silver, c.silver] : [c.bronze, c.bronze];
          return (
            <View key={r.id} style={{ alignItems: 'center' }}>
              <Avatar initial={r.initial} size={first ? 70 : 56} c1={r.color} c2={r.color} style={{ borderRadius: first ? 23 : 19 }} />
              <Text style={{ fontFamily: font.heading, fontSize: 13, color: c.ink, marginTop: 9 }}>{r.name.replace('Du (', '').replace(')', '')}</Text>
              <Text style={{ fontSize: 11, color: c.inkSoft }}>{fmt(r.steps)}</Text>
              <LinearGradient colors={colors as any} style={[styles.stand, { height: h }]}>
                <Text style={{ fontFamily: font.display, color: '#fff', fontSize: 17 }}>{place}</Text>
              </LinearGradient>
            </View>
          );
        })}
      </View>

      <Card style={{ marginTop: 12 }}>
        {rest.map((r, i) => (
          <View key={r.id} style={[styles.lb, i > 0 && { borderTopWidth: 1, borderTopColor: c.stoneLine }, r.you && { backgroundColor: c.emberGlow }]}>
            <Text style={{ fontFamily: font.heading, width: 26, fontSize: 15, color: r.you ? c.ember : c.inkSoft }}>{i + 4}</Text>
            <Avatar initial={r.initial} size={40} c1={r.color} c2={r.color} style={{ borderRadius: 13 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.semi, fontSize: 14, color: c.ink }}>{r.name}</Text>
              {!hideRegion && r.region ? <Text style={{ fontSize: 11, color: c.inkSoft }}>{r.region}</Text> : null}
            </View>
            <Text style={{ fontFamily: font.heading, fontSize: 14, color: r.you ? c.ember : c.ink }}>{fmt(r.steps)}</Text>
          </View>
        ))}
      </Card>
    </>
  );
}

function TeamBoard({ rows, c }: { rows: TeamRow[] | null; c: any }) {
  if (rows === null) return <ActivityIndicator color={c.ember} style={{ marginTop: 40 }} />;
  if (rows.length === 0) return <Empty c={c} msg="Ingen lag ennå. Opprett et lag under «Grupper» — laget konkurrerer mot alle lag i Norge." />;
  return (
    <Card>
      {rows.map((t, i) => (
        <View key={t.id} style={[styles.lb, i > 0 && { borderTopWidth: 1, borderTopColor: c.stoneLine }]}>
          <Text style={{ fontFamily: font.heading, width: 26, fontSize: 15, color: i === 0 ? c.gold : i === 1 ? c.silver : i === 2 ? c.bronze : c.inkSoft }}>{i + 1}</Text>
          <Avatar initial="" size={40} c1={t.c1} c2={t.c2} style={{ borderRadius: 13 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: font.semi, fontSize: 14, color: c.ink }}>{t.name}</Text>
            <Text style={{ fontSize: 11, color: c.inkSoft }}>{t.members} {t.members === 1 ? 'spiller' : 'spillere'}</Text>
          </View>
          <Text style={{ fontFamily: font.heading, fontSize: 14, color: c.ink }}>{fmt(t.steps)}</Text>
        </View>
      ))}
    </Card>
  );
}

function Empty({ c, msg }: { c: any; msg: string }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 50, paddingHorizontal: 24 }}>
      <Ionicons name="trophy-outline" size={40} color={c.inkFaint} />
      <Text style={{ color: c.inkSoft, marginTop: 12, textAlign: 'center', lineHeight: 20 }}>{msg}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  podium: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 14, marginTop: 8 },
  stand: { marginTop: 9, borderTopLeftRadius: 13, borderTopRightRadius: 13, width: 70, alignItems: 'center', paddingTop: 7 },
  lb: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 13 },
  pot: { borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(232,177,76,0.25)' },
});
