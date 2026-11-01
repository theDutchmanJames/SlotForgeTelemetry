# Paddock integration review — 1 November 2026

Reviewed the complete uncommitted Paddock client integration: main-process networking, preload/IPC boundary, cache lifecycle, contract validation, analysis/statistics, navigation and rendering, tests, documentation and build wiring. Fixes were made only in Telemetry. Paddock's source was read to verify its completed API and used with artificial in-memory test data.

## Findings repaired

| Severity | Finding | Repair and verification |
| --- | --- | --- |
| High | Receipt-only changes could be skipped when payload hash/revision remained unchanged, leaving correction warnings absent from the offline library. | Persist and compare the host's `resultHash`; refresh receipts and exclude `SESSION_REQUIRES_CORRECTION` sessions from analysis/records. Fixture and actual-host regression tests cover it. |
| High | Imports depended on the whole database revision, so unrelated private edits could interrupt a valid result download. | Pin the advertised result snapshot across pages/details, check the small status endpoint before committing, and retry snapshot races at most twice. Legacy revision-only support remains. Tests cover private edits, final-check failure and successful retry. |
| Medium | Participant-local driver IDs could imply a driver match across separate sessions/cars and enable misleading benefit colours. | Colours require compatible track/lane/source plus explicit confirmation of driver and conditions. Confirmation is tied to both run identities and payload hashes. Unit and desktop tests cover ID collisions and confirmation. |
| Medium | Failed reconnection could leave the interface displaying the previous connected state. | Return safe connection metadata with IPC failures, reconcile UI state, stop on access revocation, and guard stale asynchronous responses. Desktop tests cover failed reconnection and disabled refresh; host tests cover revoked access. |
| Medium | Downsampled graphs could draw continuity across excluded/missing laps, including rolling-median gaps. | Derive continuity segments before sampling and retain valid extrema independently of excluded samples. Regression tests use 5,000 laps, hidden invalid laps and missing lap numbers. |
| Medium | The earlier host installer could overwrite Paddock's completed implementation. | Retire the installer so it exits without writes. Copy Paddock's authoritative handoff unchanged, including its licence, and replace stale installation/contract guidance. |
| Low | Sessions needing correction were insufficiently visible. | Add analysis-level exclusion notices and named session/revision warnings in the race library. |
| Low | A long comparison confirmation label could overflow a narrow screen. | Allow wrapping; verify comparison layout at 390 pixels. |

## Validation completed

- `npm run check`: all JavaScript syntax checks passed.
- `npm test`: **57 passed, 0 failed, 0 skipped**, with the available Unix shell configured and `SLOTFORGE_PADDOCK_SOURCE` pointing to the Paddock source checkout.
- Actual Paddock host over localhost: existing Dealership password, normal/multi-heat/endurance sessions, unchanged incremental refresh, private edits during import, notification-driven correction, receipt-only quarantine, withdrawal, same-database-revision restore, missing-session reconciliation and password revocation. Host data was artificial and in memory; device/cache files used a disposable temporary directory.
- `test:paddock-ui`: sandboxed preload/IPC, connection/import, charts and excluded laps, escaped imported text, comparison confirmation, corrected records, failed reconnect, library, disconnect, offline reload and narrow-screen layout passed.
- `test:ui`: existing calculator, four-page navigation, setup analysis/comparison, library lifecycle, file round trips, storage protection, themes, help and responsive layouts passed.
- `test:shell`: isolated profile, sandbox, no renderer Node access, denied permissions/new windows, setup download and single-instance behavior passed.
- Desktop and narrow-screen screenshots inspected. `git diff --check` passed.

## Remaining verification and boundaries

No unresolved blocking defect was found in the reviewed changes after these repairs. This is not a claim that every possible bug is excluded.

A real two-computer connection still needs testing for multicast discovery, firewall permissions, reconnecting after host sleep/restart and the final packaged builds. Native Linux/macOS runtime behavior was not exercised here; their build-script checks passed on the available shell. No release or packaged app was published during this review.

Telemetry imports complete permitted history, then filters locally; optional host-filtered browsing and SSE are not implemented. Long-poll notifications provide automatic refresh. Imported best laps are scoped derived records, not Timing's entire official record database. Configuration signatures are retained as host evidence; Telemetry does not possess Paddock's signing key and does not independently authenticate those signatures.
