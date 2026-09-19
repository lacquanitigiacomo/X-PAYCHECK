import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PlanTier } from '../navigation/routes';
import type { PayslipRecord } from '../payslips/retention';
import { Header } from '../components/Header';
import { XButton } from '../components/XButton';
import { XCard } from '../components/XCard';
import { useTheme } from '../theme';

type PayslipHistoryScreenProps = {
  tier: PlanTier;
  items: readonly PayslipRecord[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onRefresh: () => void;
  onUpload: () => void;
  onUpgrade: () => void;
};

const monthFormatter = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric' });

function formatPayslipMonth(month: number, year: number): string {
  return monthFormatter.format(new Date(Date.UTC(year, month - 1, 1)));
}

export function PayslipHistoryScreen({
  tier,
  items,
  loading,
  error,
  onBack,
  onRefresh,
  onUpload,
  onUpgrade,
}: PayslipHistoryScreenProps) {
  const { colors, typography, spacing } = useTheme();
  const visibleItems = [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Archivio cedolini" subtitle={tier === 'pro' ? 'Storico completo Pro' : 'Cedolino corrente Free'} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        {tier === 'free' && (
          <XCard highlight style={styles.card}>
            <Text style={[typography.h4, { color: colors.text }]}>Sblocca lo storico completo</Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.sm }]}>Il piano Free conserva un solo cedolino. Con Pro mantieni tutti i mesi.</Text>
            <XButton title="Scopri Pro" onPress={onUpgrade} style={styles.button} />
          </XCard>
        )}

        {loading && <ActivityIndicator color={colors.primary} style={styles.loader} />}
        {error && (
          <XCard style={styles.card}>
            <Text style={[typography.bodySmall, { color: colors.danger }]}>{error}</Text>
            <XButton title="Riprova" variant="outline" onPress={onRefresh} style={styles.button} />
          </XCard>
        )}

        {!loading && visibleItems.length === 0 && (
          <XCard style={styles.card}>
            <Text style={[typography.h4, { color: colors.text }]}>Nessun cedolino caricato</Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.sm }]}>Carica il primo documento per iniziare.</Text>
          </XCard>
        )}

        {visibleItems.map(item => (
          <XCard key={item.id} elevated style={styles.card}>
            <Text style={[typography.h4, { color: colors.text, textTransform: 'capitalize' }]}>
              {formatPayslipMonth(item.month, item.year)}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.sm }]}>Tipo: {item.mimeType}</Text>
            <Text style={[typography.bodySmall, { color: colors.textTertiary, marginTop: spacing.xs }]}>Caricato il {new Date(item.createdAt).toLocaleString('it-IT')}</Text>
          </XCard>
        ))}

        <XButton title="Carica cedolino" onPress={onUpload} style={styles.button} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  card: { marginBottom: 12 },
  button: { marginTop: 16 },
  loader: { marginVertical: 24 },
});
