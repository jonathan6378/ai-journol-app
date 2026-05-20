import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { JournalEntry } from '@/types';
import { moodColor, moodLabel } from '@/utils/mood';
import { formatTime, relativeDay } from '@/utils/date';

export const EntryRow: React.FC<{ entry: JournalEntry }> = ({ entry }) => {
  const router = useRouter();
  const preview = entry.body.split('\n')[0]?.slice(0, 110) || moodLabel(entry.mood);

  return (
    <Pressable
      onPress={() => router.push(`/entry/${entry.id}`)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.dot, { backgroundColor: moodColor(entry.mood) }]} />
      <View style={{ flex: 1 }}>
        <View style={styles.metaRow}>
          <Text variant="caption" color={colors.textMuted}>
            {relativeDay(entry.created_at).toUpperCase()} · {formatTime(entry.created_at)}
          </Text>
          {entry.reflection_id ? (
            <Text variant="caption" color={colors.accentSoft}>
              REFLECTED
            </Text>
          ) : null}
        </View>
        <Text variant="body" color={colors.text} style={{ marginTop: 2 }} numberOfLines={2}>
          {preview}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.base,
    gap: spacing.base,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 7,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
