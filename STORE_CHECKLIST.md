# Fjellfot — App Store launch checklist

The app is wired for a production build. These steps need **your** accounts (I can't do them for you).

## 1. Accounts
- [ ] **Apple Developer Program** membership ($99/yr) → https://developer.apple.com
- [ ] **Expo / EAS** account → `npm i -g eas-cli && eas login`

## 2. Link the project
```powershell
cd C:\Users\Sebbi\Downloads\fjellfot-run
$env:NODE_EXTRA_CA_CERTS = "C:\Users\Sebbi\Downloads\winroots.pem"
eas init            # creates the EAS project, fills extra.eas.projectId in app.json
```

## 3. Firebase (production)
- [ ] Authentication → Sign-in method → **Phone** enabled
- [ ] Add your iOS bundle id `no.fjellfot.app` under Project settings → iOS app
- [ ] Upload an **APNs key** (Cloud Messaging) so phone-auth SMS works without reCAPTCHA fallback
- [ ] Publish `firestore.rules`

## 4. Real phone auth on a dev/prod build
Phone OTP currently uses `expo-firebase-recaptcha` (works in Expo Go). For the store build it keeps working, but for the cleanest UX consider `@react-native-firebase/auth` (see `DEV_BUILD.md`).

## 5. Branding assets (replace the placeholder Expo icons)
- [ ] `assets/icon.png` — 1024×1024, no transparency
- [ ] `assets/splash-icon.png` — ~1284×2778 safe-area logo
- [ ] `assets/adaptive-icon.png` — 1024×1024 foreground (Android)

## 6. Build & submit
```powershell
eas build --profile production --platform ios
# fill appleId / ascAppId / appleTeamId in eas.json, then:
eas submit --profile production --platform ios
```

## 7. App Store Connect listing
- [ ] App name, subtitle, keywords (Norwegian)
- [ ] Screenshots (6.7" + 6.1") — use the running app
- [ ] Privacy policy URL (required — app collects phone number + location)
- [ ] App Privacy questionnaire: Phone number (auth), Coarse/Precise location (app functionality), Health/steps
- [ ] Age rating, category: Health & Fitness

## Still TODO in code (flagged, not yet built)
- Live **team-step aggregation** for the national Lagkamp board (best done with a Cloud Function to avoid double-counting). `addTeamSteps()` exists as the hook.
- **HealthKit** historical sync (needs the dev build).
- Weekly/period leaderboard windows (Cloud Function).
