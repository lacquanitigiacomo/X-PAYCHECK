import {
  NavigationContainer,
  type NavigationProp,
  useNavigation,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ApiError, apiRequest, getApiErrorMessage } from '../api/client';
import {
  applyCanonicalBadgeShift,
  resolveBadgeStateAfterMutation,
  type BadgeState,
} from '../badge/mutations';
import type { BadgeCorrectionInput, BadgeShift } from '../badge/presentation';
import { completeAuthentication as completeAuthSession } from '../auth/completeAuthentication';
import { clearSession, loadSession, saveSession } from '../auth/session';
import type { AccountState, AuthSession, EditableProfile } from '../auth/types';
import { CaricaCedolinoScreen } from '../screens/CaricaCedolinoScreen';
import { BadgeScreen } from '../screens/BadgeScreen';
import { CheckoutScreen } from '../screens/CheckoutScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { ImpostazioniScreen } from '../screens/ImpostazioniScreen';
import { LandingScreen } from '../screens/LandingScreen';
import { LicenzaProScreen } from '../screens/LicenzaProScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { PlanChoiceScreen } from '../screens/PlanChoiceScreen';
import { PayslipHistoryScreen } from '../screens/PayslipHistoryScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { ReportAnalisiScreen } from '../screens/ReportAnalisiScreen';
import { UnavailableScreen } from '../screens/UnavailableScreen';
import {
  retainUploadedPayslipMetadata,
  sanitizePayslipMetadata,
  type PayslipRecord,
  type PayslipUploadBody,
  type PayslipUploadResult,
} from '../payslips/retention';
import {
  resolveDashboardDestination,
  resolveLandingDestination,
  resolvePlanChoiceDestination,
  resolvePendingPlanCancellationDestination,
  resolvePostAuthDestination,
  type RootStackParamList,
} from './routes';

const Stack = createNativeStackNavigator<RootStackParamList>();

const analysis = {
  month: 'Nessuna analisi reale',
  ccnl: 'Non configurato',
  livello: 'N/D',
  stato: 'Non disponibile',
  critici: 0,
  warning: 0,
  ok: 0,
  anomalie: [],
};

type PayslipListResponse = { items: PayslipRecord[] };
type PayslipUploadResponse = PayslipUploadResult;
type BadgeStateResponse = BadgeState;
type BadgeMutationResponse = { shift: BadgeShift };

const emptyBadgeState: BadgeStateResponse = { shift: null, items: [] };

const unavailable = (): void => {
  Alert.alert('Funzione non disponibile', 'Questa integrazione non è ancora collegata. Nessun dato è stato modificato.');
};

function useAppNavigation(): NavigationProp<RootStackParamList> {
  return useNavigation<NavigationProp<RootStackParamList>>();
}

function LandingRoute() {
  const navigation = useAppNavigation();
  return (
    <LandingScreen
      onStart={() => navigation.navigate(resolveLandingDestination('register'))}
      onLogin={() => navigation.navigate(resolveLandingDestination('login'))}
    />
  );
}

function LoginRoute({ onAuthenticated }: { onAuthenticated: (session: AuthSession) => Promise<void> }) {
  const navigation = useAppNavigation();
  return (
    <LoginScreen
      onAuthenticated={onAuthenticated}
      onRegister={() => navigation.navigate('PlanChoice')}
      onBack={() => navigation.goBack()}
    />
  );
}

function PlanChoiceRoute({ account }: { account: AccountState | null }) {
  const navigation = useAppNavigation();
  return (
    <PlanChoiceScreen
      onSelect={(tier) => {
        const destination = resolvePlanChoiceDestination(
          tier,
          account ? 'authenticated' : 'registration',
        );
        if (destination.name === 'Register') navigation.navigate(destination.name, destination.params);
        else navigation.navigate(destination.name);
      }}
      onBack={() => navigation.goBack()}
    />
  );
}

type RegisterRouteProps = NativeStackScreenProps<RootStackParamList, 'Register'> & {
  onAuthenticated: (session: AuthSession, profile?: EditableProfile) => Promise<void>;
};

function RegisterRoute({ route, navigation, onAuthenticated }: RegisterRouteProps) {
  return (
    <RegisterScreen
      tier={route.params.tier}
      onAuthenticated={onAuthenticated}
      onBack={() => navigation.goBack()}
    />
  );
}

