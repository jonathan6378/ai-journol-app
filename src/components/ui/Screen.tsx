import React from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
  ScrollView,
  ScrollViewProps,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '@/theme';
import { GradientBackground } from './GradientBackground';

export type ScreenProps = {
  children: React.ReactNode;
  /** Swap the flat ink background for a cinematic gradient. */
  gradient?: 'dusk' | 'dawn' | 'calm' | 'candle' | 'premium';
  scrollable?: boolean;
  padded?: boolean;
  /** Avoid the keyboard for screens with text input. */
  keyboardAvoiding?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  contentContainerStyle?: ViewStyle;
  style?: ViewStyle;
} & Omit<ScrollViewProps, 'children' | 'style' | 'contentContainerStyle'>;

/**
 * Standard screen wrapper. Handles:
 *  - safe area
 *  - background (flat ink or gradient)
 *  - optional scroll
 *  - keyboard avoidance
 */
export const Screen: React.FC<ScreenProps> = ({
  children,
  gradient,
  scrollable = false,
  padded = true,
  keyboardAvoiding = false,
  edges = ['top'],
  contentContainerStyle,
  style,
  ...scrollProps
}) => {
  const padding = padded ? { paddingHorizontal: spacing.lg } : null;

  const inner = scrollable ? (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[
        { paddingBottom: spacing.huge },
        padding,
        contentContainerStyle,
      ]}
      {...scrollProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padding, contentContainerStyle]}>{children}</View>
  );

  const wrapped = keyboardAvoiding ? (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {inner}
    </KeyboardAvoidingView>
  ) : (
    inner
  );

  const body = (
    <SafeAreaView edges={edges} style={[styles.flex, style]}>
      {wrapped}
    </SafeAreaView>
  );

  return gradient ? (
    <GradientBackground variant={gradient}>{body}</GradientBackground>
  ) : (
    <View style={[styles.flex, { backgroundColor: colors.bg }]}>{body}</View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
