import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertCircle, CalendarDays, FileText, FolderArchive, Plus, ShieldCheck, Upload, WalletCards } from 'lucide-react';
import { getAccessToken } from '../lib/authStorage';
import { API_BASE_URL } from '../lib/api';

const COLORS = ['#68d7be', '#f6b04b', '#ee765f'];

const mockData = [
  { name: 'Ok', value: 14 },
  { name: 'Avvisi', value: 5 },
  { name: 'Critiche', value: 2 },
];

const quickActions = [
  { label: 'Carica cedolino', icon: <Upload size={16} />, to: '/audit/payslip' },
  { label: 'Aggiungi turno', icon: <Plus size={16} />, to: '/calendar' },
  { label: 'Apri calendario', icon: <CalendarDays size={16} />, to: '/calendar' },
  { label: 'Archivio cedolini', icon: <FolderArchive size={16} />, to: '/archive' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [workProfile, setWorkProfile] = useState<any>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) { navigate('/login'); return; }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch(`${API_BASE_URL}/user/profile`, { headers }).then((response) => response.json()),
      fetch(`${API_BASE_URL}/user/work-profile`, { headers }).then((response) => response.json()),
    ]).then(([profile, work]) => {
      setUser({ name: profile.user?.email?.split('@')[0] ?? 'Utente', email: profile.user?.email });
      setWorkProfile(work);
    }).catch(() => navigate('/login'));
  }, [navigate]);

  if (!user) return <div className="px-4 py-20 text-center text-gray-400">Caricamento...</div>;

  const needsOnboarding = !workProfile?.onboardingComplete;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="phone-shell">
          <div className="phone-screen">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-bold">Ciao, {user.name}</p>
                <p className="mt-1 text-xs text-gray-500">CCNL Commercio - Livello 5</p>
              </div>
              <span className="rounded-lg bg-xpay-mint/12 px-3 py-1 text-xs font-bold text-xpay-mint">PRO</span>
            </div>

            <div className="xpay-card mt-6 p-4">
              <div className="text-xs text-gray-500">Ultima analisi</div>
              <div className="mt-1 font-semibold">Aprile 2026</div>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-xpay-coral"><span className="h-2 w-2 rounded-full bg-xpay-coral" />2 criticita</div>
                <div className="flex items-center gap-2 text-xpay-amber"><span className="h-2 w-2 rounded-full bg-xpay-amber" />5 avvisi</div>
                <div className="flex items-center gap-2 text-xpay-mint"><span className="h-2 w-2 rounded-full bg-xpay-mint" />14 controlli ok</div>
              </div>
              <Link to="/audit/payslip" className="xpay-primary mt-5 w-full !py-2.5">Apri report</Link>
            </div>

            <div className="mt-6">
              <div className="mb-3 text-sm font-semibold">Azioni rapide</div>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link key={action.label} to={action.to} className="rounded-lg border border-xpay-line bg-xpay-soft p-3 text-xs text-gray-200 transition hover:border-xpay-mint/60">
                    <span className="mb-2 block text-xpay-mint">{action.icon}</span>
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mini-label">Dashboard</p>
              <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Controlli cedolino</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
                Stato sintetico di buste paga, turni, anomalie e confronti mese su mese.
              </p>
            </div>
            <Link to="/audit/payslip" className="xpay-primary">
              <ShieldCheck size={18} /> Nuova analisi
            </Link>
          </div>

          {needsOnboarding && (
            <div className="xpay-card flex flex-col gap-4 border-xpay-amber/50 bg-xpay-amber/10 p-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="text-xpay-amber" />
                <div>
                  <div className="font-semibold text-xpay-amber">Completa profilo lavorativo</div>
                  <div className="text-sm text-gray-400">CCNL, orari e pattern turni migliorano la verifica.</div>
                </div>
              </div>
              <Link to="/onboarding" className="xpay-secondary !border-xpay-amber/50">Completa ora</Link>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Criticita', value: '2', tone: 'text-xpay-coral', icon: <AlertCircle size={20} /> },
              { label: 'Avvisi', value: '5', tone: 'text-xpay-amber', icon: <FileText size={20} /> },
              { label: 'Controlli ok', value: '14', tone: 'text-xpay-mint', icon: <ShieldCheck size={20} /> },
            ].map((s) => (
              <div key={s.label} className="xpay-card p-5">
                <div className={`${s.tone} mb-4`}>{s.icon}</div>
                <div className={`text-4xl font-black ${s.tone}`}>{s.value}</div>
                <div className="mt-1 text-sm text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
            <div className="xpay-card p-5">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="font-bold">Analisi - Aprile 2026</h2>
                <span className="rounded-full border border-xpay-amber/40 px-3 py-1 text-xs text-xpay-amber">Da verificare</span>
              </div>
              <div className="grid gap-3">
                {[
                  ['Festivita lavorata non maggiorata', 'Delta stimato: 22,45 euro', 'Alta', 'text-xpay-coral'],
                  ['Maggiorazione notturna inferiore', 'Controlla fascia oraria e livello CCNL', 'Media', 'text-xpay-amber'],
                  ['Ferie residue coerenti', 'Nessuna differenza rilevata', 'OK', 'text-xpay-mint'],
                ].map(([title, desc, priority, tone]) => (
                  <div key={title} className="rounded-lg border border-xpay-line bg-xpay-soft p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-semibold text-white">{title}</div>
                        <div className="mt-1 text-sm text-gray-400">{desc}</div>
                      </div>
                      <span className={`text-xs font-bold ${tone}`}>{priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="xpay-card p-5">
              <h2 className="font-bold">Esito controlli</h2>
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={mockData} cx="50%" cy="50%" innerRadius={54} outerRadius={78} paddingAngle={5} dataKey="value">
                      {mockData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0c1218', border: '1px solid #23313b', borderRadius: 8, color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="xpay-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold"><WalletCards size={18} className="text-xpay-mint" /> Confronto mesi</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                ['Netto', '-120,00', 'text-xpay-coral'],
                ['Lordo', '+80,00', 'text-xpay-mint'],
                ['Straordinari', '+8 ore', 'text-xpay-mint'],
                ['Ferie residue', '-2 giorni', 'text-xpay-coral'],
              ].map(([label, value, tone]) => (
                <div key={label} className="flex items-center justify-between rounded-lg bg-xpay-soft px-4 py-3 text-sm">
                  <span className="text-gray-400">{label}</span>
                  <span className={`font-mono font-bold ${tone}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ['Calendario turni', 'Ore, notti, festivi e pattern ricorrenti.', '/calendar'],
              ['Archivio cedolini', 'Storico, filtri e confronti mese su mese.', '/archive'],
              ['Simulatore', 'Stima del prossimo netto prima del cedolino.', '/simulator'],
            ].map(([title, desc, to]) => (
              <Link key={title} to={to} className="xpay-card p-5 transition hover:border-xpay-mint/60">
                <div className="font-bold">{title}</div>
                <p className="mt-2 text-sm leading-5 text-gray-400">{desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
