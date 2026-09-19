import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export type SemaforoStatus = 'PASS' | 'WARNING' | 'CRITICO' | 'INFO';

interface SemaforoProps {
  status: SemaforoStatus;
  label: string;
  value?: string;
  detail?: string;
  compact?: boolean;
}

export const Semaforo: React.FC<SemaforoProps> = ({
  status,
  label,
  value,
  detail,
  compact = false,
}) => {
  const { colors, typography, spacing } = useTheme();

  const statusConfig: Record<SemaforoStatus, { color: string; bg: string; icon: string }> = {
    PASS: { color: colors.success, bg: 'rgba(34, 197, 94, 0.15)', icon: '✓' },
    WARNING: { color: colors.warning, bg: 'rgba(245, 158, 11, 0.15)', icon: '!' },
    CRITICO: { color: colors.danger, bg: 'rgba(239, 68, 68, 0.15)', icon: '✕' },
    INFO: { color: colors.info, bg: 'rgba(59, 130, 246, 0.15)', icon: 'i' },
  };

  const config = statusConfig[status];

  if (compact) {
    return (
      <View style={[styles.compact, { backgroundColor: config.bg }]}>
        <Text style={[styles.compactIcon, { color: config.color }]}>{config.icon}</Text>
        <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: config.color }]}>
          <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>{config.icon}</Text>
        </View>
        <View style={styles.textContainer}>
          <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>{label}</Text>
          {value && (
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
              {value}
            </Text>
          )}
        </View>
      </View>
      {detail && (
        <Text style={[typography.bodySmall, { color: colors.textTertiary, marginTop: spacing.sm }]}>
          {detail}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  compactIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
  },
});
