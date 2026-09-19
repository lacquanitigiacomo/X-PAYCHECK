import { ArrowLeft, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAccessToken } from '../lib/authStorage';

const freeFeatures = [
  'Un cedolino corrente',
  'Controllo essenziale',
  'Elaborazione locale',
];

const proFeatures = [
  'Archivio e confronti',
  'Export e più profili',
  'Badge timbrature',
];

function PlanFeatures({ items }: { items: readonly string[] }) {
  return (
    <ul className="mt-5 space-y-3 text-sm text-gray-300">
      {items.map((item) => (
        <li key={item} className="flex items-center gap-3">
          <Check size={16} className="shrink-0 text-xpay-mint" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export default function PlanChoice() {
  const authenticated = getAccessToken() !== null;
  const freeDestination = authenticated ? '/onboarding' : '/register?tier=free';
  const proDestination = authenticated ? '/checkout' : '/register?tier=pro';

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="mini-label">Prima di creare l'account</p>
        <h1 className="mt-3 text-3xl font-black md:text-4xl">Scegli il tuo piano</h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">
          Parti con il controllo del cedolino corrente oppure attiva subito archivio, confronti ed export.
        </p>
      </div>

      <div className="mt-9 grid gap-5 md:grid-cols-2">
        <section className="xpay-card flex flex-col p-6">
          <h2 className="text-2xl font-black">Free</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Per controllare il cedolino corrente con le funzioni essenziali.
          </p>
          <PlanFeatures items={freeFeatures} />
          <Link to={freeDestination} className="xpay-secondary mt-7 w-full md:mt-auto md:translate-y-1">
            Continua con Free
          </Link>
        </section>

        <section className="xpay-card flex flex-col border-xpay-mint/70 bg-xpay-mint/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Pro</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-xpay-mint/15 px-3 py-1 text-xs font-bold text-xpay-mint">
              <Sparkles size={13} /> PRO
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Per conservare lo storico e seguire più mesi o profili.
          </p>
          <PlanFeatures items={proFeatures} />
          <Link
            to={proDestination}
            state={authenticated ? { fromPlanChoice: true } : undefined}
            className="xpay-primary mt-7 w-full md:mt-auto md:translate-y-1"
          >
            Continua con Pro
          </Link>
        </section>
      </div>

      <div className="mt-7 text-center">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white">
          <ArrowLeft size={16} /> Torna alla home
        </Link>
      </div>
    </div>
  );
}
