# X-PAY CHECK — UI/UX Guidelines

## Palette Colori

| Token | Hex | Uso |
|-------|-----|-----|
| `background` | `#0F1419` | Sfondo app |
| `surface` | `#1A1F24` | Card, input, elementi secondari |
| `surfaceElevated` | `#242B32` | Card elevate, menu |
| `surfaceHighlight` | `#2D3640` | Card selezionate, highlight |
| `primary` | `#2DD4A0` | CTA, accenti, badge Pro, indicatori |
| `primaryMuted` | `rgba(45,212,160,0.15)` | Sfondo badge, hover stati |
| `success` | `#22C55E` | Semaforo PASS, conferme |
| `warning` | `#F59E0B` | Semaforo WARNING, avvisi |
| `danger` | `#EF4444` | Semaforo CRITICO, errori |
| `info` | `#3B82F6` | Badge trial, link informativi |
| `text` | `#FFFFFF` | Testo primario |
| `textSecondary` | `#94A3B8` | Sottotitoli, descrizioni |
| `textTertiary` | `#64748B` | Placeholder, hint |
| `border` | `rgba(148,163,184,0.12)` | Bordi sottili, divisori |

## Tipografia

- **Display**: 32px / 800 weight — Solo logo e numeri grandi
- **H1**: 28px / 700 — Titoli schermata
- **H2**: 22px / 700 — Titoli sezione
- **H3**: 18px / 600 — Card header, nomi
- **H4**: 16px / 600 — Sottotitoli card
- **Body Large**: 16px / 400 — Testo principale
- **Body**: 14px / 400 — Descrizioni, contenuto
- **Body Small**: 12px / 400 — Metadati, hint
- **Caption**: 11px / 500 uppercase — Label, badge testo
- **Button**: 14px / 600 — Tutti i pulsanti
- **Mono**: 13px monospace — Importi, calcoli

## Spacing System

Usare multipli di 4px:
- `xs` = 4px
- `sm` = 8px
- `md` = 12px
- `lg` = 16px
- `xl` = 20px
- `2xl` = 24px
- `3xl` = 32px
- `4xl` = 40px

## Componenti Chiave

### XButton
- Primary: sfondo `#2DD4A0`, testo scuro, radius 10-14px
- Secondary: sfondo `#242B32`, testo bianco
- Outline: trasparente, bordo 1.5px `#border`
- Ghost: trasparente, testo `#2DD4A0`
- Size lg: padding 16px verticale, 20px orizzontale

### XCard
- Sfondo `#1A1F24`, radius 14px
- Elevated: shadow md (0,4,8,0.3)
- Highlight: bordo 1px `primaryMuted`, sfondo `#2D3640`
- Padding default: 16px

### Semaforo
- PASS: sfondo `rgba(34,197,94,0.15)`, icona ✓ verde
- WARNING: sfondo `rgba(245,158,11,0.15)`, icona ! arancione
- CRITICO: sfondo `rgba(239,68,68,0.15)`, icona ✕ rosso
- INFO: sfondo `rgba(59,130,246,0.15)`, icona i blu
- Compact: per riepiloghi dashboard
- Full: per report dettagliato

### XInput
- Sfondo `#1A1F24`, radius 14px
- Bordo 1.5px, colore `#border`, focus `primaryMuted`
- Icona a sinistra, placeholder `#64748B`
- Label sopra, 13px, `#94A3B8`

## Pattern UX

### 1. Dark Mode Unico
L'app è **sempre dark**. Non c'è toggle light mode. Il contrasto è garantito da:
- Testo bianco su sfondo `#0F1419`
- Gerarchia tramite opacità (100% → 60% → 40%)
- Accent `#2DD4A0` per azioni primarie

### 2. Privacy-First Messaging
Ogni schermata che coinvolge dati sensibili mostra un hint:
> "I tuoi dati restano sul tuo dispositivo."

Fonte: 12px, `#64748B`, centrato, padding 16px verticale.

### 3. Semafori come Lingua Visiva
Il colore è il primo indicatore di stato. Il testo spiega il perché.
Ordine visivo: Rosso → Arancione → Verde → Blu (info).

### 4. One-Action-Per-Screen
Ogni schermata ha **un solo obiettivo principale**:
- Landing: convincere a iniziare
- Carica: scegliere metodo input
- Report: leggere anomalie
- Impostazioni: navigare opzioni

### 5. Feedback Tattile
- TouchableOpacity con `activeOpacity={0.7}` su tutti gli elementi cliccabili
- Card con highlight border al tocco (se selezionabili)
- Button loading state con ActivityIndicator

### 6. Badge Tier
- FREE: grigio, sfondo `rgba(100,116,139,0.2)`
- PRO: verde `#2DD4A0`, sfondo `rgba(45,212,160,0.2)`
- TRIAL: blu `#3B82F6`, sfondo `rgba(59,130,246,0.2)`

## Iconografia

Usare emoji nativi per MVP (zero dipendenze), poi sostituire con icone SVG:
- Home: ⌂
- Calendar: 📅
- Archive: 📁
- Settings: ⚙
- Check: ✓
- Warning: !
- Error: ✕
- Info: i
- Arrow: ›
- Back: ←

## Responsive

L'app è mobile-only (no tablet).
- Larghezza massima contenuto: 100%
- Padding orizzontale: 20px
- Card: larghezza 100% - 40px padding
- Touch target minimo: 44x44px

## Accessibilità

- Testo minimo: 11px
- Contrasto WCAG AA: tutti i testi su sfondo scuro superano 4.5:1
- Focus states: bordo `primaryMuted` su input e card selezionabili
