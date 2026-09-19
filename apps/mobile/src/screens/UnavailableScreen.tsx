import { Text, View } from 'react-native';
import { Header } from '../components/Header';
import { useTheme } from '../theme';

interface UnavailableScreenProps {
  title: string;
  onBack: () => void;
}

export function UnavailableScreen({ title, onBack }: UnavailableScreenProps) {
  const { colors, typography, spacing } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Header title={title} onBack={onBack} />
      <Text style={[typography.body, { color: colors.textSecondary, padding: spacing.xl }]}>
        Funzione non ancora disponibile. Nessun dato è stato modificato.
      </Text>
    </View>
  );
}
