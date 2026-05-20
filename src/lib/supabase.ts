import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env, hasSupabase } from './env';

/**
 * Supabase client — single instance, AsyncStorage-backed sessions.
 *
 * If the env vars are missing we still construct a stub client pointing at a
 * dummy URL. All app code is written defensively against this so the UI keeps
 * working in design-preview mode.
 */
export const supabase: SupabaseClient = createClient(
  env.supabaseUrl || 'https://placeholder.supabase.co',
  env.supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      storage: AsyncStorage as unknown as Storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

export const isSupabaseConfigured = hasSupabase;
