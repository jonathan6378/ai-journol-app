import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '@/theme';

type Variant = keyof typeof gradients;

export type GradientBackgroundProps = {
  variant?: Variant;
  children?: React.ReactNode;
  style?: ViewStyle;
  /** Add a slow vignette so content sits in a "spotlight". */
  vignette?: boolean;
};

/**
 * Cinematic full-bleed background. Use behind hero screens.
 * The flat ink layer at the bottom prevents banding on dark Android panels.
 */
export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  variant = 'dusk',
  children,
  style,
  vignette = true,
}) => {
  return (
    <View style={[styles.root, style]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />
      <LinearGradient
        colors={gradients[variant] as unknown as readonly [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {vignette && (
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)'] as unknown as readonly [string, string]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});
