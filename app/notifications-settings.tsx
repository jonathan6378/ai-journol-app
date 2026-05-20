import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Screen, Text, GlassCard, Divider } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { useAuthStore, useNotificationsStore } from '@/store';

const HOURS = [6, 8, 10, 12, 15, 18, 20, 22];

export default function NotificationsSettings() {
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const {
    enabled,
    hour,
    busy,
    registrationStatus,
    hydrate,
    enable,
    disable,
    setHour,
  } = useNotificationsStore();
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    setStatusMsg(messageFor(registrationStatus));
  }, [registrationStatus]);

  const onToggle = async (v: boolean) => {
    if (v) await enable();
    else await disable();
  };

  return (
    <Screen edges={['top', 'bottom']} padded>
      <View style={styles.head}>
        <Pressable onPress={() => router.back()} hitSlop={16}>
          <Ionicons name="chevron-back" size={26} color={colors.text} />
        </Pressable>
        <Text variant="overline" color={colors.textMuted}>
          NOTIFICATIONS
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.huge }}>
        <Text variant="hero" style={{ marginTop: spacing.xl }}>
          Gentle by default.
        </Text>
        <Text variant="body" color={colors.textSecondary} style={{ marginTop: spacing.sm }}>
          One quiet nudge a day. No streak guilt, no clinical language. You can pause anytime.
        </Text>

        <GlassCard padding="lg" style={{ marginTop: spacing.xl }}>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: spacing.base }}>
              <Text variant="bodyMedium">Daily check-in</Text>
              <Text variant="small" color={colors.textMuted} style={{ marginTop: 2 }}>
                {enabled ? `Every day at ${formatHour(hour)}` : 'Off'}
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={onToggle}
              disabled={busy}
              trackColor={{ false: colors.bgSurface, true: `${colors.accent}66` }}
              thumbColor={enabled ? colors.accent : colors.bone400}
            />
          </View>

          {enabled && (
            <Animated.View entering={FadeIn.duration(280)}>
              <Divider style={{ marginVertical: spacing.lg }} />
              <Text variant="overline" color={colors.textMuted}>
                TIME
              </Text>
              <View style={styles.hourGrid}>
                {HOURS.map((h) => {
                  const active = h === hour;
                  return (
                    <Pressable
                      key={h}
                      onPress={() => setHour(h)}
                      style={[
                        styles.hourChip,
                        {
                          backgroundColor: active ? colors.accentMuted : colors.glass,
                          borderColor: active ? `${colors.accent}66` : colors.glassBorder,
                        },
                      ]}
                    >
                      <Text variant="caption" color={active ? colors.accent : colors.textSecondary}>
                        {formatHour(h)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>
          )}
        </GlassCard>

        {statusMsg && (
          <View style={styles.statusBox}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textMuted}
              style={{ marginTop: 2 }}
            />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text variant="small" color={colors.textSecondary}>
                {statusMsg}
              </Text>
              {registrationStatus === 'denied' && (
                <Pressable onPress={() => Linking.openSettings()} hitSlop={6}>
                  <Text variant="small" color={colors.accentSoft} style={{ marginTop: 4 }}>
                    Open settings
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        <View style={{ marginTop: spacing.xl }}>
          <Text variant="overline" color={colors.textMuted}>
            HOW THIS WORKS
          </Text>
          <Text variant="small" color={colors.textSecondary} style={{ marginTop: spacing.sm, lineHeight: 22 }}>
            We schedule a quiet local reminder at the time you choose. If you've also enabled push, a daily AI-personalized note may arrive instead — written in MindMirror's voice, tailored to your recent entries. Never more than once per day.
          </Text>
        </View>

        {profile?.expo_push_token && (
          <Text variant="caption" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
            Device registered for push.
          </Text>
        )}
      </ScrollView>
    </Screen>
  );
}

function formatHour(h: number): string {
  const ampm = h >= 12 ? 'pm' : 'am';
  const hh = h % 12 || 12;
  return `${hh}:00 ${ampm}`;
}

function messageFor(status: ReturnType<typeof useNotificationsStore.getState>['registrationStatus']) {
  switch (status) {
    case 'denied':
      return 'Notifications are disabled at the OS level. Open Settings to allow them.';
    case 'simulator':
      return 'Push tokens require a physical device. Local reminders still work.';
    case 'no_project_id':
      return 'EAS project ID missing. Local reminders still work; AI-personalized push needs an EAS build.';
    case 'error':
      return 'Could not register for push. Local reminders still work.';
    default:
      return null;
  }
}

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  hourGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.base,
  },
  hourChip: {
    paddingHorizontal: spacing.base,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: spacing.base,
    padding: spacing.base,
    borderRadius: radius.md,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
});
