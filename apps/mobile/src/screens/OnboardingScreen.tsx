import { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { apiRequest } from '../api/client';
import type { AuthAccount } from '../auth/types';
import { XButton } from '../components/XButton';
import { XInput } from '../components/XInput';
import {
  clearOnboardingDraft,
  hydrateOnboardingDraftAccess,
  saveOnboardingDraftWhenReady,
  type OnboardingDraft,
  type OnboardingDraftAccess,
} from '../onboarding/draft';
import {
  createEmptyWeek,
  updateWorkDay,
  type WeeklySchedule,
} from '../onboarding/schedule';
import {
  submitOnboardingProfile,
  type OnboardingAccountState,
} from '../onboarding/submit';
import { useTheme } from '../theme';

const DAY_NAMES = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const PARTIAL_TIME_PATTERN = /^[0-9]{0,2}(?::[0-9]{0,2})?$/;
const PARTIAL_HOURS_PATTERN = /^[0-9]*(?:[.,][0-9]*)?$/;

type OnboardingScreenProps = {
  account: AuthAccount;
  onCompleted: (account: OnboardingAccountState) => void;
};

function validSchedule(schedule: WeeklySchedule): boolean {
  return schedule.every((day) => (
    !day.enabled || Boolean(day.start && day.end && TIME_PATTERN.test(day.start) && TIME_PATTERN.test(day.end))
  ));
}

export function OnboardingScreen({ account, onCompleted }: OnboardingScreenProps) {
  const { colors, typography, spacing, radius } = useTheme();
  const isPro = account.tier === 'pro';
  const stepTitles = useMemo(
    () => isPro
      ? ['Dati personali', 'CCNL', 'Ore settimanali', 'Settimana tipo', 'Pro Badge']
      : ['Dati personali', 'CCNL', 'Ore settimanali', 'Settimana tipo'],
    [isPro],
  );
  const [step, setStep] = useState(0);
  const [ccnl, setCcnl] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('40');
  const [schedule, setSchedule] = useState(createEmptyWeek);
  const [badgeEnabled, setBadgeEnabled] = useState(false);
  const [draftAccess, setDraftAccess] = useState<OnboardingDraftAccess>({
    status: 'loading',
    accountId: account.id,
  });
  const [hydrationAttempt, setHydrationAttempt] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const persistenceQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let active = true;
    setDraftAccess({ status: 'loading', accountId: account.id });
    setError(null);
    persistenceQueue.current = Promise.resolve();

    void hydrateOnboardingDraftAccess(account.id)
      .then((access) => {
        if (!active) return;
        if (access.status === 'error') {
          setDraftAccess(access);
          setError('Impossibile ripristinare il draft onboarding.');
          return;
        }
        if (access.draft) {
          setStep(Math.min(access.draft.step, stepTitles.length - 1));
          setCcnl(access.draft.ccnl);
          setWeeklyHours(access.draft.weeklyHours);
          setSchedule(access.draft.schedule);
          setBadgeEnabled(isPro ? access.draft.badgeEnabled : false);
        }
        setDraftAccess(access);
      });

    return () => { active = false; };
  }, [account.id, hydrationAttempt, isPro, stepTitles.length]);

  useEffect(() => {
    if (draftAccess.status !== 'ready' || draftAccess.accountId !== account.id) return;
    const draft: OnboardingDraft = {
      step,
      ccnl,
      weeklyHours,
      schedule,
      badgeEnabled: isPro ? badgeEnabled : false,
    };
    persistenceQueue.current = persistenceQueue.current
      .catch(() => undefined)
      .then(() => saveOnboardingDraftWhenReady(draftAccess, account.id, draft))
      .then(() => undefined)
      .catch(() => { setError('Impossibile salvare il draft onboarding.'); });
  }, [account.id, badgeEnabled, ccnl, draftAccess, isPro, schedule, step, weeklyHours]);

  const submit = async (): Promise<void> => {
    const parsedHours = Number(weeklyHours.replace(',', '.'));
    if (!ccnl.trim() || !Number.isFinite(parsedHours) || parsedHours <= 0 || parsedHours > 80) {
      setError('Controlla CCNL e ore settimanali.');
      return;
    }
    if (!validSchedule(schedule)) {
      setError('Usa il formato HH:MM per tutti i giorni attivi.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updated = await submitOnboardingProfile(account.id, {
        ccnl: ccnl.trim(),
        weeklyHours: parsedHours,
        schedule,
        badgeEnabled: isPro ? badgeEnabled : false,
      }, {
        saveProfile: (profile) => apiRequest<OnboardingAccountState>('/account/work-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profile),
        }),
        clearDraft: async (accountId) => {
          await persistenceQueue.current;
          await clearOnboardingDraft(accountId);
        },
      });
      onCompleted(updated);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Profilo di lavoro non salvato');
    } finally {
      setLoading(false);
    }
  };

  const next = (): void => {
    setError(null);
    if (step === 1 && !ccnl.trim()) {
      setError('Inserisci il codice o la denominazione del tuo CCNL.');
      return;
    }
    if (step === 2) {
      const parsedHours = Number(weeklyHours.replace(',', '.'));
      if (!Number.isFinite(parsedHours) || parsedHours <= 0 || parsedHours > 80) {
        setError('Inserisci ore settimanali comprese tra 0 e 80.');
        return;
      }
    }
    if (step === 3 && !validSchedule(schedule)) {
      setError('Usa il formato HH:MM per tutti i giorni attivi.');
      return;
    }
    if (step === stepTitles.length - 1) {
      void submit();
      return;
    }
    setStep((current) => current + 1);
  };

  if (draftAccess.status === 'error' && draftAccess.accountId === account.id) {
    return (
      <View style={[styles.loadingDraft, { backgroundColor: colors.background }]}>
        <Text style={[typography.body, { color: colors.danger, textAlign: 'center' }]}>
          {error ?? 'Impossibile ripristinare il draft onboarding.'}
        </Text>
        <XButton
          title="Riprova"
          onPress={() => setHydrationAttempt((attempt) => attempt + 1)}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  if (draftAccess.status !== 'ready' || draftAccess.accountId !== account.id) {
    return (
      <View style={[styles.loadingDraft, { backgroundColor: colors.background }]}>
        <Text style={[typography.body, { color: colors.textSecondary }]}>Ripristino del profilo in corso…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[typography.caption, { color: colors.primary }]}>
        PASSAGGIO {step + 1} DI {stepTitles.length}
      </Text>
      <Text style={[typography.h1, { color: colors.text, marginTop: spacing.sm }]}>{stepTitles[step]}</Text>

      {step === 0 ? (
        <View style={[styles.panel, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
          <Text style={[typography.label, { color: colors.textSecondary }]}>Nome</Text>
          <Text style={[typography.h3, { color: colors.text, marginTop: spacing.xs }]}>{account.name}</Text>
          <Text style={[typography.label, { color: colors.textSecondary, marginTop: spacing.lg }]}>Email</Text>
          <Text style={[typography.body, { color: colors.text, marginTop: spacing.xs }]}>{account.email}</Text>
          <Text style={[typography.bodySmall, { color: colors.textTertiary, marginTop: spacing.lg }]}>
            Conferma che i dati personali siano corretti prima di configurare il profilo di lavoro.
          </Text>
        </View>
      ) : null}

      {step === 1 ? (
        <View style={{ marginTop: spacing.xl }}>
          <XInput
            label="Codice o denominazione CCNL"
            placeholder="es. CCNL Commercio e Terziario"
            value={ccnl}
            onChangeText={(value) => setCcnl(value.slice(0, 200))}
          />
          <Text style={[typography.bodySmall, { color: colors.textTertiary, marginTop: spacing.sm }]}>
            Puoi indicare qualsiasi contratto italiano registrato al CNEL; non sei limitato agli esempi disponibili.
          </Text>
        </View>
      ) : null}

      {step === 2 ? (
        <XInput
          label="Ore contrattuali settimanali"
          value={weeklyHours}
          onChangeText={(value) => {
            if (value.length <= 8 && PARTIAL_HOURS_PATTERN.test(value)) setWeeklyHours(value);
          }}
          keyboardType="numeric"
          style={{ marginTop: spacing.xl }}
        />
      ) : null}

      {step === 3 ? (
        <View style={{ marginTop: spacing.lg }}>
          {schedule.map((workDay, index) => (
            <View
              key={workDay.day}
              style={[styles.day, { borderColor: colors.border, borderRadius: radius.lg }]}
            >
              <View style={styles.dayHeader}>
                <Text style={[typography.h4, { color: colors.text }]}>{DAY_NAMES[index]}</Text>
                <Switch
                  value={workDay.enabled}
                  onValueChange={(enabled) => setSchedule((current) => updateWorkDay(
                    current,
                    workDay.day,
                    enabled ? { enabled: true, start: '09:00', end: '18:00' } : { enabled: false },
                  ))}
                  trackColor={{ false: colors.surfaceHighlight, true: colors.primaryDark }}
                  thumbColor={workDay.enabled ? colors.primary : colors.textSecondary}
                />
              </View>
              {workDay.enabled ? (
                <View style={styles.times}>
                  <XInput
                    label="Inizio"
                    placeholder="09:00"
                    value={workDay.start ?? ''}
                    onChangeText={(start) => {
                      if (start.length <= 5 && PARTIAL_TIME_PATTERN.test(start)) {
                        setSchedule((current) => updateWorkDay(current, workDay.day, { start }));
                      }
                    }}
                    style={styles.timeInput}
                  />
                  <XInput
                    label="Fine"
                    placeholder="18:00"
                    value={workDay.end ?? ''}
                    onChangeText={(end) => {
                      if (end.length <= 5 && PARTIAL_TIME_PATTERN.test(end)) {
                        setSchedule((current) => updateWorkDay(current, workDay.day, { end }));
                      }
                    }}
                    style={styles.timeInput}
                  />
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {step === 4 && isPro ? (
        <View style={[styles.panel, { backgroundColor: colors.surface, borderRadius: radius.lg }]}>
          <View style={styles.dayHeader}>
            <View style={styles.badgeCopy}>
              <Text style={[typography.h3, { color: colors.text }]}>Attiva Pro Badge</Text>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                Registra entrate e uscite per confrontare le ore con il cedolino.
              </Text>
            </View>
            <Switch
              value={badgeEnabled}
              onValueChange={setBadgeEnabled}
              trackColor={{ false: colors.surfaceHighlight, true: colors.primaryDark }}
              thumbColor={badgeEnabled ? colors.primary : colors.textSecondary}
            />
          </View>
        </View>
      ) : null}

      {error ? (
        <Text style={[typography.body, { color: colors.danger, marginTop: spacing.lg }]}>{error}</Text>
      ) : null}

      <View style={styles.actions}>
        {step > 0 ? (
          <XButton title="Indietro" variant="ghost" onPress={() => setStep((current) => current - 1)} />
        ) : null}
        <XButton
          title={step === stepTitles.length - 1 ? 'Completa configurazione' : 'Continua'}
          onPress={next}
          loading={loading}
          style={styles.primaryAction}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingDraft: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { flexGrow: 1, padding: 24, paddingTop: 64, paddingBottom: 40 },
  panel: { marginTop: 24, padding: 20 },
  day: { borderWidth: 1, marginBottom: 12, padding: 16 },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  times: { flexDirection: 'row', gap: 12, marginTop: 12 },
  timeInput: { flex: 1 },
  badgeCopy: { flex: 1, paddingRight: 16 },
  actions: { flexDirection: 'row', alignItems: 'center', marginTop: 24 },
  primaryAction: { flex: 1 },
});
