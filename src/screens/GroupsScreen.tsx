import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { Card, SectionHeader, Avatar, Pill, tap } from '../components/UI';
import { subscribeGroups, Group } from '../lib/db';

export default function GroupsScreen({ navigation }: any) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<Group[]>([]);
  useEffect(() => subscribeGroups(setGroups), []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.snow }}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 22, paddingBottom: 120 }}
      showsVerticalScrollIndicator={false}
    >
      <Text style={{ fontFamily: font.display, fontSize: 25, color: c.ink, letterSpacing: -0.6 }}>Grupper</Text>
      <Text style={{ fontFamily: font.body, fontSize: 13, color: c.inkSoft, marginTop: 4, marginBottom: 18 }}>Konkurrer med venner og kolleger</Text>

      <SectionHeader title="Opprett ny" />
      <CreateCard
        colors={['#3a6fd8', '#5b8def']}
        icon="people"
        title="Lagkamp"
        desc="Sett sammen et lag på 4 og konkurrer mot andre lag. Lagets samlede skritt avgjør."
        onPress={() => navigation.navigate('CreateGroup', { type: 'team' })}
      />
      <CreateCard
        colors={['#FF8A47', '#E2480A']}
        icon="trending-up"
        title="Konkurranse"
        desc="Inviter så mange du vil. Flest skritt vinner. Velg varighet og legg til pott."
        onPress={() => navigation.navigate('CreateGroup', { type: 'comp' })}
      />

      <SectionHeader title="Dine grupper" action={groups.length ? `${groups.length} aktive` : undefined} />
      {groups.length === 0 ? (
        <Card style={{ padding: 22, alignItems: 'center' }}>
          <Ionicons name="people-outline" size={32} color={c.inkFaint} />
          <Text style={{ color: c.inkSoft, marginTop: 10, textAlign: 'center', lineHeight: 19 }}>Du er ikke med i noen grupper ennå.{'\n'}Opprett en over, eller bli med via kode.</Text>
        </Card>
      ) : (
        <Card>
          {groups.map((g, i) => (
            <Pressable
              key={g.id}
              onPress={() => { tap(); navigation.navigate('GroupDetail', { id: g.id }); }}
              style={[styles.grow, i > 0 && { borderTopWidth: 1, borderTopColor: c.stoneLine }]}
            >
              <Avatar initial="" size={50} c1={g.c1} c2={g.c2} style={{ borderRadius: 16 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.heading, fontSize: 15.5, color: c.ink }}>{g.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Pill label={g.type === 'team' ? 'Lagkamp' : 'Konkurranse'} bg={g.type === 'team' ? 'rgba(91,141,239,0.15)' : c.emberGlow} color={g.type === 'team' ? '#5b8def' : c.emberDeep} />
                  <Text style={{ fontSize: 12, color: c.inkSoft }}>· {g.sub}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontFamily: font.display, fontSize: 17, color: c.ember }}>{g.pos}.</Text>
                <Text style={{ fontSize: 10.5, color: c.inkSoft }}>av {g.of}</Text>
              </View>
            </Pressable>
          ))}
        </Card>
      )}

      <Pressable
        style={[styles.codeBtn, { backgroundColor: c.surface, borderColor: c.stoneLine }]}
        onPress={() => { tap(); navigation.navigate('JoinGroup'); }}
      >
        <Ionicons name="enter-outline" size={17} color={c.ember} />
        <Text style={{ fontFamily: font.heading, fontSize: 14, color: c.ink }}>Bli med via kode</Text>
      </Pressable>
    </ScrollView>
  );
}

function CreateCard({ colors, icon, title, desc, onPress }: any) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }}>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.createCard}>
        <View style={styles.arrow}>
          <Ionicons name="chevron-forward" size={17} color="#fff" />
        </View>
        <View style={styles.gtIc}>
          <Ionicons name={icon} size={25} color="#fff" />
        </View>
        <Text style={{ fontFamily: font.display, fontSize: 19, color: '#fff', letterSpacing: -0.3 }}>{title}</Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.92)', marginTop: 5, lineHeight: 19, maxWidth: '88%' }}>{desc}</Text>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  createCard: { borderRadius: 24, padding: 20, marginBottom: 13 },
  arrow: { position: 'absolute', top: 22, right: 20, width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  gtIc: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  grow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  codeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 15, borderRadius: 16, borderWidth: 1.5, marginTop: 12 },
});
