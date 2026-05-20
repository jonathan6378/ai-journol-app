/**
 * MindMirror — Push notifications client.
 *
 * Three responsibilities:
 *   1. Ask for permission, register the device with Expo's push service,
 *      and persist the resulting token on the user's profile row.
 *   2. Configure the Android notification channel so the system shows the
 *      app's accent color and uses the gentle vibration pattern.
 *   3. Expose a small helper to schedule a *local* daily reminder at the
 *      user's chosen hour. Local notifications work without a backend and
 *      are the default; the server-side daily-nudge edge function (which
 *      uses Gemini for personalized copy) augments them.
 *
 * All public functions are best-effort and never throw — UI code can call
 * them freely without try/catch.
 */

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// ---------------------------------------------------------------------
// Foreground behavior
// ---------------------------------------------------------------------
// When a notification arrives while the app is open, show a quiet banner
// (no sound, no badge bump) so we don't startle a user mid-journaling.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const ANDROID_CHANNEL = 'mindmirror-default';
const DAILY_REMINDER_ID = 'mindmirror-daily-reminder';

// ---------------------------------------------------------------------
// Channel setup (Android)
// ---------------------------------------------------------------------
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
    name: 'Gentle reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: undefined,
    vibrationPattern: [0, 80, 60, 80],
    lightColor: '#A78BFA',
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    enableLights: true,
    enableVibrate: true,
    showBadge: false,
  }).catch(() => null);
}

// ---------------------------------------------------------------------
// Permission + token registration
// ---------------------------------------------------------------------
export type RegisterResult =
  | { ok: true; token: string }
  | { ok: false; reason: 'simulator' | 'denied' | 'no_project_id' | 'error'; detail?: string };

export async function registerForPushNotifications(): Promise<RegisterResult> {
  try {
    await ensureAndroidChannel();

    // Push tokens require a real device; emulators silently fail.
    if (!Constants.isDevice) {
      return { ok: false, reason: 'simulator' };
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const req = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: false,
          allowDisplayInCarPlay: false,
        },
      });
      status = req.status;
    }
    if (status !== 'granted') {
      return { ok: false, reason: 'denied' };
    }

    // EAS-managed projects need a projectId to mint Expo push tokens.
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) {
      return { ok: false, reason: 'no_project_id' };
    }

    const tokenResult = await Notifications.getExpoPushTokenAsync({ projectId });
    return { ok: true, token: tokenResult.data };
  } catch (e) {
    return { ok: false, reason: 'error', detail: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Persist the device's Expo push token on the signed-in profile.
 * Called after a successful registration.
 */
export async function persistPushToken(userId: string, token: string): Promise<void> {
  await supabase
    .from('profiles')
    .update({ expo_push_token: token })
    .eq('id', userId)
    .then(() => null, () => null);
}

// ---------------------------------------------------------------------
// Local daily reminder (no server required)
// ---------------------------------------------------------------------
export async function scheduleDailyReminder(opts: {
  hour: number; // 0-23 local
  body?: string;
  title?: string;
}): Promise<void> {
  await cancelDailyReminder();
  const safeHour = Math.max(0, Math.min(23, Math.round(opts.hour)));

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REMINDER_ID,
    content: {
      title: opts.title ?? 'MindMirror',
      body: opts.body ?? 'A small pause for yourself.',
      sound: undefined,
      ...(Platform.OS === 'android' ? { channelId: ANDROID_CHANNEL } : {}),
    },
    trigger: {
      hour: safeHour,
      minute: 0,
      repeats: true,
    } as Notifications.DailyTriggerInput,
  }).catch(() => null);
}

export async function cancelDailyReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID).catch(
    () => null,
  );
}

export async function getScheduledReminderTime(): Promise<number | null> {
  const all = await Notifications.getAllScheduledNotificationsAsync().catch(
    () => [] as Notifications.NotificationRequest[],
  );
  const ours = all.find((n) => n.identifier === DAILY_REMINDER_ID);
  if (!ours) return null;
  const trigger = ours.trigger as { hour?: number };
  return typeof trigger.hour === 'number' ? trigger.hour : null;
}
