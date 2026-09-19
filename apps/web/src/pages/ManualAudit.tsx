import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, CalendarX2, Clock3, Landmark, ListChecks, Send, TrendingUp, Wallet } from 'lucide-react';
import type { AuditOutput } from '@x-paycheck/audit-core';
import { getAccessToken } from '../lib/authStorage';
import { API_BASE_URL } from '../lib/api';
import AuditReport from '../components/AuditReport';
import type { AssenzeKey, DatiNumericiKey, ManualAuditFormValues } from '../lib/manualAudit';
import {
  EMPTY_MANUAL_AUDIT_FORM,
  buildCedolinoPayload,
  extractZodFlattenMessages,
  validateManualAuditForm,
} from '../lib/manualAudit';

type FieldKey = DatiNumericiKey | AssenzeKey;

const FIELD_LABELS: Record<FieldKey, string> = {
  lordo: 'Lordo mensile (€)',
  netto: 'Netto in busta (€)',
  paga_base: 'Paga base (€)',
  irpef: 'IRPEF trattenuta (€)',
  addizionale_regionale: 'Addizionale regionale (€)',
  addizionale_comunale: 'Addizionale comunale (€)',
  contributi_inps_dipendente: 'Contributi INPS dipendente (€)',
  contributi_inail: 'Contributi INAIL (€)',
  ore_ordinarie: 'Ore ordinarie',
  ore_straordinarie: 'Ore straordinarie',
  ore_notturne: 'Ore notturne',
  ore_festive: 'Ore festive',
  maggiorazione_notturna: 'Maggiorazione notturna (€)',
  maggiorazione_festiva: 'Maggiorazione festiva (€)',
  giorni_lavorati: 'Giorni lavorati',
  malattia_gg: 'Giorni di malattia',
  ferie_gg: 'Giorni di ferie',
  rol_gg: 'Giorni di ROL / permessi',
  maternita_gg: 'Giorni di maternità',
  cassa_integrazione_gg: 'Giorni di cassa integrazione',
};

const SECTIONS: { title: string; icon: ReactNode; fields: FieldKey[] }[] = [
  { title: 'Retribuzione', icon: <Wallet size={18} />, fields: ['lordo', 'netto', 'paga_base'] },
  {
    title: 'Trattenute',
    icon: <Landmark size={18} />,
    fields: ['irpef', 'addizionale_regionale', 'addizionale_comunale', 'contributi_inps_dipendente', 'contributi_inail'],
  },
  { title: 'Ore', icon: <Clock3 size={18} />, fields: ['ore_ordinarie', 'ore_straordinarie', 'ore_notturne', 'ore_festive'] },
  { title: 'Maggiorazioni', icon: <TrendingUp size={18} />, fields: ['maggiorazione_notturna', 'maggiorazione_festiva'] },
  {
    title: 'Giorni e assenze',
    icon: <CalendarX2 size={18} />,
    fields: ['giorni_lavorati', 'malattia_gg', 'ferie_gg', 'rol_gg', 'maternita_gg', 'cassa_integrazione_gg'],
  },
];

export default function ManualAudit() {
  const navigate = useNavigate();
  const [values, setValues] = useState<ManualAuditFormValues>(EMPTY_MANUAL_AUDIT_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiMessages, setApiMessages] = useState<string[]>([]);
  const [genericError, setGenericError] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AuditOutput | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) navigate('/login');
  }, [navigate]);

  const updateField = (key: keyof ManualAuditFormValues, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenericError('');
    setApiMessages([]);

    const errors = validateManualAuditForm(values);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const token = getAccessToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setReport(null);
    try {
      const payload = buildCedolinoPayload(values);
      const res = await axios.post<AuditOutput>(`${API_BASE_URL}/audit/run`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(res.data);
    } catch (err: any) {
      if (err.response?.status === 400) {
        const messages = extractZodFlattenMessages(err.response?.data?.details);
        setApiMessages(messages.length > 0 ? messages : ['Dati del cedolino non validi.']);
      } else {
        setGenericError(err.response?.data?.error || 'Verifica non riuscita. Riprova tra qualche istante.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <button
        onClick={() => navigate('/audit/payslip')}
        className="flex items-center gap-2 text-gray-400 transition hover:text-white"
      >
        <ArrowLeft size={18} /> Torna all'audit busta paga
      </button>

      <div>
        <p className="mini-label">Inserimento manuale</p>
        <h1 className="mt-2 text-3xl font-black text-white">Compila il tuo cedolino</h1>
        <p className="mt-2 text-sm text-gray-400">
          Inserisci i dati cosi' come compaiono in busta paga: i controlli automatici confrontano ogni voce con quanto
          previsto dal CCNL e restituiscono un report dettagliato.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="xpay-card space-y-4 p-5">
          <div className="flex items-center gap-2 font-bold text-white">
            <ListChecks size={18} className="text-xpay-mint" /> Contesto
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Mese di riferimento</label>
              <input
                type="month"
                value={values.mese_riferimento}
                onChange={(e) => updateField('mese_riferimento', e.target.value)}
                className="xpay-field"
              />
              {fieldErrors.mese_riferimento && (
                <p className="mt-1 text-xs text-xpay-coral">{fieldErrors.mese_riferimento}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Tipo documento</label>
              <input
                type="text"
                value={values.tipo_documento}
                onChange={(e) => updateField('tipo_documento', e.target.value)}
                placeholder="Cedolino mensile"
                className="xpay-field"
              />
              {fieldErrors.tipo_documento && (
                <p className="mt-1 text-xs text-xpay-coral">{fieldErrors.tipo_documento}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">CCNL applicato (opzionale)</label>
              <input
                type="text"
                value={values.ccnl_applicato}
                onChange={(e) => updateField('ccnl_applicato', e.target.value)}
                placeholder="es. CCNL-COMMERCIO"
                className="xpay-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Livello (opzionale)</label>
              <input
                type="text"
                value={values.livello}
                onChange={(e) => updateField('livello', e.target.value)}
                placeholder="es. 3"
                className="xpay-field"
              />
            </div>
          </div>
        </div>

        {SECTIONS.map((section) => (
          <div key={section.title} className="xpay-card space-y-4 p-5">
            <div className="flex items-center gap-2 font-bold text-white">
              <span className="text-xpay-mint">{section.icon}</span> {section.title}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {section.fields.map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-sm font-medium">{FIELD_LABELS[field]}</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    placeholder="0"
                    value={values[field]}
                    onChange={(e) => updateField(field, e.target.value)}
                    className="xpay-field"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {apiMessages.length > 0 && (
          <div className="space-y-2 rounded-lg border border-xpay-coral/40 bg-xpay-coral/10 p-4">
            <div className="font-semibold text-xpay-coral">Il server ha rifiutato i dati inviati:</div>
            {apiMessages.map((message) => (
              <div key={message} className="text-sm text-xpay-coral/90">
                {message}
              </div>
            ))}
          </div>
        )}

        {genericError && (
          <div className="rounded-lg border border-red-800 bg-red-900/30 p-3 text-sm text-red-400">{genericError}</div>
        )}

        <button type="submit" disabled={loading} className="xpay-primary w-full">
          <Send size={18} /> {loading ? 'Verifica in corso...' : 'Avvia verifica cedolino'}
        </button>
      </form>

      {report && (
        <div className="pt-4">
          <AuditReport report={report} />
        </div>
      )}
    </div>
  );
}
