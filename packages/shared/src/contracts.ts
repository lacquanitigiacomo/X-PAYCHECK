import { z } from 'zod';

export const planTierSchema = z.enum(['free', 'pro']);
export const proBillingCycleSchema = z.enum(['monthly', 'yearly', 'lifetime']);

export const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.email(),
  password: z.string().min(8),
  // Il flusso web sceglie il piano prima della registrazione e lo invia sempre,
  // ma renderlo obbligatorio spezzerebbe i client che registrano senza sceglierlo.
  // Chi non sceglie resta su Free, che e' anche il ramo senza checkout.
  tier: planTierSchema.default('free'),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const numericField = z.number().finite();
const nonNegativeNumericField = z.number().finite().nonnegative();

// Campi che audit-core/src/auditEngine.ts legge direttamente (senza fallback):
// un valore mancante produce oggi `undefined + numero = NaN` restituito con
// HTTP 200. Renderli obbligatori trasforma quel caso in un 400 esplicito.
export const cedolinoSchema = z.object({
  mese_riferimento: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  tipo_documento: z.string().min(1),
  // ccnl_applicato e livello sono letti con `?? fallback` in auditEngine.ts,
  // quindi restano opzionali. Chiavi extra sono accettate se stringhe.
  dati_testuali: z
    .object({
      ccnl_applicato: z.string().optional(),
      livello: z.string().optional(),
    })
    .catchall(z.string().optional()),
  dati_numerici: z
    .object({
      lordo: numericField,
      netto: numericField,
      paga_base: numericField,
      irpef: numericField,
      addizionale_regionale: numericField,
      addizionale_comunale: numericField,
      contributi_inps_dipendente: numericField,
      contributi_inail: numericField,
      ore_ordinarie: numericField,
      ore_straordinarie: numericField,
      ore_notturne: numericField,
      ore_festive: numericField,
      maggiorazione_notturna: numericField,
      maggiorazione_festiva: numericField,
      giorni_lavorati: numericField,
      // Ore totali dal badge aziendale: unica fonte indipendente dal cedolino.
      // Opzionale, e quando manca la regola R002 non viene proprio emessa.
      ore_badge: nonNegativeNumericField.optional(),
    })
    .catchall(numericField),
  assenze: z
    .object({
      malattia_gg: nonNegativeNumericField,
      ferie_gg: nonNegativeNumericField,
      rol_gg: nonNegativeNumericField,
      maternita_gg: nonNegativeNumericField,
      cassa_integrazione_gg: nonNegativeNumericField,
    })
    .catchall(nonNegativeNumericField),
});

export const payslipUploadSchema = z.object({
  fileData: z.string().min(1).max(7_000_000),
  mimeType: z.enum(['application/pdf', 'image/jpeg', 'image/png']),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  confirmReplace: z.boolean().default(false),
});

export const workDaySchema = z.object({
  day: z.number().int().min(1).max(7),
  enabled: z.boolean(),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
}).superRefine((value, context) => {
  if (value.enabled && (!value.start || !value.end)) {
    context.addIssue({ code: 'custom', message: 'Gli orari sono obbligatori per i giorni attivi' });
  }
});

export const workProfileSchema = z.object({
  ccnl: z.string().min(1), weeklyHours: z.number().positive().max(80),
  schedule: z.array(workDaySchema).length(7).refine(days => new Set(days.map(day => day.day)).size === 7),
  badgeEnabled: z.boolean(),
});

export const checkoutSchema = z.object({
  tier: z.literal('pro'), billingCycle: proBillingCycleSchema,
});

export const accountProfileUpdateSchema = z.object({
  name: z.string().trim().min(2).max(100),
  picture: z.url().max(2048).nullable(),
}).strict();

export const cancelPendingProSchema = z.object({}).strict();

export const badgeCorrectionSchema = z.object({
  startedAt: z.iso.datetime(), endedAt: z.iso.datetime().nullable(), reason: z.string().trim().min(3),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PayslipUploadInput = z.infer<typeof payslipUploadSchema>;
export type CedolinoInput = z.infer<typeof cedolinoSchema>;
export type PlanTier = z.infer<typeof planTierSchema>;
export type ProBillingCycle = z.infer<typeof proBillingCycleSchema>;
export type WeeklySchedule = z.infer<typeof workDaySchema>[];
export type AccountProfile = RegisterInput;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type AccountProfileUpdateInput = z.infer<typeof accountProfileUpdateSchema>;
export type CancelPendingProInput = z.infer<typeof cancelPendingProSchema>;
export type WorkProfileInput = z.infer<typeof workProfileSchema>;
export type BadgeCorrectionInput = z.infer<typeof badgeCorrectionSchema>;
