# X-PAY CHECK

Workspace unico per il controllo dei cedolini: web, app mobile, API e motore di audit deterministico.

## Requisiti

- Node.js 24 (`.nvmrc`)
- npm 11+
- Docker, solo per PostgreSQL, Redis, MinIO e servizi locali opzionali

## Avvio

```bash
npm ci
cp services/api/.env.example services/api/.env
set -a
. services/api/.env
set +a
npm run dev -w @x-paycheck/api
```

In terminali separati, il web parte con `npm run dev:web` e il mobile con `npm run dev:mobile`. La configurazione Expo è allineata a SDK 57, React Native 0.86 e React 19.2. Il prototipo conserva account, onboarding, Badge e cedolini nella memoria del processo API: ogni riavvio dell'API azzera questi dati.

## Configurazione locale

Gli esempi non contengono credenziali valide. Copiare le variabili nel file `.env` del workspace che le utilizza:

- `services/api/.env`: `GOOGLE_CLIENT_ID`, `JWT_SECRET` e `JWT_EXPIRES_IN`;
- `apps/web/.env`: `VITE_GOOGLE_CLIENT_ID`;
- `apps/mobile/.env`: `EXPO_PUBLIC_API_URL` e `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

Vite ed Expo caricano automaticamente i rispettivi file `.env`. L'API non carica automaticamente `services/api/.env`: prima di avviarla in una shell POSIX o zsh bisogna esportarne le variabili con `set -a`, `. services/api/.env`, `set +a`, come nell'esempio di avvio. Un semplice `npm run dev:api` senza variabili già esportate non legge quel file.

`GOOGLE_CLIENT_ID`, `VITE_GOOGLE_CLIENT_ID` ed `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` devono identificare il client OAuth Web autorizzato a emettere gli ID token verificati dall'API. Per Google Sign-In nativo aggiungere inoltre i file non versionati `apps/mobile/google-services.json` e `apps/mobile/GoogleService-Info.plist`, coerenti con i package identifier presenti in `apps/mobile/app.json`, quindi creare una development build: Expo Go non supporta questa integrazione nativa.

`EXPO_PUBLIC_API_URL` deve includere il prefisso `/api/v1`. `http://localhost:3001/api/v1` funziona nel simulatore web; su un dispositivo fisico usare l'indirizzo LAN del computer, per esempio `http://192.168.1.20:3001/api/v1`. Su Android Emulator usare `http://10.0.2.2:3001/api/v1`.

## Limiti del prototipo

- Il checkout Pro è simulato, non raccoglie dati di carta e offre 2,99 EUR/mese, 24,99 EUR/anno oppure 49,99 EUR una tantum.
- Il Badge è manuale, riservato al piano Pro e non usa GPS o permessi di posizione.
- Free conserva un solo cedolino valido. Un nuovo cedolino sostituisce definitivamente il precedente soltanto dopo conferma esplicita e dopo avere superato la validazione.
- Pro conserva più cedolini e abilita Badge e storico; nel prototipo non è applicato un limite quantitativo allo storico.
- Lo stato è locale e volatile: il riavvio del processo API elimina account, configurazione lavorativa, turni e cedolini.

## Verifica

```bash
npm run typecheck
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

Il web usa `http://localhost:5173`; l'API usa `http://localhost:3001`. Lo stack locale opzionale parte dalla cartella `infrastructure` con `docker compose up -d`.

## Struttura

- `apps/web`: applicazione React/Vite responsive.
- `apps/mobile`: applicazione Expo con navigazione nativa.
- `services/api`: API Express e confini di autenticazione/upload.
- `packages/audit-core`: regole deterministiche per l'audit del cedolino.
- `packages/shared`: configurazione, schemi e contratti condivisi.
- `infrastructure`: Docker, database, proxy e monitoraggio.
- `tests`: test end-to-end, integrazione e carico trasversali.

## Stato funzionale

Web e mobile espongono scelta piano, registrazione, checkout simulato, onboarding lavorativo e regole di conservazione dei cedolini attraverso la stessa API. Il mobile include anche il Badge Pro. Google Sign-In funziona solo con credenziali OAuth reali e, sul mobile, con una development build configurata. Questa modalità è esclusivamente di sviluppo.

## Sicurezza

In produzione `JWT_SECRET` e una configurazione database esplicita sono obbligatori. I valori locali presenti negli esempi e in Docker Compose non sono adatti a deployment pubblici. File `.env`, dipendenze, build, coverage e dati locali non vengono versionati.
