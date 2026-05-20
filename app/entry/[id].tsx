import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Tag, Divider } from '@/components/ui';
import { ReflectionCard } from '@/components/journal/ReflectionCard';
import { colors, spacing } from '@/theme';
import { useEntriesStore } from '@/store';
import { entriesApi } from '@/lib/api';
import { Reflection } from '@/types';
import { formatLong, formatTime } from '@/utils/date';
import { moodColor, moodLabel } from '@/utils/mood';

export default function EntryDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { entries, reflectionsByEntry, loadReflection } = useEntriesStore();
  const entry = useMemo(() => entries.find((e) => e.id === id), [entries, id]);
  const cached = entry ? reflectionsByEntry[entry.id] : undefined;
  const [reflection, setReflection] = useState<Reflection | null>(cached ?? null);

  useEffect(() => {
    if (entry && !reflection) {
      loadReflection(entry).then(setReflection);
    }
  }, [entry, reflection, loadReflection]);

  if (!entry) {
    return (
      <Screen padded edges={['top']}>
        <Text variant="body" color={colors.textMuted}>
          Entry not found.
        </Text>
      </Screen>
    );
  }

  const onDelete = () => {
    Alert.alert('Delete entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await entriesApi.remove(entry.id).catch(() => null);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={16}>
          <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.huge, paddingHorizontal: spacing.lg }}
      >
        <View style={styles.titleBlock}>
          <Text variant="caption" color={colors.textMuted}>
            {formatLong(entry.created_at).toUpperCase()} · {formatTime(entry.created_at)}
          </Text>
          {entry.mood && (
            <View style={styles.moodRow}>
              <View
                style={[styles.dot, { backgroundColor: moodColor(entry.mood) }]}
              />
              <Text variant="bodyMedium" color={colors.text}>
                {moodLabel(entry.mood)}
              </Text>
            </View>
          )}
        </View>

        <Text variant="journal" style={{ marginTop: spacing.lg }}>
          {entry.body}
        </Text>

        {entry.emotions.length > 0 && (
          <View style={styles.tagRow}>
            {entry.emotions.map((t) => (
              <Tag key={t} label={t} selected color={colors.accentSoft} />
            ))}
          </View>
        )}

        {(reflection || entry.reflection_id) && (
          <>
            <Divider style={{ marginVertical: spacing.xxl }} />
            <ReflectionCard reflection={reflection} loading={!reflection} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.base,
  },
  titleBlock: {
    paddingTop: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
});
