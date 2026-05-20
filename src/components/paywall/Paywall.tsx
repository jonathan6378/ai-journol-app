import React, { useState } from 'react';
import { Pressable, StyleSheet, View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Button, GlassCard } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { useAuthStore, usePremiumStore } from '@/store';
import { PLANS, Plan, purchasePlan, formatPrice } from '@/lib/razorpay';
import { hasRazorpay } from '@/lib/env';

type Props = {
  onClose: () => void;
};

const PERKS = [
  { icon: 'mic-outline', title: 'Voice journaling', body: 'Speak your thoughts and let MindMirror transcribe them.' },
  { icon: 'sparkles-outline', title: 'Unlimited reflections', body: 'AI responses on every entry, every day.' },
  { icon: 'leaf-outline', title: 'AI memory', body: 'Themes, goals, and triggers remembered across weeks.' },
  { icon: 'pulse-outline', title: 'Cinematic recaps', body: 'Weekly emotional summaries you\u2019ll want to read.' },
  { icon: 'infinite-outline', title: 'Emotional timeline', body: 'See months of patterns, not just the past 7 days.' },
] as const;

export const Paywall: React.FC<Props> = ({ onClose }) => {
  const [selected, setSelected] = useState<Plan>(PLANS[1]); // annual
  const [loading, setLoading] = useState(false);
  const { profile, refreshProfile } = useAuthStore();
  const { closePaywall, paywallReason } = usePremiumStore();

  const onPurchase = async () => {
    if (!hasRazorpay) {
      Alert.alert(
        'Payments not configured',
        'Add EXPO_PUBLIC_RAZORPAY_KEY_ID to your .env to enable in-app purchases.',
      );
      return;
    }
    if (!profile?.id) return;
    setLoading(true);
    const result = await purchasePlan({
      plan: selected,
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
      },
    });
    setLoading(false);
    if (result.success) {
      await refreshProfile();
      closePaywall();
      onClose();
    } else {
      Alert.alert('Payment didn\u2019t go through', result.error);
    }
  };

  return (
    <Screen gradient="premium" edges={['top', 'bottom']} padded scrollable>
      <View style={styles.head}>
        <Pressable onPress={onClose} hitSlop={16}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text variant="overline" color={colors.textMuted}>
          MINDMIRROR PREMIUM
        </Text>
        <View style={{ width: 26 }} />
      </View>

      <View style={{ marginTop: spacing.xxl }}>
        <Text variant="display" align="center">
          Soft, but{'\n'}deeper.
        </Text>
        <Text
          variant="body"
          color={colors.textSecondary}
          align="center"
          style={{ marginTop: spacing.md, paddingHorizontal: spacing.lg }}
        >
          {paywallReason ?? 'Premium unlocks the parts of MindMirror that get to know you.'}
        </Text>
      </View>

      <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
        {PERKS.map((p) => (
          <GlassCard key={p.title} padding="md" rounded="md">
            <View style={styles.perkRow}>
              <View style={styles.perkIcon}>
                <Ionicons
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  name={p.icon as any}
                  size={18}
                  color={colors.accentSoft}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="bodyMedium" color={colors.text}>
                  {p.title}
                </Text>
                <Text variant="small" color={colors.textSecondary} style={{ marginTop: 2 }}>
                  {p.body}
                </Text>
              </View>
            </View>
          </GlassCard>
        ))}
      </View>

      <View style={{ marginTop: spacing.xxl, gap: spacing.md }}>
        {PLANS.map((p) => {
          const active = selected.id === p.id;
          return (
            <Pressable key={p.id} onPress={() => setSelected(p)}>
              <View
                style={[
                  styles.plan,
                  {
                    borderColor: active ? colors.accent : colors.glassBorder,
                    backgroundColor: active ? colors.accentMuted : colors.glass,
                  },
                ]}
              >
                <View style={styles.radio}>
                  <View
                    style={[
                      styles.radioInner,
                      {
                        backgroundColor: active ? colors.accent : 'transparent',
                        borderColor: active ? colors.accent : colors.borderStrong,
                      },
                    ]}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.planHead}>
                    <Text variant="bodyMedium" color={colors.text}>
                      {p.label}
                    </Text>
                    {p.bestValue && (
                      <View style={styles.badge}>
                        <Text variant="caption" color={colors.palette.ink900}>
                          BEST VALUE
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
                    {p.perks}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text variant="bodyMedium" color={colors.text}>
                    {formatPrice(p.amountPaise)}
                  </Text>
                  <Text variant="caption" color={colors.textMuted}>
                    {p.cadence}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <Button
        label={`Continue with ${selected.label}`}
        onPress={onPurchase}
        loading={loading}
        size="lg"
        style={{ marginTop: spacing.xl }}
      />
      <Text
        variant="caption"
        color={colors.textFaint}
        align="center"
        style={{ marginTop: spacing.md, marginBottom: spacing.xl }}
      >
        Cancel anytime. Payments handled by Razorpay. Restoring purchases applies automatically.
      </Text>
    </Screen>
  );
};

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  perkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  perkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  planHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.palette.amber,
  },
});
