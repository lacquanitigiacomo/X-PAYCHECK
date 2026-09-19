import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { apiRequest } from '../api/client';
import type { AuthSession } from '../auth/types';
import { XButton } from '../components/XButton';
import { XInput } from '../components/XInput';
import { useTheme } from '../theme';

type LoginScreenProps = {
  onAuthenticated: (session: AuthSession) => Promise<void>;
  onRegister: () => void;
  onBack: () => void;
};

export function LoginScreen({ onAuthenticated, onRegister, onBack }: LoginScreenProps) {
  const { colors, typography, spacing } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (): Promise<void> => {
    setError(null);
    if (!email.includes('@') || password.length < 8) {
      setError('Inserisci email e password valide.');
      return;
    }

    setLoading(true);
    try {
      const session = await apiRequest<AuthSession>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      await onAuthenticated(session);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Accesso non riuscito');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.logoX, { color: colors.primary }]}>X</Text>
      <Text style={[typography.h2, { color: colors.text, marginTop: spacing.lg }]}>
        Accedi a <Text style={{ color: colors.primary }}>X-PAY CHECK</Text>
      </Text>
      <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
        I cedolini restano sul dispositivo. L'account gestisce piano e aggiornamenti.
      </Text>

      {error ? (
        <Text style={[typography.body, { color: colors.danger, marginTop: spacing.lg }]}>{error}</Text>
      ) : null}

      <XInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={{ marginTop: spacing.xl }}
      />
      <XInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ marginTop: spacing.lg }}
      />
      <XButton
        title="Accedi"
        onPress={() => { void login(); }}
        loading={loading}
        size="lg"
        style={{ marginTop: spacing.xl }}
      />

      <XButton
        title="Non hai un account? Scegli un piano"
        variant="ghost"
        onPress={onRegister}
        style={{ marginTop: spacing.lg }}
      />
      <XButton title="← Indietro" variant="ghost" onPress={onBack} style={{ marginTop: spacing.md }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 72, paddingBottom: 40 },
  logoX: { fontSize: 48, fontWeight: '900', textAlign: 'center' },
});
