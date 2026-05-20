import React, { useCallback } from 'react';
import {
  Pressable,
  PressableProps,
  StyleSheet,
  View,
  ViewStyle,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing, springs } from '@/theme';
import { Text } from './Text';

type Variant = 'primary' | 'ghost' | 'glass' | 'soft';
type Size = 'sm' | 'md' | 'lg';

export type ButtonProps = Omit<PressableProps, 'style'> & {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
  haptic?: boolean;
  style?: ViewStyle;
};

/**
 * Premium button. Three things matter:
 *   1. Spring scale on press (no jarring opacity blink).
 *   2. Subtle haptics on touch — not on release.
 *   3. Quiet visual hierarchy: primary uses a soft gradient, others recede.
 */
export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  fullWidth = true,
  haptic = true,
  disabled,
  style,
  ...rest
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    scale.value = withSpring(0.97, springs.snappy);
    opacity.value = withTiming(0.9, { duration: 120 });
  }, [haptic, scale, opacity]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, springs.gentle);
    opacity.value = withTiming(1, { duration: 180 });
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const heights: Record<Size, number> = { sm: 40, md: 52, lg: 60 };
  const paddings: Record<Size, number> = { sm: spacing.base, md: spacing.lg, lg: spacing.xl };
  const fontVariant = size === 'lg' ? 'h2' : 'bodyMedium';

  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle = {
    height: heights[size],
    paddingHorizontal: paddings[size],
    borderRadius: radius.pill,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    opacity: isDisabled ? 0.45 : 1,
  };

  const Inner = (
    <View style={styles.row}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.bg : colors.text} />
      ) : (
        <>
          {icon ? <View style={styles.iconLeft}>{icon}</View> : null}
          <Text
            variant={fontVariant}
            weight="semibold"
            color={variant === 'primary' ? colors.palette.ink900 : colors.text}
          >
            {label}
          </Text>
          {iconRight ? <View style={styles.iconRight}>{iconRight}</View> : null}
        </>
      )}
    </View>
  );

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        {...rest}
      >
        {variant === 'primary' ? (
          <LinearGradient
            colors={[colors.palette.bone100, colors.palette.bone200] as unknown as readonly [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.base, containerStyle]}
          >
            {Inner}
          </LinearGradient>
        ) : variant === 'glass' ? (
          <View style={[styles.base, styles.glass, containerStyle]}>{Inner}</View>
        ) : variant === 'soft' ? (
          <LinearGradient
            colors={gradients.dusk as unknown as readonly [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.base, styles.soft, containerStyle]}
          >
            {Inner}
          </LinearGradient>
        ) : (
          <View style={[styles.base, styles.ghost, containerStyle]}>{Inner}</View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: { marginRight: spacing.sm },
  iconRight: { marginLeft: spacing.sm },
  glass: {
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  soft: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
});
