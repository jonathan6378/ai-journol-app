import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

type Props = {
  onRecorded: (uri: string, durationMs: number) => void;
  disabled?: boolean;
};

/**
 * Voice recording — held while pressed, releases on lift. Uses expo-av.
 * Permission is requested on first press; the user is never blocked by an
 * unhandled rejection.
 */
export const VoiceRecorder: React.FC<Props> = ({ onRecorded, disabled }) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const pulse = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
      recording?.stopAndUnloadAsync().catch(() => null);
    };
  }, [recording]);

  const start = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) return;
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording: rec } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      setRecording(rec);
      setElapsed(0);
      timer.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      pulse.value = withRepeat(
        withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } catch {
      /* swallow — leave UI in idle state */
    }
  };

  const stop = async () => {
    if (!recording) return;
    if (timer.current) clearInterval(timer.current);
    pulse.value = withTiming(0, { duration: 200 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => null);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      const status = await recording.getStatusAsync();
      if (uri) {
        onRecorded(uri, (status.durationMillis as number) ?? elapsed * 1000);
      }
    } catch {
      /* ignore */
    } finally {
      setRecording(null);
    }
  };

  const animPulse = useAnimatedStyle(() => ({
    opacity: 0.25 + pulse.value * 0.4,
    transform: [{ scale: 1 + pulse.value * 0.35 }],
  }));

  const isRecording = !!recording;

  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable
        disabled={disabled}
        onPressIn={start}
        onPressOut={stop}
        style={styles.button}
      >
        {isRecording && (
          <Animated.View
            style={[styles.pulse, animPulse]}
            pointerEvents="none"
          />
        )}
        <View
          style={[
            styles.inner,
            { backgroundColor: isRecording ? colors.danger : colors.glass },
          ]}
        >
          <Ionicons
            name={isRecording ? 'stop' : 'mic'}
            size={24}
            color={isRecording ? colors.palette.bone100 : colors.text}
          />
        </View>
      </Pressable>
      <Text
        variant="caption"
        color={colors.textMuted}
        style={{ marginTop: spacing.sm }}
      >
        {isRecording
          ? `Recording  ${formatTime(elapsed)}`
          : 'Hold to record'}
      </Text>
    </View>
  );
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulse: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.danger,
  },
  inner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
});
