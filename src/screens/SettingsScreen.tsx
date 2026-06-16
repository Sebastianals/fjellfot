import React from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { Avatar, tap } from '../components/UI';
import { useAuth } from '../lib/AuthContext';

const CATEGORIES: { cat: string; icon: any; title: string; sub: string }[] = [
  { cat: 'appearance', icon: 'color-palette', title: 'Utseende', sub: 'Mørk modus, språk' },
  { cat: 'activity', icon: 'walk', title: 'Aktivitet og mål', sub: 'Skrittmål, enheter, helse' },
  { cat: 'notifications', icon: 'notifications', title: 'Varsler', sub: 'Push, streak, turvær' },
  { cat: 'privacy', icon: 'lock-closed', title: 'Personvern', sub: 'Synlighet på topplisten' },
];

export default function SettingsScreen({ navigation }: any) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut: doSignOut } = useAuth();

  const signOut = () => {
    Alert.alert('Logg ut', 'Vil du logge ut av Fjellfot?', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Logg ut', style: 'destructive', onPress: () => doSignOut() },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.snow }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 22, paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontFamily: font.display, fontSize: 25, color: c.ink, letterSpacing: -0.6 }}>Innstillinger</Text>
      <Text style={{ fontFamily: font.body, fontSize: 13, color: c.inkSoft, marginTop: 4, marginBottom: 18 }}>Konto, app og varsler</Text>

      <Pressable onPress={() => { tap(); navigation.navigate('EditProfile'); }} style={[styles.profile, { backgroundColor: c.surface, borderColor: c.stoneLine }]}>
        <Avatar initial={profile?.initial ?? '🙂'} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: font.heading, fontSize: 17, color: c.ink }}>{profile?.name ?? 'Profil'}</Text>
          <Text style={{ fontSize: 13, color: c.inkSoft, marginTop: 2 }}>{user?.phoneNumber ?? (profile?.city ? `Postnr. ${profile.city}` : 'Trykk for å redigere')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={c.inkFaint} />
      </Pressable>

      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.stoneLine }]}>
        {CATEGORIES.map((cat, i) => (
          <Pressable key={cat.cat} onPress={() => { tap(); navigation.navigate('SettingsDetail', { cat: cat.cat }); }} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: c.stoneLine }]}>
            <Ionicons name={cat.icon} size={22} color={c.ember} style={{ width: 30 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: font.semi, fontSize: 15, color: c.ink }}>{cat.title}</Text>
              <Text style={{ fontSize: 12, color: c.inkSoft, marginTop: 1 }}>{cat.sub}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={c.inkFaint} />
          </Pressable>
        ))}
      </View>

      <Pressable style={[styles.signout, { backgroundColor: c.surface, borderColor: c.stoneLine }]} onPress={signOut}>
        <Text style={{ color: '#d4452f', fontFamily: font.heading, fontSize: 14 }}>Logg ut</Text>
      </Pressable>
      <Text style={{ textAlign: 'center', fontSize: 11, color: c.inkFaint, marginTop: 18 }}>Fjellfot 1.0.0 · Laget i Norge</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderWidth: 1, borderRadius: 22, marginBottom: 22 },
  card: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 17 },
  signout: { padding: 15, borderWidth: 1.5, borderRadius: 16, alignItems: 'center', marginTop: 22 },
});
