import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { Avatar, tap } from '../components/UI';
import { useAuth } from '../lib/AuthContext';
import { useSettings } from '../lib/SettingsContext';
import { setGoal, setLeaderboardVisible } from '../lib/db';
import { scheduleStreakReminder, cancelStreakReminder } from '../lib/notifications';

const GOALS = [6000, 8000, 10000, 12000, 15000];

export default function SettingsScreen({ navigation }: any) {
  const { c, isDark, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile, signOut: doSignOut } = useAuth();
  const s = useSettings();
  const [visible, setVisible] = useState(true);

  const goal = profile?.goal ?? 10000;
  const cycleGoal = () => {
    tap();
    if (!user) return;
    const next = GOALS[(GOALS.indexOf(goal) + 1) % GOALS.length];
    setGoal(user.uid, next).catch(() => {});
  };

  const signOut = () => {
    Alert.alert('Logg ut', 'Vil du logge ut av Fjellfot?', [
      { text: 'Avbryt', style: 'cancel' },
      { text: 'Logg ut', style: 'destructive', onPress: () => doSignOut() },
    ]);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.snow }} contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 22, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <Text style={{ fontFamily: font.display, fontSize: 25, color: c.ink, letterSpacing: -0.6 }}>Innstillinger</Text>
      <Text style={{ fontFamily: font.body, fontSize: 13, color: c.inkSoft, marginTop: 4, marginBottom: 18 }}>Konto, app og varsler</Text>

      <Pressable onPress={() => { tap(); navigation.navigate('EditProfile'); }} style={[styles.profile, { backgroundColor: c.surface, borderColor: c.stoneLine }]}>
        <Avatar initial={profile?.initial ?? '🙂'} size={56} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: font.heading, fontSize: 17, color: c.ink }}>{profile?.name ?? 'Profil'}</Text>
          <Text style={{ fontSize: 13, color: c.inkSoft, marginTop: 2 }}>{user?.phoneNumber ?? profile?.city ?? ''}</Text>
        </View>
        <Text style={{ fontSize: 13, color: c.ember, fontFamily: font.bodyBold }}>Rediger</Text>
      </Pressable>

      <Group label="Utseende" c={c}>
        <Row c={c} icon="moon" g={['#3a3a4a', '#1f1f2e']} title="Mørk modus" sub="Magisk kart om kvelden">
          <Switch value={isDark} onValueChange={() => { tap(); toggle(); }} trackColor={{ true: c.ember, false: c.stoneLine }} thumbColor="#fff" />
        </Row>
        <Row c={c} icon="language" g={['#5b8def', '#3a6fd8']} title="Språk" sub="Appens språk" val={s.language === 'nb' ? 'Norsk' : 'English'} chevron last
          onPress={() => { tap(); s.set('language', s.language === 'nb' ? 'en' : 'nb'); }} />
      </Group>

      <Group label="Aktivitet og mål" c={c}>
        <Row c={c} icon="time" g={['#FF8A47', '#E2480A']} title="Daglig skrittmål" sub="Mål for ringen" val={goal.toLocaleString('nb-NO')} chevron onPress={cycleGoal} />
        <Row c={c} icon="pulse" g={['#3fb56e', '#2a8a4f']} title="Helsesynkronisering" sub="Apple Health (dev build)">
          <Switch value={s.healthSync} onValueChange={(v) => { tap(); s.set('healthSync', v); }} trackColor={{ true: c.ember, false: c.stoneLine }} thumbColor="#fff" />
        </Row>
        <Row c={c} icon="speedometer" g={['#9c6b8a', '#7a4f6b']} title="Enheter" sub="Distanse" val={s.units === 'metric' ? 'Metrisk' : 'Imperial'} chevron last
          onPress={() => { tap(); s.set('units', s.units === 'metric' ? 'imperial' : 'metric'); }} />
      </Group>

      <Group label="Varsler" c={c}>
        <Row c={c} icon="notifications" g={['#f0a93c', '#d97f1a']} title="Push-varsler" sub="Turneringer og pott">
          <Switch value={s.push} onValueChange={(v) => { tap(); s.set('push', v); }} trackColor={{ true: c.ember, false: c.stoneLine }} thumbColor="#fff" />
        </Row>
        <Row c={c} icon="flame" g={['#FF8A47', '#E2480A']} title="Streak-påminnelse" sub="Daglig kl. 20:00">
          <Switch
            value={s.streak}
            onValueChange={async (v) => {
              tap();
              if (v) { const ok = await scheduleStreakReminder(20, 0); s.set('streak', ok); }
              else { await cancelStreakReminder(); s.set('streak', false); }
            }}
            trackColor={{ true: c.ember, false: c.stoneLine }} thumbColor="#fff"
          />
        </Row>
        <Row c={c} icon="partly-sunny" g={['#5b8def', '#3a6fd8']} title="Turvær-tips" sub="Når det passer å gå tur" last>
          <Switch value={s.weather} onValueChange={(v) => { tap(); s.set('weather', v); }} trackColor={{ true: c.ember, false: c.stoneLine }} thumbColor="#fff" />
        </Row>
      </Group>

      <Group label="Personvern og sosialt" c={c}>
        <Row c={c} icon="shield-checkmark" g={['#3fb56e', '#2a8a4f']} title="Synlig på topplisten" sub="Vis meg nasjonalt" last>
          <Switch value={visible} onValueChange={(v) => { tap(); setVisible(v); if (user) setLeaderboardVisible(user.uid, v).catch(() => {}); }} trackColor={{ true: c.ember, false: c.stoneLine }} thumbColor="#fff" />
        </Row>
      </Group>

      <Pressable style={[styles.signout, { backgroundColor: c.surface, borderColor: c.stoneLine }]} onPress={signOut}>
        <Text style={{ color: '#d4452f', fontFamily: font.heading, fontSize: 14 }}>Logg ut</Text>
      </Pressable>
      <Text style={{ textAlign: 'center', fontSize: 11, color: c.inkFaint, marginTop: 18 }}>Fjellfot 1.0.0 · Laget i Norge</Text>
    </ScrollView>
  );
}

function Group({ label, c, children }: any) {
  return (
    <View style={{ marginBottom: 22 }}>
      <Text style={{ fontSize: 12, fontFamily: font.bodyBold, color: c.inkSoft, textTransform: 'uppercase', letterSpacing: 0.7, marginHorizontal: 6, marginBottom: 10 }}>{label}</Text>
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.stoneLine, borderRadius: 20, overflow: 'hidden' }}>{children}</View>
    </View>
  );
}

function Row({ c, icon, g, title, sub, children, chevron, val, last, onPress }: any) {
  const body = (
    <View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: c.stoneLine }]}>
      <View style={styles.rowIc}>
        <Ionicons name={icon} size={23} color={Array.isArray(g) ? g[0] : c.ember} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: font.semi, fontSize: 15, color: c.ink }}>{title}</Text>
        <Text style={{ fontSize: 12, color: c.inkSoft, marginTop: 1 }}>{sub}</Text>
      </View>
      {val ? <Text style={{ fontSize: 13, color: c.inkFaint, fontFamily: font.body, marginRight: 4 }}>{val}</Text> : null}
      {children}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={c.inkFaint} /> : null}
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderWidth: 1, borderRadius: 22, marginBottom: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  rowIc: { width: 30, alignItems: 'center', justifyContent: 'center' },
  signout: { padding: 15, borderWidth: 1.5, borderRadius: 16, alignItems: 'center', marginTop: 6 },
});
