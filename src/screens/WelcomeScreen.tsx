import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { useTheme } from '../theme/ThemeContext';
import { font } from '../theme/theme';
import { tap } from '../components/UI';
import { firebaseConfig } from '../lib/firebase';
import { requestOtp, confirmOtp, toE164, setRecaptcha } from '../lib/phoneAuth';

type Step = 'welcome' | 'phone' | 'otp';
const HERO = 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=900&q=70';

export default function WelcomeScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const recaptcha = useRef<FirebaseRecaptchaVerifierModal>(null);
  const [step, setStep] = useState<Step>('welcome');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [otpError, setOtpError] = useState(false);

  useEffect(() => { setRecaptcha(recaptcha.current); }, [step]);

  const sendCode = async () => {
    tap();
    setBusy(true);
    try {
      setRecaptcha(recaptcha.current);
      await requestOtp(toE164(phone));
      setCode(''); setOtpError(false); setStep('otp');
    } catch (e: any) {
      Alert.alert('Kunne ikke sende kode', String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async () => {
    tap();
    setBusy(true);
    try {
      const ok = await confirmOtp(code);
      // On success, Firebase signs in → the root navigator swaps automatically.
      if (!ok) setOtpError(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.snow }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FirebaseRecaptchaVerifierModal ref={recaptcha} firebaseConfig={firebaseConfig} title="Bekreft at du er ekte" cancelLabel="Avbryt" />

      {step === 'welcome' && (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <Image source={HERO} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
            <LinearGradient colors={['rgba(20,16,12,0.35)', 'rgba(20,16,12,0.85)']} style={StyleSheet.absoluteFill} />
            <View style={[styles.brand, { top: insets.top + 90 }]}>
              <LinearGradient colors={['#FF8A47', '#E2480A']} style={styles.mark}>
                <Ionicons name="triangle" size={44} color="#fff" />
              </LinearGradient>
              <Text style={{ fontFamily: font.display, fontSize: 40, color: '#FBFAF7', letterSpacing: -1 }}>Fjellfot</Text>
              <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 6 }}>Gå mer. Lås opp Norge.</Text>
            </View>
          </View>
          <View style={[styles.sheet, { backgroundColor: c.surface, paddingBottom: insets.bottom + 30 }]}>
            <Text style={{ fontFamily: font.display, fontSize: 24, color: c.ink, textAlign: 'center', letterSpacing: -0.5 }}>Velkommen til turen</Text>
            <Text style={{ fontSize: 14, color: c.inkSoft, textAlign: 'center', marginTop: 9, marginBottom: 22, lineHeight: 21 }}>
              Tell skritt, erobre kartet sone for sone, og konkurrer med venner.
            </Text>
            <Pressable style={[styles.btn, { backgroundColor: c.ember }]} onPress={() => { tap(); setStep('phone'); }}>
              <Ionicons name="call" size={19} color="#fff" />
              <Text style={styles.btnTxt}>Fortsett med telefon</Text>
            </Pressable>
            <Text style={{ textAlign: 'center', fontSize: 12, color: c.inkFaint, marginTop: 18, lineHeight: 18 }}>
              Ved å fortsette godtar du <Text style={{ color: c.ember, fontFamily: font.bodyBold }}>vilkårene</Text> og{' '}
              <Text style={{ color: c.ember, fontFamily: font.bodyBold }}>personvernerklæringen</Text>.
            </Text>
          </View>
        </View>
      )}

      {step !== 'welcome' && (
        <View style={{ flex: 1, paddingTop: insets.top + 12, paddingHorizontal: 28 }}>
          <Pressable onPress={() => { tap(); setStep(step === 'otp' ? 'phone' : 'welcome'); }} style={[styles.back, { borderColor: c.stoneLine, backgroundColor: c.surface }]}>
            <Ionicons name="chevron-back" size={20} color={c.ink} />
          </Pressable>

          {step === 'phone' && (
            <View style={{ flex: 1, paddingTop: 28 }}>
              <Text style={{ fontFamily: font.display, fontSize: 27, color: c.ink, letterSpacing: -0.6 }}>Hva er nummeret ditt?</Text>
              <Text style={{ fontSize: 14, color: c.inkSoft, marginVertical: 10, marginBottom: 28 }}>Vi sender deg en engangskode på SMS for å bekrefte.</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={[styles.cc, { borderColor: c.stoneLine, backgroundColor: c.snow }]}>
                  <Text style={{ fontSize: 18 }}>🇳🇴</Text>
                  <Text style={{ fontFamily: font.heading, fontSize: 16, color: c.ink }}>+47</Text>
                </View>
                <TextInput
                  value={phone} onChangeText={setPhone} keyboardType="number-pad" autoFocus
                  placeholder="412 34 567" placeholderTextColor={c.inkFaint}
                  style={[styles.input, { borderColor: c.stoneLine, backgroundColor: c.snow, color: c.ink }]}
                />
              </View>
              <Text style={{ fontSize: 12, color: c.inkFaint, marginTop: 14, lineHeight: 18 }}>Standard SMS-takster kan gjelde. Nummeret brukes kun til innlogging.</Text>
              <View style={{ flex: 1 }} />
              <Pressable style={[styles.btn, { backgroundColor: c.ember, marginBottom: insets.bottom + 14, opacity: phone.replace(/\D/g, '').length >= 8 && !busy ? 1 : 0.5 }]} disabled={phone.replace(/\D/g, '').length < 8 || busy} onPress={sendCode}>
                <Text style={styles.btnTxt}>{busy ? 'Sender …' : 'Send kode'}</Text>
              </Pressable>
            </View>
          )}

          {step === 'otp' && (
            <View style={{ flex: 1, paddingTop: 28 }}>
              <Text style={{ fontFamily: font.display, fontSize: 27, color: c.ink, letterSpacing: -0.6 }}>Skriv inn koden</Text>
              <Text style={{ fontSize: 14, color: c.inkSoft, marginVertical: 10, marginBottom: 22 }}>
                Sendt til <Text style={{ fontFamily: font.heading, color: c.ink }}>+47 {phone}</Text>
              </Text>
              <OtpBoxes value={code} onChange={(v) => { setCode(v); setOtpError(false); }} />
              {otpError ? <Text style={{ color: '#d4452f', fontSize: 13, textAlign: 'center' }}>Ugyldig kode — prøv igjen.</Text> : null}
              <View style={{ flex: 1 }} />
              <Pressable style={[styles.btn, { backgroundColor: c.ember, marginBottom: insets.bottom + 14, opacity: code.length === 6 && !busy ? 1 : 0.5 }]} disabled={code.length !== 6 || busy} onPress={verifyCode}>
                <Text style={styles.btnTxt}>{busy ? 'Bekrefter …' : 'Bekreft'}</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { c } = useTheme();
  const ref = useRef<TextInput>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 }}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const filled = i < value.length;
        const active = i === value.length;
        return (
          <View key={i} style={[styles.otpBox, { borderColor: filled || active ? c.ember : c.stoneLine, backgroundColor: filled ? c.emberGlow : c.snow }]}>
            <Text style={{ fontFamily: font.display, fontSize: 24, color: c.ink }}>{value[i] ?? ''}</Text>
          </View>
        );
      })}
      <TextInput ref={ref} value={value} onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, 6))} keyboardType="number-pad" autoFocus maxLength={6} style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  brand: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  mark: { width: 84, height: 84, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  sheet: { borderTopLeftRadius: 38, borderTopRightRadius: 38, padding: 28, paddingTop: 30, marginTop: -32 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 17, borderRadius: 18 },
  btnTxt: { color: '#fff', fontFamily: font.heading, fontSize: 16 },
  back: { width: 40, height: 40, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  cc: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, borderRadius: 15, borderWidth: 1.5 },
  input: { flex: 1, padding: 16, borderRadius: 15, borderWidth: 1.5, fontFamily: font.heading, fontSize: 18, letterSpacing: 1 },
  otpBox: { width: 46, height: 56, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
