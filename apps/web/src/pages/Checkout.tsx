import axios from 'axios';
import { Check, CreditCard, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { routeForAccountState, type RoutableAccountState } from '../lib/accountRouting';
import { getAccessToken } from '../lib/authStorage';
import { API_BASE_URL } from '../lib/api';

type BillingCycle = 'monthly' | 'yearly' | 'lifetime';

const offers: ReadonlyArray<{ cycle: BillingCycle; label: string; detail: string }> = [
  { cycle: 'monthly', label: '2,99 €/mese', detail: 'Flessibile, rinnovo mensile simulato' },
  { cycle: 'yearly', label: '24,99 €/anno', detail: 'Un anno completo, circa due mesi inclusi' },
  { cycle: 'lifetime', label: '49,99 € una tantum', detail: 'Accesso Pro permanente nel prototipo' },
];


function errorMessage(error: unknown, fallback: string): string {
  return axios.isAxiosError(error) ? error.response?.data?.error ?? fallback : fallback;
}

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedFromPlanChoice = (location.state as { fromPlanChoice?: unknown } | null)
    ?.fromPlanChoice === true;
  const [selected, setSelected] = useState<BillingCycle>('monthly');
  const [loading, setLoading] = useState<'account' | 'checkout' | 'cancel' | null>('account');
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
      if (route !== '/checkout' && !selectedFromPlanChoice) navigate(route, { replace: true });
    }).catch((caught) => {
      if (active) setError(errorMessage(caught, 'Impossibile verificare lo stato del piano.'));
    }).finally(() => {
      if (active) setLoading((current) => current === 'account' ? null : current);
    });

    return () => { active = false; };
  }, [navigate, selectedFromPlanChoice]);

  const confirmOffer = async () => {
    const token = getAccessToken();
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setLoading('checkout');
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/account/checkout`, {
        tier: 'pro',
        billingCycle: selected,
      }, { headers: { Authorization: `Bearer ${token}` } });
      const { data } = await axios.get<RoutableAccountState>(`${API_BASE_URL}/account/state`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate(routeForAccountState(data), { replace: true });
    } catch (caught) {
      setError(errorMessage(caught, 'Checkout non riuscito.'));
    } finally {
      setLoading(null);
    }
  };

  const cancelPendingPlan = async () => {
    const token = getAccessToken();
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    setLoading('cancel');
    setError(null);
    try {
      await axios.post(`${API_BASE_URL}/account/pending-plan/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate('/plans', { replace: true });
    } catch (caught) {
      setError(errorMessage(caught, 'Cambio piano non riuscito.'));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <div className="xpay-card p-6 md:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-xpay-mint/15 text-xpay-mint">
            <Sparkles size={24} />
          </span>
          <div>
            <p className="mini-label">Piano Pro</p>
            <h1 className="mt-1 text-3xl font-black">Attiva X-PAY CHECK Pro</h1>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              Scegli una delle tre offerte. Il checkout è simulato e non raccoglie dati di pagamento.
            </p>
          </div>
        </div>

        <fieldset className="mt-7 grid gap-3">
          <legend className="sr-only">Offerte Pro</legend>
          {offers.map((offer) => (
            <label
              key={offer.cycle}
              className={`cursor-pointer rounded-lg border p-4 transition ${
                selected === offer.cycle
                  ? 'border-xpay-mint bg-xpay-mint/10'
                  : 'border-xpay-line bg-xpay-soft hover:border-xpay-mint/50'
              }`}
            >
              <span className="flex items-center gap-4">
                <input
                  type="radio"
                  name="billing-cycle"
                  value={offer.cycle}
                  checked={selected === offer.cycle}
                  onChange={() => setSelected(offer.cycle)}
                  className="h-4 w-4 accent-xpay-mint"
                />
                <span className="flex-1">
                  <span className="block font-bold text-white">{offer.label}</span>
                  <span className="mt-1 block text-xs text-gray-400">{offer.detail}</span>
                </span>
                {selected === offer.cycle ? <Check size={18} className="text-xpay-mint" /> : null}
              </span>
            </label>
          ))}
        </fieldset>

        {error ? <div role="alert" className="mt-5 rounded-lg border border-red-800 bg-red-900/25 p-3 text-sm text-red-300">{error}</div> : null}

        <button
          type="button"
          onClick={() => { void confirmOffer(); }}
          disabled={loading !== null}
          className="xpay-primary mt-7 w-full"
        >
          <CreditCard size={18} /> {loading === 'checkout' ? 'Attivazione…' : 'Conferma offerta'}
        </button>
        <p className="mt-3 text-center text-xs leading-5 text-gray-500">
          Nessun numero di carta, scadenza, CVV o indirizzo di fatturazione viene richiesto.
        </p>
        <button
          type="button"
          onClick={() => { void cancelPendingPlan(); }}
          disabled={loading !== null}
          className="mt-5 w-full text-sm font-semibold text-gray-400 hover:text-white disabled:opacity-50"
        >
          {loading === 'cancel' ? 'Cambio piano…' : 'Annulla e cambia piano'}
        </button>
      </div>
    </div>
  );
}
