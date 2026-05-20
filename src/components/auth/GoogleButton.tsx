import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Text } from '@/components/ui';
import { colors, radius, spacing, springs } from '@/theme';
import { googleSignIn, isGoogleSignInAvailable } from '@/lib/google-auth';
import { auth } from '@/lib/api';

type Props = {
  onSuccess?: () => void;
  onError?: (msg: string) => void;
  label?: string;
  disabled?: boolean;
};

/**
 * Google sign-in button — quietly branded.
 *
 * Notes on style:
 *  - We keep the official Google "G" mark (per brand guidelines) but mute
 *    everything else: surface, label, hover state. The button never shouts.
 *  - Hidden entirely when Google isn't configured, so users don't see a dead
 *    affordance.
 *  - Calls google-auth → supabase.auth.signInWithIdToken in a single tap.
 */
export const GoogleButton: React.FC<Props> = ({
  onSuccess,
  onError,
  label = 'Continue with Google',
  disabled,
}) => {
  const [busy, setBusy] = useState(false);
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withSpring(0.97, springs.snappy);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
  }, [scale]);
  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, springs.gentle);
  }, [scale]);

  const handlePress = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const result = await googleSignIn();
      if (!result.ok) {
        if (!result.cancelled) onError?.(result.error);
        return;
      }
      try {
        await auth.signInWithGoogle(result.idToken);
        onSuccess?.();
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Could not sign in.';
        onError?.(msg);
      }
    } finally {
      setBusy(false);
    }
  };

  if (!isGoogleSignInAvailable()) return null;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || busy}
        style={({ pressed }) => [
          styles.button,
          pressed && { opacity: 0.92 },
          (disabled || busy) && { opacity: 0.6 },
        ]}
      >
        {busy ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <View style={styles.content}>
            <GoogleG />
            <Text variant="bodyMedium" color={colors.text} style={{ marginLeft: spacing.md }}>
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

/**
 * The official Google "G" SVG. Vector, so it stays sharp at any size.
 */
const GoogleG: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48">
    <Path
      fill="#FFC107"
      d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917"
    />
    <Path
      fill="#FF3D00"
      d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691"
    />
    <Path
      fill="#4CAF50"
      d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44"
    />
    <Path
      fill="#1976D2"
      d="M43.611 20.083L43.595 20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917"
    />
  </Svg>
);

const styles = StyleSheet.create({
  button: {
    height: 52,
    borderRadius: radius.pill,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
