import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BadgeCorrectionInput, BadgeShift } from '../badge/presentation';
import { buildBadgeCorrection, formatElapsed } from '../badge/presentation';
import { Header } from '../components/Header';
import { XButton } from '../components/XButton';
import { XCard } from '../components/XCard';
import { XInput } from '../components/XInput';
import { useTheme } from '../theme';

type BadgeScreenProps = {
  shift: BadgeShift | null;
  items: readonly BadgeShift[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onRefresh: () => void;
  onStart: () => void;
  onStop: () => void;
  onCorrect: (shiftId: string, correction: BadgeCorrectionInput) => Promise<boolean>;
};

type EditDraft = { shiftId: string; startedAt: string; endedAt: string; reason: string };

export function BadgeScreen({
  shift,
  items,
  loading,
  error,
  onBack,
  onRefresh,
  onStart,
  onStop,
  onCorrect,
}: BadgeScreenProps) {
  const { colors, typography, spacing } = useTheme();
  const [now, setNow] = useState(Date.now());
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  useEffect(() => {
    if (!shift) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [shift]);

  const history = useMemo(
    () => [...items].sort((left, right) => right.startedAt.localeCompare(left.startedAt)),
    [items],
  );

  const beginCorrection = (item: BadgeShift): void => {
    setDraft({
      shiftId: item.id,
      startedAt: item.startedAt,
      endedAt: item.endedAt ?? '',
      reason: '',
    });
    setDraftError(null);
  };

  const saveCorrection = async (): Promise<void> => {
    if (!draft) return;
    const result = buildBadgeCorrection(draft.startedAt, draft.endedAt, draft.reason);
    if (!result.ok) {
      setDraftError(result.error);
      return;
    }
    if (await onCorrect(draft.shiftId, result.value)) {
      setDraft(null);
      setDraftError(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Badge" subtitle="Timbrature Pro senza geolocalizzazione" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content}>
        <XCard highlight style={styles.card}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>TURNO CORRENTE</Text>
          {shift ? (
            <>
              <Text style={[styles.elapsed, { color: colors.primary }]}>{formatElapsed(shift.startedAt, now)}</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Iniziato: {new Date(shift.startedAt).toLocaleString('it-IT')}</Text>
              <XButton title="Termina turno" variant="danger" onPress={onStop} loading={loading} style={styles.button} />
            </>
          ) : (
            <>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>Nessun turno aperto.</Text>
              <XButton title="Inizia turno" onPress={onStart} loading={loading} style={styles.button} />
            </>
          )}
        </XCard>

        {error && (
          <XCard style={styles.card}>
            <Text style={[typography.bodySmall, { color: colors.danger }]}>{error}</Text>
            <XButton title="Riprova" variant="outline" onPress={onRefresh} style={styles.button} />
          </XCard>
        )}
        {loading && !shift && <ActivityIndicator color={colors.primary} style={styles.loader} />}

        <Text style={[typography.h4, { color: colors.text, marginBottom: spacing.md }]}>Storico timbrature</Text>
        {!loading && history.length === 0 && (
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Nessuna timbratura registrata.</Text>
        )}

        {history.map(item => {
          const editing = draft?.shiftId === item.id;
          return (
            <XCard key={item.id} elevated style={styles.card}>
              <Text style={[typography.h4, { color: colors.text }]}>{new Date(item.startedAt).toLocaleDateString('it-IT')}</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: spacing.sm }]}>Entrata: {new Date(item.startedAt).toLocaleString('it-IT')}</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>Uscita: {item.endedAt ? new Date(item.endedAt).toLocaleString('it-IT') : 'Turno aperto'}</Text>
              {item.corrections.length > 0 && (
                <Text style={[typography.bodySmall, { color: colors.warning, marginTop: spacing.sm }]}>{item.corrections.length} correzion{item.corrections.length === 1 ? 'e' : 'i'} registrat{item.corrections.length === 1 ? 'a' : 'e'}</Text>
              )}

              {editing && draft ? (
                <View style={styles.editor}>
                  <XInput label="Entrata (ISO)" value={draft.startedAt} onChangeText={startedAt => setDraft({ ...draft, startedAt })} />
                  <XInput label="Uscita (ISO, vuota se aperto)" value={draft.endedAt} onChangeText={endedAt => setDraft({ ...draft, endedAt })} />
                  <XInput label="Motivazione obbligatoria" value={draft.reason} onChangeText={reason => setDraft({ ...draft, reason })} error={draftError ?? undefined} />
                  <View style={styles.actions}>
                    <XButton title="Annulla" variant="ghost" onPress={() => setDraft(null)} style={styles.flexButton} />
                    <XButton title="Salva" onPress={() => { void saveCorrection(); }} loading={loading} style={styles.flexButton} />
                  </View>
                </View>
              ) : (
                <XButton title="Correggi orari" variant="outline" onPress={() => beginCorrection(item)} style={styles.button} />
              )}
            </XCard>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  card: { marginBottom: 12 },
  elapsed: { fontSize: 36, fontWeight: '800', marginVertical: 12, fontVariant: ['tabular-nums'] },
  button: { marginTop: 16 },
  loader: { marginVertical: 24 },
  editor: { gap: 12, marginTop: 16 },
  actions: { flexDirection: 'row', gap: 8 },
  flexButton: { flex: 1 },
});
