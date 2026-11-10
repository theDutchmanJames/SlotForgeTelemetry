# Chassis geometry implementation review — 10 November 2026

## Scope and outcome

Implemented guide/rear-contact geometry, explicit two/three-point weighing, repeat readings, horizontal CG, measurement bounds, two-dimensional ballast changes and target suggestions. Added live results, saved-only analysis, neutral comparisons, help, and saved chassis evidence attached to controlled lap runs. The previously approved SVG branding remains intact.

Reviewed the changed calculation, validation, persistence, snapshot, comparison, UI and release-workflow code. No unresolved defect was found in the reviewed scope after the corrections below. This is not a guarantee of zero defects or a validation of real-world handling predictions. The formulas describe static point-support models under documented assumptions.

## Calculation checks

- Independently checked the 100 mm / 60 mm triangle: 33.398488° angle, 1.666667 ratio, 104.403065 mm side.
- Independently checked the 20/30/30 g fixture and 10 g addition at x = 70 mm, y = +15 mm: 23/31/36 g, 90 g total, CG x = 74.444444 mm and y = 1.666667 mm.
- Verified conservation of mass and both first moments over 60 ballast positions, mirrored left/right behaviour, centred symmetry, relocation and removal.
- Verified missing geometry, mixed supports, unconfirmed weighing, zero load boundaries, negative final reactions, singular/unreachable targets, lateral target infeasibility and mass-limit margins.
- Checked uncertainty interval endpoints against sampled interior points; incomplete bounds do not produce a pass/fail judgement, and zero-total intervals do not produce CG/share bounds.
- Main car mass, magnetic force and existing axle/guide planner semantics remain independent. Copying a legacy plan is an explicit action.

## Data and UI checks

- Older setup files get blank optional inputs; new fields and snapshots survive setup/library round trips.
- Snapshots use a bounded, versioned, non-recursive subset of setup data. Later source changes do not change the captured inputs. Changed/moved run rows detach earlier evidence.
- Data is escaped in labels, notes, ballast tables and captured evidence. Malformed/nonfinite/oversized values fail validation.
- Saved analysis remains independent from unsaved workbench edits. An invalid draft does not replace the last valid persisted workspace.
- Verified input navigation, help navigation, support-mode gating, condition reset, add/remove/move controls, saved setup evidence for manual and imported lap windows, theme switching and 390/760px layouts.
- Visually inspected actual Electron captures in both themes. Tables scroll within their container at narrow widths instead of breaking words into unreadable columns.
- Script, stylesheet and SVG references resolve; packaged assets remain covered by the existing build globs. Version remains 0.9.0; no release was created.

## Issues corrected during review

- Explicitly separated the guide pivot geometry from the actual weighing support, including the pivot approximation and mode-change confirmation reset.
- Preserved measured results when dimensions are incomplete; missing readings never become zero.
- Kept negative load changes valid while rejecting negative final support reactions; evaluated a move as removal plus addition before validating final loads.
- Suppressed incompatible balance comparisons; share deltas use percentage points, and chassis positions do not receive misleading relative-percentage changes or automatic performance colours.
- Added notices for plans/target suggestions exceeding user-entered mass limits, and for ballast rows pending a weighing method.
- Rejected duplicate snapshots for the same run row.
- Made setup export/import enforce the same UTF-8 byte limit, preventing oversized exports that could not be reopened.
- Corrected legacy span equality checks to compare numeric values rather than formatting such as `100` versus `100.0`.
- Clarified that displayed CG coordinates are calculated from scale readings.

## Validation results

- `npm run check`: passed.
- `npm test`: 130 tests; 125 passed, 0 failed, 5 skipped. Includes 20 new chassis/snapshot regression tests.
- Nine Electron suites passed: pages/library, desktop shell, magnetic, workshop, chassis, Paddock desktop import, manual laps, race analysis and race progress.
- The five skips are existing environment-dependent cases: four Unix shell-builder checks (no configured Bash executable) and one live Paddock source interoperability test (no `SLOTFORGE_PADDOCK_SOURCE` configured). Synthetic Paddock network tests, handoff fixtures and desktop import tests passed.
- `git diff --check`: passed.

No native Linux/macOS package was built during this task. The release workflow now includes the chassis UI suite before Windows packaging.

Screenshots from the isolated synthetic profiles are available under `test-results/chassis-*.png`. The measurement instructions, derivations and research sources are in [the chassis guide](../chassis-geometry.md).
