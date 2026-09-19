import { describe, expect, it } from 'vitest';
import { runAudit } from './auditEngine';
import type { CedolinoRaw } from './types';

const validPayslip: CedolinoRaw = {
  mese_riferimento: '2026-08',
  tipo_documento: 'cedolino',
  dati_testuali: {
    ccnl_applicato: 'Commercio',
    livello: '5',
  },
  dati_numerici: {
    lordo: 2_000,
    netto: 1_586.2,
    irpef: 200,
    addizionale_regionale: 20,
    addizionale_comunale: 10,
    contributi_inps_dipendente: 183.8,
    contributi_inail: 0,
    paga_base: 1_600,
    ore_ordinarie: 160,
    ore_straordinarie: 0,
    ore_notturne: 0,
    ore_festive: 0,
    maggiorazione_notturna: 0,
    maggiorazione_festiva: 0,
    giorni_lavorati: 30,
  },
  assenze: {
    malattia_gg: 0,
    ferie_gg: 0,
    rol_gg: 0,
    maternita_gg: 0,
    cassa_integrazione_gg: 0,
  },
};

describe('runAudit', () => {
  it('marks a coherent payslip as passing', () => {
    const report = runAudit(validPayslip);

    expect(report.severita_massima).toBe('PASS');
    expect(report.riepilogo.critici).toBe(0);
    expect(report.riepilogo.warning).toBe(0);
  });

  it('reports an insufficient night premium', () => {
    const report = runAudit({
      ...validPayslip,
      dati_numerici: {
        ...validPayslip.dati_numerici,
        ore_notturne: 8,
        maggiorazione_notturna: 10,
      },
    });

    expect(report.dettaglio).toContainEqual(
      expect.objectContaining({ regola_id: 'R103', stato: 'WARNING' }),
    );
  });

  it('does not divide by zero when ordinary hours are absent', () => {
    const report = runAudit({
      ...validPayslip,
      dati_numerici: {
        ...validPayslip.dati_numerici,
        ore_ordinarie: 0,
        paga_base: 0,
      },
    });

    expect(report.dettaglio.every((rule) => Number.isFinite(rule.delta))).toBe(true);
  });

  it('omits the badge rule when badge hours are missing', () => {
    const report = runAudit(validPayslip);

    expect(report.dettaglio.some((rule) => rule.regola_id === 'R002')).toBe(false);
    expect(report.dati_investigativi.ore_badge_vs_cedolino).toBeNull();
  });

  it('flags badge hours that exceed the hours paid in the payslip', () => {
    const report = runAudit({
      ...validPayslip,
      dati_numerici: { ...validPayslip.dati_numerici, ore_badge: 172 },
    });

    expect(report.dati_investigativi.ore_badge_vs_cedolino).toEqual({
      badge: 172,
      cedolino: 160,
      delta: 12,
    });
    expect(report.dettaglio).toContainEqual(
      expect.objectContaining({ regola_id: 'R002', stato: 'CRITICO', delta: 12 }),
    );
    expect(report.severita_massima).toBe('CRITICO');
  });

  it('passes the badge rule when timed hours match the payslip', () => {
    const report = runAudit({
      ...validPayslip,
      dati_numerici: { ...validPayslip.dati_numerici, ore_badge: 160 },
    });

    expect(report.dettaglio).toContainEqual(
      expect.objectContaining({ regola_id: 'R002', stato: 'PASS' }),
    );
    expect(report.severita_massima).toBe('PASS');
  });

  it('reports worked Sundays as unavailable instead of zero', () => {
    const report = runAudit(validPayslip);

    expect(report.dati_investigativi.domeniche_lavorate).toBeNull();
  });

  it('checks days against the 30 paid days regardless of calendar length', () => {
    // Gennaio ha 31 giorni di calendario, ma i giorni retribuiti restano 30.
    const report = runAudit({ ...validPayslip, mese_riferimento: '2026-01' });

    expect(report.dettaglio).toContainEqual(
      expect.objectContaining({ regola_id: 'R005', stato: 'PASS', valore_atteso: 30 }),
    );
  });
});
