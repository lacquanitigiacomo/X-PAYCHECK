import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme';

export type NavTab = 'home' | 'calendar' | 'archive' | 'settings';

interface BottomNavProps {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}

const tabs: { key: NavTab; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: '⌂' },
  { key: 'calendar', label: 'Turni', icon: '📅' },
  { key: 'archive', label: 'Archivio', icon: '📁' },
  { key: 'settings', label: 'Impostazioni', icon: '⚙' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ active, onChange }) => {
  const { colors, typography } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
      {tabs.map((tab) => {
        const isActive = tab.key === active;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={styles.tab}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.icon,
                { color: isActive ? colors.primary : colors.textTertiary },
              ]}
            >
              {tab.icon}
            </Text>
            <Text
              style={[
                typography.caption,
                {
                  color: isActive ? colors.primary : colors.textTertiary,
                  marginTop: 2,
                  fontSize: 10,
                },
              ]}
            >
              {tab.label}
            </Text>
            {isActive && (
              <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 4,
  },
  icon: {
    fontSize: 20,
  },
  indicator: {
    position: 'absolute',
    top: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
