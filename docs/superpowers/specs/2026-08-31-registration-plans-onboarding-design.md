# Registrazione, piani e onboarding adattivo

## Obiettivo

Rendere la registrazione lineare e coerente con i piani Free e Pro, eliminando la compilazione ridondante dei dati disponibili tramite Google e configurando subito il profilo lavorativo necessario alle funzioni di X-PAYCHECK.

## Piattaforme

L'app mobile Expo è il prodotto principale e riceve il flusso completo, inclusi onboarding, Badge e gestione cedolini. Il frontend web mantiene allineati registrazione, scelta piano, checkout simulato, onboarding e limitazioni essenziali, ma non guida le decisioni di UX mobile. Mobile e web consumano gli stessi contratti e la stessa API.

## Flusso principale

1. L'utente sceglie il piano Free oppure Pro.
2. Si registra con email e password oppure con Google.
3. Google precompila nome, email e immagine profilo; questi dati restano modificabili.
4. Se sceglie Pro, seleziona una formula e completa un checkout simulato.
5. Tutti gli utenti completano l'onboarding lavorativo.
6. Al termine entrano nella dashboard configurata secondo il piano attivo.

Un utente autenticato con onboarding incompleto viene sempre riportato al primo passaggio non completato. Login e registrazione non devono più inviarlo direttamente a una dashboard incoerente.

Sul mobile Google Sign-In usa l'integrazione nativa e richiede una development build Expo configurata; Expo Go non è considerato un ambiente di collaudo valido per questo accesso. Il web continua a usare Google Identity Services.

## Piani

### Free

- Configurazione immediata di CCNL e settimana lavorativa standard.
- Caricamento e analisi di un solo cedolino alla volta.
- Prima di un nuovo caricamento viene chiesta conferma; il nuovo cedolino sostituisce il precedente.
- Nessuno storico multi-mese e nessuna modalità Badge.

### Pro

- Le stesse informazioni lavorative obbligatorie del piano Free.
- Formule simulate: 2,99 euro mensili, 24,99 euro annuali oppure 49,99 euro una tantum.
- Archivio multi-cedolino e confronti tra periodi, senza limite applicativo iniziale.
- Modalità Badge manuale.

Il checkout è simulato nel prototipo, ma produce uno stato di sottoscrizione strutturato e sostituibile in futuro con un provider reale. Nessun dato di carta fittizio viene conservato.

## Onboarding lavorativo

L'onboarding è un unico wizard adattivo e comprende:

1. conferma dei dati personali recuperati dalla registrazione;
2. scelta del CCNL;
3. indicazione delle ore settimanali standard;
4. selezione dei giorni lavorativi su uno schema lunedì-domenica;
5. indicazione degli orari standard per ciascun giorno selezionato;
6. per il Pro, proposta di attivazione della modalità Badge.

Il calendario settimanale rappresenta una settimana tipo, non date reali. Deve consentire giorni con orari differenti. I dati vengono salvati progressivamente, così un'interruzione non obbliga a ricominciare.

## Modalità Badge Pro

Il Badge funziona senza GPS:

- `Inizia turno` registra data e ora di ingresso;
- `Termina turno` chiude il turno attivo;
- può esistere un solo turno aperto per utente;
- l'utente può correggere ingresso e uscita;
- ogni correzione conserva l'orario originario e quello modificato;
- un turno dimenticato resta visibile come aperto e richiede una scelta esplicita, senza chiusure automatiche inventate.

La dashboard Pro mostra lo stato corrente del Badge e un accesso rapido alla timbratura.

## Dati e autorizzazioni

Il profilo utente distingue almeno:

- piano scelto: `free` o `pro`;
- formula Pro: `monthly`, `yearly` o `lifetime`;
- stato del checkout simulato;
- stato di completamento dell'onboarding;
- dati Google facoltativi;
- configurazione lavorativa settimanale.

Le API verificano i permessi Pro per Badge, storico e confronto multi-cedolino. Il frontend può adattare la navigazione, ma non costituisce il controllo di sicurezza.

## Cedolini

Il caricamento usa una regola deterministica:

- Free: al massimo un cedolino persistito; la sostituzione richiede conferma e avviene solo dopo che il nuovo file è stato validato correttamente;
- Pro: ogni cedolino valido viene aggiunto allo storico e può partecipare ai confronti.

Se il nuovo file Free non supera la validazione, il cedolino precedente resta intatto.

## Errori e ripristino

- Fallimento Google: resta disponibile la registrazione manuale senza perdere il piano selezionato.
- Checkout simulato annullato: l'utente può riprovare oppure tornare alla scelta piano.
- Salvataggio onboarding fallito: i dati locali della schermata restano disponibili e viene mostrato un errore recuperabile.
- Badge già aperto: una seconda apertura viene rifiutata mostrando il turno esistente.
- Funzione Pro richiesta da un Free: risposta API `403` e proposta di upgrade nell'interfaccia.

## Verifica

I test devono coprire:

- registrazione manuale e Google con precompilazione;
- instradamento Free e Pro;
- tre formule del checkout simulato;
- ripresa dell'onboarding incompleto;
- validazione della settimana lavorativa;
- permessi API Free/Pro;
- sostituzione sicura del cedolino Free;
- storico multi-cedolino Pro;
- apertura, chiusura, correzione e conflitti del Badge.

## Fuori ambito

- pagamenti reali e gestione fiscale degli acquisti;
- geolocalizzazione del Badge;
- sincronizzazione con sistemi di rilevazione presenze aziendali;
- chiusura automatica dei turni;
- limiti quantitativi definitivi per lo storico Pro.
