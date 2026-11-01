# Changelog

## 0.8.0 — 1 November 2026 · Manual laps, deeper analysis and reports

- Added manual lap sessions without Paddock: paste times or numbered columns, review parsed values, mark invalid/pit laps, and save with car, track, driver, source and optional setup details.
- Added local manual-session editing, deletion, JSON backup/restore, and access to lap analysis, comparisons, Progress, records and reports. Manual provenance stays distinct from imported evidence; consecutive metrics require explicit sequence confirmation.
- Added recorded-stint summaries and a lap-scope selector for focused charts, statistics and lap inspection.
- Added opening/closing median pace within uninterrupted sequences of at least ten valid laps, with pit/invalid counts and explicit sample limits.
- Added optional A/B lap-progression overlays with common axes, preserved gaps, unequal run lengths and a keyboard-accessible sequence inspector. The default comparison remains a simple table.
- Added Progress history grouped by collection, source, car, track, lane, session type and recorded lane length, with minimum-lap filters and median/best/consistency charts.
- Added selected/reference observations, captured technical and component differences, and links to detailed analysis/comparison.
- Added descriptive run/comparison findings for pace, consistency, exclusions and sample limitations; conflicting best-lap and median changes remain explicit.
- Added self-contained HTML comparison reports with captured setup differences, provenance, source revisions and separate classifications/adjustments.
- Review repairs: retain pit/invalid flags when lap times are corrected; add safe recovery from manual backups; validate numeric setup details; keep rounded-zero comparisons neutral; clarify manual-data provenance.
- Updated electron-builder to 26.18.1 and pinned compatible archive, universal, file-list and pattern-matching dependencies to resolve the earlier build-tool advisories. Clean install, compatibility tests and Windows portable packaging passed; npm audit reports zero vulnerabilities.
- Uses existing offline imports; no Paddock host or API changes are required.

## 0.7.0 — 1 November 2026

- Added a sandboxed desktop connection to Paddock using existing Dealership or Timing credentials, local host discovery and manual addresses.
- Added incremental, atomic result imports with offline caching, corrections, withdrawals, identity/hash checks, rate-limit handling and optional change notifications.
- Added lap progression, pace/consistency metrics, best consecutive runs, captured configurations, graph-free run comparisons, scoped imported records and a separate Race results library/export.
- Preserved measured lap durations separately from adjusted session classifications. Invalid/pit laps, withdrawn sessions and quarantined data do not create records.
- Hardened imports against concurrent database edits and receipt-only changes; added correction notices, explicit comparison confirmation, chart continuity fixes and failed-reconnect recovery.
- Added a versioned host handoff and artificial fixtures. Paddock owns the host implementation; a compatible host build is required. Includes Windows, Linux and macOS packages.

## Licence wording correction — 1 November 2026

- Corrected the licence scope to name SlotForge Telemetry. Permissions,
  restrictions, copyright and Paddock attribution remain unchanged.
- The original v0.6.2 packages contain the earlier Paddock-named text; the
  corrected licence is supplied separately with that release and will be
  embedded in subsequent builds.

## 0.6.2 — 1 November 2026

### Pre-release review fixes

- Unified numeric bounds across typing, calculations and imports; normalize imported numbers for the native input fields.
- Preserve small nonzero results with scientific notation instead of rounding them to zero.
- Confirm replacement of unsaved drafts by New setup, Load example and Open file.
- Export unreadable library data and restore a validated backup with explicit confirmation and write-failure protection.
- Open the current saved setup in Analyze; clear stale legacy references on library loads.
- Prevent simultaneous app instances from overwriting the same draft; restore the macOS application menu.
- Recover invalid remembered theme modes, preserve the import icon, support Enter in setup-name dialogs and synchronize the displayed version.
- Improve Windows source-launcher errors and use the actual architecture in Windows package names.
- Match Linux download links and local-builder checks to native AppImage `x86_64` and DEB `amd64` filenames, confirmed by native CI builds.
- Expand model, UI and main-process regression coverage; add the main-process check to the manual build workflow.

See [the review report](docs/REVIEW.md) for validation and outstanding platform/dependency checks.

### Features

- Standalone Telemetry workbench with live gearing, motor, tyre and weight calculations.
- Analyze saved setups with motor curves, weight/ballast, tyre wear, clearance, gear finder and lap speed.
- Graph-free comparison with absolute/percentage changes and contextual highlights.
- Local library with names, notes, search, duplication, delete/undo and import/export.
- Ballast placement, static axle-load distribution and longitudinal centre of gravity.
- Nominal driven-gear clearance with contact/interference warnings.
- Estimated wheel force and power after assumed drivetrain losses.
- Visible inputs, top-of-page shortcuts and direct editing links from Analyze.
- Eight themes, custom colours and remembered Light/Dark choices.
- Calculation explanations, examples and model limitations.
- SlotForge stopwatch desktop icon and Paddock's vector icon family.
- Windows portable, Linux AppImage/DEB and universal macOS DMG/ZIP package targets.
- Normal/quick local Linux and Mac builders, plus native GitHub package builds.

### Limits

Physical outputs are idealized estimates, not measured on-track performance. No live timing/sensor input or automatic cross-app synchronization is included. Windows is the manually exercised desktop environment; Linux/macOS packages require testing on users' specific systems. Windows is unsigned; macOS is ad-hoc signed and not notarized. Linux downloads target x64; ARM64 Linux source builds are supported separately.
