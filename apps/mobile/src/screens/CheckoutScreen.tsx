import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { apiRequest } from '../api/client';
import type { AccountState } from '../auth/types';
import { cancelPendingPlan as cancelPendingPlanFlow } from '../checkout/cancelPendingPlan';
import { XButton } from '../components/XButton';
import { useTheme } from '../theme';

type BillingCycle = 'monthly' | 'yearly' | 'lifetime';

const OFFERS: ReadonlyArray<{ cycle: BillingCycle; label: string }> = [
  { cycle: 'monthly', label: '2,99 €/mese' },
  { cycle: 'yearly', label: '24,99 €/anno' },
  { cycle: 'lifetime', label: '49,99 € una tantum' },
];

type CheckoutScreenProps = {
  onCompleted: (billingCycle: BillingCycle) => Promise<void>;
  onCancelled: (account: AccountState) => Promise<void>;
};

export function CheckoutScreen({ onCompleted, onCancelled }: CheckoutScreenProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [selected, setSelected] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState<'checkout' | 'cancel' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confirm = async (): Promise<void> => {
    setLoading('checkout');
    setError(null);
    try {
      await apiRequest('/account/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: 'pro', billingCycle: selected }),
      });
      await onCompleted(selected);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Checkout non riuscito');
    } finally {
      setLoading(null);
    }
  };

  const cancelPendingPlan = async (): Promise<void> => {
    setLoading('cancel');
    setError(null);
    try {
      await cancelPendingPlanFlow({
        cancelOnServer: () => apiRequest<AccountState>('/account/pending-plan/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }),
        resetToPlanChoice: onCancelled,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Cambio piano non riuscito');
    } finally {
      setLoading(null);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Text style={[typography.h1, { color: colors.text }]}>Attiva X-PAY CHECK Pro</Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
        Scegli una delle tre offerte. In questa versione il checkout è simulato e non raccoglie dati di pagamento.
      </Text>

      {OFFERS.map((offer) => {
        const isSelected = selected === offer.cycle;
        return (
          <TouchableOpacity
            key={offer.cycle}
            accessibilityRole="radio"
            accessibilityState={{ checked: isSelected }}
            onPress={() => setSelected(offer.cycle)}
            style={[
              styles.offer,
              {
                borderColor: isSelected ? colors.primary : colors.border,
                backgroundColor: isSelected ? colors.primaryMuted : colors.surface,
                borderRadius: radius.lg,
              },
            ]}
          >
            <Text style={[typography.h3, { color: colors.text }]}>{offer.label}</Text>
          </TouchableOpacity>
        );
      })}

      {error ? (
        <Text style={[typography.body, { color: colors.danger, marginTop: spacing.lg }]}>{error}</Text>
      ) : null}

      <XButton
        title="Conferma offerta"
        onPress={() => { void confirm(); }}
        loading={loading === 'checkout'}
        disabled={loading !== null}
        size="lg"
        style={{ marginTop: spacing.xl }}
      />
      <Text style={[typography.bodySmall, { color: colors.textTertiary, marginTop: spacing.md }]}>
        Nessun numero di carta, scadenza, CVV o indirizzo di fatturazione viene richiesto.
      </Text>
      <XButton
        title="Annulla e cambia piano"
        variant="ghost"
        onPress={() => { void cancelPendingPlan(); }}
        loading={loading === 'cancel'}
        disabled={loading !== null}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 24, paddingTop: 72, paddingBottom: 40 },
  offer: { borderWidth: 1.5, marginTop: 16, padding: 20 },
});
