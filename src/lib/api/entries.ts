import { supabase } from '../supabase';
import { JournalEntry, Mood, EmotionTag, Reflection } from '@/types';

type CreateEntryInput = {
  body: string;
  mood: Mood | null;
  emotions: EmotionTag[];
  voice_url?: string | null;
};

export const entriesApi = {
  async list(userId: string, limit = 50): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as JournalEntry[];
  },

  async listSince(userId: string, sinceIso: string): Promise<JournalEntry[]> {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as JournalEntry[];
  },

  async create(userId: string, input: CreateEntryInput): Promise<JournalEntry> {
    const word_count = (input.body || '').trim().split(/\s+/).filter(Boolean).length;
    const { data, error } = await supabase
      .from('journal_entries')
      .insert({
        user_id: userId,
        body: input.body,
        mood: input.mood,
        emotions: input.emotions,
        voice_url: input.voice_url ?? null,
        word_count,
      })
      .select()
      .single();
    if (error) throw error;
    return data as JournalEntry;
  },

  async attachReflection(entryId: string, reflectionId: string): Promise<void> {
    const { error } = await supabase
      .from('journal_entries')
      .update({ reflection_id: reflectionId })
      .eq('id', entryId);
    if (error) throw error;
  },

  async getReflection(reflectionId: string): Promise<Reflection | null> {
    const { data, error } = await supabase
      .from('reflections')
      .select('*')
      .eq('id', reflectionId)
      .maybeSingle();
    if (error) throw error;
    return (data as Reflection) ?? null;
  },

  async createReflection(
    userId: string,
    entryId: string,
    payload: Omit<Reflection, 'id' | 'created_at' | 'user_id' | 'entry_id'>,
  ): Promise<Reflection> {
    const { data, error } = await supabase
      .from('reflections')
      .insert({
        user_id: userId,
        entry_id: entryId,
        ...payload,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Reflection;
  },

  async remove(entryId: string): Promise<void> {
    const { error } = await supabase.from('journal_entries').delete().eq('id', entryId);
    if (error) throw error;
  },
};
