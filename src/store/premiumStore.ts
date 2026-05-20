import { create } from 'zustand';
import { useAuthStore } from './authStore';

type State = {
  paywallOpen: boolean;
  paywallReason: string | null;
};

type Actions = {
  isPremium: () => boolean;
  requirePremium: (reason?: string) => boolean; // returns true if allowed
  openPaywall: (reason?: string) => void;
  closePaywall: () => void;
};

/**
 * The premium store is the single source of truth for "can the user do X?".
 * It reads `is_premium` off the auth profile.
 *
 * Free tier limits (intentionally generous so people can fall in love):
 *  - 3 AI reflections per week
 *  - basic mood graph (last 7 days)
 *  - text journaling unlimited
 *
 * Premium unlocks:
 *  - unlimited reflections
 *  - voice journaling
 *  - emotional timeline (90 days+)
 *  - AI memory references
 *  - weekly cinematic recap
 */
export const FREE_REFLECTIONS_PER_WEEK = 3;

export const usePremiumStore = create<State & Actions>((set, get) => ({
  paywallOpen: false,
  paywallReason: null,

  isPremium() {
    const profile = useAuthStore.getState().profile;
    if (!profile) return false;
    if (!profile.is_premium) return false;
    if (!profile.premium_until) return true; // lifetime
    return new Date(profile.premium_until).getTime() > Date.now();
  },

  requirePremium(reason) {
    if (get().isPremium()) return true;
    set({ paywallOpen: true, paywallReason: reason ?? null });
    return false;
  },

  openPaywall(reason) {
    set({ paywallOpen: true, paywallReason: reason ?? null });
  },

  closePaywall() {
    set({ paywallOpen: false, paywallReason: null });
  },
}));
