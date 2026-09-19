import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme';
import { XButton } from '../components/XButton';
import { XCard } from '../components/XCard';

interface LandingScreenProps {
  onStart: () => void;
  onLogin: () => void;
}

export const LandingScreen: React.FC<LandingScreenProps> = ({ onStart, onLogin }) => {
  const { colors, typography, spacing } = useTheme();

  const features = [
    { icon: '✓', title: 'Analisi completa del cedolino', desc: 'Verifica ogni riga della tua busta paga' },
    { icon: '📋', title: 'CCNL sempre aggiornati', desc: 'Confronta con i minimi contrattuali' },
    { icon: '📅', title: 'Turni e calendario intelligenti', desc: 'Traccia orari, notti e festività' },
    { icon: '🔒', title: 'Privacy e dati al sicuro', desc: 'Tutto sul tuo dispositivo, zero cloud' },
    { icon: '📊', title: 'Report chiari e azionabili', desc: 'Semafori e narrativa da commercialista' },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Logo */}
      <View style={styles.logoArea}>
        <Text style={[styles.logoX, { color: colors.primary }]}>X</Text>
        <Text style={[styles.logoText, { color: colors.text }]}>-PAY CHECK</Text>
      </View>

      <Text style={[typography.h2, { color: colors.text, textAlign: 'center', marginTop: spacing.xl }]}>
        Controlla se la tua busta paga torna davvero.
      </Text>

      <Text
        style={[
          typography.body,
          { color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md },
        ]}
      >
        La tua busta paga, finalmente leggibile.
      </Text>

      {/* Feature Cards */}
      <View style={styles.features}>
        {features.map((f, i) => (
          <XCard key={i} style={styles.featureCard} elevated>
            <View style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <View style={styles.featureText}>
                <Text style={[typography.body, { color: colors.text, fontWeight: '600' }]}>
                  {f.title}
                </Text>
                <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 2 }]}>
                  {f.desc}
                </Text>
              </View>
            </View>
          </XCard>
        ))}
      </View>

      {/* Privacy Note */}
      <XCard highlight style={styles.privacyCard}>
        <Text style={[typography.bodySmall, { color: colors.textSecondary, textAlign: 'center' }]}>
          🔒 X-PAY CHECK non carica i tuoi cedolini sui server. L'analisi avviene sul tuo dispositivo, in totale sicurezza.
        </Text>
      </XCard>

      {/* CTAs */}
      <View style={styles.ctaArea}>
        <XButton title="Inizia gratis" onPress={onStart} size="lg" />
        <XButton
          title="Accedi con email"
          variant="outline"
          onPress={onLogin}
          size="lg"
          style={{ marginTop: spacing.md }}
        />
      </View>

      <Text
        style={[
          typography.bodySmall,
          { color: colors.textTertiary, textAlign: 'center', marginTop: spacing.lg },
        ]}
      >
        I tuoi dati restano sul tuo dispositivo.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  logoX: {
    fontSize: 36,
    fontWeight: '900',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  features: {
    marginTop: 32,
    gap: 10,
  },
  featureCard: {
    marginVertical: 5,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureText: {
    flex: 1,
  },
  privacyCard: {
    marginTop: 20,
    padding: 14,
  },
  ctaArea: {
    marginTop: 28,
  },
});
