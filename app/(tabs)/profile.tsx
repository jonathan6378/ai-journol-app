import React from 'react';
import { Pressable, StyleSheet, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, GlassCard, Divider, Button } from '@/components/ui';
import { useAuthStore, useEntriesStore, usePremiumStore } from '@/store';
import { colors, radius, spacing } from '@/theme';

export default function Profile() {
  const { profile, signOut } = useAuthStore();
  const { entries } = useEntriesStore();
  const { isPremium, openPaywall } = usePremiumStore();
  const premium = isPremium();
  const initials =
    (profile?.full_name ?? profile?.email ?? '?')
      .split(/[\s@]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join('') || '?';

  const onSignOut = () => {
    Alert.alert('Sign out?', 'You can come back anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  return (
    <Screen scrollable contentContainerStyle={{ paddingTop: spacing.xl, paddingBottom: 140 }}>
      <View style={styles.head}>
        <View style={styles.avatar}>
          <Text variant="h1" color={colors.palette.ink900}>
            {initials}
          </Text>
        </View>
        <Text variant="title" style={{ marginTop: spacing.lg }}>
          {profile?.full_name ?? 'You'}
        </Text>
        <Text variant="small" color={colors.textMuted}>
          {profile?.email}
        </Text>
      </View>

      <View style={styles.statsRow}>
        <Stat label="Entries" value={entries.length} />
        <Divider vertical style={{ height: 32 }} />
        <Stat label="Streak" value={profile?.streak_count ?? 0} />
        <Divider vertical style={{ height: 32 }} />
        <Stat label="Status" value={premium ? 'Premium' : 'Free'} />
      </View>

      {!premium && (
        <Pressable onPress={() => openPaywall()} style={{ marginTop: spacing.xl }}>
          <GlassCard padding="lg">
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text variant="overline" color={colors.accentSoft}>
                  PREMIUM
                </Text>
                <Text variant="title" style={{ marginTop: 6 }}>
                  Go deeper.
                </Text>
                <Text variant="small" color={colors.textSecondary} style={{ marginTop: 4 }}>
                  Voice journaling, AI memory, weekly recaps.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color={colors.text} />
            </View>
          </GlassCard>
        </Pressable>
      )}

      <View style={{ marginTop: spacing.xl, gap: 2 }}>
        <SettingRow icon="notifications-outline" label="Notifications" />
        <SettingRow icon="lock-closed-outline" label="Privacy" />
        <SettingRow icon="cloud-download-outline" label="Export entries" />
        <SettingRow icon="help-circle-outline" label="Help" />
        <SettingRow icon="document-text-outline" label="Terms & Privacy" />
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <Button label="Sign out" onPress={onSignOut} variant="ghost" />
      </View>

      <Text
        variant="caption"
        color={colors.textFaint}
        align="center"
        style={{ marginTop: spacing.lg }}
      >
        MindMirror v1.0.0
      </Text>
    </Screen>
  );
}

const Stat: React.FC<{ label: string; value: number | string }> = ({ label, value }) => (
  <View style={{ alignItems: 'center', flex: 1 }}>
    <Text variant="h1" color={colors.text}>
      {value}
    </Text>
    <Text variant="caption" color={colors.textMuted}>
      {label.toUpperCase()}
    </Text>
  </View>
);

const SettingRow: React.FC<{
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
}> = ({ icon, label, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.settingRow, pressed && { backgroundColor: colors.glass }]}
  >
    <Ionicons name={icon} size={20} color={colors.textSecondary} />
    <Text variant="body" style={{ flex: 1, marginLeft: spacing.base }}>
      {label}
    </Text>
    <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
  </Pressable>
);

const styles = StyleSheet.create({
  head: {
    alignItems: 'center',
    paddingTop: spacing.lg,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.palette.bone200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    height: 56,
    borderRadius: radius.md,
  },
});
