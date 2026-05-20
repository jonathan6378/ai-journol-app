import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '@/theme';
import { Text } from './Text';

export type TagProps = {
  label: string;
  selected?: boolean;
  color?: string;
  onPress?: () => void;
  size?: 'sm' | 'md';
  style?: ViewStyle;
};

/**
 * Pill chip used for emotion tags & filters. Selected state uses the tag's
 * own color at very low alpha — never a solid fill.
 */
export const Tag: React.FC<TagProps> = ({
  label,
  selected = false,
  color = colors.accent,
  onPress,
  size = 'md',
  style,
}) => {
  const handlePress = () => {
    Haptics.selectionAsync().catch(() => {});
    onPress?.();
  };

  const heights = { sm: 28, md: 36 };
  const paddings = { sm: spacing.sm, md: spacing.md };

  const interactive = !!onPress;

  const inner = (
    <View
      style={[
        styles.tag,
        {
          height: heights[size],
          paddingHorizontal: paddings[size],
          backgroundColor: selected ? `${color}22` : colors.glass,
          borderColor: selected ? `${color}66` : colors.glassBorder,
        },
        style,
      ]}
    >
      {selected && (
        <View
          style={[
            styles.dot,
            { backgroundColor: color },
          ]}
        />
      )}
      <Text
        variant="caption"
        color={selected ? color : colors.textSecondary}
      >
        {label}
      </Text>
    </View>
  );

  if (!interactive) return inner;

  return (
    <Pressable onPress={handlePress} hitSlop={6}>
      {inner}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
});
