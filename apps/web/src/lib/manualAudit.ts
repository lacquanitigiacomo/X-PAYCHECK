import type { CedolinoInput } from '@x-paycheck/shared';

export const DATI_NUMERICI_KEYS = [
  'lordo',
  'netto',
  'paga_base',
  'irpef',
  'addizionale_regionale',
  'addizionale_comunale',
  'contributi_inps_dipendente',
  'contributi_inail',
  'ore_ordinarie',
  'ore_straordinarie',
  'ore_notturne',
  'ore_festive',
  'maggiorazione_notturna',
  'maggiorazione_festiva',
  'giorni_lavorati',
] as const;

export const ASSENZE_KEYS = ['malattia_gg', 'ferie_gg', 'rol_gg', 'maternita_gg', 'cassa_integrazione_gg'] as const;

export type DatiNumericiKey = (typeof DATI_NUMERICI_KEYS)[number];
export type AssenzeKey = (typeof ASSENZE_KEYS)[number];

/**
 * Valori grezzi del form: tutti stringhe, cosi' un campo numerico lasciato
 * vuoto dall'utente si distingue da uno compilato con "0".
 */
export type ManualAuditFormValues = {
  mese_riferimento: string;
  tipo_documento: string;
  ccnl_applicato: string;
  livello: string;
} & Record<DatiNumericiKey, string> &
  Record<AssenzeKey, string>;

function emptyNumericFields<K extends string>(keys: readonly K[]): Record<K, string> {
  return keys.reduce((acc, key) => {
    acc[key] = '';
    return acc;
  }, {} as Record<K, string>);
}

export const EMPTY_MANUAL_AUDIT_FORM: ManualAuditFormValues = {
  mese_riferimento: '',
  tipo_documento: 'Cedolino mensile',
  ccnl_applicato: '',
  livello: '',
  ...emptyNumericFields(DATI_NUMERICI_KEYS),
  ...emptyNumericFields(ASSENZE_KEYS),
};

/** Un campo numerico vuoto o non valido vale 0: l'utente non deve subire un 400 per un campo che per lui e' zero. */
export function toNumberOrZero(value: string): number {
  const trimmed = value.trim();
  if (trimmed === '') return 0;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildCedolinoPayload(values: ManualAuditFormValues): CedolinoInput {
  const dati_numerici = DATI_NUMERICI_KEYS.reduce((acc, key) => {
    acc[key] = toNumberOrZero(values[key]);
    return acc;
  }, {} as Record<DatiNumericiKey, number>);

  const assenze = ASSENZE_KEYS.reduce((acc, key) => {
    acc[key] = toNumberOrZero(values[key]);
    return acc;
  }, {} as Record<AssenzeKey, number>);

  return {
    mese_riferimento: values.mese_riferimento.trim(),
    tipo_documento: values.tipo_documento.trim(),
    dati_testuali: {
      ccnl_applicato: values.ccnl_applicato.trim() || undefined,
      livello: values.livello.trim() || undefined,
    },
    dati_numerici,
    assenze,
  };
}

export type ManualAuditValidationErrors = Partial<Record<'mese_riferimento' | 'tipo_documento', string>>;

const MESE_RIFERIMENTO_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function validateManualAuditForm(values: ManualAuditFormValues): ManualAuditValidationErrors {
  const errors: ManualAuditValidationErrors = {};

  if (!MESE_RIFERIMENTO_PATTERN.test(values.mese_riferimento.trim())) {
    errors.mese_riferimento = 'Inserisci il mese di riferimento nel formato AAAA-MM (es. 2026-05).';
  }

  if (!values.tipo_documento.trim()) {
    errors.tipo_documento = 'Indica il tipo di documento (es. Cedolino mensile).';
  }

  return errors;
}

/** Estrae i messaggi dal `flatten()` di Zod restituito dal server in caso di 400. */
export function extractZodFlattenMessages(details: unknown): string[] {
  if (!details || typeof details !== 'object') return [];
  const messages: string[] = [];
  const { formErrors, fieldErrors } = details as {
    formErrors?: unknown;
    fieldErrors?: Record<string, unknown>;
  };

  if (Array.isArray(formErrors)) {
    for (const m of formErrors) if (typeof m === 'string') messages.push(m);
  }

  if (fieldErrors && typeof fieldErrors === 'object') {
    for (const [field, fieldMessages] of Object.entries(fieldErrors)) {
      if (Array.isArray(fieldMessages)) {
        for (const m of fieldMessages) {
          if (typeof m === 'string') messages.push(`${field}: ${m}`);
        }
      }
    }
  }

  return messages;
}
