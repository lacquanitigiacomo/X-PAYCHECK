import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  FileCheck2,
  FolderArchive,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const heroFeatures = [
  { icon: <ScanLine size={18} />, label: 'Analisi completa del cedolino' },
  { icon: <FileCheck2 size={18} />, label: 'CCNL e livello sempre al centro' },
  { icon: <CalendarDays size={18} />, label: 'Turni e calendario intelligenti' },
  { icon: <LockKeyhole size={18} />, label: 'Privacy e dati sotto controllo' },
];

const modules = [
  {
    icon: <ScanLine size={22} />,
    title: 'Caricamento cedolino',
    desc: 'Importi PDF, foto o immagini. L’app estrae mese, lordo, netto, ore, trattenute e voci ricorrenti.',
  },
  {
    icon: <CalendarDays size={22} />,
    title: 'Calendario turni',
    desc: 'Segni ore ordinarie, straordinari, notturni, domeniche e festivi. I turni diventano la base del confronto.',
  },
  {
    icon: <ShieldCheck size={22} />,
    title: 'Report anomalie',
    desc: 'Ogni differenza viene classificata come critica, avviso o controllo ok, con priorita e importo stimato.',
  },
  {
    icon: <FolderArchive size={22} />,
    title: 'Archivio cedolini',
    desc: 'Mantieni lo storico dei mesi, riapri vecchi report e confronti netto, lordo, ferie e straordinari.',
  },
  {
    icon: <WalletCards size={22} />,
    title: 'Confronto mesi',
    desc: 'Capisci subito se qualcosa cambia rispetto ai mesi precedenti: importi, ore, contributi, ferie residue.',
  },
  {
    icon: <SlidersHorizontal size={22} />,
    title: 'Focus controlli',
    desc: 'Scegli cosa controllare meglio: TFR, malattia, IRPEF, contributi, netto troppo basso o differenze tra mesi.',
  },
];

const checks = [
  'Straordinari',
  'Notturni',
  'Festivi e domeniche',
  'Ferie e permessi',
  'TFR',
  'Malattia',
  'Netto troppo basso',
  'Contributi e IRPEF',
];

const steps = [
  ['01', 'Configura lavoro', 'Inserisci CCNL, livello, pattern turni e preferenze di controllo.'],
  ['02', 'Carica dati', 'Aggiungi cedolino e orari del mese, anche in modalita manuale.'],
  ['03', 'Leggi il report', 'Apri criticita, avvisi e controlli ok con spiegazioni operative.'],
  ['04', 'Archivia e confronta', 'Salva lo storico e confronta il mese corrente con quelli precedenti.'],
];

const faqs = [
  ['Serve capire la busta paga?', 'No. L’obiettivo e tradurre il cedolino in controlli leggibili e azionabili.'],
  ['Posso provarla senza backend?', 'Si. Dalla pagina login puoi entrare in demo e navigare tutte le sezioni.'],
  ['I cedolini finiscono sul server?', 'Il modello dell’app e privacy-first: l’esperienza e pensata per minimizzare i dati sensibili inviati.'],
];

