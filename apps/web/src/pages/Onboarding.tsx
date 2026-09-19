import axios from 'axios';
import { AlertCircle, ArrowLeft, ArrowRight, Briefcase, Check, Clock3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { routeForAccountState, type RoutableAccountState } from '../lib/accountRouting';
import { getAccessToken } from '../lib/authStorage';
import { API_BASE_URL } from '../lib/api';

type WorkDay = {
  day: number;
  enabled: boolean;
  start: string | null;
  end: string | null;
};

const dayNames = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'] as const;
const stepNames = ['CCNL', 'Ore settimanali', 'Settimana tipo'] as const;
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function createEmptyWeek(): WorkDay[] {
  return dayNames.map((_, index) => ({
    day: index + 1,
    enabled: false,
    start: null,
    end: null,
  }));
}

function validSchedule(schedule: readonly WorkDay[]): boolean {
  return schedule.every((workDay) => (
    !workDay.enabled
    || Boolean(workDay.start && workDay.end && timePattern.test(workDay.start) && timePattern.test(workDay.end))
  ));
}

function requestError(error: unknown): string {
  return axios.isAxiosError(error)
    ? error.response?.data?.error ?? 'Errore nel salvataggio.'
    : 'Errore nel salvataggio.';
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [ccnl, setCcnl] = useState('');
  const [weeklyHours, setWeeklyHours] = useState('40');
  const [schedule, setSchedule] = useState(createEmptyWeek);
  const [checkingAccount, setCheckingAccount] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    let active = true;
    void axios.get<RoutableAccountState>(`${API_BASE_URL}/account/state`, {
      headers: { Authorization: `Bearer ${token}` },
    }).then(({ data }) => {
      if (!active) return;
      const route = routeForAccountState(data);
      if (route !== '/onboarding') navigate(route, { replace: true });
    }).catch((caught) => {
      if (active) setError(requestError(caught));
    }).finally(() => {
      if (active) setCheckingAccount(false);
    });

    return () => { active = false; };
  }, [navigate]);

  const updateDay = (day: number, patch: Partial<Omit<WorkDay, 'day'>>) => {
    setSchedule((current) => current.map((workDay) => {
      if (workDay.day !== day) return workDay;
      const updated = { ...workDay, ...patch };
      return updated.enabled ? updated : { ...updated, start: null, end: null };
    }));
  };

  const next = () => {
    setError(null);
    if (step === 0 && !ccnl.trim()) {
      setError('Inserisci il codice o la denominazione del tuo CCNL.');
      return;
    }
    if (step === 1) {
      const hours = Number(weeklyHours.replace(',', '.'));
      if (!Number.isFinite(hours) || hours <= 0 || hours > 80) {
        setError('Inserisci ore settimanali comprese tra 0 e 80.');
        return;
      }
    }
    setStep((current) => Math.min(current + 1, stepNames.length - 1));
  };

  const submit = async () => {
    if (!validSchedule(schedule)) {
      setError('Usa il formato HH:MM per tutti i giorni attivi.');
      return;
    }

    const token = getAccessToken();
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.put<RoutableAccountState>(`${API_BASE_URL}/account/work-profile`, {
        ccnl: ccnl.trim(),
        weeklyHours: Number(weeklyHours.replace(',', '.')),
        schedule,
        badgeEnabled: false,
      }, { headers: { Authorization: `Bearer ${token}` } });
      navigate(routeForAccountState(data), { replace: true });
    } catch (caught) {
      setError(requestError(caught));
    } finally {
      setLoading(false);
    }
  };

  if (checkingAccount) {
    return <div className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-gray-400">Verifica del profilo…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <p className="mini-label">Passaggio {step + 1} di {stepNames.length}</p>
        <div className="mt-3 flex gap-2" aria-label="Avanzamento onboarding">
          {stepNames.map((name, index) => (
            <div key={name} className="flex-1">
              <div className={`h-1 rounded-full ${index <= step ? 'bg-xpay-mint' : 'bg-xpay-soft'}`} />
              <span className={`mt-2 hidden text-xs sm:block ${index <= step ? 'text-gray-300' : 'text-gray-600'}`}>{name}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="xpay-card p-6 md:p-8">
        {step === 0 ? (
          <div>
            <Briefcase size={32} className="text-xpay-mint" />
            <h1 className="mt-4 text-2xl font-black">Il tuo contratto collettivo</h1>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Inserisci qualsiasi CCNL italiano registrato al CNEL: non sei limitato a un elenco di esempi.
            </p>
            <label htmlFor="ccnl" className="mt-6 block text-sm font-semibold">Codice o denominazione CCNL</label>
            <input
              id="ccnl"
              value={ccnl}
              onChange={(event) => setCcnl(event.target.value.slice(0, 200))}
              placeholder="es. CCNL Commercio e Terziario"
              className="xpay-field mt-2"
              autoComplete="organization-title"
            />
          </div>
        ) : null}

        {step === 1 ? (
          <div>
            <Clock3 size={32} className="text-xpay-mint" />
            <h1 className="mt-4 text-2xl font-black">Ore contrattuali</h1>
            <p className="mt-2 text-sm leading-6 text-gray-400">Indica il totale previsto dal tuo contratto per una settimana.</p>
            <label htmlFor="weekly-hours" className="mt-6 block text-sm font-semibold">Ore contrattuali settimanali</label>
            <input
              id="weekly-hours"
              value={weeklyHours}
              onChange={(event) => {
                if (/^[0-9]*(?:[.,][0-9]*)?$/.test(event.target.value)) setWeeklyHours(event.target.value.slice(0, 8));
              }}
              inputMode="decimal"
              className="xpay-field mt-2"
            />
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <h1 className="text-2xl font-black">La tua settimana tipo</h1>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Attiva i giorni lavorativi e indica inizio e fine. I giorni non attivi restano senza orari.
            </p>
            <div className="mt-6 grid gap-3">
              {schedule.map((workDay, index) => {
                const dayName = dayNames[index];
                return (
                  <div key={workDay.day} className="rounded-lg border border-xpay-line bg-xpay-soft p-4">
                    <label className="flex cursor-pointer items-center justify-between gap-4 font-semibold">
                      <span>{dayName}</span>
                      <input
                        type="checkbox"
                        checked={workDay.enabled}
                        onChange={(event) => updateDay(workDay.day, event.target.checked
                          ? { enabled: true, start: '09:00', end: '18:00' }
                          : { enabled: false })}
                        className="h-5 w-5 accent-xpay-mint"
                      />
                    </label>
                    {workDay.enabled ? (
                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <label className="text-xs text-gray-400">
                          Inizio {dayName}
                          <input
                            type="time"
                            aria-label={`Inizio ${dayName}`}
                            value={workDay.start ?? ''}
                            onChange={(event) => updateDay(workDay.day, { start: event.target.value })}
                            className="xpay-field mt-1"
                          />
                        </label>
                        <label className="text-xs text-gray-400">
                          Fine {dayName}
                          <input
                            type="time"
                            aria-label={`Fine ${dayName}`}
                            value={workDay.end ?? ''}
                            onChange={(event) => updateDay(workDay.day, { end: event.target.value })}
                            className="xpay-field mt-1"
                          />
                        </label>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {error ? (
          <div role="alert" className="mt-5 flex items-center gap-2 rounded-lg border border-red-800 bg-red-900/25 p-3 text-sm text-red-300">
            <AlertCircle size={16} /> {error}
          </div>
        ) : null}

        <div className="mt-7 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button type="button" onClick={() => setStep((current) => current - 1)} className="xpay-secondary">
              <ArrowLeft size={17} /> Indietro
            </button>
          ) : <span />}
          {step < stepNames.length - 1 ? (
            <button type="button" onClick={next} className="xpay-primary">
              Continua <ArrowRight size={17} />
            </button>
          ) : (
            <button type="button" onClick={() => { void submit(); }} disabled={loading} className="xpay-primary">
              <Check size={17} /> {loading ? 'Salvataggio…' : 'Completa configurazione'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
