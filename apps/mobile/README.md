# X-PAY CHECK — Mobile Kit

Applicazione mobile X-PAY CHECK, progettata per Expo e VS Code.

## Contenuto del pacchetto

```
x-pay-check-vscode-kit/
├── .vscode/
│   ├── settings.json          → Configurazione editor ottimizzata
│   ├── extensions.json        → Estensioni consigliate
│   └── snippets/
│       └── xpay.code-snippets → Snippet rapidi per componenti X-PAY
├── assets/
│   ├── reference/
│   │   └── mockup-full-reference.png  → Anteprima completa UI
│   ├── logo.svg               → Logo X-PAY CHECK
│   └── app-icon.svg           → Icona app placeholder
├── src/
│   ├── theme/
│   │   ├── colors.ts          → Palette dark mode
│   │   ├── typography.ts      → Scale tipografica
│   │   ├── spacing.ts         → Spacing, radius, shadows
│   │   └── index.ts           → Hook useTheme()
│   ├── components/
│   │   ├── XButton.tsx        → Pulsante primario/secondario/outline/ghost
│   │   ├── XCard.tsx          → Card con varianti elevated/highlight
│   │   ├── XInput.tsx         → Input con label, icona, error state
│   │   ├── Semaforo.tsx       → Indicatori PASS/WARNING/CRITICO/INFO
│   │   ├── StatusBadge.tsx    → Badge tier FREE/PRO/TRIAL
│   │   ├── Header.tsx         → Header navigazione con back
│   │   └── BottomNav.tsx      → Tab bar principale 4 voci
│   ├── screens/
│   │   ├── LandingScreen.tsx  → Schermata onboarding
│   │   ├── LoginScreen.tsx    → Login social + magic link
│   │   ├── DashboardScreen.tsx→ Dashboard con semafori e azioni rapide
│   │   ├── CaricaCedolinoScreen.tsx → Scelta metodo input
│   │   ├── ReportAnalisiScreen.tsx  → Report con anomalie
│   │   ├── ImpostazioniScreen.tsx   → Impostazioni e menu
│   │   └── LicenzaProScreen.tsx    → Piano e acquisto Pro
│   └── navigation/
│       └── AppNavigator.tsx   → Router semplice (mock)
├── docs/
│   └── ui-ux-guidelines.md    → Documentazione design system
├── App.tsx                    → Entry point
├── package.json               → Dipendenze Expo + React Native
└── tsconfig.json              → TypeScript strict
```

## Come usare in VS Code

1. **Installa le estensioni consigliate**
   Apri il progetto in VS Code → comparirà il popup "Recommended Extensions". Installa tutte.

2. **Usa gli snippet**
   - `xscreen` → Scaffolding schermata
   - `xcomp` → Scaffolding componente
   - `xsemaforo` → Semaforo rapido

3. **Riferimento visivo**
   Apri `assets/reference/mockup-full-reference.png` in una tab laterale (Ctrl+Alt+→) mentre codi.

4. **Tema coerente**
   Tutti i componenti usano `useTheme()` — modifica `src/theme/colors.ts` per cambiare la palette globalmente.

## Comandi utili

```bash
# Installa dipendenze
npm install

# Avvia in sviluppo
npx expo start

# Lint
npm run lint

# Type check
npm run typecheck
```

## Note sviluppo

- **Dark mode unico**: l'app è sempre dark. Non implementare toggle.
- **Privacy-first**: ogni schermata con dati sensibili deve mostrare l'hint "I tuoi dati restano sul tuo dispositivo."
- **One user, one device**: non implementare multi-profile.
- **Offline-first**: tutte le schermate principali devono funzionare senza rete dopo il primo setup.

## Roadmap implementazione

1. [ ] Setup progetto Expo + TypeScript
2. [ ] Implementare theme system
3. [ ] Implementare componenti base
4. [ ] Implementare schermate (Landing → Login → Dashboard)
5. [ ] Aggiungere navigazione reale (@react-navigation)
6. [ ] Integrare OCR on-device (tesseract.js / ML Kit)
7. [ ] Implementare Rule Engine
8. [ ] Integrare LLM locale (llama.rn)
9. [ ] Implementare Badge/Calendario
10. [ ] Integrare IAP (RevenueCat)
11. [ ] Collegare backend self-hosted
12. [ ] Test su device fisico
13. [ ] Deploy su App Store / Play Store
