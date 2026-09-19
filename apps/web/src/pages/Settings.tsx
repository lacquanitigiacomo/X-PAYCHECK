import { Bell, Database, LockKeyhole, ShieldCheck, ToggleRight, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  { icon: <UserRound size={18} />, title: 'Profilo utente', value: 'Demo X-PAY', to: '/profile' },
  { icon: <ShieldCheck size={18} />, title: 'CCNL e lavoro', value: 'Commercio - Livello 5', to: '/profile' },
  { icon: <Bell size={18} />, title: 'Avvisi anomalie', value: 'Attivi' },
  { icon: <Database size={18} />, title: 'Backup metadati', value: 'Solo Pro' },
];

export default function Settings() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <p className="mini-label">Impostazioni</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">Privacy e controllo dati</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
          Gestisci profilo, preferenze, salvataggio locale e funzioni Pro senza perdere di vista cosa viene conservato.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="xpay-card p-5">
          <div className="grid gap-3">
            {sections.map((item) => (
              <Link key={item.title} to={item.to || '/settings'} className="flex items-center justify-between rounded-lg border border-xpay-line bg-xpay-soft p-4 text-left transition hover:border-xpay-mint/50">
                <span className="flex items-center gap-3">
                  <span className="text-xpay-mint">{item.icon}</span>
                  <span>
                    <span className="block font-semibold">{item.title}</span>
                    <span className="text-sm text-gray-500">{item.value}</span>
                  </span>
                </span>
                <span className="text-gray-500">›</span>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="xpay-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold"><LockKeyhole size={18} className="text-xpay-mint" /> Privacy</h2>
            {[
              ['Cedolini salvati sul dispositivo', true],
              ['Analisi eseguita localmente', true],
              ['Backup contenuto cedolini', false],
              ['Esporta dati', true],
            ].map(([label, active]) => (
              <div key={String(label)} className="flex items-center justify-between border-b border-xpay-line py-3 text-sm last:border-0">
                <span className="text-gray-400">{label}</span>
                <ToggleRight className={active ? 'text-xpay-mint' : 'text-gray-600'} size={28} />
              </div>
            ))}
          </div>

          <div className="xpay-card border-xpay-mint/40 bg-xpay-mint/10 p-5">
            <div className="mini-label">Piano attuale</div>
            <div className="mt-2 text-3xl font-black text-xpay-mint">Pro</div>
            <p className="mt-2 text-sm leading-6 text-gray-300">
              Report avanzati, calendario turni, confronto cedolino/orari, storico multi-mese e aggiornamenti CCNL.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