type DashboardRouteProps = {
  account: AccountState | null;
  badgeState: BadgeStateResponse;
  badgeLoading: boolean;
  badgeError: string | null;
  onRefreshBadge: () => Promise<void>;
  onStartBadge: () => Promise<void>;
  onStopBadge: () => Promise<void>;
};

function DashboardRoute({
  account,
  badgeState,
  badgeLoading,
  badgeError,
  onRefreshBadge,
  onStartBadge,
  onStopBadge,
}: DashboardRouteProps) {
  const navigation = useAppNavigation();
  useEffect(() => {
    if (account?.tier === 'pro') void onRefreshBadge();
  }, [account?.id, account?.tier, onRefreshBadge]);

  const navigate = (destination: string): void => {
    const route = resolveDashboardDestination(destination, account?.tier ?? 'free');
    if (route) navigation.navigate(route);
    else unavailable();
  };
  return (
    <DashboardScreen
      tier={account?.tier ?? 'free'}
      userName={account?.name ?? 'Profilo da configurare'}
      ccnl="CCNL configurato nel profilo"
      livello="N/D"
      lastAnalysis={{ month: analysis.month, critici: 0, warning: 0, ok: 0 }}
      badgeShift={account?.tier === 'pro' ? badgeState.shift : null}
      badgeLoading={badgeLoading}
      badgeError={badgeError}
      onBadgeStart={() => { void onStartBadge(); }}
      onBadgeStop={() => { void onStopBadge(); }}
      onNavigate={navigate}
      onNavTab={(tab) => navigate(
        tab === 'settings'
          ? 'impostazioni'
          : tab === 'calendar'
            ? 'calendario'
            : tab === 'archive'
              ? 'archivio'
              : 'dashboard'
      )}
    />
  );
}

type UploadRouteProps = {
  tier: 'free' | 'pro';
  items: PayslipRecord[];
  onRefresh: () => Promise<void>;
  onSaved: (result: PayslipUploadResponse) => void;
};

function UploadRoute({ tier, items, onRefresh, onSaved }: UploadRouteProps) {
  const navigation = useAppNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    void onRefresh()
      .catch(loadError => setError(getApiErrorMessage(loadError, 'Impossibile caricare i cedolini.')))
      .finally(() => setLoading(false));
  }, [onRefresh]);

  const submit = async (upload: PayslipUploadBody): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const result = await apiRequest<PayslipUploadResponse>('/payslips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(upload),
      });
      onSaved(result);
      setSuccessMessage(result.replaced ? 'Cedolino sostituito correttamente.' : 'Cedolino caricato correttamente.');
      return true;
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 409) {
        await onRefresh().catch(() => undefined);
      }
      setError(getApiErrorMessage(submitError, 'Caricamento non riuscito.'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CaricaCedolinoScreen
      tier={tier}
      items={items}
      loading={loading}
      error={error}
      successMessage={successMessage}
      onBack={() => navigation.goBack()}
      onSubmit={submit}
      onUnavailable={unavailable}
    />
  );
}

type PayslipHistoryRouteProps = Omit<UploadRouteProps, 'onSaved'>;

function PayslipHistoryRoute({ tier, items, onRefresh }: PayslipHistoryRouteProps) {
  const navigation = useAppNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback((): void => {
    setLoading(true);
    setError(null);
    void onRefresh()
      .catch(loadError => setError(getApiErrorMessage(loadError, 'Impossibile caricare lo storico cedolini.')))
      .finally(() => setLoading(false));
  }, [onRefresh]);

  useEffect(refresh, [refresh]);

  return (
    <PayslipHistoryScreen
      tier={tier}
      items={items}
      loading={loading}
      error={error}
      onBack={() => navigation.goBack()}
      onRefresh={refresh}
      onUpload={() => navigation.navigate('Upload')}
      onUpgrade={() => navigation.navigate('License')}
    />
  );
}

function ReportRoute() {
  const navigation = useAppNavigation();
  return (
    <ReportAnalisiScreen
      onBack={() => navigation.goBack()}
      onCorreggiDati={unavailable}
      onGeneraAnalisi={unavailable}
      analysisData={analysis}
    />
  );
}

function SettingsRoute({ account }: { account: AccountState | null }) {
  const navigation = useAppNavigation();
  return (
    <ImpostazioniScreen
      onBack={() => navigation.goBack()}
      userName={account?.name ?? 'Profilo da configurare'}
      tier={account?.tier ?? 'free'}
      notifications={false}
      onToggleNotifications={unavailable}
      onNavigate={(destination) => (
        destination === 'licenza' ? navigation.navigate('License') : unavailable()
      )}
    />
  );
}

