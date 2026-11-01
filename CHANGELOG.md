# Changelog

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
