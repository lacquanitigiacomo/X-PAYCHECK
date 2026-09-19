import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../theme';
import { Header } from '../components/Header';
import { XCard } from '../components/XCard';
import { XButton } from '../components/XButton';
import { StatusBadge } from '../components/StatusBadge';

interface LicenzaProScreenProps {
  onBack: () => void;
  onPurchase: () => void;
  onRestore: () => void;
  tier: 'free' | 'trial' | 'pro';
  trialDaysLeft?: number;
}

export const LicenzaProScreen: React.FC<LicenzaProScreenProps> = ({
  onBack,
  onPurchase,
  onRestore,
  tier,
  trialDaysLeft,
}) => {
  const { colors, typography, spacing } = useTheme();

  const proFeatures = [
    'Caricamento multiplo cedolini',
    'Modalità badge avanzata',
    'Calendario turni completo',
    'Confronto multi-mese',
    'Report discorsivo LLM',
    'Storico e archivio illimitato',
    'Backup metadati sicuro',
    'Aggiornamenti CCNL automatici',
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Piano attuale" onBack={onBack} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Current Plan */}
        <XCard elevated style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={[typography.h2, { color: colors.text }]}>
              {tier === 'pro' ? 'Pro' : tier === 'trial' ? 'Pro Trial' : 'Free'}
            </Text>
            <StatusBadge
              label={tier === 'pro' ? 'ATTIVO' : tier === 'trial' ? `${trialDaysLeft} giorni` : 'CORRENTE'}
              type={tier === 'pro' ? 'pro' : tier === 'trial' ? 'trial' : 'freemium'}
            />
          </View>

          {tier === 'trial' && (
            <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              Attivo fino al {new Date(Date.now() + (trialDaysLeft || 0) * 86400000).toLocaleDateString('it-IT')}
            </Text>
          )}
        </XCard>

        {/* Pro Features */}
        <Text style={[typography.h4, { color: colors.text, marginTop: spacing.xl }]}>
          Funzioni Pro
        </Text>

        <XCard style={styles.featuresCard}>
          {proFeatures.map((feat, i) => (
            <View key={i} style={[styles.featureRow, { borderBottomColor: colors.border, borderBottomWidth: i < proFeatures.length - 1 ? 1 : 0 }]}>
              <Text style={{ color: colors.primary, fontSize: 14, width: 20 }}>✓</Text>
              <Text style={[typography.body, { color: colors.textSecondary, flex: 1 }]}>{feat}</Text>
            </View>
          ))}
        </XCard>

        {/* Pricing / CTA */}
        {tier !== 'pro' && (
          <View style={styles.ctaArea}>
            <XCard highlight style={styles.priceCard}>
              <Text style={[typography.h1, { color: colors.primary }]}>€9,99</Text>
              <Text style={[typography.body, { color: colors.textSecondary }]}>una tantum</Text>
              <Text style={[typography.bodySmall, { color: colors.textTertiary, marginTop: 4 }]}>
                Nessun abbonamento ricorrente
              </Text>
            </XCard>

            <XButton title="Passa a Pro" onPress={onPurchase} size="lg" />
            <XButton
              title="Ripristina acquisti"
              variant="ghost"
              onPress={onRestore}
              size="md"
              style={{ marginTop: spacing.md }}
            />
          </View>
        )}

        {tier === 'pro' && (
          <XCard style={[styles.priceCard, { borderColor: colors.success }]}>
            <Text style={[typography.h3, { color: colors.success }]}>
              ✓ Licenza Pro attiva
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
              Hai accesso a tutte le funzionalità avanzate
            </Text>
          </XCard>
        )}
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
  planCard: {
    marginTop: 8,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuresCard: {
    marginTop: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  ctaArea: {
    marginTop: 24,
  },
  priceCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 16,
  },
});
