# Changelog

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
