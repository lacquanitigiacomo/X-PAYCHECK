import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { XButton } from '../components/XButton';
import type { PlanTier } from '../navigation/routes';
import { useTheme } from '../theme';

type PlanChoiceScreenProps = {
  onSelect: (tier: PlanTier) => void;
  onBack: () => void;
};

export function PlanChoiceScreen({ onSelect, onBack }: PlanChoiceScreenProps) {
  const { colors, typography, spacing, radius } = useTheme();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
    >
      <Text style={[typography.h1, { color: colors.text }]}>Scegli il tuo piano</Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
        Lo selezioni prima di creare l'account. Potrai cambiare idea tornando qui.
      </Text>

      <View style={[styles.plan, { borderColor: colors.border, borderRadius: radius.xl }]}>
        <Text style={[typography.h2, { color: colors.text }]}>Free</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
          Controlla il cedolino corrente con elaborazione locale.
        </Text>
        <XButton
          title="Continua con Free"
          onPress={() => onSelect('free')}
          size="lg"
          style={{ marginTop: spacing.xl }}
        />
      </View>

      <View
        style={[
          styles.plan,
          { borderColor: colors.primary, borderRadius: radius.xl, backgroundColor: colors.primaryMuted },
        ]}
      >
        <Text style={[typography.caption, { color: colors.primary }]}>PRO</Text>
        <Text style={[typography.h2, { color: colors.text, marginTop: spacing.xs }]}>Archivio e confronti</Text>
        <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
          Storico, confronti, export, più profili e Badge timbrature.
        </Text>
        <XButton
          title="Continua con Pro"
          onPress={() => onSelect('pro')}
          size="lg"
          style={{ marginTop: spacing.xl }}
        />
      </View>

      <XButton title="← Indietro" variant="ghost" onPress={onBack} style={{ marginTop: spacing.lg }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 72,
    paddingBottom: 40,
  },
  plan: {
    borderWidth: 1.5,
    marginTop: 24,
    padding: 20,
  },
});
