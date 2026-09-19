import { randomUUID } from 'node:crypto';
import type { AuditOutput, CedolinoRaw, RuleResult, Severity } from './types.js';

const EPSILON = 0.01;

/**
 * Giorni retribuiti per un mensilizzato: la busta paga li normalizza a 30 a
 * prescindere dalla lunghezza reale del mese, quindi R005 confronta con questo
 * e non con i giorni di calendario di `mese_riferimento`.
 */
const GIORNI_RETRIBUITI_MENSILIZZATI = 30;

/** Aliquota contributiva INPS a carico del dipendente, e tolleranza ammessa. */
const ALIQUOTA_INPS_DIPENDENTE = 0.0919;
const TOLLERANZA_ALIQUOTA_INPS = 0.02;

/** Maggiorazioni minime sulla paga oraria media. */
const MAGGIORAZIONE_NOTTURNA = 0.25;
const MAGGIORAZIONE_FESTIVA = 0.3;

/**
 * Stima grossolana: assume 2 ore in fascia notturna per turno. Serve solo come
 * indicatore nel report, non alimenta nessuna regola PASS/WARNING/CRITICO.
 */
const ORE_NOTTURNE_PER_TURNO = 2;

/** Scostamento ammesso fra ore da badge e ore da cedolino prima di segnalare. */
const TOLLERANZA_ORE_BADGE = 0.5;

const roundCurrency = (value: number): number => Math.round(value * 100) / 100;

/**
 * `dati_numerici` e' un `Record<string, number>`: un campo assente si legge
 * comunque come `number` a livello di tipi, quindi va verificato a runtime.
 */
