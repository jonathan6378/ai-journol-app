import React from 'react';
import { Platform, StyleSheet, View, ViewProps, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '@/theme';

export type GlassCardProps = ViewProps & {
  intensity?: number;
  padding?: keyof typeof spacing | number;
  rounded?: keyof typeof radius;
  withSheen?: boolean;
  style?: ViewStyle;
};

/**
 * Glass card — used VERY sparingly, only for hero moments
 * (hero greeting, paywall card, AI reflection card).
 *
 * On Android BlurView falls back to a translucent surface; we add a subtle
 * top-light gradient so it doesn't feel flat.
 */
export const GlassCard: React.FC<GlassCardProps> = ({
  intensity = 30,
  padding = 'lg',
  rounded = 'lg',
  withSheen = true,
  style,
  children,
  ...rest
}) => {
  const paddingValue =
    typeof padding === 'number' ? padding : spacing[padding];

  return (
    <View
      {...rest}
      style={[
        styles.container,
        { borderRadius: radius[rounded] },
        style,
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.androidGlass]} />
      )}
      {withSheen && (
        <LinearGradient
          colors={['rgba(255,255,255,0.06)', 'rgba(255,255,255,0)'] as unknown as readonly [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 0.6 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      <View style={{ padding: paddingValue }}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  androidGlass: {
    backgroundColor: 'rgba(28, 26, 40, 0.65)',
  },
});
