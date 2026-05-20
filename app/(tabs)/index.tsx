import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Text, Divider } from '@/components/ui';
import { MoodPicker } from '@/components/home/MoodPicker';
import { PromptCard } from '@/components/home/PromptCard';
import { StreakBadge } from '@/components/home/StreakBadge';
import { EntryRow } from '@/components/home/EntryRow';
import { colors, spacing } from '@/theme';
import { useAuthStore, useEntriesStore } from '@/store';
import { greetingFor } from '@/utils/greeting';
import { promptForToday } from '@/utils/prompts';
import { Mood } from '@/types';

export default function Home() {
  const { profile, session } = useAuthStore();
  const { entries, draft, setDraft, load } = useEntriesStore();

  useEffect(() => {
    if (session?.user.id) load(session.user.id);
  }, [session?.user.id, load]);

  const greeting = useMemo(() => greetingFor(new Date(), profile?.full_name), [profile?.full_name]);
  const prompt = useMemo(() => promptForToday(), []);
  const recent = entries.slice(0, 5);

  const handleMood = (m: Mood) => setDraft({ mood: m });

  return (
    <Screen scrollable contentContainerStyle={{ paddingTop: spacing.xl }}>
      <Animated.View entering={FadeInDown.duration(420)}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text variant="caption" color={colors.textMuted}>
              {new Date().toDateString().toUpperCase()}
            </Text>
            <Text variant="hero" style={{ marginTop: 4 }}>
              {greeting.primary}
            </Text>
            <Text
              variant="body"
              color={colors.textSecondary}
              style={{ marginTop: 4 }}
            >
              {greeting.secondary}
            </Text>
          </View>
          <StreakBadge count={profile?.streak_count ?? 0} />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(120).duration(420)}
        style={{ marginTop: spacing.xxl }}
      >
        <Text variant="overline" color={colors.textMuted}>
          HOW ARE YOU FEELING?
        </Text>
        <View style={{ marginTop: spacing.base }}>
          <MoodPicker value={draft.mood} onChange={handleMood} />
        </View>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(220).duration(420)}
        style={{ marginTop: spacing.xl }}
      >
        <PromptCard prompt={prompt} />
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(320).duration(420)}
        style={{ marginTop: spacing.xxl }}
      >
        <View style={styles.sectionHeader}>
          <Text variant="h2">Recently</Text>
          <Text variant="caption" color={colors.textMuted}>
            {entries.length} entries
          </Text>
        </View>
        <Divider style={{ marginTop: spacing.md }} />
        {recent.length === 0 ? (
          <View style={styles.empty}>
            <Text variant="body" color={colors.textMuted} align="center">
              No entries yet.{'\n'}Your first reflection is one tap away.
            </Text>
          </View>
        ) : (
          recent.map((e, i) => (
            <View key={e.id}>
              <EntryRow entry={e} />
              {i < recent.length - 1 && <Divider />}
            </View>
          ))
        )}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  empty: {
    paddingVertical: spacing.xxl,
  },
});
