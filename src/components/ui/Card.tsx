import React from 'react';
import { View, ViewProps, ViewStyle, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '@/theme';

export type CardProps = ViewProps & {
  padding?: keyof typeof spacing | number;
  surface?: 'base' | 'elevated' | 'inset';
  bordered?: boolean;
  rounded?: keyof typeof radius;
  style?: ViewStyle;
};

/**
 * Quiet container. Uses translucent layering — never harsh shadows.
 */
export const Card: React.FC<CardProps> = ({
  padding = 'lg',
  surface = 'elevated',
  bordered = true,
  rounded = 'lg',
  style,
  children,
  ...rest
}) => {
  const paddingValue =
    typeof padding === 'number' ? padding : spacing[padding];

  const bgMap = {
    base: colors.bgSurface,
    elevated: colors.bgElevated,
    inset: colors.bgInset,
  };

  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: bgMap[surface],
          borderRadius: radius[rounded],
          padding: paddingValue,
          borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};
