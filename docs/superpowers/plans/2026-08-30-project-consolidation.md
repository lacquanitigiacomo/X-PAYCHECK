# X-PAY CHECK Consolidation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate all existing X-PAY CHECK sources into one buildable workspace with one web app, one Expo mobile app, one API, one audit package, and no overlapping prototypes.

**Architecture:** The parent `DEVELOPMENT` repository retains ownership. The whitespace-bearing wrapper and nested `X-PAY CHECK` directory collapse into `PROJECTS/X-PAYCHECK`, organized as npm workspaces under `apps`, `services`, and `packages`. Existing behavior is moved first, then duplicate clients are mined for unique behavior and deleted only after verification.

**Tech Stack:** Node.js 24, npm workspaces, TypeScript, React 19, Vite 6, Expo 52, React Native 0.76, Express 4, Jest, Vitest, Playwright

**Spec:** `docs/superpowers/specs/2026-08-30-project-consolidation-design.md`

## Global Constraints

- Keep the project inside the parent `DEVELOPMENT` Git repository; do not create a nested repository.
- Final directory is exactly `PROJECTS/X-PAYCHECK`, without trailing whitespace.
- Preserve working behavior before deleting any source.
- Do not upgrade dependencies unless a retained workspace cannot build with the recorded runtime.
- Do not push or deploy.
- Never stage unrelated parent-repository changes.
- Changed behavior follows red-green-refactor; pure moves use baseline-versus-final verification.

---

### Task 1: Establish the Baseline and Repository Guardrails

**Files:**
- Create: `BASELINE.md` (temporary evidence file, remove before final commit)
- Create: `.gitignore`
- Create: `package.json`
- Create: `.nvmrc`

**Interfaces:**
- Consumes: the three current source roots and their existing package scripts.
- Produces: root workspace commands `build`, `typecheck`, `test`, and `lint` used by every later task.

- [ ] **Step 1: Record current evidence**

Run from the whitespace-bearing wrapper and record exit codes for each existing package:

```bash
node --version
npm --version
npm --prefix "X-PAY CHECK/frontend" run build
npm --prefix "X-PAY CHECK/backend" run build
npm --prefix "X-PAY CHECK/ai-core" run build
npm --prefix "x-pay-check-vscode-kit" run typecheck
git status --short -- .
```

- [ ] **Step 2: Add repository guardrails**

Create `.gitignore` with dependency, Expo, build, coverage, local environment, editor, and macOS exclusions. Add `.nvmrc` containing `24`.

- [ ] **Step 3: Add the root workspace manifest**

Create a private root package with these workspaces and scripts:

```json
{
  "name": "x-paycheck",
  "private": true,
  "workspaces": ["apps/*", "services/*", "packages/*"],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "typecheck": "npm run typecheck --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  },
  "engines": { "node": ">=24" }
}
```

- [ ] **Step 4: Verify guardrails**

Run `git check-ignore` against representative `node_modules`, `dist`, `coverage`, `.env`, and `.DS_Store` paths. Confirm only the four intended root files differ.

- [ ] **Step 5: Commit**

```bash
git add -- .gitignore .nvmrc package.json
git commit -m "chore(x-paycheck): establish workspace guardrails"
```

### Task 2: Normalize the Project Root and Move Canonical Components

**Files:**
- Move: `X-PAY CHECK/frontend` → `apps/web`
- Move: `X-PAY CHECK/backend` → `services/api`
- Move: `X-PAY CHECK/ai-core` → `packages/audit-core`
- Move: `X-PAY CHECK/shared` → `packages/shared`
- Move: `X-PAY CHECK/infrastructure` → `infrastructure`
- Move: `X-PAY CHECK/monitoring` → `infrastructure/monitoring`
- Move: `X-PAY CHECK/tests` → `tests`
- Move: `X-PAY CHECK/docs` → `docs`
- Move: wrapper contents → `PROJECTS/X-PAYCHECK`

**Interfaces:**
- Consumes: the baseline commands and canonical full-stack source.
- Produces: stable target paths for all remaining work.

