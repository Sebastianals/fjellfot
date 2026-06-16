import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { tap } from '../components/UI';
import { useAuth } from '../lib/AuthContext';
import { useSettings } from '../lib/SettingsContext';
import { setGoal, setLeaderboardVisible } from '../lib/db';
import { scheduleStreakReminder, cancelStreakReminder } from '../lib/notifications';

const GOALS = [6000, 8000, 10000, 12000, 15000];

const TITLES: Record<string, string> = {
  appearance: 'Utseende',
  activity: 'Aktivitet og mål',
  notifications: 'Varsler',
  privacy: 'Personvern',
};

export default function SettingsDetailScreen({ route, navigation }: any) {
  const cat: string = route.params?.cat ?? 'appearance';
  const { c, isDark, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, profile } = useAuth();
  const s = useSettings();
  const [visible, setVisible] = useState(true);

  const goal = profile?.goal ?? 10000;
  const cycleGoal = () => { tap(); if (user) setGoal(user.uid, GOALS[(GOALS.indexOf(goal) + 1) % GOALS.length]).catch(() => {}); };

  return (
    <View style={{ flex: 1, backgroundColor: c.snow }}>
      <View style={[styles.head, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => { tap(); navigation.goBack(); }} hitSlop={8} style={[styles.back, { borderColor: c.stoneLine }]}>
          <Ionicons name="chevron-back" size={20} color={c.ink} />
        </Pressable>
        <Text style={{ fontFamily: font.display, fontSize: 20, color: c.ink }}>{TITLES[cat]}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.stoneLine }]}>
          {cat === 'appearance' && (
            <>
              <Row c={c} icon="moon" title="Mørk modus" sub="Magisk kart om kvelden">
                <Switch value={isDark} onValueChange={() => { tap(); toggle(); }} trackColor={{ true: c.ember, false: c.stoneLine }} thumbColor="#fff" />
              </Row>
              <Row c={c} icon="language" title="Språk" sub="Appens språk" val={s.language === 'nb' ? 'Norsk' : 'English'} last onPress={() => { tap(); s.set('language', s.language === 'nb' ? 'en' : 'nb'); }} chevron />
            </>
          )}
          {cat === 'activity' && (
            <>
              <Row c={c} icon="walk" title="Daglig skrittmål" sub="Mål for ringen" val={goal.toLocaleString('nb-NO')} onPress={cycleGoal} chevron />
              <Row c={c} icon="speedometer" title="Enheter" sub="Distanse" val={s.units === 'metric' ? 'Metrisk' : 'Imperial'} onPress={() => { tap(); s.set('units', s.units === 'metric' ? 'imperial' : 'metric'); }} chevron />
              <Row c={c} icon="pulse" title="Helsesynkronisering" sub="Apple Health (dev build)" last>
                <Switch value={s.healthSync} onValueChange={(v) => { tap(); s.set('healthSync', v); }} trackColor={{ true: c.ember, false: c.stoneLine }} thumbColor="#fff" />
              </Row>
            </>
          )}
          {cat === 'notifications' && (
            <>
              <Row c={c} icon="notifications" title="Push-varsler" sub="Turneringer og pott">
                <Switch value={s.push} onValueChange={(v) => { tap(); s.set('push', v); }} trackColor={{ true: c.ember, false: c.stoneLine }} thumbColor="#fff" />
              </Row>
              <Row c={c} icon="flame" title="Streak-påminnelse" sub="Daglig kl. 20:00">
                <Switch value={s.streak} onValueChange={async (v) => { tap(); if (v) { const ok = await scheduleStreakReminder(20, 0); s.set('streak', ok); } else { await cancelStreakReminder(); s.set('streak', false); } }} trackColor={{ true: c.ember, false: c.stoneLine }} thumbColor="#fff" />
              </Row>
              <Row c={c} icon="partly-sunny" title="Turvær-tips" sub="Når det passer å gå tur" last>
                <Switch value={s.weather} onValueChange={(v) => { tap(); s.set('weather', v); }} trackColor={{ true: c.ember, false: c.stoneLine }} thumbColor="#fff" />
              </Row>
            </>
          )}
          {cat === 'privacy' && (
            <Row c={c} icon="shield-checkmark" title="Synlig på topplisten" sub="Vis meg nasjonalt" last>
              <Switch value={visible} onValueChange={(v) => { tap(); setVisible(v); if (user) setLeaderboardVisible(user.uid, v).catch(() => {}); }} trackColor={{ true: c.ember, false: c.stoneLine }} thumbColor="#fff" />
            </Row>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Row({ c, icon, title, sub, children, chevron, val, last, onPress }: any) {
  const body = (
    <View style={[styles.row, !last && { borderBottomWidth: 1, borderBottomColor: c.stoneLine }]}>
      <Ionicons name={icon} size={22} color={c.ember} style={{ width: 28 }} />
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
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingBottom: 12 },
  back: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderWidth: 1, borderRadius: 20, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 16 },
});
