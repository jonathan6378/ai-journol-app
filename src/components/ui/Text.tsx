import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleProp, TextStyle } from 'react-native';
import { colors, typography, TypographyVariant } from '@/theme';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: string;
  align?: 'left' | 'center' | 'right';
  weight?: 'regular' | 'medium' | 'semibold';
  italic?: boolean;
  style?: StyleProp<TextStyle>;
};

/**
 * Single source of truth for type. Always use this — never raw <Text>.
 *
 *   <Text variant="display">Good morning</Text>
 *   <Text variant="body" color={colors.textMuted}>...</Text>
 */
export const Text: React.FC<TextProps> = ({
  variant = 'body',
  color,
  align,
  weight,
  italic,
  style,
  children,
  ...rest
}) => {
  const base = typography[variant];
  return (
    <RNText
      allowFontScaling
      {...rest}
      style={[
        base,
        { color: color ?? colors.text },
        align ? { textAlign: align } : null,
        italic ? { fontStyle: 'italic' } : null,
        weight === 'medium' ? { fontWeight: '500' } : null,
        weight === 'semibold' ? { fontWeight: '600' } : null,
        style,
      ]}
    >
      {children}
    </RNText>
  );
};
