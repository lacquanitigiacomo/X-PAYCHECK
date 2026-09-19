import { useCallback, useState } from 'react';
import { Navigate, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, FileCheck2, UserPlus } from 'lucide-react';
import axios from 'axios';
import GoogleAuthButton from '../components/GoogleAuthButton';
import type { GoogleAuthError } from '../components/GoogleAuthButton';
import { saveAccessToken } from '../lib/authStorage';
import { routeForAccountState, type RoutableAccountState } from '../lib/accountRouting';
import { API_BASE_URL } from '../lib/api';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedTier = searchParams.get('tier');
  const [name, setName] = useState('');
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

  const updateProfileFromGoogle = useCallback((profile: { name?: string; email?: string }) => {
    if (profile.name) setName(profile.name);
    if (profile.email) setEmail(profile.email);
  }, []);

  const handleGoogleSuccess = useCallback(({ token }: { token: string }) => {
    void completeAuth(token).catch(() => setError('Impossibile verificare lo stato dell’account.'));
  }, [completeAuth]);

  const handleGoogleError = useCallback(({ message }: GoogleAuthError) => {
    setError(message);
  }, []);

  if (selectedTier !== 'free' && selectedTier !== 'pro') {
    return <Navigate to="/plans" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        password,
        tier: selectedTier,
      });
      await completeAuth(res.data.token);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registrazione non riuscita');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-5xl items-center gap-8 px-4 py-10 md:grid-cols-[420px_1fr]">
      <form onSubmit={handleSubmit} className="xpay-card space-y-4 p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 text-5xl font-black text-xpay-mint">X</div>
          <h1 className="text-2xl font-black">Crea account</h1>
          <p className="mt-2 text-sm text-gray-400">
            Piano {selectedTier === 'pro' ? 'Pro' : 'Free'} · poi configuri CCNL, ore e settimana tipo.
          </p>
        </div>
        {error && <div className="p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-400 text-sm">{error}</div>}

        <div>
          <label htmlFor="register-name" className="mb-1 block text-sm font-medium">Nome</label>
          <input id="register-name" type="text" value={name} onChange={e => setName(e.target.value)}
            className="xpay-field" required />
        </div>

        <div>
          <label htmlFor="register-email" className="mb-1 block text-sm font-medium">Email</label>
          <input id="register-email" type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="xpay-field" required />
        </div>

        <div>
          <label htmlFor="register-password" className="mb-1 block text-sm font-medium">Password</label>
          <div className="relative">
            <input id="register-password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
              className="xpay-field pr-10" required />
            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-3 text-gray-500" aria-label="Mostra password">
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="xpay-primary w-full">
          {loading ? '...' : <><UserPlus size={18} /> Registrati</>}
        </button>

        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span className="h-px flex-1 bg-xpay-line" />
          oppure
          <span className="h-px flex-1 bg-xpay-line" />
        </div>

        <GoogleAuthButton
          label="signup_with"
          tier={selectedTier}
          intent="register"
          onProfile={updateProfileFromGoogle}
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />

        <p className="text-center text-sm text-gray-500">
          Hai gia un account? <Link to="/login" className="font-semibold text-xpay-mint hover:underline">Accedi</Link>
        </p>
        <p className="text-center text-xs text-gray-600">
          <Link to="/plans" className="hover:text-gray-300">Cambia piano</Link>
        </p>
      </form>

      <div className="hidden space-y-5 md:block">
        <p className="mini-label">Primo controllo</p>
        <h1 className="text-4xl font-black">Porta dentro il cedolino, esci con un report leggibile.</h1>
        <div className="grid gap-3">
          {['Straordinari e notti', 'Festivi e domeniche', 'Contributi e IRPEF', 'Ferie e permessi'].map((item) => (
            <div key={item} className="flex items-center gap-3 text-gray-300">
              <FileCheck2 size={18} className="text-xpay-mint" />
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
