import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { tap } from '../components/UI';
import { useAuth } from '../lib/AuthContext';
import { joinGroupByCode } from '../lib/db';

export default function JoinGroupScreen({ navigation }: any) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const join = async () => {
    if (!user || code.trim().length < 4) return;
    tap();
    setBusy(true);
    setError('');
    try {
      const id = await joinGroupByCode(code, user.uid, profile?.name ?? 'Du');
      if (id) navigation.replace('GroupDetail', { id });
      else { setError('Fant ingen gruppe med den koden.'); setBusy(false); }
    } catch {
      setError('Noe gikk galt. Prøv igjen.');
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.snow }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.head, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => { tap(); navigation.goBack(); }} hitSlop={8} style={[styles.back, { borderColor: c.stoneLine }]}>
          <Ionicons name="close" size={20} color={c.ink} />
        </Pressable>
        <Text style={{ fontFamily: font.display, fontSize: 20, color: c.ink }}>Bli med i gruppe</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={{ padding: 22 }}>
        <Text style={{ fontSize: 13.5, color: c.inkSoft, marginBottom: 22, lineHeight: 20 }}>
          Skriv inn invitasjonskoden du fikk fra en venn.
        </Text>
        <TextInput
          value={code}
          onChangeText={(t) => { setCode(t.toUpperCase()); setError(''); }}
          placeholder="KODE"
          placeholderTextColor={c.inkFaint}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          style={[styles.input, { borderColor: error ? '#d4452f' : c.stoneLine, backgroundColor: c.surface, color: c.ink }]}
        />
        {error ? <Text style={{ color: '#d4452f', fontSize: 12.5, marginTop: 10 }}>{error}</Text> : null}
        <Pressable onPress={join} disabled={busy || code.trim().length < 4} style={[styles.cta, { backgroundColor: c.ember, opacity: busy || code.trim().length < 4 ? 0.5 : 1 }]}>
          <Text style={{ color: '#fff', fontFamily: font.heading, fontSize: 15 }}>{busy ? 'Blir med …' : 'Bli med'}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 12 },
  back: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { padding: 18, borderRadius: 16, borderWidth: 1.5, fontFamily: font.display, fontSize: 24, letterSpacing: 4, textAlign: 'center' },
  cta: { padding: 16, borderRadius: 16, alignItems: 'center', marginTop: 28 },
});
