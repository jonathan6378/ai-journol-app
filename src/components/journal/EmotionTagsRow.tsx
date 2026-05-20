import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Tag } from '@/components/ui';
import { EmotionTag, EMOTION_TAGS } from '@/types';
import { colors, spacing } from '@/theme';

const COLORS: Partial<Record<EmotionTag, string>> = {
  grateful: colors.palette.peach,
  inspired: colors.palette.amber,
  hopeful: colors.palette.sky,
  loved: colors.palette.rose,
  focused: colors.palette.lavender,
  proud: colors.palette.amber,
  curious: colors.palette.sky,
  creative: colors.palette.lavenderSoft,
  restless: colors.palette.peach,
  lonely: colors.palette.clay,
  angry: colors.palette.rose,
  jealous: colors.palette.clay,
  guilty: colors.palette.clay,
  embarrassed: colors.palette.rose,
  numb: colors.palette.mist300,
  sensitive: colors.palette.lavenderSoft,
};

type Props = {
  selected: EmotionTag[];
  onToggle: (tag: EmotionTag) => void;
};

export const EmotionTagsRow: React.FC<Props> = ({ selected, onToggle }) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {EMOTION_TAGS.map((t) => (
        <View key={t} style={{ marginRight: spacing.sm }}>
          <Tag
            label={t}
            selected={selected.includes(t)}
            onPress={() => onToggle(t)}
            color={COLORS[t] ?? colors.accent}
          />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    paddingVertical: 4,
  },
});