- [ ] **Step 1: Remove ignored local output**

Delete only verified generated or reinstallable directories: `node_modules`, `dist`, `coverage`, `.DS_Store`, and Expo caches. Confirm no source files are included.

- [ ] **Step 2: Perform history-preserving moves**

Use `git mv` for tracked files and ordinary `mv` only for ignored local files. Move canonical components to their target paths, then collapse the inner directory and rename the outer wrapper to remove its trailing space.

- [ ] **Step 3: Update path consumers**

Update TypeScript aliases, Docker build contexts, monitoring paths, test roots, scripts, and documentation so no live reference points to `frontend`, `backend`, `ai-core`, or the whitespace-bearing root.

- [ ] **Step 4: Verify moves**

Run:

```bash
npm run build --workspace apps/web
npm run build --workspace services/api
npm run build --workspace packages/audit-core
rg -n "X-PAYCHECK |X-PAY CHECK/(frontend|backend|ai-core|shared)" . --glob '!docs/superpowers/**'
git diff --check
```

- [ ] **Step 5: Commit**

```bash
git add -- PROJECTS/X-PAYCHECK
git diff --cached --name-status
git commit -m "refactor(x-paycheck): normalize project structure"
```

### Task 3: Consolidate Shared Contracts and Secure Configuration

**Files:**
- Create: `packages/shared/src/audit.ts`
- Create: `packages/shared/src/auth.ts`
- Create: `packages/shared/src/config.ts`
- Create: `packages/shared/src/config.test.ts`
- Modify: `packages/shared/package.json`
- Modify: `services/api/src/routes/auth.ts`
- Modify: `services/api/src/middleware/authenticate.ts`
- Modify: `services/api/src/db/migrate.ts`
- Modify: `services/api/src/routes/api.ts`
- Create: `.env.example`

**Interfaces:**
- Produces: `loadServerConfig(env: NodeJS.ProcessEnv): ServerConfig`, `loginSchema`, `registerSchema`, `cedolinoSchema`, `AuditOutput`, and `CedolinoRaw`.
- Consumers: API, web client, mobile client, and tests.

- [ ] **Step 1: Write failing configuration tests**

```typescript
it('rejects missing production secrets', () => {
  expect(() => loadServerConfig({ NODE_ENV: 'production' })).toThrow(/JWT_SECRET/);
});

it('allows explicit development values without logging secrets', () => {
  expect(loadServerConfig({ NODE_ENV: 'development', JWT_SECRET: 'local-only' }).jwtSecret)
    .toBe('local-only');
});
```

- [ ] **Step 2: Verify RED**

Run `npm test --workspace packages/shared -- config.test.ts`; expect failure because `loadServerConfig` does not exist.

- [ ] **Step 3: Implement shared schemas and strict configuration**

Implement config loading with no production fallback, move duplicated Zod schemas and audit types into `packages/shared`, and export them from one package entry point.

- [ ] **Step 4: Update API consumers**

Replace `process.env.JWT_SECRET || 'dev-secret'`, the hard-coded database password, and local request schemas with shared configuration and contracts. Remove all secret-prefix logging.

- [ ] **Step 5: Verify GREEN**

Run shared tests, API type-check, API tests, and `rg` for `dev-secret`, `ryb_dev_secret_2026`, secret slicing, and duplicate schema declarations.

- [ ] **Step 6: Commit**

```bash
git add -- PROJECTS/X-PAYCHECK/packages/shared PROJECTS/X-PAYCHECK/services/api PROJECTS/X-PAYCHECK/.env.example
git commit -m "refactor(x-paycheck): centralize contracts and configuration"
```

### Task 4: Build the Canonical Expo Mobile Application

**Files:**
- Move: `x-pay-check-vscode-kit/src` → `apps/mobile/src`
- Move: `x-pay-check-vscode-kit/assets` → `apps/mobile/assets`
- Modify: `apps/mobile/App.tsx`
- Modify: `apps/mobile/src/navigation/AppNavigator.tsx`
- Create: `apps/mobile/src/navigation/types.ts`
- Create: `apps/mobile/src/navigation/AppNavigator.test.tsx`
- Modify: `apps/mobile/package.json`