export default function Home() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:py-14 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div className="space-y-8">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <span className="text-6xl font-black leading-none text-xpay-mint">X</span>
              <h1 className="text-4xl font-black tracking-wide text-white md:text-5xl">X-PAY CHECK</h1>
            </div>
            <p className="max-w-md text-xl leading-relaxed text-gray-200">
              Controlla se la tua busta paga torna davvero.
            </p>
            <p className="max-w-lg text-sm leading-6 text-gray-400">
              Una app per trasformare cedolino, turni e CCNL in un report chiaro: cosa torna, cosa non torna e cosa
              vale la pena verificare prima di lasciar perdere.
            </p>
          </div>

          <div className="grid gap-3">
            {heroFeatures.map((feature) => (
              <div key={feature.label} className="flex items-center gap-4 text-sm text-gray-200">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-xpay-mint/40 bg-xpay-mint/10 text-xpay-mint">
                  {feature.icon}
                </span>
                {feature.label}
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link to="/login" className="xpay-primary">
              Entra e prova la demo <ArrowRight size={18} />
            </Link>
            <a href="#funzioni" className="xpay-secondary">
              Vedi funzionalita
            </a>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <div className="phone-shell md:translate-y-8">
            <div className="phone-screen flex flex-col">
              <div className="mb-10 flex items-center justify-between text-[0.65rem] text-gray-400">
                <span>0:31</span><span>LTE</span>
              </div>
              <div className="text-center">
                <div className="mx-auto mb-3 text-5xl font-black text-xpay-mint">X</div>
                <div className="text-xl font-black">X-PAY CHECK</div>
                <p className="mt-3 text-sm leading-5 text-gray-300">La tua busta paga, finalmente leggibile.</p>
              </div>
              <div className="mt-10 grid gap-3">
                <Link to="/login" className="xpay-primary !py-3">Entra in demo</Link>
                <Link to="/dashboard" className="xpay-secondary !py-3">Dashboard</Link>
              </div>
              <p className="mt-auto text-center text-xs text-gray-600">I tuoi dati restano sotto il tuo controllo.</p>
            </div>
          </div>

          <div className="phone-shell">
            <div className="phone-screen">
              <div className="mini-label">Nuova analisi</div>
              <h2 className="mt-2 text-xl font-bold">Scegli come caricare il tuo cedolino</h2>
              <div className="mt-8 grid gap-3">
                {['Scatta foto', 'Carica PDF', 'Importa immagine', 'Inserisci dati manualmente'].map((item) => (
                  <div key={item} className="flex items-center gap-3 rounded-lg border border-xpay-line bg-xpay-soft px-3 py-3 text-sm">
                    <ScanLine size={16} className="text-xpay-mint" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-lg border border-xpay-line bg-black/20 p-4">
                <div className="text-sm font-semibold">Dati estratti</div>
                {['Mese: Aprile 2026', 'CCNL: Commercio', 'Lordo: 1.850,00', 'Netto: 1.300,00'].map((row) => (
                  <div key={row} className="mt-3 flex justify-between text-xs text-gray-400">
                    <span>{row.split(':')[0]}</span><span className="text-gray-100">{row.split(': ')[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="phone-shell md:translate-y-8">
            <div className="phone-screen">
              <div className="mini-label">Analisi - Aprile 2026</div>
              <h2 className="mt-2 text-xl font-bold">Stato: da verificare</h2>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  ['2', 'Critiche', 'text-xpay-coral'],
                  ['5', 'Avvisi', 'text-xpay-amber'],
                  ['14', 'OK', 'text-xpay-mint'],
                ].map(([value, label, color]) => (
                  <div key={label} className="rounded-lg border border-xpay-line bg-xpay-soft p-3 text-center">
                    <div className={`text-2xl font-black ${color}`}>{value}</div>
                    <div className="mt-1 text-[0.65rem] text-gray-400">{label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-xpay-coral/50 bg-xpay-coral/12 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-xpay-coral">
                  <Sparkles size={16} /> Anomalia critica
                </div>
                <p className="mt-3 text-sm leading-5 text-gray-300">
                  Festivita lavorata non maggiorata. Delta stimato: 22,45 euro.
                </p>
              </div>
              <div className="mt-4 rounded-lg border border-xpay-mint/40 bg-xpay-mint/10 p-4 text-sm text-xpay-mint">
                Maggiorazione notturna inferiore
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-xpay-line/70 bg-black/20">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
          {[
            ['2 min', 'per caricare il primo cedolino'],
            ['21', 'controlli simulati nel report demo'],
            ['4', 'sezioni operative navigabili'],
          ].map(([value, label]) => (
            <div key={label}>
              <div className="text-4xl font-black text-xpay-mint">{value}</div>
              <div className="mt-1 text-sm text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="funzioni" className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-8 max-w-2xl">
          <p className="mini-label">Funzionalita</p>
          <h2 className="mt-2 text-3xl font-black">Tutte le sezioni dell’app</h2>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Ogni sezione serve a una domanda concreta: cosa ho lavorato, cosa mi hanno pagato, cosa manca e come lo dimostro.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <div key={module.title} className="xpay-card p-5">
              <div className="mb-4 text-xpay-mint">{module.icon}</div>
              <h3 className="font-bold text-white">{module.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">{module.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="mini-label">Flusso principale</p>
          <h2 className="mt-2 text-3xl font-black">Dal cedolino al report</h2>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            Il percorso e pensato per chi non vuole interpretare ogni riga del cedolino da zero, ma vuole capire dove
            guardare e perche.
          </p>
        </div>

        <div className="grid gap-3">
          {steps.map(([number, title, desc]) => (
            <div key={number} className="xpay-card grid gap-4 p-4 sm:grid-cols-[70px_1fr]">
              <div className="text-3xl font-black text-xpay-mint">{number}</div>
              <div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-gray-400">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="xpay-card grid gap-8 p-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="mini-label">Controlli coperti</p>
            <h2 className="mt-2 text-3xl font-black">Le voci che guardi per prime</h2>
            <p className="mt-3 text-sm leading-6 text-gray-400">
              La prima versione mette ordine sulle voci piu frequenti e sulle differenze piu facili da perdere.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {checks.map((check) => (
              <div key={check} className="flex items-center gap-3 rounded-lg bg-xpay-soft px-4 py-3 text-sm">
                <CheckCircle2 size={18} className="text-xpay-mint" />
                {check}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 lg:grid-cols-2">
        <div className="xpay-card p-6">
          <LockKeyhole className="mb-4 text-xpay-mint" />
          <h2 className="text-2xl font-black">Privacy by design</h2>
          <p className="mt-3 text-sm leading-6 text-gray-400">
            L’app nasce per trattare documenti sensibili con prudenza: controlli locali dove possibile, backup separato
            dai contenuti piu delicati e impostazioni chiare su cosa resta salvato.
          </p>
        </div>
        <div className="xpay-card border-xpay-mint/40 bg-xpay-mint/10 p-6">
          <div className="mini-label">Piano Pro</div>
          <h2 className="mt-2 text-2xl font-black text-xpay-mint">Report avanzati e storico completo</h2>
          <p className="mt-3 text-sm leading-6 text-gray-300">
            Include calendario turni, confronto multi-mese, simulatore cedolino, backup metadati e aggiornamenti CCNL.
          </p>
          <Link to="/login" className="xpay-primary mt-5">Prova la demo</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6">
          <p className="mini-label">FAQ</p>
          <h2 className="mt-2 text-3xl font-black">Domande rapide</h2>
        </div>
        <div className="grid gap-3">
          {faqs.map(([question, answer]) => (
            <div key={question} className="xpay-card p-5">
              <h3 className="font-bold">{question}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">{answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
