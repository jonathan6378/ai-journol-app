import { supabase } from '../supabase';
import { UserProfile } from '@/types';

export const profileApi = {
  async get(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    return (data as UserProfile) ?? null;
  },

  async upsert(userId: string, patch: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...patch })
      .select()
      .single();
    if (error) throw error;
    return data as UserProfile;
  },

  async setPremium(userId: string, until: string | null): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: !!until, premium_until: until })
      .eq('id', userId);
    if (error) throw error;
  },

  async bumpStreak(userId: string, streak: number, lastIso: string): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ streak_count: streak, last_entry_at: lastIso })
      .eq('id', userId);
    if (error) throw error;
  },
};
