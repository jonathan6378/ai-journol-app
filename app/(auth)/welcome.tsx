import React, { useEffect } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter, Link } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withTiming,
  Easing,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { Screen, Text, Button } from '@/components/ui';
import { colors, spacing } from '@/theme';

/**
 * Welcome screen — the first emotional beat.
 * No marketing copy, no checklist of features. Just an invitation.
 */
export default function Welcome() {
  const router = useRouter();
  const fadeIn = useSharedValue(0);
  const orbScale = useSharedValue(0.8);

  useEffect(() => {
    fadeIn.value = withDelay(200, withTiming(1, { duration: 1200 }));
    orbScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [fadeIn, orbScale]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeIn.value }));
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  return (
    <Screen gradient="dawn" edges={['top', 'bottom']} padded={false}>
      <View style={styles.container}>
        <View style={styles.orbWrap}>
          <Animated.View style={[styles.orbOuter, orbStyle]} />
          <Animated.View style={[styles.orbInner, orbStyle]} />
        </View>

        <Animated.View style={[styles.copy, fadeStyle]}>
          <Text variant="display" align="center" color={colors.text}>
            MindMirror
          </Text>
          <Text
            variant="body"
            align="center"
            color={colors.textSecondary}
            style={{ marginTop: spacing.md, paddingHorizontal: spacing.xl }}
          >
            A quiet place to think,{'\n'}with someone who listens.
          </Text>
        </Animated.View>

        <Animated.View style={[styles.cta, fadeStyle]}>
          <Button
            label="Begin"
            onPress={() => router.push('/(auth)/onboarding')}
            size="lg"
          />
          <Link href="/(auth)/sign-in" asChild>
            <Pressable hitSlop={12} style={styles.signinLink}>
              <Text variant="bodyMedium" color={colors.textSecondary}>
                I already have an account
              </Text>
            </Pressable>
          </Link>
        </Animated.View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
    paddingTop: spacing.huge,
    paddingBottom: spacing.xxl,
  },
  orbWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xxl,
    height: 200,
  },
  orbOuter: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(167, 139, 250, 0.10)',
  },
  orbInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(244, 182, 182, 0.30)',
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 60,
    shadowOffset: { width: 0, height: 0 },
  },
  copy: {
    alignItems: 'center',
  },
  cta: {
    gap: spacing.lg,
  },
  signinLink: {
    alignSelf: 'center',
    paddingVertical: spacing.sm,
  },
});
