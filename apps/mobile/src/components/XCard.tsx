import React from 'react';
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { useTheme } from '../theme';

interface XCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  highlight?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const XCard: React.FC<XCardProps> = ({
  children,
  style,
  elevated = false,
  highlight = false,
  padding = 'md',
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  const paddings = {
    none: 0,
    sm: spacing.sm,
    md: spacing.lg,
    lg: spacing.xl,
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: highlight ? colors.surfaceHighlight : colors.surface,
          borderRadius: radius.lg,
          padding: paddings[padding],
          borderWidth: highlight ? 1 : 0,
          borderColor: highlight ? colors.primaryMuted : 'transparent',
        },
        elevated && shadows.md,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
});
