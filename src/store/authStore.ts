import { create } from 'zustand';
import { Session } from '@supabase/supabase-js';
import { auth } from '@/lib/api';
import { profileApi } from '@/lib/api/profile';
import { supabase } from '@/lib/supabase';
import { UserProfile } from '@/types';

type State = {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
};

type Actions = {
  bootstrap: () => Promise<void>;
  setSession: (s: Session | null) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<State & Actions>((set, get) => ({
  session: null,
  profile: null,
  loading: false,
  initialized: false,

  async bootstrap() {
    if (get().initialized) return;
    set({ loading: true });
    try {
      const session = await auth.getSession();
      await get().setSession(session);
      auth.onAuthStateChange((s) => {
        get().setSession(s);
      });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  async setSession(session) {
    set({ session });
    if (session?.user) {
      try {
        let profile = await profileApi.get(session.user.id);
        if (!profile) {
          profile = await profileApi.upsert(session.user.id, {
            email: session.user.email ?? null,
            full_name:
              (session.user.user_metadata?.full_name as string | undefined) ?? null,
          });
        }
        set({ profile });
      } catch {
        // Network blip — keep session but no profile yet.
        set({ profile: null });
      }
    } else {
      set({ profile: null });
    }
  },

  async refreshProfile() {
    const { session } = get();
    if (!session?.user) return;
    try {
      const profile = await profileApi.get(session.user.id);
      set({ profile });
    } catch {
      /* ignore */
    }
  },

  async signOut() {
    await supabase.auth.signOut().catch(() => null);
    set({ session: null, profile: null });
  },
}));
