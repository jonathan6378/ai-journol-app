import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { GlassCard, Text, Tag, Divider } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { Reflection } from '@/types';

type Props = {
  reflection: Reflection | null;
  loading?: boolean;
};

export const ReflectionCard: React.FC<Props> = ({ reflection, loading }) => {
  if (loading) {
    return (
      <GlassCard padding="lg">
        <View style={styles.headerRow}>
          <View style={styles.dot} />
          <Text variant="overline" color={colors.accentSoft}>
            REFLECTING
          </Text>
        </View>
        <Text
          variant="body"
          color={colors.textMuted}
          italic
          style={{ marginTop: spacing.md }}
        >
          A quiet pause...
        </Text>
      </GlassCard>
    );
  }

  if (!reflection) return null;

  return (
    <Animated.View entering={FadeInUp.duration(520)}>
      <GlassCard padding="lg">
        <View style={styles.headerRow}>
          <View style={[styles.dot, { backgroundColor: colors.accent }]} />
          <Text variant="overline" color={colors.accentSoft}>
            MINDMIRROR
          </Text>
        </View>

        <Text
          variant="journal"
          color={colors.text}
          style={{ marginTop: spacing.base }}
        >
          {reflection.summary}
        </Text>

        {!!reflection.insight && (
          <>
            <Divider style={{ marginVertical: spacing.lg }} />
            <View style={styles.insightRow}>
              <Ionicons
                name="leaf-outline"
                size={16}
                color={colors.palette.sage}
                style={{ marginTop: 4 }}
              />
              <Text
                variant="body"
                color={colors.textSecondary}
                style={{ flex: 1, marginLeft: spacing.sm }}
              >
                {reflection.insight}
              </Text>
            </View>
          </>
        )}

        {!!reflection.question && (
          <Animated.View
            entering={FadeIn.delay(220).duration(420)}
            style={styles.question}
          >
            <Text variant="overline" color={colors.textFaint}>
              A QUESTION FOR YOU
            </Text>
            <Text variant="title" style={{ marginTop: spacing.sm }}>
              {reflection.question}
            </Text>
          </Animated.View>
        )}

        {reflection.detected_emotions.length > 0 && (
          <View style={styles.tagRow}>
            {reflection.detected_emotions.slice(0, 4).map((t) => (
              <Tag key={t} label={t} selected color={colors.accentSoft} />
            ))}
          </View>
        )}
      </GlassCard>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accentSoft,
    marginRight: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  question: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
});