**Interfaces:**
- Produces: a typed `RootStackParamList` and reachable Landing, Login, Dashboard, Upload, Report, Settings, License, Calendar, and Archive routes.
- Consumes: preferred kit screens and unique real navigation behavior from the older Expo prototype.

- [ ] **Step 1: Write a failing navigation test**

The test renders the navigator, activates the landing primary action, and asserts that Login becomes visible; it then signs in and asserts that Dashboard becomes visible. It must fail against the kit's state-switch navigator or missing test harness.

- [ ] **Step 2: Verify RED**

Run `npm test --workspace apps/mobile -- AppNavigator.test.tsx`; confirm the failure describes missing real navigation behavior.

- [ ] **Step 3: Merge the mobile sources**

Keep the kit's theme, components, and screens. Replace its mock switch with React Navigation using the older prototype's typed stack pattern. Retain Expo 52 and React Native 0.76. Remove unused camera, OCR, storage, and purchase dependencies unless referenced by retained source.

- [ ] **Step 4: Make incomplete actions explicit**

Buttons without implementation must display an unavailable state or message. They must not silently do nothing or return mock success.

- [ ] **Step 5: Verify GREEN**

Run the navigation test, mobile type-check, lint, and Expo configuration validation. Confirm no `onPress={() => {}}` or mock navigator remains.

- [ ] **Step 6: Commit**

```bash
git add -- PROJECTS/X-PAYCHECK/apps/mobile
git commit -m "feat(x-paycheck): consolidate mobile application"
```

### Task 5: Consolidate the Responsive Web Client

**Files:**
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/components/Layout.tsx`
- Modify: `apps/web/src/pages/PayslipAudit.tsx`
- Modify: `apps/web/src/pages/Dashboard.tsx`
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/App.test.tsx`

**Interfaces:**
- Produces: one responsive browser journey consuming shared API contracts.
- Consumes: canonical Vite pages and any unique useful flow from the former PWA.

- [ ] **Step 1: Write failing route and unavailable-action tests**

Test that the primary journey exposes onboarding, login, dashboard, payslip upload, audit report, calendar, archive, and settings routes. Test that an unimplemented integration reports `Funzione non ancora disponibile` rather than succeeding silently.

- [ ] **Step 2: Verify RED**

Run `npm test --workspace apps/web`; confirm failures correspond to the missing consolidated behavior.

- [ ] **Step 3: Integrate unique PWA behavior**

Port only behavior not already represented in the canonical web pages. Connect API calls through `src/lib/api.ts` using shared contracts. Do not copy the PWA's duplicate authentication/dashboard shell.

- [ ] **Step 4: Remove fabricated success paths**

Replace mock success, fake authorization, and inert controls with real API calls or explicit unavailable feedback.

- [ ] **Step 5: Verify GREEN**

Run web tests, type-check, lint, and production build. Search for empty click handlers and duplicated route implementations.

- [ ] **Step 6: Commit**

```bash
git add -- PROJECTS/X-PAYCHECK/apps/web
git commit -m "feat(x-paycheck): consolidate responsive web flows"
```

### Task 6: Harden and Test the API and Audit Engine

**Files:**
- Create: `services/api/src/app.ts`
- Create: `services/api/src/app.test.ts`
- Modify: `services/api/src/index.ts`
- Modify: `services/api/src/routes/api.ts`
- Move: `services/api/src/services/auditEngine.ts` → `packages/audit-core/src/auditEngine.ts`
- Create: `packages/audit-core/src/auditEngine.test.ts`
- Modify: `packages/audit-core/src/index.ts`

**Interfaces:**
- Produces: `createApp(config)` for in-process integration testing and `runAudit(cedolino)` from the audit package.
- Consumes: shared schemas and configuration from Task 3.

- [ ] **Step 1: Write failing API tests**

Use Supertest against `createApp`, not a separately running server. Cover unauthenticated rejection, invalid registration, invalid payslip upload metadata, malformed audit payload, and valid deterministic audit output.

