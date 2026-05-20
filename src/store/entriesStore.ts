import { create } from 'zustand';
import { entriesApi, memoryApi } from '@/lib/api';
import {
  reflectOnEntry,
  extractMemoryNotes,
  ReflectionPayload,
} from '@/lib/gemini';
import { hasGemini } from '@/lib/env';
import { profileApi } from '@/lib/api/profile';
import { JournalEntry, Reflection, EmotionTag, Mood } from '@/types';
import { computeStreak } from '@/utils/streak';

type State = {
  entries: JournalEntry[];
  reflectionsByEntry: Record<string, Reflection>;
  loading: boolean;
  composing: boolean;
  draft: {
    body: string;
    mood: Mood | null;
    emotions: EmotionTag[];
  };
};

type Actions = {
  load: (userId: string) => Promise<void>;
  setDraft: (patch: Partial<State['draft']>) => void;
  resetDraft: () => void;
  saveEntry: (
    userId: string,
    opts?: { skipReflection?: boolean },
  ) => Promise<{ entry: JournalEntry; reflection: Reflection | null }>;
  loadReflection: (entry: JournalEntry) => Promise<Reflection | null>;
};

const emptyDraft: State['draft'] = { body: '', mood: null, emotions: [] };

export const useEntriesStore = create<State & Actions>((set, get) => ({
  entries: [],
  reflectionsByEntry: {},
  loading: false,
  composing: false,
  draft: emptyDraft,

  async load(userId) {
    set({ loading: true });
    try {
      const entries = await entriesApi.list(userId, 100);
      set({ entries });
    } finally {
      set({ loading: false });
    }
  },

  setDraft(patch) {
    set((s) => ({ draft: { ...s.draft, ...patch } }));
  },

  resetDraft() {
    set({ draft: emptyDraft });
  },

  async saveEntry(userId, opts) {
    const { draft } = get();
    if (!draft.body.trim() && !draft.mood) {
      throw new Error('Add a thought or pick a mood first.');
    }
    set({ composing: true });
    try {
      const entry = await entriesApi.create(userId, {
        body: draft.body.trim(),
        mood: draft.mood,
        emotions: draft.emotions,
      });

      // Optimistically prepend
      set((s) => ({ entries: [entry, ...s.entries] }));

      // Update streak — fire-and-forget
      const streakInputs = [entry, ...get().entries].map((e) => e.created_at);
      const newStreak = computeStreak(streakInputs);
      profileApi
        .bumpStreak(userId, newStreak, entry.created_at)
        .catch(() => null);

      let reflection: Reflection | null = null;

      if (!opts?.skipReflection && hasGemini && entry.body.length > 0) {
        try {
          const memory = await memoryApi.list(userId, 12).catch(() => []);
          const recent = get().entries.slice(0, 7);
          const payload: ReflectionPayload = await reflectOnEntry({
            body: entry.body,
            mood: entry.mood,
            emotions: entry.emotions,
            memory,
            recentEntries: recent.map((e) => ({
              created_at: e.created_at,
              mood: e.mood,
              emotions: e.emotions,
            })),
          });

          reflection = await entriesApi.createReflection(userId, entry.id, {
            summary: payload.summary,
            insight: payload.insight,
            question: payload.question,
            detected_emotions: payload.detected_emotions,
            detected_mood: payload.detected_mood,
          });
          await entriesApi.attachReflection(entry.id, reflection.id);

          set((s) => ({
            reflectionsByEntry: { ...s.reflectionsByEntry, [entry.id]: reflection! },
            entries: s.entries.map((e) =>
              e.id === entry.id ? { ...e, reflection_id: reflection!.id } : e,
            ),
          }));

          // Background: extract memory notes
          extractMemoryNotes(entry.body)
            .then(async (notes) => {
              for (const n of notes) {
                await memoryApi.upsert(userId, n).catch(() => null);
              }
            })
            .catch(() => null);
        } catch (e) {
          // Reflection is non-blocking. The entry still saved.
          console.warn('[reflection] failed:', e);
        }
      }

      return { entry, reflection };
    } finally {
      set({ composing: false });
    }
  },

  async loadReflection(entry) {
    if (!entry.reflection_id) return null;
    const cached = get().reflectionsByEntry[entry.id];
    if (cached) return cached;
    try {
      const r = await entriesApi.getReflection(entry.reflection_id);
      if (r) {
        set((s) => ({
          reflectionsByEntry: { ...s.reflectionsByEntry, [entry.id]: r },
        }));
      }
      return r;
    } catch {
      return null;
    }
  },
}));
