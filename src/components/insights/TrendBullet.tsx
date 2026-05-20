import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

export const TrendBullet: React.FC<{ text: string; color?: string }> = ({
  text,
  color = colors.accentSoft,
}) => (
  <View style={styles.row}>
    <View style={[styles.bullet, { backgroundColor: color }]} />
    <Text variant="body" color={colors.textSecondary} style={{ flex: 1 }}>
      {text}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
    marginRight: spacing.md,
  },
});