- [ ] **Step 2: Verify RED**

Run the API test file; confirm failure because the app factory and validations are absent.

- [ ] **Step 3: Extract the app factory and audit engine**

Make `index.ts` startup-only, export `createApp`, import `runAudit` from `@x-paycheck/audit-core`, and validate upload type, size, month, and year before processing.

- [ ] **Step 4: Add audit unit coverage**

Cover consistent net pay, net mismatch, zero ordinary hours, insufficient night premium, insufficient holiday premium, and inconsistent counted days.

- [ ] **Step 5: Verify GREEN**

Run API and audit tests, type-check both workspaces, and confirm tests require no external server.

- [ ] **Step 6: Commit**

```bash
git add -- PROJECTS/X-PAYCHECK/services/api PROJECTS/X-PAYCHECK/packages/audit-core
git commit -m "test(x-paycheck): harden api and audit boundaries"
```

### Task 7: Remove Superseded Sources and Normalize Operations

**Files:**
- Delete: old Expo prototype root
- Delete: superseded PWA root after unique behavior is migrated
- Delete: `backend-legacy`
- Delete: `google-drive-demo`
- Delete: tracked `dist` output and generated shared JavaScript/declarations
- Modify: `infrastructure/docker-compose.yml`
- Modify: `infrastructure/scripts/*.sh`
- Modify: `Makefile` or replace it with root npm scripts

**Interfaces:**
- Consumes: verified canonical applications from Tasks 4–6.
- Produces: one operational path for local development and infrastructure.

- [ ] **Step 1: Prove duplicate coverage**

Create a temporary inventory mapping every unique screen, route, component, script, and endpoint from each removal candidate to its retained destination. Resolve every unmapped item before deletion.

- [ ] **Step 2: Remove superseded sources**

Delete only candidates whose inventory is fully mapped or explicitly classified obsolete. Remove tracked build output and generated mirrors of TypeScript source.

- [ ] **Step 3: Normalize operational configuration**

Rename RYB containers, database defaults, status output, scripts, and comments to X-PAY CHECK. Move monitoring configuration under `infrastructure/monitoring`. Require explicit production credentials while retaining documented local-only defaults in the development compose profile.

- [ ] **Step 4: Verify cleanup**

Run searches for `RYB`, duplicate package names, legacy/demo paths, tracked `dist`, tracked `.DS_Store`, tracked `node_modules`, and whitespace-bearing path names. Review every remaining match.

- [ ] **Step 5: Commit**

```bash
git add -A -- PROJECTS/X-PAYCHECK
git diff --cached --name-status
git commit -m "chore(x-paycheck): remove superseded implementations"
```

### Task 8: Complete Documentation and Full Verification

**Files:**
- Replace: `README.md`
- Modify: `docs/architecture/overview.md`
- Modify: `AGENTS.md`
- Modify: `X-PAY CHECK.yaml` or rename to `project.yaml`
- Remove: temporary baseline and inventory files

**Interfaces:**
- Produces: accurate setup, architecture, command, privacy, and known-limit documentation.

- [ ] **Step 1: Rewrite documentation from verified commands**

Document prerequisites, install, development, build, test, lint, workspace boundaries, environment variables, local infrastructure, privacy constraints, and incomplete features. Do not document commands that have not run successfully.

- [ ] **Step 2: Run the complete verification suite**

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
git status --short
```

Run Playwright only after starting the verified API and web development services. Record any external-tool limitation separately from code failures.

- [ ] **Step 3: Audit repository scope**

Confirm the final tree contains exactly one web client, one mobile client, one API, one audit engine, and no tracked generated or sensitive files. Inspect `git diff --cached --name-status` before committing.

- [ ] **Step 4: Commit**

```bash
git add -- PROJECTS/X-PAYCHECK
git diff --cached --check
git commit -m "docs(x-paycheck): complete consolidated project"
```

- [ ] **Step 5: Post-commit audit**

Run `git status --short`, inspect the final commit range, and confirm no files outside `PROJECTS/X-PAYCHECK` were included. Do not push.
