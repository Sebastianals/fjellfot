import * as Notifications from 'expo-notifications';

// Show the banner even when the app is foregrounded.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const STREAK_ID = 'fjellfot-streak-reminder';

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

/** Daily local reminder to keep the streak alive. Local notifications work in Expo Go. */
export async function scheduleStreakReminder(hour = 20, minute = 0): Promise<boolean> {
  const ok = await ensureNotificationPermission();
  if (!ok) return false;
  await Notifications.cancelScheduledNotificationAsync(STREAK_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: STREAK_ID,
    content: {
      title: 'Ikke mist streaken! 🔥',
      body: 'Du mangler noen skritt for å holde streaken i live i dag.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
  return true;
}

export async function cancelStreakReminder() {
  await Notifications.cancelScheduledNotificationAsync(STREAK_ID).catch(() => {});
}
