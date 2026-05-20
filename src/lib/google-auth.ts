/**
 * Google Sign-In wrapper.
 *
 * Why this file exists:
 *  - The native module is platform-specific and requires Google services on
 *    Android. We isolate that complexity here so screens stay clean.
 *  - We lazy-`require` the module so the app continues to boot even when the
 *    package is not yet installed (e.g. running in plain Expo Go for design
 *    previews). All errors are surfaced as friendly strings, not crashes.
 *  - Configuration happens once at module import time using the env vars.
 *
 * Setup checklist (see docs/SETUP.md §5):
 *  1. Create OAuth Web + Android client IDs in Google Cloud Console.
 *  2. Paste the Web client ID + secret into Supabase → Auth → Providers → Google.
 *  3. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in your .env.
 *  4. (iOS only) set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID.
 *  5. On Android: register the SHA-1 of your debug + upload keystore in the
 *     OAuth Android client.
 */

import { Platform } from 'react-native';
import { env } from './env';

type GSignInModule = {
  GoogleSignin: {
    configure: (config: {
      webClientId: string;
      iosClientId?: string;
      offlineAccess?: boolean;
      forceCodeForRefreshToken?: boolean;
    }) => void;
    hasPlayServices: (opts?: { showPlayServicesUpdateDialog?: boolean }) => Promise<boolean>;
    signIn: () => Promise<{ idToken?: string | null; user?: { email: string } }>;
    signOut: () => Promise<void>;
    revokeAccess: () => Promise<void>;
  };
  statusCodes: {
    SIGN_IN_CANCELLED: string;
    IN_PROGRESS: string;
    PLAY_SERVICES_NOT_AVAILABLE: string;
  };
};

let mod: GSignInModule | null = null;
let configured = false;

function load(): GSignInModule | null {
  if (mod) return mod;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('@react-native-google-signin/google-signin') as GSignInModule;
    return mod;
  } catch {
    return null;
  }
}

export function isGoogleSignInAvailable(): boolean {
  return !!env.googleWebClientId && load() !== null;
}

function configureOnce() {
  if (configured) return;
  const m = load();
  if (!m) return;
  m.GoogleSignin.configure({
    webClientId: env.googleWebClientId,
    iosClientId: env.googleIosClientId || undefined,
    offlineAccess: false, // Supabase only needs the ID token
    forceCodeForRefreshToken: false,
  });
  configured = true;
}

export type GoogleSignInResult =
  | { ok: true; idToken: string; email?: string }
  | { ok: false; cancelled?: boolean; error: string };

/**
 * Pop the Google account picker, return an ID token suitable for
 * `supabase.auth.signInWithIdToken({ provider: 'google', token })`.
 *
 * Never throws — always resolves to a discriminated union.
 */
export async function googleSignIn(): Promise<GoogleSignInResult> {
  if (!env.googleWebClientId) {
    return {
      ok: false,
      error:
        'Google Sign-In not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your .env.',
    };
  }

  const m = load();
  if (!m) {
    return {
      ok: false,
      error:
        'Google Sign-In native module is not installed in this build. Use a dev-client build (not Expo Go).',
    };
  }

  configureOnce();

  try {
    if (Platform.OS === 'android') {
      await m.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    }
    const userInfo = await m.GoogleSignin.signIn();
    const idToken = userInfo?.idToken;
    if (!idToken) {
      return { ok: false, error: 'Google did not return an ID token. Try again.' };
    }
    return { ok: true, idToken, email: userInfo?.user?.email };
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === m.statusCodes.SIGN_IN_CANCELLED) {
      return { ok: false, cancelled: true, error: 'Sign-in cancelled.' };
    }
    if (e.code === m.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return { ok: false, error: 'Google Play Services unavailable on this device.' };
    }
    return { ok: false, error: e.message ?? 'Google sign-in failed.' };
  }
}

export async function googleSignOut(): Promise<void> {
  const m = load();
  if (!m || !configured) return;
  try {
    await m.GoogleSignin.signOut();
  } catch {
    /* ignore */
  }
}
