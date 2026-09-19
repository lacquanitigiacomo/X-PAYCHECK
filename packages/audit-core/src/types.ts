export type Severity = 'CRITICO' | 'WARNING' | 'INFO' | 'PASS';

export interface CedolinoRaw {
  mese_riferimento: string;
  tipo_documento: string;
  dati_testuali: Record<string, string | undefined>;
  /**
   * Oltre ai campi obbligatori validati da `cedolinoSchema`, puo' contenere
   * `ore_badge`: il totale ore rilevato dal badge aziendale. E' l'unica fonte
   * indipendente dal cedolino, quindi la regola R002 gira solo quando c'e'.
   */
  dati_numerici: Record<string, number>;
  assenze: Record<string, number>;
}

export interface RuleResult {
  regola_id: string;
  nome: string;
  stato: Severity;
  valore_atteso: number | string | null;
  valore_rilevato: number | string | null;
  delta: number;
  severita: Severity;
  messaggio: string;
  riferimento_ccnl?: string;
}

export interface AuditOutput {
  audit_id: string;
  timestamp: string;
  ccnl: string;
  livello: string;
  severita_massima: Severity;
  riepilogo: { totale_controlli: number; critici: number; warning: number; info: number; pass: number };
  dettaglio: RuleResult[];
  /**
   * `null` significa "non calcolabile con i dati ricevuti", mai "zero".
   * Il client deve distinguere le due cose invece di mostrare un valore finto.
   */
  dati_investigativi: {
    notti_totali_mese: number;
    /** Richiede il dettaglio giorno per giorno, che il cedolino non riporta. */
    domeniche_lavorate: number | null;
    festivita_lavorate_non_maggiorate: string[];
    /** Presente solo se `dati_numerici.ore_badge` e' stato fornito. */
    ore_badge_vs_cedolino: { badge: number; cedolino: number; delta: number } | null;
  };
}
