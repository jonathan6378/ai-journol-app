import { supabase } from '../supabase';
import { MemoryNote } from '@/types';

export const memoryApi = {
  async list(userId: string, limit = 30): Promise<MemoryNote[]> {
    const { data, error } = await supabase
      .from('memory_notes')
      .select('*')
      .eq('user_id', userId)
      .order('weight', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as MemoryNote[];
  },

  async upsert(
    userId: string,
    note: Omit<MemoryNote, 'id' | 'user_id' | 'created_at' | 'last_seen_at'>,
  ): Promise<MemoryNote> {
    // Naive de-duplication by (user_id, content). Production version should
    // embed and cluster by cosine similarity.
    const existing = await supabase
      .from('memory_notes')
      .select('*')
      .eq('user_id', userId)
      .eq('content', note.content)
      .maybeSingle();

    if (existing.data) {
      const { data, error } = await supabase
        .from('memory_notes')
        .update({
          weight: Math.min(1, (existing.data as MemoryNote).weight + 0.05),
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', (existing.data as MemoryNote).id)
        .select()
        .single();
      if (error) throw error;
      return data as MemoryNote;
    }

    const { data, error } = await supabase
      .from('memory_notes')
      .insert({ user_id: userId, ...note, last_seen_at: new Date().toISOString() })
      .select()
      .single();
    if (error) throw error;
    return data as MemoryNote;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('memory_notes').delete().eq('id', id);
    if (error) throw error;
  },
};
