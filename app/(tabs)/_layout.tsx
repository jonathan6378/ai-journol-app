import React from 'react';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, radius, spacing } from '@/theme';
import { Text } from '@/components/ui';

type TabKey = 'index' | 'insights' | 'memory' | 'profile';

const ICONS: Record<TabKey, { active: keyof typeof Ionicons.glyphMap; idle: keyof typeof Ionicons.glyphMap }> = {
  index: { active: 'sparkles', idle: 'sparkles-outline' },
  insights: { active: 'pulse', idle: 'pulse-outline' },
  memory: { active: 'leaf', idle: 'leaf-outline' },
  profile: { active: 'person', idle: 'person-outline' },
};

const LABELS: Record<TabKey, string> = {
  index: 'Today',
  insights: 'Insights',
  memory: 'Memory',
  profile: 'You',
};

function ComposeFab() {
  const router = useRouter();
  const onPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => null);
    router.push('/compose');
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="New journal entry"
      style={styles.fab}
    >
      <View style={styles.fabInner}>
        <Ionicons name="add" size={28} color={colors.palette.ink900} />
      </View>
    </Pressable>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          tabBarBackground: () =>
            Platform.OS === 'ios' ? (
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
            ) : (
              <View style={[StyleSheet.absoluteFill, styles.androidBar]} />
            ),
          tabBarIcon: ({ focused }) => {
            const key = (route.name as TabKey) ?? 'index';
            const icons = ICONS[key];
            return (
              <View style={styles.iconCol}>
                <Ionicons
                  name={focused ? icons.active : icons.idle}
                  size={22}
                  color={focused ? colors.text : colors.textMuted}
                />
                <Text
                  variant="caption"
                  color={focused ? colors.text : colors.textMuted}
                  style={{ marginTop: 4, fontSize: 10 }}
                >
                  {LABELS[key]}
                </Text>
              </View>
            );
          },
        })}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="insights" />
        <Tabs.Screen name="memory" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <ComposeFab />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 24,
    height: 64,
    borderRadius: radius.pill,
    borderTopWidth: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    elevation: 0,
    backgroundColor: 'transparent',
  },
  androidBar: {
    backgroundColor: 'rgba(20, 18, 30, 0.92)',
  },
  iconCol: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 56,
  },
  fab: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 56,
    zIndex: 50,
  },
  fabInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.palette.bone100,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
});
