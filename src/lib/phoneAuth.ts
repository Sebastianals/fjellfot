import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from './firebase';

// REAL phone OTP via Firebase JS SDK + reCAPTCHA (works in Expo Go).
// WelcomeScreen mounts <FirebaseRecaptchaVerifierModal> and passes its ref here.
export const REAL_PHONE_AUTH = true;

export function toE164(localDigits: string, cc = '+47') {
  return cc + localDigits.replace(/\D/g, '');
}

let recaptchaVerifier: any = null;
export function setRecaptcha(v: any) { recaptchaVerifier = v; }

let verificationId: string | null = null;

/** Sends a real SMS code. Throws if reCAPTCHA isn't ready or the number is invalid. */
export async function requestOtp(phoneE164: string): Promise<void> {
  if (!recaptchaVerifier) throw new Error('reCAPTCHA er ikke klar ennå — prøv igjen.');
  const provider = new PhoneAuthProvider(auth);
  verificationId = await provider.verifyPhoneNumber(phoneE164, recaptchaVerifier);
}

/** Verifies the code immediately and signs the user in. Returns false on a wrong code. */
export async function confirmOtp(code: string): Promise<boolean> {
  if (!verificationId) return false;
  try {
    const cred = PhoneAuthProvider.credential(verificationId, code);
    await signInWithCredential(auth, cred);
    verificationId = null;
    return true;
  } catch {
    return false;
  }
}