function LicenseRoute({ account }: { account: AccountState | null }) {
  const navigation = useAppNavigation();
  return (
    <LicenzaProScreen
      onBack={() => navigation.goBack()}
      onPurchase={unavailable}
      onRestore={unavailable}
      tier={account?.tier ?? 'free'}
    />
  );
}

type BadgeRouteProps = {
  state: BadgeStateResponse;
  loading: boolean;
  error: string | null;
  onRefresh: () => Promise<void>;
  onStart: () => Promise<void>;
  onStop: () => Promise<void>;
  onCorrect: (shiftId: string, correction: BadgeCorrectionInput) => Promise<boolean>;
};

function BadgeRoute({ state, loading, error, onRefresh, onStart, onStop, onCorrect }: BadgeRouteProps) {
  const navigation = useAppNavigation();

  useEffect(() => { void onRefresh(); }, [onRefresh]);

  return (
    <BadgeScreen
      shift={state.shift}
      items={state.items}
      loading={loading}
      error={error}
      onBack={() => navigation.goBack()}
      onRefresh={() => { void onRefresh(); }}
      onStart={() => { void onStart(); }}
      onStop={() => { void onStop(); }}
      onCorrect={onCorrect}
    />
  );
}

function PlaceholderRoute({ title }: { title: string }) {
  const navigation = useAppNavigation();
  return <UnavailableScreen title={title} onBack={() => navigation.goBack()} />;
}

