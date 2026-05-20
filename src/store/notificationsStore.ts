/**
 * Notifications store — owns the user's reminder preferences and keeps the
 * local schedule in sync with the profile row.
 *
 * Two-way binding rule:
 *   profile column   <->   stored value   <->   OS schedule
 * Whenever you mutate the store via setEnabled/setHour, this file:
 *   1. updates the profile row in Supabase
 *   2. cancels or re-schedules the OS-level daily reminder
 * That way the source of truth stays consistent across devices.
 */

import { create } from 'zustand';
import { profileApi } from '@/lib/api';
import {
  cancelDailyReminder,
  registerForPushNotifications,
  persistPushToken,
  scheduleDailyReminder,
} from '@/lib/notifications';
import { useAuthStore } from './authStore';

type State = {
  enabled: boolean;
  hour: number;
  /** Result of last permission attempt — surfaces why notifications might silently not work. */
  registrationStatus:
    | 'unknown'
    | 'granted'
    | 'denied'
    | 'simulator'
    | 'no_project_id'
    | 'error';
  busy: boolean;
};

type Actions = {
  /** Hydrate from the profile row already in the auth store. */
  hydrate: () => void;
  /** Ask for OS permission, register the token, persist it. */
  enable: () => Promise<void>;
  /** Turn reminders off and clear the OS schedule. */
  disable: () => Promise<void>;
  /** Move the daily reminder to a new hour (0-23). */
  setHour: (hour: number) => Promise<void>;
};

export const useNotificationsStore = create<State & Actions>((set, get) => ({
  enabled: true,
  hour: 20,
  registrationStatus: 'unknown',
  busy: false,

  hydrate() {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    set({
      enabled: profile.notifications_enabled,
      hour: profile.notification_hour ?? 20,
    });
  },

  async enable() {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    set({ busy: true });
    try {
      const result = await registerForPushNotifications();
      if (!result.ok) {
        set({ registrationStatus: result.reason });
        // Local schedule still works even if push tokens don't.
        if (result.reason === 'simulator' || result.reason === 'no_project_id') {
          await scheduleDailyReminder({ hour: get().hour });
          await profileApi.upsert(profile.id, { notifications_enabled: true });
          set({ enabled: true });
        }
        return;
      }
      set({ registrationStatus: 'granted' });
      await persistPushToken(profile.id, result.token);
      await profileApi.upsert(profile.id, {
        notifications_enabled: true,
        expo_push_token: result.token,
      });
      await scheduleDailyReminder({ hour: get().hour });
      set({ enabled: true });
      useAuthStore.getState().refreshProfile();
    } finally {
      set({ busy: false });
    }
  },

  async disable() {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    set({ busy: true });
    try {
      await cancelDailyReminder();
      await profileApi.upsert(profile.id, { notifications_enabled: false });
      set({ enabled: false });
      useAuthStore.getState().refreshProfile();
    } finally {
      set({ busy: false });
    }
  },

  async setHour(hour) {
    const profile = useAuthStore.getState().profile;
    if (!profile) return;
    const safeHour = Math.max(0, Math.min(23, Math.round(hour)));
    set({ hour: safeHour });
    await profileApi.upsert(profile.id, { notification_hour: safeHour });
    if (get().enabled) {
      await scheduleDailyReminder({ hour: safeHour });
    }
    useAuthStore.getState().refreshProfile();
  },
}));
