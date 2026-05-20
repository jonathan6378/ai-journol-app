import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Text, Button } from '@/components/ui';
import { GoogleButton } from '@/components/auth/GoogleButton';
import { isGoogleSignInAvailable } from '@/lib/google-auth';
import { auth } from '@/lib/api';
import { colors, radius, spacing } from '@/theme';

export default function SignUp() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = email.includes('@') && password.length >= 6;

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await auth.signUpWithEmail(email.trim(), password, name.trim() || undefined);
      router.replace('/(tabs)');
    } catch (e: any) {
      setError(e.message ?? 'Could not create account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen gradient="dawn" keyboardAvoiding edges={['top', 'bottom']}>
      <View style={styles.container}>
        <Pressable onPress={() => router.back()} hitSlop={16} style={styles.back}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <View style={{ flex: 1, justifyContent: 'center' }}>
          <Text variant="hero" color={colors.text}>
            Make space for{'\n'}your thoughts.
          </Text>
          <Text variant="body" color={colors.textSecondary} style={{ marginTop: 8 }}>
            Takes less than a minute.
          </Text>

          <View style={{ marginTop: spacing.xxl, gap: spacing.base }}>
            <Field
              icon="person-outline"
              placeholder="Your name (optional)"
              value={name}
              onChangeText={setName}
            />
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
              placeholder="Password (6+ chars)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {error && (
            <Text variant="small" color={colors.danger} style={{ marginTop: spacing.md }}>
              {error}
            </Text>
          )}

          <Button
            label="Create account"
            onPress={onSubmit}
            loading={loading}
            disabled={!valid}
            size="lg"
            style={{ marginTop: spacing.xl }}
          />

          {isGoogleSignInAvailable() && (
            <>
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text variant="caption" color={colors.textFaint} style={{ marginHorizontal: spacing.md }}>
                  OR
                </Text>
                <View style={styles.dividerLine} />
              </View>
              <GoogleButton
                label="Sign up with Google"
                onSuccess={() => router.replace('/(tabs)')}
                onError={(msg) => setError(msg)}
              />
            </>
          )}

          <Text
            variant="caption"
            color={colors.textFaint}
            align="center"
            style={{ marginTop: spacing.base, paddingHorizontal: spacing.lg }}
          >
            By continuing you agree to our Terms and Privacy Policy.
          </Text>
        </View>

        <Link href="/(auth)/sign-in" asChild>
          <Pressable
            hitSlop={12}
            style={{ alignSelf: 'center', paddingVertical: spacing.lg }}
          >
            <Text variant="bodyMedium" color={colors.textSecondary}>
              Already a member?{' '}
              <Text variant="bodyMedium" color={colors.text}>
                Sign in
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.divider,
  },
});
