# X-PAY CHECK Project Consolidation Design

## Objective

Consolidate the three overlapping X-PAY CHECK implementations into one coherent project while preserving working features, removing duplicated prototypes, and establishing one verifiable development workflow.

The canonical project remains part of the parent `DEVELOPMENT` repository. The final directory name is `PROJECTS/X-PAYCHECK`, with no trailing whitespace and no nested Git repository.

## Current Sources

The consolidation starts from these existing implementations:

- `X-PAY CHECK/`: canonical full-stack base containing the React/Vite web application, TypeScript API, audit core, shared utilities, infrastructure, tests, and documentation.
- `x-pay-check-vscode-kit/`: preferred Expo mobile UI, screens, theme, and components.
- `xpay-check-frontend/`: older Expo prototype whose real navigation and any unique working behavior may be reused, but which will not survive as a separate application.

The current PWA under `X-PAY CHECK/mobile/`, `backend-legacy/`, and `google-drive-demo/` are migration sources only. They will be removed once their unique behavior has either been integrated or explicitly proven redundant.

## Target Structure

```text
X-PAYCHECK/
├── apps/
│   ├── web/
│   └── mobile/
├── services/
│   └── api/
├── packages/
│   ├── audit-core/
│   └── shared/
├── infrastructure/
├── tests/
├── docs/
├── package.json
├── README.md
└── .gitignore
```

Responsibilities are exclusive:

- `apps/web`: browser interface and responsive web experience.
- `apps/mobile`: native Expo application and device-specific functionality.
- `services/api`: authentication, profiles, uploads, audit endpoints, and persistence adapters.
- `packages/audit-core`: deterministic payslip audit rules with no UI dependency.
- `packages/shared`: shared contracts, validation schemas, and environment helpers.
- `infrastructure`: Docker, database initialization, proxy, monitoring, and operational scripts.
- `tests`: cross-package integration, end-to-end, and performance tests.

## Consolidation Rules

No source directory is deleted merely because another implementation looks newer. Before deletion, its files are classified as duplicated, unique-and-reusable, obsolete, generated, or local dependency output.

Migration decisions follow these rules:

1. Preserve observable working behavior before visual polish.
2. Prefer the current full-stack implementation for web, API, audit, and infrastructure.
3. Prefer the VS Code kit for mobile design components and screens.
4. Reuse the older Expo prototype only for behavior absent from the preferred kit, especially real navigation wiring.
5. Fold unique PWA flows into the responsive web app; do not keep a second browser client.
6. Remove legacy and demo code only after a file-level comparison and replacement check.
7. Replace residual product naming such as `RYB` where it denotes this product. Technical identifiers are renamed only when consumers are updated in the same change.

## Application Flows

Both clients expose the same product journey while retaining platform-appropriate navigation:

1. Landing and onboarding.
2. Login or registration.
3. Work-profile setup, including CCNL and contract data.
4. Dashboard.
5. Payslip acquisition by upload or device capture.
6. Audit execution.
7. Report with PASS, WARNING, and CRITICO findings.
8. Calendar and archive.
9. Settings and license status.

Incomplete integrations must be visibly identified as unavailable; buttons must not silently succeed or navigate to fabricated results.

## Data and API Boundaries

The API is the authoritative boundary for account, profile, upload, audit, license, and backup operations. Shared request and response contracts live in `packages/shared` and are consumed by clients and the API.

The audit engine remains deterministic and independently testable. Client applications submit normalized payslip data and render the returned audit report; they do not duplicate audit calculations.

Temporary in-memory implementations may remain during consolidation only when clearly labeled development-only. Production startup must reject missing secrets instead of falling back to known values. Persisted user data and uploaded payslips must not be introduced until their storage and privacy behavior are covered by tests and documentation.

## Configuration and Security

- One root-level environment example documents all supported variables without real credentials.
- Production mode has no fallback JWT secret or database password.
- Secrets are never logged, including prefixes.
- Generated environment files, dependencies, build output, coverage, editor state, and `.DS_Store` are ignored.
- Existing tracked build output is removed from version control.
- File upload validation covers size, accepted type, and malformed content before OCR or audit processing.

## Build and Developer Workflow

A root workspace manifest provides a single entry point for install, development, build, type-check, test, and lint commands. Each workspace retains focused commands where platform tooling differs.

The documented supported runtime is one current Node version compatible with the chosen web, API, and Expo toolchains. Dependency upgrades are not part of consolidation unless required to make the retained application build or test successfully.

Operational scripts resolve paths relative to their own location so the project works after removal of the whitespace-bearing wrapper and from any checkout location.

## Testing Strategy

Consolidation proceeds in reversible slices. Each slice establishes a baseline before moving files, then reruns the relevant checks afterward.

Required verification layers:

- Unit tests for audit rules and shared validation.
- API integration tests for authentication failures, profile validation, uploads, audits, and development-only fallbacks.
- Web component or flow tests for the main journey and unavailable actions.
- Mobile type-check plus focused navigation and screen behavior tests.
- Workspace-wide build, type-check, lint, and test commands.
- Final Git audit confirming no dependency directories, generated build output, secrets, obsolete duplicate roots, or whitespace-bearing project paths remain tracked.

Tests for changed behavior are written and observed failing before implementation. Pure file moves and configuration-only changes are verified through baseline-versus-final commands and repository audits.

## Migration Sequence

1. Record current build, type-check, test, and repository baselines without altering product behavior.
2. Add the root workspace and ignore rules.
3. Move the canonical full-stack components into the target structure, preserving history where Git can detect renames.
4. Consolidate shared contracts and environment handling.
5. Merge mobile screens, components, and real navigation into `apps/mobile`.
6. Integrate unique PWA behavior into `apps/web`.
7. Remove superseded prototypes, legacy backend, demos, tracked build output, and local artifacts.
8. Normalize product naming, scripts, documentation, and architecture references.
9. Run full verification and inspect the complete scoped diff.

No push or deployment is included.

## Acceptance Criteria

- Exactly one `X-PAYCHECK` project directory exists and its name has no trailing whitespace.
- The project contains one web client, one mobile client, one API, and one audit engine.
- No separate prototype, legacy backend, static demo, dependency directory, or generated distribution directory remains tracked.
- All retained screens and flows are reachable through real navigation or explicitly marked unavailable.
- Web and mobile consume shared contracts instead of redefining API payloads independently.
- Production configuration refuses missing secrets and contains no known credential fallback.
- Root commands install, build, type-check, test, and lint the retained workspaces.
- Documentation describes the actual structure and verified commands.
- The parent repository contains only intentional X-PAY CHECK changes, with no unrelated files staged or committed.
