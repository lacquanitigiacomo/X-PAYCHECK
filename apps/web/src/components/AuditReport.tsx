import type { ReactNode } from 'react';
import type { AuditOutput, RuleResult, Severity } from '@x-paycheck/audit-core';
import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

const SEVERITY_META: Record<Severity, { label: string; text: string; bg: string; border: string; icon: ReactNode }> = {
  CRITICO: {
    label: 'Critico',
    text: 'text-xpay-coral',
    bg: 'bg-xpay-coral/10',
    border: 'border-xpay-coral/40',
    icon: <AlertOctagon size={18} />,
  },
  WARNING: {
    label: 'Attenzione',
    text: 'text-xpay-amber',
    bg: 'bg-xpay-amber/10',
    border: 'border-xpay-amber/40',
    icon: <AlertTriangle size={18} />,
  },
  INFO: {
    label: 'Informazione',
    text: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/40',
    icon: <Info size={18} />,
  },
  PASS: {
    label: 'Tutto ok',
    text: 'text-xpay-mint',
    bg: 'bg-xpay-mint/10',
    border: 'border-xpay-mint/40',
    icon: <CheckCircle2 size={18} />,
  },
};

function formatValore(value: number | string | null): string {
  if (value === null) return '-';
  if (typeof value === 'number') return value.toLocaleString('it-IT', { maximumFractionDigits: 2 });
  return value;
}

function RuleRow({ rule }: { rule: RuleResult }) {
  const meta = SEVERITY_META[rule.stato];
  return (
    <div className={`rounded-lg border ${meta.border} ${meta.bg} p-4`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={meta.text}>{meta.icon}</span>
          <div>
            <div className="font-semibold text-white">{rule.nome}</div>
            <div className="text-xs text-gray-500">{rule.regola_id}</div>
          </div>
        </div>
        <span className={`text-xs font-bold uppercase ${meta.text}`}>{meta.label}</span>
      </div>

      <p className="mt-3 text-sm text-gray-300">{rule.messaggio}</p>

      <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
        <div className="rounded-lg bg-xpay-soft p-2">
          <div className="text-xs text-gray-500">Atteso</div>
          <div className="font-mono font-semibold">{formatValore(rule.valore_atteso)}</div>
        </div>
        <div className="rounded-lg bg-xpay-soft p-2">
          <div className="text-xs text-gray-500">Rilevato</div>
          <div className="font-mono font-semibold">{formatValore(rule.valore_rilevato)}</div>
        </div>
        <div className="rounded-lg bg-xpay-soft p-2">
          <div className="text-xs text-gray-500">Delta</div>
          <div className="font-mono font-semibold">{formatValore(rule.delta)}</div>
        </div>
      </div>

      {rule.riferimento_ccnl && (
        <div className="mt-3 text-xs text-gray-500">
          Riferimento CCNL: <span className="text-gray-300">{rule.riferimento_ccnl}</span>
        </div>
      )}
    </div>
  );
}

export default function AuditReport({ report }: { report: AuditOutput }) {
  const semaforo = SEVERITY_META[report.severita_massima];

  return (
    <div className="space-y-6">
      <div className={`rounded-xl border ${semaforo.border} ${semaforo.bg} p-6`}>
        <div className="flex items-center gap-3">
          <span className={semaforo.text}>{semaforo.icon}</span>
          <div>
            <div className={`text-xl font-bold ${semaforo.text}`}>{semaforo.label}</div>
            <div className="text-sm text-gray-400">
              Esito complessivo del controllo - CCNL {report.ccnl}, livello {report.livello}
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          Report {report.audit_id} - {new Date(report.timestamp).toLocaleString('it-IT')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Controlli totali', value: report.riepilogo.totale_controlli, tone: 'text-white' },
          { label: 'Critici', value: report.riepilogo.critici, tone: 'text-xpay-coral' },
          { label: 'Avvisi', value: report.riepilogo.warning, tone: 'text-xpay-amber' },
          { label: 'Passati', value: report.riepilogo.pass, tone: 'text-xpay-mint' },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-xpay-line bg-xpay-panel p-4 text-center">
            <div className={`text-2xl font-black ${s.tone}`}>{s.value}</div>
            <div className="mt-1 text-xs text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-white">Dettaglio controlli</h3>
        {report.dettaglio.map((rule) => (
          <RuleRow key={rule.regola_id} rule={rule} />
        ))}
      </div>
    </div>
  );
}
