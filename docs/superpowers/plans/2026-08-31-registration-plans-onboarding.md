# Registration, Plans, and Adaptive Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a mobile-first registration and onboarding flow with Free/Pro entitlements, simulated checkout, a Pro time badge, and plan-aware payslip retention, while keeping the web flow aligned.

**Architecture:** Put plan, onboarding, badge, and payslip rules in shared Zod contracts and an API-owned prototype store. Expo is the primary client; the web client consumes the same API for essential registration and onboarding behavior. Authorization is enforced by API middleware and store state rather than presentation-only checks.

**Tech Stack:** TypeScript, Zod, Express, JWT, Jest/Supertest, Expo SDK 57, React Native 0.86, React Navigation 7, React 19, Vite, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-31-registration-plans-onboarding-design.md`

## Global Constraints

- Expo mobile is the primary product; web remains aligned for essential flows.
- Plans are `free` and `pro`; Pro billing options are `monthly`, `yearly`, and `lifetime`.
- Prototype prices are 2.99 EUR monthly, 24.99 EUR yearly, and 49.99 EUR lifetime.
- Checkout is simulated and must not collect or persist card data.
- Every user must complete CCNL and a Monday-Sunday standard work week before dashboard access.
- Badge is Pro-only, manual, and never uses GPS.
- Free retains one valid payslip; a later valid upload replaces it only after explicit confirmation.
- Pro retains multiple valid payslips without an application limit in this prototype.
- API authorization is authoritative; hiding UI controls is insufficient.
- Use Node 24 and the existing npm workspaces.

---

### Task 1: Shared account, onboarding, badge, and payslip contracts

**Files:**
- Modify: `packages/shared/src/contracts.ts`
- Modify: `packages/shared/src/index.ts`
- Create: `packages/shared/src/accountContracts.test.ts`

**Interfaces:**
- Produces: `PlanTier`, `ProBillingCycle`, `WeeklySchedule`, `AccountProfile`, `CheckoutInput`, `WorkProfileInput`, `BadgeCorrectionInput`, and `PayslipUploadInput`.
- Consumes: existing `registerSchema` and `payslipUploadSchema`.

- [ ] **Step 1: Write failing schema tests**

```ts
import { checkoutSchema, workProfileSchema } from './contracts';

it('accepts a complete seven-day work profile', () => {
  expect(workProfileSchema.parse({
    ccnl: 'CCNL-COMMERCIO', weeklyHours: 40,
    schedule: [
      { day: 1, enabled: true, start: '09:00', end: '18:00' },
      { day: 2, enabled: true, start: '09:00', end: '18:00' },
      { day: 3, enabled: true, start: '09:00', end: '18:00' },
      { day: 4, enabled: true, start: '09:00', end: '18:00' },
      { day: 5, enabled: true, start: '09:00', end: '18:00' },
      { day: 6, enabled: false, start: null, end: null },
      { day: 7, enabled: false, start: null, end: null },
    ], badgeEnabled: false,
  }).weeklyHours).toBe(40);
});

