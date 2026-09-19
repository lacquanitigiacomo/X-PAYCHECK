import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

interface StatusBadgeProps {
  label: string;
  type: 'freemium' | 'pro' | 'trial' | 'error' | 'success';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ label, type }) => {
  const { colors, typography } = useTheme();

  const config = {
    freemium: { bg: 'rgba(100, 116, 139, 0.2)', color: colors.textSecondary },
    pro: { bg: 'rgba(45, 212, 160, 0.2)', color: colors.primary },
    trial: { bg: 'rgba(59, 130, 246, 0.2)', color: colors.info },
    error: { bg: 'rgba(239, 68, 68, 0.2)', color: colors.danger },
    success: { bg: 'rgba(34, 197, 94, 0.2)', color: colors.success },
  };

  const c = config[type];

  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[typography.caption, { color: c.color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
});
