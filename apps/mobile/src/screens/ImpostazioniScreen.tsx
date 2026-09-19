import React from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme';
import { Header } from '../components/Header';
import { XCard } from '../components/XCard';
import { StatusBadge } from '../components/StatusBadge';

interface ImpostazioniScreenProps {
  onBack: () => void;
  userName: string;
  tier: 'free' | 'pro' | 'trial';
  proExpiry?: string;
  notifications: boolean;
  onToggleNotifications: (val: boolean) => void;
  onNavigate: (screen: string) => void;
}

export const ImpostazioniScreen: React.FC<ImpostazioniScreenProps> = ({
  onBack,
  userName,
  tier,
  proExpiry,
  notifications,
  onToggleNotifications,
  onNavigate,
}) => {
  const { colors, typography } = useTheme();

  const menuItems = [
    { label: 'Profilo utente', icon: '👤', screen: 'profile' },
    { label: 'Orario di lavoro', icon: '⏰', screen: 'orario' },
    { label: 'Turni e pattern', icon: '📅', screen: 'turni' },
    { label: 'Focus controlli', icon: '🔍', screen: 'focus' },
    { label: 'Licenza', icon: '🎫', screen: 'licenza' },
    { label: 'Privacy e dati', icon: '🛡', screen: 'privacy' },
    { label: 'Backup metadati', icon: '☁', screen: 'backup', proOnly: true },
    { label: 'Dispositivo', icon: '📱', screen: 'device' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Impostazioni" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Summary */}
        <XCard elevated style={styles.profileCard}>
          <Text style={[typography.h4, { color: colors.text }]}>{userName}</Text>
          <View style={styles.badgeRow}>
            <StatusBadge
              label={tier === 'pro' ? 'PRO' : tier === 'trial' ? 'PRO TRIAL' : 'FREE'}
              type={tier === 'pro' ? 'pro' : tier === 'trial' ? 'trial' : 'freemium'}
            />
            {proExpiry && (
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                Attivo fino al {proExpiry}
              </Text>
            )}
          </View>
        </XCard>

        {/* Pro Features */}
        {tier !== 'free' && (
          <XCard highlight style={styles.proCard}>
            <Text style={[typography.caption, { color: colors.primary }]}>FUNZIONI PRO ATTIVE</Text>
            {[
              'Report avanzati',
              'Calendario turni',
              'Confronto badge/cedolino',
              'Storico multi-mese',
              'Simulatore',
              'Backup metadati',
              'Aggiornamenti CCNL',
            ].map((feat, i) => (
              <View key={i} style={styles.proFeatureRow}>
                <Text style={{ color: colors.primary, fontSize: 12 }}>✓</Text>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>{feat}</Text>
              </View>
            ))}
          </XCard>
        )}

        {/* Menu */}
        <View style={styles.menu}>
          {menuItems.map((item, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => onNavigate(item.screen)}
              style={[styles.menuItem, { borderBottomColor: colors.border }]}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={[typography.body, { color: colors.text, flex: 1 }]}>{item.label}</Text>
              {item.proOnly && tier === 'free' && (
                <StatusBadge label="PRO" type="pro" />
              )}
              <Text style={[typography.h4, { color: colors.textTertiary }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications Toggle */}
        <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
          <Text style={[typography.body, { color: colors.text }]}>Notifiche badge</Text>
          <Switch
            value={notifications}
            onValueChange={onToggleNotifications}
            trackColor={{ false: colors.surfaceElevated, true: colors.primaryMuted }}
            thumbColor={notifications ? colors.primary : colors.textTertiary}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    marginBottom: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  proCard: {
    marginBottom: 16,
  },
  proFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  menu: {
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  menuIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginTop: 8,
  },
});
