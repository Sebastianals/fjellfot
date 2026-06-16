import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { Card, Avatar, Segmented, tap } from '../components/UI';
import { useAuth } from '../lib/AuthContext';
import {
  subscribeGroup, subscribeStandings, subscribeLedger, setPaid,
  Group, Standing, LedgerEntry,
} from '../lib/db';

const fmt = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : `${n}`);

export default function GroupDetailScreen({ route, navigation }: any) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const id: string = route.params?.id;
  const [tab, setTab] = useState(0);

  const [group, setGroup] = useState<Group | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    const a = subscribeGroup(id, (g) => g && setGroup(g));
    const b = subscribeStandings(id, user.uid, setStandings);
    const c2 = subscribeLedger(id, user.uid, setLedger);
    return () => { a(); b(); c2(); };
  }, [id, user?.uid]);

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: c.snow, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: c.inkFaint }}>Laster …</Text>
      </View>
    );
  }

  const isTeam = group.type === 'team';
  const potTotal = group.potTotal ?? 0;
  const potStake = group.potStake ?? 0;
  const leader = standings[0];
  const code = group.code;

  const invite = async () => {
    tap();
    if (!code) return;
    try {
      await Share.share({ message: `Bli med i «${group.name}» på Fjellfot! Åpne appen og skriv inn koden ${code} 🏔️` });
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.snow }}>
      <LinearGradient colors={isTeam ? ['#2c4a8a', '#3a6fd8'] : ['#b8400a', '#FF8A47']} style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Pressable onPress={() => { tap(); navigation.goBack(); }} style={styles.back}>
            <Ionicons name="chevron-back" size={20} color="#fff" />
          </Pressable>
          {code ? (
            <Pressable onPress={invite} style={styles.invite}>
              <Ionicons name="person-add" size={15} color="#fff" />
              <Text style={{ color: '#fff', fontFamily: font.bodyBold, fontSize: 13 }}>Inviter</Text>
            </Pressable>
          ) : null}
        </View>
        <Text style={{ fontFamily: font.display, fontSize: 24, color: '#fff', letterSpacing: -0.5 }}>{group.name}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.92)', fontSize: 13, marginTop: 8 }}>
          {isTeam ? `Lagkamp · ${group.members ?? 24} spillere · runde 4` : `Konkurranse · ${group.members ?? 8} medlemmer · ${group.endsIn ?? '3d 14t'} igjen`}
        </Text>
        {!isTeam && potTotal > 0 && (
          <View style={styles.potbar}>
            <View style={styles.potIc}><Ionicons name="trophy" size={20} color="#5a3d08" /></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.display, fontSize: 20, color: '#fff' }}>kr {potTotal.toLocaleString('nb-NO')}</Text>
              <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 1 }}>Vinner tar alt · kr {potStake} fra hver</Text>
            </View>
            {leader ? <Text style={{ color: '#fff', fontSize: 11, fontFamily: font.bodyBold, textAlign: 'right' }}>{leader.name} leder{'\n'}potten nå</Text> : null}
          </View>
        )}
      </LinearGradient>

      <View style={{ paddingHorizontal: 22, paddingTop: 16 }}>
        <Segmented items={isTeam ? ['Stilling', 'Historikk'] : ['Stilling', 'Pott']} value={tab} onChange={setTab} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {tab === 0 && (
          <>
            {standings.length === 0 ? (
              <Loading c={c} />
            ) : (
              <Card>
                {standings.map((row, i) => (
                  <View key={row.id} style={[styles.lb, i > 0 && { borderTopWidth: 1, borderTopColor: c.stoneLine }, row.you && { backgroundColor: c.emberGlow }]}>
                    <Text style={[styles.rank, { color: i === 0 ? c.gold : i === 1 ? c.silver : row.you ? c.ember : c.inkSoft }]}>{i + 1}</Text>
                    <Avatar initial={row.initial} size={40} c1={row.color} c2={row.color} style={{ borderRadius: 13 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: font.bodyBold, fontSize: 14, color: c.ink }}>{row.name}</Text>
                      {row.note ? <Text style={{ fontSize: 11, color: c.inkSoft, marginTop: 1 }}>{row.note}</Text> : null}
                    </View>
                    <Text style={{ fontFamily: font.heading, fontSize: 14, color: row.you ? c.ember : c.ink }}>{fmt(row.steps)}</Text>
                  </View>
                ))}
              </Card>
            )}
            {!isTeam && (
              <View style={[styles.hint, { backgroundColor: c.emberGlow, borderColor: 'rgba(255,107,26,0.2)' }]}>
                <Ionicons name="triangle" size={20} color={c.ember} />
                <Text style={{ flex: 1, fontSize: 13, color: c.ink, fontFamily: font.body, lineHeight: 18 }}>
                  Gå <Text style={{ fontFamily: font.bodyBold }}>8 801 skritt</Text> til for å ta ledelsen og potten på kr {potTotal}.
                </Text>
              </View>
            )}
          </>
        )}

        {tab === 1 && !isTeam && potTotal === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Ionicons name="trophy-outline" size={40} color={c.inkFaint} />
            <Text style={{ color: c.inkSoft, marginTop: 12, textAlign: 'center' }}>Ingen pengepott i denne konkurransen.</Text>
          </View>
        )}
        {tab === 1 && !isTeam && potTotal > 0 && (
          <>
            <View style={[styles.noteBox, { backgroundColor: c.surface, borderColor: c.stoneLine }]}>
              <Ionicons name="information-circle-outline" size={18} color={c.inkSoft} />
              <Text style={{ flex: 1, fontSize: 12.5, color: c.inkSoft, lineHeight: 17 }}>
                Fjellfot holder bare oversikten. Selve oppgjøret skjer mellom dere via Vipps. Trykk for å markere din egen som betalt.
              </Text>
            </View>
            {ledger.length === 0 ? <Loading c={c} /> : (
              <Card>
                {ledger.map((m, i) => (
                  <Pressable
                    key={m.id}
                    disabled={!m.you}
                    onPress={() => { tap(); setPaid(id, m.id, !m.paid).catch(() => {}); }}
                    style={[styles.lb, i > 0 && { borderTopWidth: 1, borderTopColor: c.stoneLine }, m.you && { backgroundColor: c.emberGlow }]}
                  >
                    <Avatar initial={m.initial} size={40} c1={m.color} c2={m.color} style={{ borderRadius: 13 }} />
                    <Text style={{ flex: 1, fontFamily: font.bodyBold, fontSize: 14, color: c.ink }}>{m.name}</Text>
                    <Text style={{ fontFamily: font.bodyBold, fontSize: 13, color: c.inkSoft, marginRight: 8 }}>kr {potStake}</Text>
                    {m.paid ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="checkmark-circle" size={18} color="#2a8a4f" />
                        <Text style={{ fontSize: 12, color: '#2a8a4f', fontFamily: font.bodyBold }}>Betalt</Text>
                      </View>
                    ) : (
                      <Text style={{ fontSize: 12, color: m.you ? c.ember : c.inkFaint, fontFamily: font.bodyBold }}>{m.you ? 'Marker betalt' : 'Venter'}</Text>
                    )}
                  </Pressable>
                ))}
              </Card>
            )}
          </>
        )}

        {tab === 1 && isTeam && (
          <Card style={{ padding: 18 }}>
            <Text style={{ fontFamily: font.heading, fontSize: 15, color: c.ink }}>Lagets historikk</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <Stat c={c} v="1" l="Runder vunnet" gold />
              <Stat c={c} v="2.3" l="Snittplassering" />
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

function Loading({ c }: any) {
  return <Text style={{ color: c.inkFaint, textAlign: 'center', marginTop: 30 }}>Laster …</Text>;
}
function Stat({ c, v, l, gold }: any) {
  return (
    <View style={{ flex: 1, backgroundColor: c.snow, borderWidth: 1, borderColor: c.stoneLine, borderRadius: 16, padding: 14 }}>
      <Text style={{ fontFamily: font.display, fontSize: 22, color: gold ? c.gold : c.ink }}>{v}</Text>
      <Text style={{ fontSize: 11.5, color: c.inkSoft, marginTop: 2 }}>{l}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30, paddingHorizontal: 22, paddingBottom: 24 },
  back: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  invite: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, height: 40, borderRadius: 13 },
  potbar: { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 18, padding: 14, marginTop: 18 },
  potIc: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E8B14C', alignItems: 'center', justifyContent: 'center' },
  lb: { flexDirection: 'row', alignItems: 'center', gap: 13, padding: 13 },
  rank: { fontFamily: font.heading, width: 22, fontSize: 15 },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 14 },
  noteBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14 },
});