it('rejects checkout for the free plan', () => {
  expect(() => checkoutSchema.parse({ tier: 'free', billingCycle: 'monthly' })).toThrow();
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test --workspace @x-paycheck/shared -- --run src/accountContracts.test.ts`

Expected: FAIL because `checkoutSchema` and `workProfileSchema` are not exported.

- [ ] **Step 3: Add exact shared schemas and inferred types**

```ts
export const planTierSchema = z.enum(['free', 'pro']);
export const proBillingCycleSchema = z.enum(['monthly', 'yearly', 'lifetime']);
export const workDaySchema = z.object({
  day: z.number().int().min(1).max(7),
  enabled: z.boolean(),
  start: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
  end: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).nullable(),
}).superRefine((value, context) => {
  if (value.enabled && (!value.start || !value.end)) {
    context.addIssue({ code: 'custom', message: 'Gli orari sono obbligatori per i giorni attivi' });
  }
});
export const workProfileSchema = z.object({
  ccnl: z.string().min(1), weeklyHours: z.number().positive().max(80),
  schedule: z.array(workDaySchema).length(7).refine(days => new Set(days.map(day => day.day)).size === 7),
  badgeEnabled: z.boolean(),
});
export const checkoutSchema = z.object({
  tier: z.literal('pro'), billingCycle: proBillingCycleSchema,
});
export const badgeCorrectionSchema = z.object({
  startedAt: z.iso.datetime(), endedAt: z.iso.datetime().nullable(), reason: z.string().trim().min(3),
});
export type PlanTier = z.infer<typeof planTierSchema>;
export type ProBillingCycle = z.infer<typeof proBillingCycleSchema>;
export type WeeklySchedule = z.infer<typeof workDaySchema>[];
export type WorkProfileInput = z.infer<typeof workProfileSchema>;
```

Extend `registerSchema` with `tier: planTierSchema`. Extend `payslipUploadSchema` with `confirmReplace: z.boolean().default(false)`.

- [ ] **Step 4: Run shared tests and typecheck**

Run: `npm test --workspace @x-paycheck/shared && npm run typecheck --workspace @x-paycheck/shared`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/shared
git commit -m "feat(x-paycheck): define account and onboarding contracts"
```

---

### Task 2: API-owned prototype account state and plan-aware authentication

**Files:**
- Create: `services/api/src/store/prototypeStore.ts`
- Modify: `services/api/src/routes/auth.ts`
- Modify: `services/api/src/middleware/authenticate.ts`
- Modify: `services/api/src/app.test.ts`

**Interfaces:**
- Consumes: `PlanTier`, `ProBillingCycle`, `WorkProfileInput` from `@x-paycheck/shared`.
- Produces: `prototypeStore.createUser`, `findUserByEmail`, `getUser`, `activatePro`, `saveWorkProfile`, and `reset`; JWT claims remain identity-only and current entitlement is loaded from the store.

- [ ] **Step 1: Add failing API tests for plan persistence**

```ts
it('registers a free user with incomplete onboarding', async () => {
  const response = await request(app).post('/api/v1/auth/register').send({
    name: 'Ada Rossi', email: 'ada@example.it', password: 'password123', tier: 'free',
  });
  expect(response.status).toBe(201);
  expect(response.body.user).toMatchObject({ tier: 'free', onboardingComplete: false });
});

it('does not grant pro before checkout', async () => {
  const response = await request(app).post('/api/v1/auth/register').send({
    name: 'Piero Pro', email: 'pro@example.it', password: 'password123', tier: 'pro',
  });
  expect(response.body.user).toMatchObject({ tier: 'free', pendingTier: 'pro' });
});
```

Call `prototypeStore.reset()` in `beforeEach` so tests are isolated.

- [ ] **Step 2: Run API tests and verify RED**

Run: `npm test --workspace @x-paycheck/api -- --runInBand`

Expected: FAIL because registration does not persist tier state.

- [ ] **Step 3: Create the typed in-memory store**

```ts
export type PrototypeUser = {
  id: string; email: string; passwordHash: string; name: string; picture?: string;
  tier: 'free' | 'pro'; pendingTier: 'pro' | null; billingCycle: 'monthly' | 'yearly' | 'lifetime' | null;
  checkoutStatus: 'not_required' | 'pending' | 'complete'; onboardingComplete: boolean;
  workProfile: WorkProfileInput | null;
};

const users = new Map<string, PrototypeUser>();
export const prototypeStore = {
  createUser(user: PrototypeUser) { users.set(user.id, user); return user; },
  findUserByEmail(email: string) { return [...users.values()].find(user => user.email === email); },
  getUser(id: string) { return users.get(id); },
  reset() { users.clear(); },
};
```

Add focused mutation methods rather than exposing the `Map` to routes.

- [ ] **Step 4: Route registration, login, and Google creation through the store**

Requested Free creates `tier: 'free'`, `pendingTier: null`, `checkoutStatus: 'not_required'`. Requested Pro creates `tier: 'free'`, `pendingTier: 'pro'`, `checkoutStatus: 'pending'`. Return the same public account shape from manual and Google authentication.

Change `authenticate` to verify the JWT, load the store user by `userId`, and attach the current tier. Reject tokens whose user no longer exists. This prevents stale JWT entitlement from granting Pro.

- [ ] **Step 5: Run tests and commit**

Run: `npm test --workspace @x-paycheck/api -- --runInBand`

Expected: PASS.

```bash
git add services/api/src/store services/api/src/routes/auth.ts services/api/src/middleware/authenticate.ts services/api/src/app.test.ts
git commit -m "feat(x-paycheck): persist prototype account plans"
```

---

### Task 3: Simulated Pro checkout and resumable onboarding API

**Files:**
- Create: `services/api/src/routes/account.ts`
- Modify: `services/api/src/app.ts`
- Modify: `services/api/src/store/prototypeStore.ts`
- Create: `services/api/src/routes/account.test.ts`

**Interfaces:**
- Produces: `POST /api/v1/account/checkout`, `GET /api/v1/account/state`, `PUT /api/v1/account/work-profile`.
- Checkout response: `{ tier: 'pro', billingCycle, checkoutStatus: 'complete', amountCents }`.
- Account state response includes `nextStep: 'checkout' | 'onboarding' | 'dashboard'`.

- [ ] **Step 1: Write failing route tests**

Test these cases with a registered token:

```ts
expect((await request(app).post('/api/v1/account/checkout').set(auth).send({ tier: 'pro', billingCycle: 'monthly' })).body.amountCents).toBe(299);
expect((await request(app).post('/api/v1/account/checkout').set(auth).send({ tier: 'pro', billingCycle: 'yearly' })).body.amountCents).toBe(2499);
expect((await request(app).post('/api/v1/account/checkout').set(auth).send({ tier: 'pro', billingCycle: 'lifetime' })).body.amountCents).toBe(4999);
```

Also assert that a work profile with fewer than seven days returns `400`, and a valid profile returns `nextStep: 'dashboard'`.

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test --workspace @x-paycheck/api -- --runInBand src/routes/account.test.ts`

Expected: FAIL with route `404`.

- [ ] **Step 3: Implement account routing**

Use a fixed price table:

```ts
const prices = { monthly: 299, yearly: 2499, lifetime: 4999 } as const;
```

`POST /checkout` accepts no card fields, marks the authenticated account Pro, and stores the billing cycle. `PUT /work-profile` validates `workProfileSchema`, forbids `badgeEnabled: true` for Free, saves progress, and marks onboarding complete. `GET /state` derives the next step from pending checkout and onboarding state.

- [ ] **Step 4: Run account and full API tests**

Run: `npm test --workspace @x-paycheck/api -- --runInBand`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add services/api/src/routes/account.ts services/api/src/routes/account.test.ts services/api/src/store/prototypeStore.ts services/api/src/app.ts
git commit -m "feat(x-paycheck): add simulated checkout and onboarding API"
```

---

### Task 4: Enforce Free replacement and Pro payslip history

**Files:**
- Create: `services/api/src/routes/payslips.ts`
- Create: `services/api/src/routes/payslips.test.ts`
- Modify: `services/api/src/routes/api.ts`
- Modify: `services/api/src/app.ts`
- Modify: `services/api/src/store/prototypeStore.ts`

**Interfaces:**
- Produces: `POST /api/v1/payslips`, `GET /api/v1/payslips`.
- Free conflict response: HTTP `409`, `{ error: 'FREE_REPLACE_CONFIRMATION_REQUIRED', existingPayslip }`.
- Upload success: `{ success: true, payslip, replaced: boolean }`.

- [ ] **Step 1: Write failing retention tests**

```ts
it('keeps the old Free payslip until valid replacement is confirmed', async () => {
  await uploadFree({ month: 1, confirmReplace: false });
  expect((await uploadFree({ month: 2, confirmReplace: false })).status).toBe(409);
  expect((await listFree()).body.items).toHaveLength(1);
  expect((await uploadFree({ month: 2, confirmReplace: true })).body.replaced).toBe(true);
  expect((await listFree()).body.items[0].month).toBe(2);
});

it('retains multiple Pro payslips', async () => {
  await uploadPro({ month: 1 }); await uploadPro({ month: 2 });
  expect((await listPro()).body.items).toHaveLength(2);
});
```

Add an invalid upload assertion proving the existing Free record remains unchanged.

- [ ] **Step 2: Run tests and verify RED**

Run: `npm test --workspace @x-paycheck/api -- --runInBand src/routes/payslips.test.ts`

Expected: FAIL with route `404`.

- [ ] **Step 3: Implement validation-before-replacement**

Parse the complete upload first. Create the new record in memory only after parsing succeeds. For Free, return `409` when a record exists and `confirmReplace` is false; when true, atomically replace the user's array with the new record. For Pro, append. Filter all list results by authenticated `userId`.

Remove the duplicate `/upload/payslip` handler from `routes/api.ts` after switching clients to the new endpoint.

- [ ] **Step 4: Run API tests and commit**

Run: `npm test --workspace @x-paycheck/api -- --runInBand`

Expected: PASS.

```bash
git add services/api/src/routes/payslips.ts services/api/src/routes/payslips.test.ts services/api/src/routes/api.ts services/api/src/app.ts services/api/src/store/prototypeStore.ts
git commit -m "feat(x-paycheck): enforce plan-aware payslip retention"
```

---

### Task 5: Pro manual Badge API with correction history

**Files:**
- Create: `services/api/src/routes/badge.ts`
- Create: `services/api/src/routes/badge.test.ts`
- Modify: `services/api/src/app.ts`
- Modify: `services/api/src/store/prototypeStore.ts`

**Interfaces:**
- Produces: `POST /api/v1/badge/start`, `POST /api/v1/badge/stop`, `PATCH /api/v1/badge/shifts/:id`, `GET /api/v1/badge/state`.
- A shift is `{ id, userId, startedAt, endedAt, corrections: Array<{ previousStartedAt, previousEndedAt, reason, correctedAt }> }`.

- [ ] **Step 1: Write failing Badge tests**

Cover: Free receives `403`; Pro can start; second start receives `409` with the open shift; stop closes it; stopping without an open shift receives `409`; correction retains previous values; no request or response contains latitude or longitude.

```ts
expect((await request(app).post('/api/v1/badge/start').set(proAuth)).body.shift.endedAt).toBeNull();
expect((await request(app).post('/api/v1/badge/start').set(proAuth)).status).toBe(409);
```

- [ ] **Step 2: Run focused test and verify RED**

Run: `npm test --workspace @x-paycheck/api -- --runInBand src/routes/badge.test.ts`

Expected: FAIL with route `404`.

- [ ] **Step 3: Implement Badge state transitions**

Mount the router behind `authenticate` and apply `requirePro` to every route. Use server time for start, stop, and correction audit timestamps. Validate corrections with `badgeCorrectionSchema`; require `endedAt > startedAt` when an end exists. Never auto-close an open shift.

- [ ] **Step 4: Run API tests and commit**

Run: `npm test --workspace @x-paycheck/api -- --runInBand`

Expected: PASS.

```bash
git add services/api/src/routes/badge.ts services/api/src/routes/badge.test.ts services/api/src/app.ts services/api/src/store/prototypeStore.ts
git commit -m "feat(x-paycheck): add pro manual time badge"
```

---

### Task 6: Mobile API client, secure session, and authenticated navigation

**Files:**
- Create: `apps/mobile/src/api/client.ts`
- Create: `apps/mobile/src/auth/session.ts`
- Create: `apps/mobile/src/auth/session.test.ts`
- Modify: `apps/mobile/src/navigation/routes.ts`
- Modify: `apps/mobile/src/navigation/routes.test.ts`
- Modify: `apps/mobile/src/navigation/AppNavigator.tsx`

**Interfaces:**
- Produces: `apiRequest<T>(path, options)`, `saveSession(token)`, `loadSession()`, `clearSession()`, and routes `Register`, `Checkout`, `Onboarding`, `Badge`.
- Consumes: `GET /account/state` to choose `Checkout`, `Onboarding`, or `Dashboard`.

- [ ] **Step 1: Write failing pure routing and session tests**

```ts
expect(resolvePostAuthDestination({ nextStep: 'checkout' })).toBe('Checkout');
expect(resolvePostAuthDestination({ nextStep: 'onboarding' })).toBe('Onboarding');
expect(resolvePostAuthDestination({ nextStep: 'dashboard' })).toBe('Dashboard');
```

Mock `expo-secure-store` and verify that demo or blank tokens are rejected.

- [ ] **Step 2: Run mobile tests and verify RED**

Run: `npm test --workspace @x-paycheck/mobile`

Expected: FAIL because session and post-auth routing helpers do not exist.

- [ ] **Step 3: Implement secure session and typed client**

Use `expo-secure-store` under key `xpay_access_token`. Read the API base URL from `EXPO_PUBLIC_API_URL`, defaulting to `http://localhost:3001/api/v1` for the web simulator. The client adds the Bearer token and throws an `ApiError` containing `status` and parsed response body.

- [ ] **Step 4: Add navigation routes and replace hard-coded demo login**

After authentication, save the token, fetch account state, and reset navigation to the derived route. Do not keep the module-level fake `user` as the source of entitlement.

- [ ] **Step 5: Run mobile tests/typecheck and commit**

Run: `npm test --workspace @x-paycheck/mobile && npm run typecheck --workspace @x-paycheck/mobile`

Expected: PASS.

```bash
git add apps/mobile/src/api apps/mobile/src/auth apps/mobile/src/navigation
git commit -m "feat(x-paycheck): connect mobile session and account routing"
```

---

### Task 7: Mobile registration, plan choice, checkout, and weekly onboarding

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/app.json`
- Create: `apps/mobile/src/auth/googleSignIn.ts`
- Create: `apps/mobile/src/screens/RegisterScreen.tsx`
- Create: `apps/mobile/src/screens/PlanChoiceScreen.tsx`
- Create: `apps/mobile/src/screens/CheckoutScreen.tsx`
- Create: `apps/mobile/src/screens/OnboardingScreen.tsx`
- Create: `apps/mobile/src/onboarding/schedule.ts`
- Create: `apps/mobile/src/onboarding/schedule.test.ts`
- Modify: `apps/mobile/src/screens/LoginScreen.tsx`
- Modify: `apps/mobile/src/navigation/AppNavigator.tsx`

**Interfaces:**
- Produces: `signInWithGoogle(): Promise<{ idToken: string; name: string; email: string; picture?: string }>`, `createEmptyWeek(): WeeklySchedule`, `updateWorkDay(schedule, day, patch)` and the complete mobile onboarding screens.
- Consumes: auth, checkout, and work-profile API routes from Tasks 2-3.

- [ ] **Step 1: Write failing week-editor tests**

```ts
it('creates Monday through Sunday exactly once', () => {
  expect(createEmptyWeek().map(item => item.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
});

it('clears times when a day is disabled', () => {
  const result = updateWorkDay(createEmptyWeek(), 1, { enabled: false });
  expect(result[0]).toMatchObject({ enabled: false, start: null, end: null });
});
```

- [ ] **Step 2: Run mobile tests and verify RED**

Run: `npm test --workspace @x-paycheck/mobile`

Expected: FAIL because schedule helpers do not exist.

- [ ] **Step 3: Install and configure native Google Sign-In**

Run: `npx expo install @react-native-google-signin/google-signin`

Add its Expo config plugin to `app.json` and configure the platform client identifiers from `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and the native Google service files. Call `GoogleSignin.configure({ webClientId })` before sign-in. The adapter must call `hasPlayServices`, then `signIn`, accept only `isSuccessResponse`, require a non-null `idToken`, and return the Google name, email, and photo with that token. Native Google authentication requires an Expo development build; Expo Go is not an acceptance environment for this flow.

- [ ] **Step 4: Implement the plan and authentication screens**

Plan choice precedes account creation and remains selected if Google or manual registration fails. Manual registration collects name, email, and password. Google calls `signInWithGoogle`, submits its `idToken` and selected tier to `/auth/social`, and immediately shows the returned name, email, and picture as editable profile data. If native Google credentials are not configured, show a clear configuration error and leave manual registration usable.

- [ ] **Step 5: Implement simulated checkout**

Render exactly three selectable offers: `2,99 €/mese`, `24,99 €/anno`, `49,99 € una tantum`. The confirmation button calls `/account/checkout`; no card-number, expiry, CVV, or billing-address inputs are rendered.

- [ ] **Step 6: Implement the progressive onboarding wizard**

Steps are personal confirmation, CCNL, weekly hours, Monday-Sunday schedule, and Pro Badge opt-in. Each active day exposes start/end time controls. Free never sees Badge activation. Submit the exact `workProfileSchema` shape and reset navigation to Dashboard only after success.

- [ ] **Step 7: Run mobile tests, lint, typecheck, and commit**

Run: `npm test --workspace @x-paycheck/mobile && npm run lint --workspace @x-paycheck/mobile && npm run typecheck --workspace @x-paycheck/mobile`

Expected: PASS.

```bash
git add apps/mobile/package.json apps/mobile/app.json apps/mobile/src/auth/googleSignIn.ts apps/mobile/src/screens apps/mobile/src/onboarding apps/mobile/src/navigation/AppNavigator.tsx
git commit -m "feat(x-paycheck): add mobile plan and onboarding flow"
```

---

### Task 8: Mobile Badge and plan-aware payslip experience

**Files:**
- Create: `apps/mobile/src/screens/BadgeScreen.tsx`
- Create: `apps/mobile/src/screens/PayslipHistoryScreen.tsx`
- Create: `apps/mobile/src/payslips/retention.ts`
- Create: `apps/mobile/src/payslips/retention.test.ts`
- Modify: `apps/mobile/src/screens/DashboardScreen.tsx`
- Modify: `apps/mobile/src/screens/CaricaCedolinoScreen.tsx`
- Modify: `apps/mobile/src/navigation/AppNavigator.tsx`
- Modify: `apps/mobile/src/navigation/routes.ts`

**Interfaces:**
- Produces: `requiresReplacementConfirmation(tier, items)`, Badge state UI, and plan-aware payslip navigation.
- Consumes: Badge and payslip endpoints from Tasks 4-5.

- [ ] **Step 1: Write failing retention presentation tests**

```ts
expect(requiresReplacementConfirmation('free', [{ id: 'old' }])).toBe(true);
expect(requiresReplacementConfirmation('free', [])).toBe(false);
expect(requiresReplacementConfirmation('pro', [{ id: 'one' }])).toBe(false);
```

- [ ] **Step 2: Run mobile tests and verify RED**

Run: `npm test --workspace @x-paycheck/mobile`

Expected: FAIL because the retention helper is missing.

- [ ] **Step 3: Connect payslip upload and replacement confirmation**

Before a Free replacement, show the existing month and explain that it will be removed. Send `confirmReplace: true` only after confirmation. If upload validation fails, display the API message and continue showing the old record. Pro displays all returned records in `PayslipHistoryScreen`.

- [ ] **Step 4: Build the Badge screen and dashboard card**

The Pro dashboard card renders either `Inizia turno` or the elapsed open shift with `Termina turno`. Badge history permits editing entry/end and requires a correction reason. Free receives an upgrade card and cannot navigate to a functional Badge route.

- [ ] **Step 5: Run mobile verification and commit**

Run: `npm test --workspace @x-paycheck/mobile && npm run lint --workspace @x-paycheck/mobile && npm run typecheck --workspace @x-paycheck/mobile`

Expected: PASS.

```bash
git add apps/mobile/src/screens apps/mobile/src/payslips apps/mobile/src/navigation
git commit -m "feat(x-paycheck): add mobile badge and payslip retention"
```

---

### Task 9: Align essential web registration and onboarding flows

**Files:**
- Create: `apps/web/src/lib/accountRouting.ts`
- Create: `apps/web/src/lib/accountRouting.test.ts`
- Create: `apps/web/src/pages/PlanChoice.tsx`
- Create: `apps/web/src/pages/Checkout.tsx`
- Modify: `apps/web/src/pages/Register.tsx`
- Modify: `apps/web/src/pages/Login.tsx`
- Modify: `apps/web/src/pages/Onboarding.tsx`
- Modify: `apps/web/src/pages/PayslipAudit.tsx`
- Modify: `apps/web/src/App.tsx`

**Interfaces:**
- Produces: `routeForAccountState(state): '/checkout' | '/onboarding' | '/dashboard'`.
- Consumes: the same API endpoints used by mobile.

- [ ] **Step 1: Write failing routing tests**

```ts
expect(routeForAccountState({ nextStep: 'checkout' })).toBe('/checkout');
expect(routeForAccountState({ nextStep: 'onboarding' })).toBe('/onboarding');
expect(routeForAccountState({ nextStep: 'dashboard' })).toBe('/dashboard');
```

- [ ] **Step 2: Run web tests and verify RED**

Run: `npm test --workspace @x-paycheck/web`

Expected: FAIL because `routeForAccountState` does not exist.

- [ ] **Step 3: Add essential web parity**

Add plan selection before registration, use the existing Google button to submit the selected tier, route authentication through account state, provide the same three simulated checkout offers, and replace the old three-question onboarding with CCNL, weekly hours, and the seven-day schedule. Preserve mobile-first styling decisions independently.

- [ ] **Step 4: Enforce Free upload confirmation in web UI**

Switch `PayslipAudit` to `/payslips`. On `409 FREE_REPLACE_CONFIRMATION_REQUIRED`, show a confirmation dialog; repeat with `confirmReplace: true` only after consent. Pro users link to Archive for multi-item history.

- [ ] **Step 5: Run web tests, lint, typecheck, and commit**

Run: `npm test --workspace @x-paycheck/web && npm run lint --workspace @x-paycheck/web && npm run typecheck --workspace @x-paycheck/web`

Expected: PASS.

```bash
git add apps/web/src
git commit -m "feat(x-paycheck): align web plan and onboarding flow"
```

---

### Task 10: Full verification and operating documentation

**Files:**
- Modify: `README.md`
- Modify: `.env.example`
- Modify: `apps/mobile/app.json`
- Modify: `services/api/.env.example`

**Interfaces:**
- Documents: mobile API URL, Google client configuration, simulated checkout behavior, and plan boundaries.

- [ ] **Step 1: Update configuration documentation**

Document `EXPO_PUBLIC_API_URL`, `VITE_GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_ID`. State explicitly that checkout is simulated, Badge has no GPS, Free replacement is destructive only after confirmation, and local prototype state resets when the API process restarts.

- [ ] **Step 2: Run the full clean verification**

Run:

```bash
npm ci
npm run typecheck
npm test
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

Expected: typecheck, tests, lint, and builds pass. Audit exits successfully with no high or critical production vulnerability; record any remaining moderate transitive advisory without forcing a breaking downgrade.

- [ ] **Step 3: Exercise the acceptance flow**

Start API and Expo, then verify: Free manual registration → seven-day onboarding → first upload → confirmed replacement; Pro Google registration → monthly checkout → onboarding with Badge enabled → start/stop/correct shift → upload two payslips. Repeat plan selection and onboarding on web.

- [ ] **Step 4: Audit scope and commit**

Run:

```bash
git diff --check
git status --short
git diff --name-only
```

From the repository root, confirm all changed tracked files are under `PROJECTS/X-PAYCHECK` and do not stage unrelated `.claude-flow/` or `.claude/` files. Return to `PROJECTS/X-PAYCHECK` before running the commit commands below.

```bash
git add README.md .env.example apps/mobile/app.json services/api/.env.example
git commit -m "docs(x-paycheck): document mobile account flows"
```
