import { useCallback, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import GoogleAuthButton from '../components/GoogleAuthButton';
import type { GoogleAuthError } from '../components/GoogleAuthButton';
import { saveAccessToken } from '../lib/authStorage';
import { routeForAccountState, type RoutableAccountState } from '../lib/accountRouting';
import { API_BASE_URL } from '../lib/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const completeAuth = useCallback(async (token: string) => {
    saveAccessToken(token);
    const { data } = await axios.get<RoutableAccountState>(`${API_BASE_URL}/account/state`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    navigate(routeForAccountState(data), { replace: true });
  }, [navigate]);

  const handleGoogleSuccess = useCallback(({ token }: { token: string }) => {
    void completeAuth(token).catch(() => setError('Impossibile verificare lo stato dell’account.'));
  }, [completeAuth]);

  const handleGoogleError = useCallback(({ message, code }: GoogleAuthError) => {
    if (code === 'GOOGLE_ACCOUNT_NOT_REGISTERED') {
      navigate('/plans', { replace: true });
      return;
    }
    setError(message);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
      await completeAuth(res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Accesso non riuscito');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-5xl items-center gap-8 px-4 py-10 md:grid-cols-[1fr_420px]">
      <div className="hidden space-y-6 md:block">
        <div className="flex items-center gap-3">
          <span className="text-6xl font-black text-xpay-mint">X</span>
          <div>
            <p className="mini-label">Accesso sicuro</p>
            <h1 className="text-4xl font-black">X-PAY CHECK</h1>
          </div>
        </div>
        <p className="max-w-md text-gray-400">Rientra nel tuo spazio privato per controllare report, cedolini caricati e anomalie aperte.</p>
        <div className="xpay-card max-w-sm p-4">
          <ShieldCheck className="mb-3 text-xpay-mint" />
          <div className="font-semibold">I cedolini restano protetti</div>
          <p className="mt-1 text-sm text-gray-400">Sessione, licenza e analisi sono separate dai dati sensibili.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="xpay-card space-y-4 p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 text-5xl font-black text-xpay-mint">X</div>
          <h1 className="text-2xl font-black">Accedi a X-PAY CHECK</h1>
          <p className="mt-2 text-sm text-gray-400">Ti serve solo per licenza, sincronizzazione e backup sicuro.</p>
        </div>
        {error && <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">{error}</div>}

        <div>
          <label htmlFor="login-email" className="mb-1 block text-sm font-medium">Email</label>
          <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="xpay-field" required />
        </div>

        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm font-medium">Password</label>
          <div className="relative">
            <input id="login-password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              className="xpay-field pr-10" required />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-gray-500" aria-label="Mostra password">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="xpay-primary w-full">
          {loading ? '...' : <><LogIn size={18} /> Accedi</>}
        </button>

        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="h-px flex-1 bg-xpay-line" />
          oppure
          <span className="h-px flex-1 bg-xpay-line" />
        </div>

        <GoogleAuthButton
          label="signin_with"
          tier="free"
          intent="login"
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />

        <p className="text-center text-sm text-gray-500">
          Non hai un account? <Link to="/plans" className="font-semibold text-xpay-mint hover:underline">Registrati</Link>
        </p>
      </form>
    </div>
  );
}
