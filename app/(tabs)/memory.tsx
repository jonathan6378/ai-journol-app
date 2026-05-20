import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Text, GlassCard, Divider } from '@/components/ui';
import { useAuthStore, useMemoryStore, usePremiumStore } from '@/store';
import { colors, radius, spacing } from '@/theme';
import { MemoryNote } from '@/types';

const CATEGORY_COLOR: Record<MemoryNote['category'], string> = {
  goal: colors.palette.amber,
  habit: colors.palette.sage,
  relationship: colors.palette.rose,
  stress: colors.palette.clay,
  trigger: colors.palette.peach,
  value: colors.palette.lavender,
};

export default function Memory() {
  const { session } = useAuthStore();
  const { notes, load, remove, loading } = useMemoryStore();
  const { isPremium, openPaywall } = usePremiumStore();

  useEffect(() => {
    if (session?.user.id) load(session.user.id);
  }, [session?.user.id, load]);

  if (!isPremium()) {
    return (
      <Screen scrollable contentContainerStyle={{ paddingTop: spacing.xl, paddingBottom: 140 }}>
        <Text variant="caption" color={colors.textMuted}>
          MEMORY
        </Text>
        <Text variant="hero" style={{ marginTop: 4 }}>
          {'What I\u2019m holding\nfor you.'}
        </Text>
        <Text variant="body" color={colors.textSecondary} style={{ marginTop: 8 }}>
          MindMirror gently remembers themes, goals, and triggers across your entries.
        </Text>

        <GlassCard padding="lg" style={{ marginTop: spacing.xxl }}>
          <Text variant="overline" color={colors.accentSoft}>
            PREMIUM
          </Text>
          <Text variant="title" style={{ marginTop: spacing.sm }}>
            Memory keeps your reflections personal.
          </Text>
          <Text variant="body" color={colors.textSecondary} style={{ marginTop: spacing.md }}>
            Without memory, every entry feels like meeting a stranger. With memory, MindMirror notices when something you mentioned weeks ago resurfaces.
          </Text>
          <Pressable
            onPress={() => openPaywall('Memory is part of Premium.')}
            style={[styles.cta, { marginTop: spacing.lg }]}
          >
            <Text variant="bodyMedium" color={colors.text}>
              See Premium
            </Text>
            <Ionicons name="arrow-forward" size={18} color={colors.text} />
          </Pressable>
        </GlassCard>
      </Screen>
    );
  }

  return (
    <Screen scrollable contentContainerStyle={{ paddingTop: spacing.xl, paddingBottom: 140 }}>
      <Animated.View entering={FadeInDown.duration(420)}>
        <Text variant="caption" color={colors.textMuted}>
          MEMORY
        </Text>
        <Text variant="hero" style={{ marginTop: 4 }}>
          {'What I\u2019m holding\nfor you.'}
        </Text>
        <Text variant="body" color={colors.textSecondary} style={{ marginTop: 8 }}>
          {notes.length === 0
            ? loading
              ? 'Settling in...'
              : 'Nothing yet. The more you write, the more I notice.'
            : `${notes.length} note${notes.length === 1 ? '' : 's'}, kept private.`}
        </Text>
      </Animated.View>

      <View style={{ marginTop: spacing.xl, gap: spacing.sm }}>
        {notes.map((n, i) => (
          <Animated.View
            key={n.id}
            entering={FadeInDown.delay(40 * i).duration(360)}
          >
            <GlassCard padding="md" rounded="md">
              <View style={styles.row}>
                <View
                  style={[styles.dot, { backgroundColor: CATEGORY_COLOR[n.category] }]}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="caption" color={colors.textMuted}>
                    {n.category.toUpperCase()}
                  </Text>
                  <Text variant="body" style={{ marginTop: 2 }}>
                    {n.content}
                  </Text>
                </View>
                <Pressable onPress={() => remove(n.id)} hitSlop={10}>
                  <Ionicons name="close" size={18} color={colors.textFaint} />
                </Pressable>
              </View>
            </GlassCard>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.glassStrong,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
});
