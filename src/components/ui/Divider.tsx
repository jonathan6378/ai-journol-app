import React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors } from '@/theme';

export const Divider: React.FC<{ style?: ViewStyle; vertical?: boolean }> = ({
  style,
  vertical,
}) =>
  vertical ? (
    <View style={[{ width: 1, backgroundColor: colors.divider }, style]} />
  ) : (
    <View style={[{ height: 1, backgroundColor: colors.divider }, style]} />
  );
