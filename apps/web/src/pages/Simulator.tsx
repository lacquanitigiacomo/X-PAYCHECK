import { Calculator, Check, Moon, SunMedium } from 'lucide-react';

const rows = [
  ['Ore ordinarie', '176', '1.760,00'],
  ['Straordinari', '10', '137,50'],
  ['Notturni', '8', '24,80'],
  ['Festivi', '1', '42,45'],
];

export default function Simulator() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <p className="mini-label">Simulatore cedolino</p>
        <h1 className="mt-2 text-3xl font-black md:text-4xl">Stima il prossimo netto</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
          Inserisci ore previste, turni speciali e livello CCNL per ottenere una stima prima che arrivi il cedolino.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <section className="xpay-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Calculator size={18} className="text-xpay-mint" /> Parametri</h2>
          <div className="space-y-4">
            {['Ore ordinarie', 'Straordinari', 'Ore notturne', 'Festivi'].map((label, index) => (
              <label key={label} className="block">
                <span className="mb-1 block text-sm text-gray-400">{label}</span>
                <input className="xpay-field" defaultValue={[176, 10, 8, 1][index]} />
              </label>
            ))}
            <button className="xpay-primary w-full">Calcola stima</button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="xpay-card p-5">
              <div className="text-sm text-gray-500">Lordo stimato</div>
              <div className="mt-2 text-4xl font-black text-white">1.920,00</div>
            </div>
            <div className="xpay-card p-5">
              <div className="text-sm text-gray-500">Netto stimato</div>
              <div className="mt-2 text-4xl font-black text-xpay-mint">1.450,00</div>
            </div>
          </div>

          <div className="xpay-card p-5">
            <h2 className="mb-4 font-bold">Voci previste</h2>
            {rows.map(([label, hours, amount]) => (
              <div key={label} className="grid grid-cols-3 border-b border-xpay-line py-3 text-sm last:border-0">
                <span className="text-gray-300">{label}</span>
                <span className="text-right font-mono text-gray-500">{hours}</span>
                <span className="text-right font-mono font-bold">{amount}</span>
              </div>
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              { icon: <Moon size={18} />, title: 'Notturni inclusi', desc: 'La stima applica maggiorazioni separate dal lordo base.' },
              { icon: <SunMedium size={18} />, title: 'Festivi evidenziati', desc: 'I giorni speciali vengono marcati per il confronto successivo.' },
              { icon: <Check size={18} />, title: 'Pronto per audit', desc: 'Quando arriva il cedolino confronti stima, ore e importi effettivi.' },
            ].map((item) => (
              <div key={item.title} className="xpay-card p-4">
                <div className="mb-3 text-xpay-mint">{item.icon}</div>
                <div className="font-bold">{item.title}</div>
                <p className="mt-1 text-sm leading-5 text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
