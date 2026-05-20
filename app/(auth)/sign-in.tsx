import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Button } from '@/components/ui';
import { auth } from '@/lib/api';
import { colors, radius, spacing } from '@/theme';

export default function SignIn() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await auth.signInWithEmail(email.trim(), password);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message ?? 'Could not sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen gradient="dusk" keyboardAvoiding edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={16}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text variant="hero" color={colors.text}>
            Welcome back.
          </Text>
          <Text variant="body" color={colors.textSecondary} style={{ marginTop: 8 }}>
            Pick up where you left off.
          </Text>

          <View style={{ marginTop: spacing.xxl, gap: spacing.base }}>
            <Field
              icon="mail-outline"
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <Field
              icon="lock-closed-outline"
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error && (
            <Text
              variant="small"
              color={colors.danger}
              style={{ marginTop: spacing.md }}
            >
              {error}
            </Text>
          )}

          <Button
            label="Sign in"
            onPress={onSubmit}
            loading={loading}
            disabled={!email || !password}
            size="lg"
            style={{ marginTop: spacing.xl }}
          />

          <Pressable
            style={{ alignSelf: 'center', marginTop: spacing.lg }}
            hitSlop={12}
          >
            <Text variant="small" color={colors.textMuted}>
              Forgot password?
            </Text>
          </Pressable>
        </View>

        <Link href="/(auth)/sign-up" asChild>
          <Pressable
            hitSlop={12}
            style={{ alignSelf: 'center', paddingVertical: spacing.lg }}
          >
            <Text variant="bodyMedium" color={colors.textSecondary}>
              New here?{' '}
              <Text variant="bodyMedium" color={colors.text}>
                Create an account
              </Text>
            </Text>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

function Field(
  props: React.ComponentProps<typeof TextInput> & {
    icon: keyof typeof Ionicons.glyphMap;
  },
) {
  const { icon, ...input } = props;
  return (
    <View style={styles.field}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        autoCorrect={false}
        {...input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: spacing.lg },
  back: { width: 32, height: 32, justifyContent: 'center' },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
});
