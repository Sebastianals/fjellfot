import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { tap } from '../components/UI';
import { addPoi } from '../lib/db';

const DIFFS = [
  { label: 'Lett', c1: '#3fb56e', c2: '#2a8a4f' },
  { label: 'Moderat', c1: '#5b8def', c2: '#3a6fd8' },
  { label: 'Krevende', c1: '#FF8A47', c2: '#E2480A' },
];

export default function AddPlaceScreen({ route, navigation }: any) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  // Map passes its current center so the pin lands where the user is looking.
  const center = route.params?.center ?? { latitude: 60.39, longitude: 5.32 };
  const [name, setName] = useState('');
  const [diff, setDiff] = useState(0);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    tap();
    setBusy(true);
    const d = DIFFS[diff];
    try {
      await addPoi({
        name: name.trim(), dist: 'nylig lagt til', diff: d.label, rating: 0,
        trips: 'ny', lat: center.latitude, lng: center.longitude, c1: d.c1, c2: d.c2,
      });
      navigation.goBack();
    } catch {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.snow }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.head, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => { tap(); navigation.goBack(); }} hitSlop={8} style={[styles.back, { borderColor: c.stoneLine }]}>
          <Ionicons name="close" size={20} color={c.ink} />
        </Pressable>
        <Text style={{ fontFamily: font.display, fontSize: 20, color: c.ink }}>Legg til tursted</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 22 }} keyboardShouldPersistTaps="handled">
        <Text style={{ fontSize: 13.5, color: c.inkSoft, marginBottom: 18, lineHeight: 20 }}>
          Del favorittstedet ditt. Det vises på kartet for alle med en gang.
        </Text>

        <Text style={styles.label(c)}>Navn på stedet</Text>
        <TextInput value={name} onChangeText={setName} placeholder="f.eks. Stoltzekleiven" placeholderTextColor={c.inkFaint}
          style={[styles.input, { borderColor: c.stoneLine, backgroundColor: c.surface, color: c.ink }]} />

        <Text style={styles.label(c)}>Plassering</Text>
        <View style={[styles.input, { borderColor: c.stoneLine, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
          <Ionicons name="location" size={16} color={c.ember} />
          <Text style={{ color: c.inkSoft, fontSize: 14 }}>
            {center.latitude.toFixed(3)}, {center.longitude.toFixed(3)} (kartsenter)
          </Text>
        </View>

        <Text style={styles.label(c)}>Vanskelighetsgrad</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {DIFFS.map((d, i) => {
            const on = i === diff;
            return (
              <Pressable key={d.label} onPress={() => { tap(); setDiff(i); }} style={[styles.chip, { borderColor: on ? c.ember : c.stoneLine, backgroundColor: on ? c.emberGlow : c.surface }]}>
                <Text style={{ fontFamily: font.semi, fontSize: 13, color: on ? c.ember : c.inkSoft }}>{d.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={submit} disabled={busy || !name.trim()} style={[styles.cta, { backgroundColor: c.ember, opacity: busy || !name.trim() ? 0.5 : 1 }]}>
          <Text style={{ color: '#fff', fontFamily: font.heading, fontSize: 15 }}>{busy ? 'Sender …' : 'Send inn tursted'}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 12 } as const,
  back: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' } as const,
  input: { padding: 14, borderRadius: 14, borderWidth: 1, fontFamily: font.body, fontSize: 15 } as const,
  chip: { flex: 1, paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' } as const,
  cta: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 28 } as const,
  label: (c: any) => ({ fontSize: 12, fontFamily: font.bodyBold, color: c.ink, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 14, marginBottom: 10 }),
};
