import { create } from 'zustand';
import { memoryApi } from '@/lib/api';
import { MemoryNote } from '@/types';

type State = {
  notes: MemoryNote[];
  loading: boolean;
};

type Actions = {
  load: (userId: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export const useMemoryStore = create<State & Actions>((set, get) => ({
  notes: [],
  loading: false,

  async load(userId) {
    set({ loading: true });
    try {
      const notes = await memoryApi.list(userId);
      set({ notes });
    } finally {
      set({ loading: false });
    }
  },

  async remove(id) {
    await memoryApi.remove(id);
    set({ notes: get().notes.filter((n) => n.id !== id) });
  },
}));
