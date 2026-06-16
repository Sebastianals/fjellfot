import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { tap } from '../components/UI';
import { useAuth } from '../lib/AuthContext';
import { createGroup } from '../lib/db';

const DURATIONS = [3, 7, 14, 30];
const STAKES = [20, 50, 100, 200];

export default function CreateGroupScreen({ route, navigation }: any) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const type: 'comp' | 'team' = route.params?.type === 'team' ? 'team' : 'comp';
  const isTeam = type === 'team';

  const [name, setName] = useState('');
  const [duration, setDuration] = useState(7);
  const [potOn, setPotOn] = useState(false);
  const [stake, setStake] = useState(50);
  const [busy, setBusy] = useState(false);

  const canCreate = name.trim().length > 1 && !busy;

  const submit = async () => {
    if (!user || !canCreate) return;
    tap();
    setBusy(true);
    try {
      const id = await createGroup({
        type,
        name: name.trim(),
        durationDays: isTeam ? undefined : duration,
        potStake: !isTeam && potOn ? stake : 0,
        members: [],
        creatorUid: user.uid,
        creatorInitial: profile?.initial ?? '🙂',
      });
      navigation.replace('GroupDetail', { id });
    } catch {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.snow }}>
      <View style={[styles.head, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => { tap(); navigation.goBack(); }} hitSlop={8} style={[styles.back, { borderColor: c.stoneLine }]}>
          <Ionicons name="close" size={20} color={c.ink} />
        </Pressable>
        <Text style={{ fontFamily: font.display, fontSize: 20, color: c.ink }}>{isTeam ? 'Nytt lag' : 'Ny konkurranse'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 13.5, color: c.inkSoft, marginBottom: 18, lineHeight: 20 }}>
          {isTeam ? 'Lagets samlede skritt konkurrerer mot andre lag.' : 'Alle går for seg selv. Flest skritt i perioden vinner.'}
        </Text>

        <Label c={c}>{isTeam ? 'Lagnavn' : 'Navn på konkurransen'}</Label>
        <TextInput value={name} onChangeText={setName} autoFocus placeholder={isTeam ? 'f.eks. Lag Løvstakken' : 'f.eks. Sommerdytten'} placeholderTextColor={c.inkFaint}
          style={[styles.input, { borderColor: c.stoneLine, backgroundColor: c.surface, color: c.ink }]} />

        {!isTeam && (
          <>
            <Label c={c}>Hvor lenge?</Label>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DURATIONS.map((d) => {
                const on = d === duration;
                return (
                  <Pressable key={d} onPress={() => { tap(); setDuration(d); }} style={[styles.dur, { borderColor: on ? c.ember : c.stoneLine, backgroundColor: on ? c.emberGlow : c.surface }]}>
                    <Text style={{ fontFamily: font.display, fontSize: 19, color: on ? c.ember : c.ink }}>{d}</Text>
                    <Text style={{ fontSize: 10.5, color: c.inkSoft }}>dager</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.potSetup, { borderColor: c.stoneLine }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <LinearGradient colors={['#F4D58A', '#E8B14C']} style={styles.potIc}><Ionicons name="trophy" size={20} color="#5a3d08" /></LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: font.heading, fontSize: 15, color: c.ink }}>Legg til pengepott</Text>
                  <Text style={{ fontSize: 12, color: c.inkSoft, marginTop: 1 }}>Alle betaler likt · vinner tar alt</Text>
                </View>
                <Pressable onPress={() => { tap(); setPotOn((v) => !v); }} style={[styles.tgl, { backgroundColor: potOn ? c.ember : c.stoneLine }]}>
                  <View style={[styles.knob, potOn && { transform: [{ translateX: 20 }] }]} />
                </Pressable>
              </View>
              {potOn && (
                <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: c.stoneLine }}>
                  <Label c={c}>Innsats per person</Label>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {STAKES.map((s) => {
                      const on = s === stake;
                      return (
                        <Pressable key={s} onPress={() => { tap(); setStake(s); }} style={[styles.stake, { borderColor: on ? c.gold : c.stoneLine, backgroundColor: on ? 'rgba(232,177,76,0.12)' : c.surface }]}>
                          <Text style={{ fontFamily: font.heading, fontSize: 15, color: on ? '#a07a1a' : c.ink }}>kr {s}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <Text style={{ fontSize: 11.5, color: c.inkFaint, marginTop: 12, lineHeight: 16 }}>
                    Demo — ingen ekte betaling i appen. Oppgjør skjer mellom dere via Vipps.
                  </Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={[styles.hint, { backgroundColor: c.emberGlow, borderColor: 'rgba(255,107,26,0.2)' }]}>
          <Ionicons name="person-add" size={18} color={c.ember} />
          <Text style={{ flex: 1, fontSize: 12.5, color: c.ink, lineHeight: 17 }}>
            Du blir med automatisk. Etterpå får du en invitasjonskode å dele med venner.
          </Text>
        </View>

        <Pressable onPress={submit} disabled={!canCreate} style={[styles.cta, { backgroundColor: c.ember, opacity: canCreate ? 1 : 0.5 }]}>
          <Text style={{ color: '#fff', fontFamily: font.heading, fontSize: 15 }}>{busy ? 'Oppretter …' : isTeam ? 'Opprett lag' : 'Opprett konkurranse'}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Label({ c, children }: any) {
  return <Text style={{ fontSize: 12, fontFamily: font.bodyBold, color: c.ink, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 18, marginBottom: 10 }}>{children}</Text>;
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 12 },
  back: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { padding: 14, borderRadius: 14, borderWidth: 1, fontFamily: font.body, fontSize: 15 },
  dur: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  potSetup: { borderWidth: 1.5, borderRadius: 18, padding: 16, marginTop: 18 },
  potIc: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tgl: { width: 50, height: 30, borderRadius: 99, padding: 3, justifyContent: 'center' },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  stake: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14, marginTop: 22 },
  cta: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 16 },
});