export function AppNavigator() {
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const [account, setAccount] = useState<AccountState | null>(null);
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [badgeState, setBadgeState] = useState<BadgeStateResponse>(emptyBadgeState);
  const [badgeLoading, setBadgeLoading] = useState(false);
  const [badgeError, setBadgeError] = useState<string | null>(null);

  const refreshPayslips = useCallback(async (): Promise<void> => {
    const response = await apiRequest<PayslipListResponse>('/payslips');
    setPayslips(response.items.map(sanitizePayslipMetadata));
  }, []);

  const retainUploadedPayslip = useCallback((result: PayslipUploadResponse): void => {
    setPayslips(current => retainUploadedPayslipMetadata(current, result));
  }, []);

  const refreshBadge = useCallback(async (): Promise<void> => {
    setBadgeLoading(true);
    setBadgeError(null);
    try {
      const response = await apiRequest<BadgeStateResponse>('/badge/state');
      setBadgeState(response);
    } catch (error) {
      setBadgeError(getApiErrorMessage(error, 'Impossibile caricare le timbrature.'));
    } finally {
      setBadgeLoading(false);
    }
  }, []);

  const reconcileBadgeMutation = useCallback(async (canonical: BadgeShift): Promise<void> => {
    setBadgeState(current => applyCanonicalBadgeShift(current, canonical));
    const resolved = await resolveBadgeStateAfterMutation(
      badgeState,
      canonical,
      () => apiRequest<BadgeStateResponse>('/badge/state'),
    );
    setBadgeState(resolved);
  }, [badgeState]);

  const startBadge = useCallback(async (): Promise<void> => {
    setBadgeLoading(true);
    setBadgeError(null);
    try {
      const result = await apiRequest<BadgeMutationResponse>('/badge/start', { method: 'POST' });
      await reconcileBadgeMutation(result.shift);
    } catch (error) {
      setBadgeError(getApiErrorMessage(error, 'Impossibile iniziare il turno.'));
    } finally {
      setBadgeLoading(false);
    }
  }, [reconcileBadgeMutation]);

  const stopBadge = useCallback(async (): Promise<void> => {
    setBadgeLoading(true);
    setBadgeError(null);
    try {
      const result = await apiRequest<BadgeMutationResponse>('/badge/stop', { method: 'POST' });
      await reconcileBadgeMutation(result.shift);
    } catch (error) {
      setBadgeError(getApiErrorMessage(error, 'Impossibile terminare il turno.'));
    } finally {
      setBadgeLoading(false);
    }
  }, [reconcileBadgeMutation]);

  const correctBadge = useCallback(async (
    shiftId: string,
    correction: BadgeCorrectionInput,
  ): Promise<boolean> => {
    setBadgeLoading(true);
    setBadgeError(null);
    try {
      const result = await apiRequest<BadgeMutationResponse>(`/badge/shifts/${shiftId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(correction),
      });
      await reconcileBadgeMutation(result.shift);
      return true;
    } catch (error) {
      setBadgeError(getApiErrorMessage(error, 'Impossibile correggere la timbratura.'));
      return false;
    } finally {
      setBadgeLoading(false);
    }
  }, [reconcileBadgeMutation]);

  useEffect(() => {
    setPayslips([]);
    setBadgeState(emptyBadgeState);
    setBadgeError(null);
  }, [account?.id]);

  useEffect(() => {
    if (account?.tier !== 'pro') {
      setBadgeState(emptyBadgeState);
      setBadgeError(null);
    }
  }, [account?.tier]);

  const resetForAccount = useCallback((accountState: AccountState): void => {
    navigationRef.reset({
      index: 0,
      routes: [{ name: resolvePostAuthDestination(accountState) }],
    });
  }, [navigationRef]);

  const syncAccountState = useCallback(async (): Promise<void> => {
    const accountState = await apiRequest<AccountState>('/account/state');
    setAccount(accountState);
    resetForAccount(accountState);
  }, [resetForAccount]);

  const completeAuthentication = useCallback(async (
    session: AuthSession,
    profile?: EditableProfile,
  ): Promise<void> => {
    const authoritativeAccount = await completeAuthSession(session, profile, {
      saveSession,
      updateProfile: (profileUpdate) => apiRequest<AccountState>('/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileUpdate),
      }),
    });
    setAccount(authoritativeAccount);
    resetForAccount(authoritativeAccount);
  }, [resetForAccount]);

  const restoreSession = useCallback(async (): Promise<void> => {
    const token = await loadSession();
    if (!token) return;

    try {
      await syncAccountState();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) await clearSession();
    }
  }, [syncAccountState]);

  const completeOnboarding = useCallback((updated: AccountState): void => {
    setAccount(updated);
    resetForAccount(updated);
  }, [resetForAccount]);

  const cancelPendingPlan = useCallback(async (updated: AccountState): Promise<void> => {
    const destination = resolvePendingPlanCancellationDestination(updated);
    if (!destination) throw new Error('Lo stato piano restituito dal server non è valido');
    setAccount(updated);
    navigationRef.reset({ index: 0, routes: [{ name: destination }] });
  }, [navigationRef]);

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef} onReady={() => { void restoreSession(); }}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Landing" component={LandingRoute} />
          <Stack.Screen name="Login">
            {() => <LoginRoute onAuthenticated={completeAuthentication} />}
          </Stack.Screen>
          <Stack.Screen name="PlanChoice">{() => <PlanChoiceRoute account={account} />}</Stack.Screen>
          <Stack.Screen name="Register">
            {(props) => <RegisterRoute {...props} onAuthenticated={completeAuthentication} />}
          </Stack.Screen>
          <Stack.Screen name="Checkout">
            {() => (
              <CheckoutScreen
                onCompleted={async () => { await syncAccountState(); }}
                onCancelled={cancelPendingPlan}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Onboarding">
            {() => account
              ? <OnboardingScreen account={account} onCompleted={completeOnboarding} />
              : <PlaceholderRoute title="Profilo non disponibile" />}
          </Stack.Screen>
          <Stack.Screen name="Dashboard">
            {() => (
              <DashboardRoute
                account={account}
                badgeState={badgeState}
                badgeLoading={badgeLoading}
                badgeError={badgeError}
                onRefreshBadge={refreshBadge}
                onStartBadge={startBadge}
                onStopBadge={stopBadge}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Upload">
            {() => (
              <UploadRoute
                tier={account?.tier ?? 'free'}
                items={payslips}
                onRefresh={refreshPayslips}
                onSaved={retainUploadedPayslip}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Report" component={ReportRoute} />
          <Stack.Screen name="Settings">{() => <SettingsRoute account={account} />}</Stack.Screen>
          <Stack.Screen name="License">{() => <LicenseRoute account={account} />}</Stack.Screen>
          <Stack.Screen name="Calendar">{() => <PlaceholderRoute title="Calendario" />}</Stack.Screen>
          <Stack.Screen name="Archive">
            {() => (
              <PayslipHistoryRoute
                tier={account?.tier ?? 'free'}
                items={payslips}
                onRefresh={refreshPayslips}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Badge">
            {() => account?.tier === 'pro'
              ? (
                <BadgeRoute
                  state={badgeState}
                  loading={badgeLoading}
                  error={badgeError}
                  onRefresh={refreshBadge}
                  onStart={startBadge}
                  onStop={stopBadge}
                  onCorrect={correctBadge}
                />
              )
              : <LicenseRoute account={account} />}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
