import { describe, expect, it } from 'vitest';
import {
  EMPTY_MANUAL_AUDIT_FORM,
  buildCedolinoPayload,
  extractZodFlattenMessages,
  toNumberOrZero,
  validateManualAuditForm,
} from './manualAudit';

describe('toNumberOrZero', () => {
  it('converte una stringa vuota in 0', () => {
    expect(toNumberOrZero('')).toBe(0);
    expect(toNumberOrZero('   ')).toBe(0);
  });

  it('converte un numero valido preservando i decimali', () => {
    expect(toNumberOrZero('1234.56')).toBe(1234.56);
  });

  it('ricade su 0 per input non numerici', () => {
    expect(toNumberOrZero('abc')).toBe(0);
  });
});

describe('buildCedolinoPayload', () => {
  it('imposta a 0 tutti i campi numerici e le assenze lasciati vuoti', () => {
    const payload = buildCedolinoPayload({
      ...EMPTY_MANUAL_AUDIT_FORM,
      mese_riferimento: '2026-05',
      tipo_documento: 'Cedolino mensile',
    });

    expect(payload.dati_numerici).toEqual({
      lordo: 0,
      netto: 0,
      paga_base: 0,
      irpef: 0,
      addizionale_regionale: 0,
      addizionale_comunale: 0,
      contributi_inps_dipendente: 0,
      contributi_inail: 0,
      ore_ordinarie: 0,
      ore_straordinarie: 0,
      ore_notturne: 0,
      ore_festive: 0,
      maggiorazione_notturna: 0,
      maggiorazione_festiva: 0,
      giorni_lavorati: 0,
    });
    expect(payload.assenze).toEqual({
      malattia_gg: 0,
      ferie_gg: 0,
      rol_gg: 0,
      maternita_gg: 0,
      cassa_integrazione_gg: 0,
    });
  });

  it('riporta i campi testuali opzionali come undefined quando vuoti', () => {
    const payload = buildCedolinoPayload({
      ...EMPTY_MANUAL_AUDIT_FORM,
      mese_riferimento: '2026-05',
      tipo_documento: 'Cedolino mensile',
    });

    expect(payload.dati_testuali.ccnl_applicato).toBeUndefined();
    expect(payload.dati_testuali.livello).toBeUndefined();
  });

  it('trasferisce correttamente i valori numerici compilati', () => {
    const payload = buildCedolinoPayload({
      ...EMPTY_MANUAL_AUDIT_FORM,
      mese_riferimento: '2026-05',
      tipo_documento: 'Cedolino mensile',
      ccnl_applicato: 'CCNL-COMMERCIO',
      livello: '3',
      lordo: '1850.5',
      netto: '1350',
      ore_ordinarie: '160',
      malattia_gg: '2',
    });

    expect(payload.dati_testuali.ccnl_applicato).toBe('CCNL-COMMERCIO');
    expect(payload.dati_testuali.livello).toBe('3');
    expect(payload.dati_numerici.lordo).toBe(1850.5);
    expect(payload.dati_numerici.netto).toBe(1350);
    expect(payload.dati_numerici.ore_ordinarie).toBe(160);
    expect(payload.assenze.malattia_gg).toBe(2);
  });

  it('normalizza mese_riferimento e tipo_documento rimuovendo gli spazi', () => {
    const payload = buildCedolinoPayload({
      ...EMPTY_MANUAL_AUDIT_FORM,
      mese_riferimento: '  2026-05  ',
      tipo_documento: '  Cedolino mensile  ',
    });

    expect(payload.mese_riferimento).toBe('2026-05');
    expect(payload.tipo_documento).toBe('Cedolino mensile');
  });
});

describe('validateManualAuditForm', () => {
  it('richiede il mese di riferimento nel formato AAAA-MM', () => {
    const errors = validateManualAuditForm({
      ...EMPTY_MANUAL_AUDIT_FORM,
      mese_riferimento: '05-2026',
      tipo_documento: 'Cedolino mensile',
    });
    expect(errors.mese_riferimento).toBeDefined();
  });

  it('rifiuta un mese di riferimento vuoto', () => {
    const errors = validateManualAuditForm({ ...EMPTY_MANUAL_AUDIT_FORM, tipo_documento: 'Cedolino mensile' });
    expect(errors.mese_riferimento).toBeDefined();
  });

  it('richiede un tipo documento non vuoto', () => {
    const errors = validateManualAuditForm({
      ...EMPTY_MANUAL_AUDIT_FORM,
      mese_riferimento: '2026-05',
      tipo_documento: '   ',
    });
    expect(errors.tipo_documento).toBeDefined();
  });

  it('non riporta errori quando i campi obbligatori sono validi', () => {
    const errors = validateManualAuditForm({
      ...EMPTY_MANUAL_AUDIT_FORM,
      mese_riferimento: '2026-05',
      tipo_documento: 'Cedolino mensile',
    });
    expect(errors).toEqual({});
  });
});

describe('extractZodFlattenMessages', () => {
  it('estrae i messaggi da formErrors e fieldErrors', () => {
    const details = {
      formErrors: ['Errore generale'],
      fieldErrors: {
        mese_riferimento: ['Formato non valido'],
        dati_numerici: ['Campo obbligatorio'],
      },
    };
    expect(extractZodFlattenMessages(details)).toEqual([
      'Errore generale',
      'mese_riferimento: Formato non valido',
      'dati_numerici: Campo obbligatorio',
    ]);
  });

  it('restituisce un array vuoto per input non validi', () => {
    expect(extractZodFlattenMessages(undefined)).toEqual([]);
    expect(extractZodFlattenMessages(null)).toEqual([]);
    expect(extractZodFlattenMessages('errore')).toEqual([]);
  });
});