function readOptionalNumber(source: Record<string, number>, key: string): number | null {
  const value = source[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

export function runAudit(cedolino: CedolinoRaw): AuditOutput {
  const values = cedolino.dati_numerici;
  const absences = cedolino.assenze;
  const taxTotal = values.irpef + values.addizionale_regionale + values.addizionale_comunale;
  const calculatedNet = roundCurrency(values.lordo - taxTotal - values.contributi_inps_dipendente - values.contributi_inail);
  const netDelta = roundCurrency(values.netto - calculatedNet);
  const hourlyRate = values.ore_ordinarie > 0 ? values.paga_base / values.ore_ordinarie : 0;
  const expectedNight = roundCurrency(values.ore_notturne * hourlyRate * MAGGIORAZIONE_NOTTURNA);
  const expectedHoliday = roundCurrency(values.ore_festive * hourlyRate * MAGGIORAZIONE_FESTIVA);
  const countedDays = values.giorni_lavorati + absences.malattia_gg + absences.ferie_gg + absences.rol_gg + absences.maternita_gg + absences.cassa_integrazione_gg;
  const netSeverity: Severity = Math.abs(netDelta) <= EPSILON ? 'PASS' : 'CRITICO';
  const contributionPass =
    values.lordo > 0 &&
    Math.abs(values.contributi_inps_dipendente / values.lordo - ALIQUOTA_INPS_DIPENDENTE) <= TOLLERANZA_ALIQUOTA_INPS;
  const nightPass = values.ore_notturne === 0 || values.maggiorazione_notturna + EPSILON >= expectedNight;
  const holidayPass = values.ore_festive === 0 || values.maggiorazione_festiva + EPSILON >= expectedHoliday;

  // Il badge e' l'unica fonte indipendente dal cedolino: senza, il confronto
  // non esiste. Meglio nessuna regola che una regola che si autoconferma.
  const badgeHours = readOptionalNumber(values, 'ore_badge');
  const payslipHours = values.ore_ordinarie + values.ore_straordinarie;
  const badgeComparison =
    badgeHours === null
      ? null
      : { badge: badgeHours, cedolino: payslipHours, delta: roundCurrency(badgeHours - payslipHours) };
  const daysPass = countedDays === GIORNI_RETRIBUITI_MENSILIZZATI;

  const rules: RuleResult[] = [
    {
      regola_id: 'R001', nome: 'Coerenza Lordo-Netto', stato: netSeverity,
      valore_atteso: calculatedNet, valore_rilevato: values.netto, delta: netDelta, severita: netSeverity,
      messaggio: netSeverity === 'PASS' ? 'Il netto calcolato coincide con il netto riportato.' : 'Il netto riportato non coincide con il calcolo base di imposte e contributi.',
    },
    {
      regola_id: 'R003', nome: 'Contributi INPS %', stato: contributionPass ? 'PASS' : 'WARNING',
      valore_atteso: roundCurrency(values.lordo * ALIQUOTA_INPS_DIPENDENTE), valore_rilevato: values.contributi_inps_dipendente,
      delta: roundCurrency(values.contributi_inps_dipendente - values.lordo * ALIQUOTA_INPS_DIPENDENTE),
      severita: contributionPass ? 'PASS' : 'WARNING',
      messaggio: 'Verifica indicativa sull’aliquota contributiva INPS dipendente (~9,19%).',
    },
    {
      regola_id: 'R005', nome: 'Congruenza Giorni', stato: daysPass ? 'PASS' : 'CRITICO',
      valore_atteso: GIORNI_RETRIBUITI_MENSILIZZATI, valore_rilevato: countedDays,
      delta: countedDays - GIORNI_RETRIBUITI_MENSILIZZATI, severita: daysPass ? 'PASS' : 'CRITICO',
      messaggio: daysPass ? 'Totale giorni coerente.' : 'Somma giorni lavorati e assenze non coerente con i 30 giorni retribuiti del mese.',
    },
    {
      regola_id: 'R103', nome: 'Maggiorazione Notturna', stato: nightPass ? 'PASS' : 'WARNING',
      valore_atteso: expectedNight, valore_rilevato: values.maggiorazione_notturna,
      delta: roundCurrency(values.maggiorazione_notturna - expectedNight), severita: nightPass ? 'PASS' : 'WARNING',
      messaggio: 'Controllo della maggiorazione notturna rispetto al 25% della paga oraria media.',
      riferimento_ccnl: 'Art. 42 — Lavoro notturno',
    },
    {
      regola_id: 'R104', nome: 'Maggiorazione Festiva', stato: holidayPass ? 'PASS' : 'WARNING',
      valore_atteso: expectedHoliday, valore_rilevato: values.maggiorazione_festiva,
      delta: roundCurrency(values.maggiorazione_festiva - expectedHoliday), severita: holidayPass ? 'PASS' : 'WARNING',
      messaggio: 'Controllo della maggiorazione festiva rispetto al 30% della paga oraria media.',
      riferimento_ccnl: 'Art. 43 — Lavoro festivo',
    },
  ];

  if (badgeComparison !== null) {
    const badgePass = Math.abs(badgeComparison.delta) <= TOLLERANZA_ORE_BADGE;
    rules.push({
      regola_id: 'R002', nome: 'Ore badge vs cedolino', stato: badgePass ? 'PASS' : 'CRITICO',
      valore_atteso: badgeComparison.badge, valore_rilevato: badgeComparison.cedolino,
      delta: badgeComparison.delta, severita: badgePass ? 'PASS' : 'CRITICO',
      messaggio: badgePass
        ? 'Le ore timbrate coincidono con quelle retribuite.'
        : 'Le ore timbrate non coincidono con quelle retribuite in cedolino.',
    });
  }

  const count = (severity: Severity): number => rules.filter((rule) => rule.severita === severity).length;
  const critici = count('CRITICO');
  const warning = count('WARNING');
  const info = count('INFO');
  const pass = count('PASS');
  const maximumSeverity: Severity = critici > 0 ? 'CRITICO' : warning > 0 ? 'WARNING' : info > 0 ? 'INFO' : 'PASS';

  return {
    audit_id: randomUUID(), timestamp: new Date().toISOString(),
    ccnl: cedolino.dati_testuali.ccnl_applicato ?? 'NON_RILEVATO',
    livello: cedolino.dati_testuali.livello ?? 'N/A', severita_massima: maximumSeverity,
    riepilogo: { totale_controlli: rules.length, critici, warning, info, pass }, dettaglio: rules,
    dati_investigativi: {
      notti_totali_mese: Math.max(0, Math.round(values.ore_notturne / ORE_NOTTURNE_PER_TURNO)),
      domeniche_lavorate: null,
      festivita_lavorate_non_maggiorate: values.ore_festive > 0 && expectedHoliday > values.maggiorazione_festiva ? [`${cedolino.mese_riferimento}-25`] : [],
      ore_badge_vs_cedolino: badgeComparison,
    },
  };
}
