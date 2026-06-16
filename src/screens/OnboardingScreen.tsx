import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, useWindowDimensions, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { tap } from '../components/UI';

const slides = [
  { icon: 'map', g: ['#211C18', '#3d2f24'], title: 'Gå mer.\nLås opp Norge.', text: 'Hvert skritt fargelegger kartet ditt. Start grått, og avdekk landet sone for sone mens du går.' },
  { icon: 'grid', g: ['#2a1f16', '#4a2f1a'], title: 'Erobre soner', text: 'Norge er delt i tusenvis av soner. Vær først til å sette foten din, og gjør dem til dine.' },
  { icon: 'trophy', g: ['#1d1814', '#3a2d1a'], title: 'Spill om potten', text: 'Lag konkurranser med venner. Flest skritt vinner potten — oppgjøret skjer enkelt via Vipps.' },
  { icon: 'footsteps', g: ['#16120F', '#2c241d'], title: 'Følg fremgangen', text: 'Daglig skrittring, nivåer og prestasjoner. Fjellfot synkroniserer med Apple Health.' },
];

export default function OnboardingScreen({ navigation }: any) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(0);
  const scroller = useRef<ScrollView>(null);

  const finish = async () => {
    tap();
    await AsyncStorage.setItem('fjellfot.onboarded', '1');
    navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
  };

  const next = () => {
    tap();
    if (index < slides.length - 1) {
      scroller.current?.scrollTo({ x: (index + 1) * width, animated: true });
      setIndex(index + 1);
    } else finish();
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  const slide = slides[index];

  return (
    <View style={{ flex: 1, backgroundColor: c.snow }}>
      <Pressable onPress={finish} style={[styles.skip, { top: insets.top + 12 }]} hitSlop={10}>
        <Text style={{ color: '#fff', fontFamily: font.bodyBold, fontSize: 14 }}>Hopp over</Text>
      </Pressable>

      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        style={{ flex: 1 }}
      >
        {slides.map((s, i) => (
          <LinearGradient key={i} colors={s.g as any} style={{ width, flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <View style={styles.iconWrap}>
              <Ionicons name={s.icon as any} size={120} color="#FF6B1A" />
            </View>
          </LinearGradient>
        ))}
      </ScrollView>

      <View style={[styles.bottom, { backgroundColor: c.surface, paddingBottom: insets.bottom + 40 }]}>
        <View style={{ flexDirection: 'row', gap: 7, marginBottom: 22 }}>
          {slides.map((_, i) => (
            <View key={i} style={{ width: i === index ? 22 : 7, height: 7, borderRadius: 99, backgroundColor: i === index ? c.ember : c.stoneLine }} />
          ))}
        </View>
        <Text style={{ fontFamily: font.display, fontSize: 26, color: c.ink, letterSpacing: -0.6, lineHeight: 30 }}>{slide.title}</Text>
        <Text style={{ fontSize: 14.5, color: c.inkSoft, lineHeight: 22, marginTop: 10, minHeight: 66 }}>{slide.text}</Text>
        <Pressable style={[styles.btn, { backgroundColor: c.ember }]} onPress={next}>
          <Text style={{ color: '#fff', fontFamily: font.heading, fontSize: 16 }}>{index === slides.length - 1 ? 'Kom i gang' : 'Neste'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skip: { position: 'absolute', right: 26, zIndex: 5, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99 },
  iconWrap: { width: 200, height: 200, borderRadius: 60, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,107,26,0.08)', borderWidth: 1, borderColor: 'rgba(255,107,26,0.2)' },
  bottom: { borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingHorizontal: 30, paddingTop: 32 },
  btn: { padding: 17, borderRadius: 18, alignItems: 'center', marginTop: 22 },
});
