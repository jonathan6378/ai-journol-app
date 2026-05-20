import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Screen, Text, Button } from '@/components/ui';
import { MoodPicker } from '@/components/home/MoodPicker';
import { EmotionTagsRow } from '@/components/journal/EmotionTagsRow';
import { VoiceRecorder } from '@/components/journal/VoiceRecorder';
import { ReflectionCard } from '@/components/journal/ReflectionCard';
import { colors, spacing, radius } from '@/theme';
import {
  useAuthStore,
  useEntriesStore,
  usePremiumStore,
} from '@/store';
import { promptForToday } from '@/utils/prompts';
import { hasGemini } from '@/lib/env';
import { EmotionTag, Mood, Reflection } from '@/types';

export default function Compose() {
  const router = useRouter();
  const { session } = useAuthStore();
  const { draft, setDraft, resetDraft, saveEntry, composing } = useEntriesStore();
  const { isPremium, openPaywall } = usePremiumStore();
  const [showVoice, setShowVoice] = useState(false);
  const [phase, setPhase] = useState<'compose' | 'reflecting' | 'reflected'>('compose');
  const [reflection, setReflection] = useState<Reflection | null>(null);

  const onMood = (m: Mood) => setDraft({ mood: m });
  const onTag = (t: EmotionTag) => {
    const next = draft.emotions.includes(t)
      ? draft.emotions.filter((x) => x !== t)
      : [...draft.emotions, t];
    setDraft({ emotions: next });
  };

  const canSave = draft.body.trim().length > 0 || !!draft.mood;

  const onSave = async () => {
    if (!session?.user.id) return;
    setPhase('reflecting');
    try {
      const { reflection: r } = await saveEntry(session.user.id);
      setReflection(r);
      setPhase('reflected');
    } catch {
      setPhase('compose');
    }
  };

  const onClose = () => {
    resetDraft();
    setReflection(null);
    setPhase('compose');
    router.back();
  };

  const onVoicePress = () => {
    if (!isPremium()) {
      openPaywall('Voice journaling is part of Premium.');
      return;
    }
    setShowVoice((v) => !v);
  };

  if (phase !== 'compose') {
    return (
      <Screen gradient="candle" padded keyboardAvoiding edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          <Pressable onPress={onClose} hitSlop={16}>
            <Ionicons name="close" size={26} color={colors.text} />
          </Pressable>
          <Text variant="overline" color={colors.textMuted}>
            REFLECTION
          </Text>
          <View style={{ width: 26 }} />
        </View>
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.huge }}>
          <Animated.View entering={FadeIn.duration(300)} style={{ marginTop: spacing.xl }}>
            <ReflectionCard
              reflection={reflection}
              loading={phase === 'reflecting'}
            />
          </Animated.View>

          <View style={{ marginTop: spacing.xxl }}>
            <Button label="Done" onPress={onClose} size="lg" />
          </View>
        </ScrollView>
      </Screen>
    );
  }

  return (
    <Screen gradient="dusk" padded keyboardAvoiding edges={['top', 'bottom']}>
      <View style={styles.modalHeader}>
        <Pressable onPress={onClose} hitSlop={16}>
          <Ionicons name="close" size={26} color={colors.text} />
        </Pressable>
        <Text variant="overline" color={colors.textMuted}>
          NEW ENTRY
        </Text>
        <Pressable onPress={onVoicePress} hitSlop={16}>
          <Ionicons
            name={showVoice ? 'mic' : 'mic-outline'}
            size={22}
            color={showVoice ? colors.accentSoft : colors.text}
          />
        </Pressable>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: spacing.huge }}
      >
        <Text
          variant="caption"
          color={colors.textMuted}
          style={{ marginTop: spacing.lg }}
        >
          {new Date().toDateString().toUpperCase()}
        </Text>
        <Text
          variant="title"
          color={colors.textSecondary}
          style={{ marginTop: spacing.xs }}
        >
          {promptForToday()}
        </Text>

        <View style={styles.editor}>
          <TextInput
            placeholder="Start writing... no rules here."
            placeholderTextColor={colors.textFaint}
            multiline
            value={draft.body}
            onChangeText={(t) => setDraft({ body: t })}
            style={styles.input}
            textAlignVertical="top"
          />
        </View>

        {showVoice && (
          <Animated.View
            entering={FadeIn.duration(280)}
            style={{ marginTop: spacing.xl, alignItems: 'center' }}
          >
            <VoiceRecorder
              onRecorded={(uri) => {
                // For brevity we attach the URI to the body. A production
                // version would upload to Supabase Storage and store the URL.
                setDraft({
                  body:
                    draft.body +
                    (draft.body ? '\n\n' : '') +
                    `[voice note saved locally: ${uri.slice(-12)}]`,
                });
              }}
            />
          </Animated.View>
        )}

        <View style={{ marginTop: spacing.xl }}>
          <Text variant="overline" color={colors.textMuted}>
            MOOD
          </Text>
          <View style={{ marginTop: spacing.base }}>
            <MoodPicker value={draft.mood} onChange={onMood} />
          </View>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <Text variant="overline" color={colors.textMuted}>
            HOW IT FEELS
          </Text>
          <View style={{ marginTop: spacing.base, marginHorizontal: -spacing.lg }}>
            <View style={{ paddingHorizontal: spacing.lg }}>
              <EmotionTagsRow selected={draft.emotions} onToggle={onTag} />
            </View>
          </View>
        </View>

        <View style={{ marginTop: spacing.xxl }}>
          <Button
            label={hasGemini ? 'Save & reflect' : 'Save entry'}
            onPress={onSave}
            loading={composing}
            disabled={!canSave}
            size="lg"
          />
          {!hasGemini && (
            <Text
              variant="caption"
              color={colors.textFaint}
              align="center"
              style={{ marginTop: spacing.md }}
            >
              Add a Gemini API key in .env to enable AI reflections.
            </Text>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  editor: {
    marginTop: spacing.lg,
    minHeight: 220,
    backgroundColor: colors.glass,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    padding: spacing.lg,
  },
  input: {
    color: colors.text,
    fontSize: 18,
    lineHeight: 28,
    minHeight: 200,
  },
});
