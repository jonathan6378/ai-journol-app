import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Screen, Text, GlassCard, Tag, Divider, Button } from '@/components/ui';
import { MoodChart } from '@/components/insights/MoodChart';
import { EmotionRing } from '@/components/insights/EmotionRing';
import { TrendBullet } from '@/components/insights/TrendBullet';
import { colors, gradients, radius, spacing } from '@/theme';
import { useAuthStore, useEntriesStore, usePremiumStore } from '@/store';
import { summarizeWeek, WeeklySummaryPayload } from '@/lib/gemini';
import { hasGemini } from '@/lib/env';
import { memoryApi } from '@/lib/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

type Range = 'week' | 'month';

export default function Insights() {
  const { width } = useWindowDimensions();
  const { session } = useAuthStore();
  const { entries, load } = useEntriesStore();
  const { isPremium, openPaywall } = usePremiumStore();
  const [range, setRange] = useState<Range>('week');
  const [summary, setSummary] = useState<WeeklySummaryPayload | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (session?.user.id) load(session.user.id);
  }, [session?.user.id, load]);

  const days = range === 'week' ? 7 : 30;
  const cutoff = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1));
    return d;
  }, [days]);

  const ranged = useMemo(
    () => entries.filter((e) => new Date(e.created_at) >= cutoff),
    [entries, cutoff],
  );

  const moodAvg = useMemo(() => {
    const vals = ranged
      .map((e) => (e.mood ? { radiant: 5, happy: 4, calm: 3.5, neutral: 3, tired: 2.5, anxious: 2, sad: 1.5, overwhelmed: 1 }[e.mood] : null))
      .filter((v): v is number => v != null);
    return vals.length ? vals.reduce((a, c) => a + c, 0) / vals.length : null;
  }, [ranged]);

  const onGenerate = async () => {
    if (!session?.user.id) return;
    if (!isPremium()) {
      openPaywall('Cinematic weekly recaps are part of Premium.');
      return;
    }
    setGenerating(true);
    try {
      const memory = await memoryApi.list(session.user.id, 8).catch(() => []);
      const result = await summarizeWeek({ entries: ranged, memory });
      setSummary(result);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Screen scrollable contentContainerStyle={{ paddingTop: spacing.xl, paddingBottom: 140 }}>
      <Animated.View entering={FadeInDown.duration(420)}>
        <Text variant="caption" color={colors.textMuted}>
          {range === 'week' ? 'THIS WEEK' : 'LAST 30 DAYS'}
        </Text>
        <Text variant="hero" style={{ marginTop: 4 }}>
          Your inner weather.
        </Text>
        <Text variant="body" color={colors.textSecondary} style={{ marginTop: 6 }}>
          {ranged.length === 0
            ? 'Write a few entries to see patterns emerge.'
            : `${ranged.length} entries · ${moodAvg ? `avg ${moodAvg.toFixed(1)}/5` : 'unmeasured'}`}
        </Text>
      </Animated.View>

      <View style={styles.toggleRow}>
        {(['week', 'month'] as Range[]).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRange(r)}
            style={[
              styles.toggle,
              range === r && { backgroundColor: colors.glassStrong, borderColor: colors.borderStrong },
            ]}
          >
            <Text
              variant="caption"
              color={range === r ? colors.text : colors.textMuted}
            >
              {r === 'week' ? '7 DAYS' : '30 DAYS'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Animated.View entering={FadeInDown.delay(120).duration(420)}>
        <GlassCard padding="lg" style={{ marginTop: spacing.lg }}>
          <Text variant="overline" color={colors.textMuted}>
            MOOD
          </Text>
          <View style={{ marginTop: spacing.base, marginHorizontal: -spacing.sm }}>
            <MoodChart entries={ranged} width={width - spacing.lg * 2 - spacing.lg + spacing.sm * 2} days={days} />
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(220).duration(420)}>
        <GlassCard padding="lg" style={{ marginTop: spacing.lg }}>
          <Text variant="overline" color={colors.textMuted}>
            EMOTIONS
          </Text>
          <View style={{ marginTop: spacing.base, alignItems: 'center' }}>
            <EmotionRing entries={ranged} />
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(320).duration(420)}>
        <Pressable
          onPress={hasGemini ? onGenerate : undefined}
          disabled={generating}
        >
          <LinearGradient
            colors={gradients.premium as unknown as readonly [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.recap, { marginTop: spacing.lg }]}
          >
            {summary ? (
              <View>
                <View style={styles.recapHead}>
                  <Ionicons name="sparkles" size={14} color={colors.accentSoft} />
                  <Text variant="overline" color={colors.accentSoft} style={{ marginLeft: 6 }}>
                    AI WEEKLY RECAP
                  </Text>
                </View>
                <Text variant="title" style={{ marginTop: spacing.sm }}>
                  {summary.highlight}
                </Text>

                {summary.trends.length > 0 && (
                  <View style={{ marginTop: spacing.lg }}>
                    {summary.trends.map((t, i) => (
                      <TrendBullet key={i} text={t} />
                    ))}
                  </View>
                )}

                {summary.most_common_emotions.length > 0 && (
                  <View style={styles.tagRow}>
                    {summary.most_common_emotions.map((t) => (
                      <Tag key={t} label={t} selected color={colors.accentSoft} />
                    ))}
                  </View>
                )}

                {summary.triggers.length > 0 && (
                  <>
                    <Divider style={{ marginVertical: spacing.lg }} />
                    <Text variant="overline" color={colors.textFaint}>
                      WHAT WEIGHED ON YOU
                    </Text>
                    <View style={{ marginTop: spacing.sm, gap: 4 }}>
                      {summary.triggers.map((t, i) => (
                        <Text
                          key={i}
                          variant="body"
                          color={colors.textSecondary}
                        >
                          {'\u2014'} {t}
                        </Text>
                      ))}
                    </View>
                  </>
                )}
              </View>
            ) : (
              <View>
                <View style={styles.recapHead}>
                  <Ionicons name="sparkles" size={14} color={colors.accentSoft} />
                  <Text variant="overline" color={colors.accentSoft} style={{ marginLeft: 6 }}>
                    WEEKLY AI RECAP
                  </Text>
                </View>
                <Text variant="title" style={{ marginTop: spacing.sm }}>
                  See your week, in one breath.
                </Text>
                <Text
                  variant="body"
                  color={colors.textSecondary}
                  style={{ marginTop: spacing.sm }}
                >
                  A cinematic recap of your patterns, triggers, and quiet wins.
                </Text>
                <View style={{ marginTop: spacing.lg }}>
                  <Button
                    label={
                      !hasGemini
                        ? 'Add Gemini key in .env'
                        : isPremium()
                        ? 'Generate recap'
                        : 'Unlock with Premium'
                    }
                    onPress={hasGemini ? onGenerate : undefined}
                    loading={generating}
                    variant="glass"
                    disabled={!hasGemini || ranged.length === 0}
                  />
                </View>
              </View>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  toggle: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  recap: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  recapHead: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
