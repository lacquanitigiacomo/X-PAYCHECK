# Architettura X-PAY CHECK

## Componenti

Il workspace contiene due client e un solo backend. Web e mobile gestiscono presentazione e navigazione; l'API è il confine autorevole per autenticazione, profilo, upload, licenza e backup; `audit-core` contiene esclusivamente regole deterministiche e testabili.

```text
apps/web ─────┐
              ├── services/api ── packages/audit-core
apps/mobile ──┘         │
                        └── packages/shared
```

## Flusso dati

1. Il client raccoglie profilo e dati del cedolino.
2. `packages/shared` valida i payload ai confini.
3. L'API autentica la richiesta e inoltra dati normalizzati al motore audit.
4. `audit-core` restituisce regole PASS, WARNING o CRITICO senza dipendenze UI.
5. Il client rende il report ricevuto.

## Stack

- Web: React 19, Vite 6, TypeScript.
- Mobile: Expo SDK 57, React Native 0.86, React Navigation 7.
- API: Node 24, Express 4, TypeScript, Zod.
- Dati locali opzionali: PostgreSQL 16, Redis 7, MinIO.

## Vincoli

- Nessun segreto predefinito è accettato in produzione.
- Le funzioni incomplete sono osservabili e non producono risultati fittizi.
- Le regole di audit non vengono duplicate nei client.
- `node_modules`, `dist`, coverage e configurazioni locali non appartengono alla storia Git.
