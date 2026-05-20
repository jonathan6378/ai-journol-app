import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard, Text } from '@/components/ui';
import { colors, gradients, radius, spacing } from '@/theme';

type Props = {
  prompt: string;
};

export const PromptCard: React.FC<Props> = ({ prompt }) => {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push('/compose')}>
      <GlassCard padding="lg" rounded="lg">
        <View style={styles.row}>
          <View style={{ flex: 1, paddingRight: spacing.lg }}>
            <Text variant="overline" color={colors.accentSoft}>
              {'TODAY\u2019S PROMPT'}
            </Text>
            <Text variant="title" style={{ marginTop: spacing.sm }}>
              {prompt}
            </Text>
            <Text
              variant="small"
              color={colors.textMuted}
              style={{ marginTop: spacing.md }}
            >
              Tap to begin writing.
            </Text>
          </View>
          <LinearGradient
            colors={gradients.moodCool as unknown as readonly [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconBubble}
          >
            <Ionicons name="arrow-forward" size={20} color={colors.palette.ink900} />
          </LinearGradient>
        </View>
      </GlassCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBubble: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
