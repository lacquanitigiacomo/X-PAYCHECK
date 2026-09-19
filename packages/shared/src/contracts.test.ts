import { describe, expect, it } from 'vitest';
import { cedolinoSchema } from './contracts.js';

const validCedolino = {
  mese_riferimento: '2024-05',
  tipo_documento: 'cedolino',
  dati_testuali: {
    ccnl_applicato: 'COMMERCIO_2024',
    livello: '4',
  },
  dati_numerici: {
    lordo: 2000,
    netto: 1500,
    paga_base: 1600,
    irpef: 300,
    addizionale_regionale: 20,
    addizionale_comunale: 10,
    contributi_inps_dipendente: 180,
    contributi_inail: 5,
    ore_ordinarie: 160,
    ore_straordinarie: 4,
    ore_notturne: 0,
    ore_festive: 0,
    maggiorazione_notturna: 0,
    maggiorazione_festiva: 0,
    giorni_lavorati: 22,
  },
  assenze: {
    malattia_gg: 0,
    ferie_gg: 8,
    rol_gg: 0,
    maternita_gg: 0,
    cassa_integrazione_gg: 0,
  },
};

describe('cedolinoSchema', () => {
  it('accepts a complete cedolino', () => {
    const result = cedolinoSchema.safeParse(validCedolino);
    expect(result.success).toBe(true);
  });

  it('accepts a cedolino missing the optional dati_testuali fields', () => {
    const { dati_testuali, ...rest } = validCedolino;
    const result = cedolinoSchema.safeParse({ ...rest, dati_testuali: {} });
    expect(result.success).toBe(true);
  });

  it('rejects a cedolino missing dati_numerici.irpef (the field that today silently produces NaN)', () => {
    const { irpef, ...datiNumericiSenzaIrpef } = validCedolino.dati_numerici;
    const result = cedolinoSchema.safeParse({
      ...validCedolino,
      dati_numerici: datiNumericiSenzaIrpef,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a cedolino missing any other required numeric field', () => {
    const requiredNumericFields = [
      'lordo', 'netto', 'paga_base', 'irpef', 'addizionale_regionale', 'addizionale_comunale',
      'contributi_inps_dipendente', 'contributi_inail', 'ore_ordinarie', 'ore_straordinarie',
      'ore_notturne', 'ore_festive', 'maggiorazione_notturna', 'maggiorazione_festiva', 'giorni_lavorati',
    ] as const;

    for (const field of requiredNumericFields) {
      const datiNumerici = { ...validCedolino.dati_numerici };
      delete (datiNumerici as Record<string, number>)[field];
      const result = cedolinoSchema.safeParse({ ...validCedolino, dati_numerici: datiNumerici });
      expect(result.success, `expected rejection when ${field} is missing`).toBe(false);
    }
  });

  it('rejects a cedolino missing any required assenze field', () => {
    const requiredAbsenceFields = ['malattia_gg', 'ferie_gg', 'rol_gg', 'maternita_gg', 'cassa_integrazione_gg'] as const;

    for (const field of requiredAbsenceFields) {
      const assenze = { ...validCedolino.assenze };
      delete (assenze as Record<string, number>)[field];
      const result = cedolinoSchema.safeParse({ ...validCedolino, assenze });
      expect(result.success, `expected rejection when ${field} is missing`).toBe(false);
    }
  });

  it('rejects negative absence values', () => {
    const result = cedolinoSchema.safeParse({
      ...validCedolino,
      assenze: { ...validCedolino.assenze, ferie_gg: -1 },
    });
    expect(result.success).toBe(false);
  });

  it('accepts extra fields beyond the required ones', () => {
    const result = cedolinoSchema.safeParse({
      ...validCedolino,
      dati_testuali: { ...validCedolino.dati_testuali, note: 'testo extra' },
      dati_numerici: { ...validCedolino.dati_numerici, tredicesima: 150 },
      assenze: { ...validCedolino.assenze, permessi_gg: 2 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an extra numeric field that is not actually a number', () => {
    const result = cedolinoSchema.safeParse({
      ...validCedolino,
      dati_numerici: { ...validCedolino.dati_numerici, tredicesima: 'non-numerico' },
    });
    expect(result.success).toBe(false);
  });
});
