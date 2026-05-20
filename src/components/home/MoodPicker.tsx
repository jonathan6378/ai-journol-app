import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { colors, springs, spacing } from '@/theme';
import { Mood, MOOD_ORDER, MOOD_LABEL } from '@/types';

type Props = {
  value: Mood | null;
  onChange: (m: Mood) => void;
  size?: 'sm' | 'lg';
};

/**
 * The mood picker — 8 soft orbs in a horizontal scroll-free row.
 * Each orb is just a colored circle on a translucent backdrop. When selected,
 * the orb scales up gently and reveals its label below.
 */
export const MoodPicker: React.FC<Props> = ({ value, onChange, size = 'lg' }) => {
  return (
    <View>
      <View style={styles.row}>
        {MOOD_ORDER.map((m) => (
          <MoodOrb
            key={m}
            mood={m}
            selected={value === m}
            onPress={() => {
              Haptics.selectionAsync().catch(() => null);
              onChange(m);
            }}
            size={size}
          />
        ))}
      </View>
      <View style={{ height: 22, marginTop: spacing.sm }}>
        <Text
          variant="caption"
          align="center"
          color={value ? colors.text : colors.textFaint}
        >
          {value ? MOOD_LABEL[value] : 'Choose a mood'}
        </Text>
      </View>
    </View>
  );
};

const MoodOrb: React.FC<{
  mood: Mood;
  selected: boolean;
  onPress: () => void;
  size: 'sm' | 'lg';
}> = ({ mood, selected, onPress, size }) => {
  const scale = useSharedValue(1);
  const ring = useSharedValue(0);

  React.useEffect(() => {
    scale.value = withSpring(selected ? 1.18 : 1, springs.gentle);
    ring.value = withSpring(selected ? 1 : 0, springs.soft);
  }, [selected, scale, ring]);

  const animOrb = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const animRing = useAnimatedStyle(() => ({
    opacity: ring.value,
    transform: [{ scale: 0.9 + ring.value * 0.2 }],
  }));

  const dot = size === 'lg' ? 28 : 22;
  const ringSize = dot + 18;
  const color = colors.mood[mood];

  return (
    <Pressable onPress={onPress} hitSlop={4} style={styles.orbWrap}>
      <Animated.View
        style={[
          styles.ring,
          { width: ringSize, height: ringSize, borderColor: `${color}88` },
          animRing,
        ]}
      />
      <Animated.View
        style={[
          styles.orb,
          {
            width: dot,
            height: dot,
            borderRadius: dot / 2,
            backgroundColor: color,
            shadowColor: color,
          },
          animOrb,
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orbWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    shadowOpacity: 0.45,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1.5,
  },
});
