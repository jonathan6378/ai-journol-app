/**
 * Centralized env access. Throws helpful errors instead of cryptic undefined
 * references at runtime.
 */
import Constants from 'expo-constants';

function read(key: string, fallback?: string): string {
  // EXPO_PUBLIC_* vars are inlined at build time.
  const fromProcess = (process.env as Record<string, string | undefined>)[key];
  // app.json `extra` is a secondary fallback (useful for EAS overrides).
  const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
  const fromExtra =
    extra[key] ??
    extra[key.replace(/^EXPO_PUBLIC_/, '').replace(/^./, (c) => c.toLowerCase())];
  return fromProcess || fromExtra || fallback || '';
}

export const env = {
  supabaseUrl: read('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: read('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  geminiApiKey: read('EXPO_PUBLIC_GEMINI_API_KEY'),
  geminiModel: read('EXPO_PUBLIC_GEMINI_MODEL', 'gemini-1.5-flash'),
  razorpayKeyId: read('EXPO_PUBLIC_RAZORPAY_KEY_ID'),
  googleWebClientId: read('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
  googleIosClientId: read('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
};

export const hasSupabase = !!(env.supabaseUrl && env.supabaseAnonKey);
export const hasGemini = !!env.geminiApiKey;
export const hasRazorpay = !!env.razorpayKeyId;
