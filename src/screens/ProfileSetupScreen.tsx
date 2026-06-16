import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { Avatar, tap } from '../components/UI';
import { useAuth } from '../lib/AuthContext';
import { lookupPostal } from '../lib/geo';

export default function ProfileSetupScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { completeProfile } = useAuth();
  const [name, setName] = useState('');
  const [postal, setPostal] = useState('');
  const [place, setPlace] = useState('');
  const [locating, setLocating] = useState(true);
  const [busy, setBusy] = useState(false);

  const detect = async () => {
    setLocating(true);
    const r = await lookupPostal();
    if (r) { setPostal(r.postal); setPlace(r.place ?? ''); }
    setLocating(false);
  };
  useEffect(() => { detect(); }, []);

  const save = async () => {
    if (name.trim().length < 2) return;
    tap();
    setBusy(true);
    try {
      await completeProfile(name.trim(), postal.trim() || 'Norge');
    } catch (e: any) {
      setBusy(false);
      Alert.alert('Kunne ikke lagre', String(e?.message || e));
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.snow }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, paddingTop: insets.top + 40, paddingHorizontal: 28 }}>
        <View style={{ alignItems: 'center', marginBottom: 26 }}>
          <Avatar initial={(name.trim()[0] || '🙂').toUpperCase()} size={88} style={{ borderRadius: 28 }} />
        </View>
        <Text style={{ fontFamily: font.display, fontSize: 27, color: c.ink, letterSpacing: -0.6, textAlign: 'center' }}>Sett opp profilen</Text>
        <Text style={{ fontSize: 14, color: c.inkSoft, marginVertical: 10, marginBottom: 28, textAlign: 'center' }}>Slik vises du for venner og på topplisten.</Text>

        <Text style={styles.label(c)}>Navn</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Fornavn og etternavn" placeholderTextColor={c.inkFaint} autoFocus
          style={[styles.input, { borderColor: c.stoneLine, backgroundColor: c.surface, color: c.ink }]} />

        <Text style={styles.label(c)}>Postnummer</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput value={postal} onChangeText={(t) => setPostal(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" placeholder="0000" placeholderTextColor={c.inkFaint}
            style={[styles.input, { flex: 1, borderColor: c.stoneLine, backgroundColor: c.surface, color: c.ink, fontFamily: font.heading, letterSpacing: 2 }]} />
          <Pressable onPress={() => { tap(); detect(); }} style={[styles.locBtn, { borderColor: c.stoneLine, backgroundColor: c.snow }]}>
            <Ionicons name={locating ? 'locate' : 'locate-outline'} size={20} color={c.ember} />
          </Pressable>
        </View>
        <Text style={{ fontSize: 12, color: c.inkFaint, marginTop: 8 }}>
          {locating ? 'Finner posisjonen din …' : place ? `${postal} ${place}` : 'Trykk på 📍 for å hente postnummeret automatisk.'}
        </Text>

        <View style={{ flex: 1 }} />
        <Pressable onPress={save} disabled={busy || name.trim().length < 2} style={[styles.btn, { backgroundColor: c.ember, marginBottom: insets.bottom + 16, opacity: busy || name.trim().length < 2 ? 0.5 : 1 }]}>
          <Text style={{ color: '#fff', fontFamily: font.heading, fontSize: 16 }}>{busy ? 'Lagrer …' : 'Fullfør og start'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = {
  input: { padding: 16, borderRadius: 15, borderWidth: 1.5, fontFamily: font.body, fontSize: 16 } as const,
  locBtn: { width: 56, borderRadius: 15, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' } as const,
  btn: { padding: 17, borderRadius: 18, alignItems: 'center' } as const,
  label: (c: any) => ({ fontSize: 12, fontFamily: font.bodyBold, color: c.ink, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginBottom: 10, marginTop: 4 }),
};
