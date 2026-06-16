import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { Avatar, tap } from '../components/UI';
import { useAuth } from '../lib/AuthContext';
import { updateProfile } from '../lib/db';
import { lookupPostal } from '../lib/geo';

export default function EditProfileScreen({ navigation }: any) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [postal, setPostal] = useState(profile?.city ?? '');
  const [busy, setBusy] = useState(false);

  const detect = async () => {
    tap();
    const r = await lookupPostal();
    if (r) setPostal(r.postal);
  };

  const save = async () => {
    if (!user || !name.trim()) return;
    tap();
    setBusy(true);
    try {
      await updateProfile(user.uid, name.trim(), postal.trim());
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
        <Text style={{ fontFamily: font.display, fontSize: 20, color: c.ink }}>Rediger profil</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ padding: 22 }}>
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <Avatar initial={(name.trim()[0] || 'S').toUpperCase()} size={84} style={{ borderRadius: 28 }} />
        </View>

        <Text style={styles.label(c)}>Navn</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Fornavn og etternavn" placeholderTextColor={c.inkFaint}
          style={[styles.input, { borderColor: c.stoneLine, backgroundColor: c.surface, color: c.ink }]} />

        <Text style={styles.label(c)}>Postnummer</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TextInput value={postal} onChangeText={(t) => setPostal(t.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" placeholder="0000" placeholderTextColor={c.inkFaint}
            style={[styles.input, { flex: 1, borderColor: c.stoneLine, backgroundColor: c.surface, color: c.ink, fontFamily: font.heading, letterSpacing: 2 }]} />
          <Pressable onPress={detect} style={{ width: 54, borderRadius: 14, borderWidth: 1, borderColor: c.stoneLine, backgroundColor: c.snow, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <Ionicons name="locate-outline" size={20} color={c.ember} />
          </Pressable>
        </View>

        <Pressable onPress={save} disabled={busy || !name.trim()} style={[styles.cta, { backgroundColor: c.ember, opacity: busy || !name.trim() ? 0.5 : 1 }]}>
          <Text style={{ color: '#fff', fontFamily: font.heading, fontSize: 15 }}>{busy ? 'Lagrer …' : 'Lagre endringer'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = {
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 12 } as const,
  back: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' } as const,
  input: { padding: 14, borderRadius: 14, borderWidth: 1, fontFamily: font.body, fontSize: 15, marginBottom: 4 } as const,
  cta: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 28 } as const,
  label: (c: any) => ({ fontSize: 12, fontFamily: font.bodyBold, color: c.ink, textTransform: 'uppercase' as const, letterSpacing: 0.5, marginTop: 14, marginBottom: 10 }),
};
