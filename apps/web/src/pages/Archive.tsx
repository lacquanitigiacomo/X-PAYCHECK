import { FileText, Filter, Search, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const payslips = [
  { month: 'Maggio 2026', status: 'Da verificare', critical: '2 criticita', tone: 'text-xpay-coral' },
  { month: 'Aprile 2026', status: 'OK', critical: '0 criticita', tone: 'text-xpay-mint' },
  { month: 'Marzo 2026', status: 'OK', critical: '0 criticita', tone: 'text-xpay-mint' },
  { month: 'Febbraio 2026', status: 'Avvisi', critical: '3 avvisi', tone: 'text-xpay-amber' },
];

export default function Archive() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="mini-label">Archivio cedolini</p>
          <h1 className="mt-2 text-3xl font-black md:text-4xl">Storico analisi</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Consulta i cedolini gia analizzati, confronta i mesi e riapri le anomalie ancora da chiudere.
          </p>
        </div>
        <Link to="/audit/payslip" className="xpay-primary"><FileText size={18} /> Nuovo cedolino</Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="xpay-card p-5">
          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto]">
            <label className="relative">
              <Search size={16} className="absolute left-3 top-3.5 text-gray-500" />
              <input className="xpay-field pl-10" placeholder="Cerca mese, CCNL, stato..." />
            </label>
            <button className="xpay-secondary"><Filter size={16} /> Filtri</button>
          </div>

          <div className="grid gap-3">
            {payslips.map((item) => (
              <Link key={item.month} to="/audit/payslip" className="rounded-lg border border-xpay-line bg-xpay-soft p-4 transition hover:border-xpay-mint/60">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-bold text-white">{item.month}</div>
                    <div className="mt-1 text-sm text-gray-500">CCNL Commercio - Livello 5</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${item.tone}`}>{item.status}</div>
                    <div className="mt-1 text-xs text-gray-500">{item.critical}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="xpay-card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-bold"><ShieldCheck size={18} className="text-xpay-mint" /> Integrita dati</h2>
            <p className="text-sm leading-6 text-gray-400">
              Ogni analisi conserva mese, CCNL, ore dichiarate, differenze rilevate e stato di risoluzione.
            </p>
          </div>
          <div className="xpay-card p-5">
            <h2 className="mb-4 font-bold">Confronto rapido</h2>
            {[
              ['Netto medio', '1.332,00'],
              ['Delta aperti', '37,90'],
              ['Mesi analizzati', '4'],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-xpay-line py-3 text-sm last:border-0">
                <span className="text-gray-400">{label}</span>
                <span className="font-mono font-bold">{value}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
