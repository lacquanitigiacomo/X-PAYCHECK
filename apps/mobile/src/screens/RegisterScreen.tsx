import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { apiRequest } from '../api/client';
import { signInWithGoogle } from '../auth/googleSignIn';
import type { AuthSession, EditableProfile } from '../auth/types';
import { XButton } from '../components/XButton';
import { XInput } from '../components/XInput';
import type { PlanTier } from '../navigation/routes';
import { useTheme } from '../theme';

type RegisterScreenProps = {
  tier: PlanTier;
  onAuthenticated: (session: AuthSession, profile?: EditableProfile) => Promise<void>;
  onBack: () => void;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Registrazione non riuscita';
}

export function RegisterScreen({ tier, onAuthenticated, onBack }: RegisterScreenProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [picture, setPicture] = useState('');
  const [googleSession, setGoogleSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState<'manual' | 'google' | 'continue' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const registerManually = async (): Promise<void> => {
    setError(null);
    if (name.trim().length < 2 || !email.includes('@') || password.length < 8) {
      setError('Inserisci nome, email valida e una password di almeno 8 caratteri.');
      return;
    }

    setLoading('manual');
    try {
      const session = await apiRequest<AuthSession>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, tier }),
      });
      await onAuthenticated(session);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(null);
    }
  };

  const registerWithGoogle = async (): Promise<void> => {
    setError(null);
    setLoading('google');
    try {
      const identity = await signInWithGoogle();
      const session = await apiRequest<AuthSession>('/auth/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: 'google', idToken: identity.idToken, tier }),
      });
      setGoogleSession(session);
      setName(session.user.name || identity.name);
      setPicture(session.user.picture ?? identity.picture ?? '');
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(null);
    }
  };

  const continueWithGoogle = async (): Promise<void> => {
    if (!googleSession) return;
    if (name.trim().length < 2) {
      setError('Controlla il nome del profilo Google.');
      return;
    }

    setLoading('continue');
    setError(null);
    try {
      await onAuthenticated(googleSession, {
        name: name.trim(),
        picture: picture.trim() || null,
      });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(null);
    }
  };

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[typography.h1, { color: colors.text }]}>Crea il tuo account</Text>
      <View style={[styles.tier, { backgroundColor: colors.primaryMuted, borderRadius: radius.lg }]}>
        <Text style={[typography.label, { color: colors.primary }]}>Piano selezionato: {tier === 'pro' ? 'Pro' : 'Free'}</Text>
      </View>

      {error ? (
        <Text style={[typography.body, { color: colors.danger, marginTop: spacing.lg }]}>{error}</Text>
      ) : null}

      {googleSession ? (
        <View style={{ marginTop: spacing.xl }}>
          <Text style={[typography.h3, { color: colors.text }]}>Conferma il profilo Google</Text>
          {picture ? <Image source={{ uri: picture }} style={styles.avatar} /> : null}
          <XInput label="Nome" value={name} onChangeText={setName} style={{ marginTop: spacing.lg }} />
          <Text style={[typography.label, { color: colors.textSecondary, marginTop: spacing.lg }]}>Email verificata</Text>
          <Text style={[typography.body, { color: colors.text, marginTop: spacing.xs }]}>{googleSession.user.email}</Text>
          <XInput
            label="URL foto profilo (facoltativo)"
            value={picture}
            onChangeText={setPicture}
            style={{ marginTop: spacing.lg }}
          />
          <XButton
            title="Continua"
            onPress={() => { void continueWithGoogle(); }}
            loading={loading === 'continue'}
            size="lg"
            style={{ marginTop: spacing.xl }}
          />
        </View>
      ) : (
        <>
          <XButton
            title="Continua con Google"
            variant="secondary"
            onPress={() => { void registerWithGoogle(); }}
            loading={loading === 'google'}
            size="lg"
            style={{ marginTop: spacing.xl }}
          />
          <Text style={[typography.bodySmall, { color: colors.textTertiary, marginTop: spacing.sm }]}>
            Richiede credenziali native e una Expo development build. La registrazione manuale resta disponibile.
          </Text>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <XInput label="Nome e cognome" value={name} onChangeText={setName} />
          <XInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={{ marginTop: spacing.lg }}
          />
          <XInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ marginTop: spacing.lg }}
          />
          <XButton
            title="Crea account"
            onPress={() => { void registerManually(); }}
            loading={loading === 'manual'}
            size="lg"
            style={{ marginTop: spacing.xl }}
          />
        </>
      )}

      <XButton title="← Cambia piano" variant="ghost" onPress={onBack} style={{ marginTop: spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 24, paddingTop: 72, paddingBottom: 40 },
  tier: { alignSelf: 'flex-start', marginTop: 16, paddingHorizontal: 12, paddingVertical: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, marginTop: 16 },
  divider: { height: 1, marginVertical: 24 },
});
