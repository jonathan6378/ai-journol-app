import React, { useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Screen, Text, Button } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  gradient: 'dawn' | 'dusk' | 'calm' | 'candle';
};

const SLIDES: Slide[] = [
  {
    eyebrow: 'Write freely',
    title: 'Not a diary.\nA conversation.',
    body: 'Type or speak. Short or long. There is no right way.',
    gradient: 'dawn',
  },
  {
    eyebrow: 'Get reflected',
    title: 'A second voice,\ngentle and yours.',
    body: 'After you write, MindMirror responds — never advice, just clarity.',
    gradient: 'calm',
  },
  {
    eyebrow: 'See yourself',
    title: 'Your week,\nin emotional color.',
    body: 'Soft patterns surface over time. Triggers, joys, recurring themes.',
    gradient: 'dusk',
  },
  {
    eyebrow: 'Stays private',
    title: 'Encrypted.\nYours alone.',
    body: 'Entries live in your account. We never sell or share what you write.',
    gradient: 'candle',
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const onNext = () => {
    if (isLast) router.push('/(auth)/sign-up');
    else setStep((s) => s + 1);
  };

  return (
    <Screen gradient={slide.gradient} edges={['top', 'bottom']} padded={false}>
      <View style={styles.container}>
        <View style={styles.topRow}>
          <View style={styles.dots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === step && styles.dotActive,
                  i < step && styles.dotPast,
                ]}
              />
            ))}
          </View>
          <Pressable onPress={() => router.push('/(auth)/sign-up')} hitSlop={12}>
            <Text variant="caption" color={colors.textMuted}>
              SKIP
            </Text>
          </Pressable>
        </View>

        <Animated.View
          key={step}
          entering={FadeIn.duration(420)}
          exiting={FadeOut.duration(180)}
          style={styles.copy}
        >
          <Text variant="overline" color={colors.accentSoft}>
            {slide.eyebrow}
          </Text>
          <Text
            variant="hero"
            color={colors.text}
            style={{ marginTop: spacing.base }}
          >
            {slide.title}
          </Text>
          <Text
            variant="body"
            color={colors.textSecondary}
            style={{ marginTop: spacing.lg, lineHeight: 26 }}
          >
            {slide.body}
          </Text>
        </Animated.View>

        <View style={styles.cta}>
          <Button label={isLast ? 'Create account' : 'Continue'} onPress={onNext} size="lg" />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 24,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  dotActive: {
    backgroundColor: colors.text,
    width: 36,
  },
  dotPast: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  copy: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: spacing.xl,
  },
  cta: {},
});
