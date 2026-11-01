# Pre-release review — 1 November 2026

Reviewed the SlotForge Telemetry 0.6.2 source, calculations, input validation, persistence, library operations, four-page workflows, themes, illustrations, Electron shell, launchers, builders, package configuration and documentation. No release, tag, workflow dispatch or upload was performed during this local review. Subsequent publication and native CI build results are recorded in the release notes.

This is a tested review, not a guarantee that every possible defect has been found. Native Linux/macOS packages and runtime behavior still need verification on those systems.

## Findings repaired

| Area | Problem | Repair and verification |
| --- | --- | --- |
| Numeric inputs | Imported tooth counts could exceed the UI's maximum; very small imported positive inputs could also violate the displayed minimum. | Calculation and import validation now use the same bounds as the fields. Invalid entries are rejected before replacement or saving. Boundary regression tests cover both paths. |
| Numeric notation | Browser-valid scientific notation was rejected. Some accepted file strings, such as `20.` or `+9`, could render as blank in number fields. | A shared parser accepts decimal/exponent notation, rejects nonfinite and out-of-range values, and normalizes stored/imported numeric strings. Desktop tests inspect the actual input values after import. |
| Result formatting | Small nonzero results could be displayed as `0`. | Small magnitudes use scientific notation. Zero and unavailable results remain distinct. |
| Draft preservation | New setup, Load example and Open file could overwrite a draft without warning. | Unsaved changes now require confirmation. Cancellation keeps the draft; pristine examples, blank workbenches and unchanged saved setups do not need a redundant prompt. |
| Library recovery | An unreadable library disabled import and had no in-app recovery path. A later read failure could leave stale entries visible. | Clear stale in-memory entries, retain stored bytes, offer an export of the unreadable data, and restore only after validating a backup and confirming replacement. Invalid backups, cancellation and storage-quota failures leave the original bytes untouched. |
| Analyze selection | The workbench's Open Analyze link could open a different saved setup. | It selects the linked saved setup; saving also selects that entry for analysis. Analysis still uses saved snapshots. |
| Saved metadata | Loading a library entry retained an unrelated legacy comparison reference. | Clear that obsolete reference on library loads; individual setup-file references still round-trip for compatibility. |
| Concurrent instances | Two app processes could edit the same automatically saved draft. | Use Electron's single-instance lock and focus the existing window on a second launch. Tested against the real main process with a separate app-data directory. |
| macOS menu | The app did not provide the standard macOS application menu. | Add Electron's macOS application menu role. Native macOS behavior still needs manual verification. |
| Themes | Invalid remembered Light/Dark preferences could select a theme of the opposite tone. | Validate each remembered preference against its actual tone and fall back safely. Desktop regression test covers recovery. |
| Library controls | Save as copy remained enabled when the library was unavailable. | Disable library-dependent save controls consistently. Keep file export available for a valid draft. |
| Small UI defects | Setup-name dialogs did not submit with Enter; the top version differed from the footer. | Add keyboard submission without interfering with multiline notes; display 0.6.2 consistently. Preserve the family import icon when its recovery label changes. |
| Windows packaging | The portable filename always said x64 even if another architecture were built. | Include the actual build architecture in the filename. The local package is x64. |
| Source launchers | Missing/outdated Node or startup failure could leave a confusing or disappearing error. | Check Node/npm and minimum Node version, include development dependencies, and pause on failures. The former Calculator launcher delegates to Telemetry's launcher. |
| Documentation | Some notices/troubleshooting still implied a public release existed. | Correct source-only status and explain library recovery and review limitations. |

## Calculation review

Checked gearing, axle RPM, rollout, tyre/rim geometry, no-load speed, torque units, force, linear brushed-DC motor curves, peak mechanical power, efficiency, mass conversion, ballast, static balance and longitudinal CG, tyre wear, nominal gear clearance, gear search, lap speed, scale conversion and comparison differences.

No arithmetic error was found in the existing physical formulas under their stated assumptions. The numeric parsing and display defects above were repaired. Tests cover the worked examples, missing and incompatible inputs, zero-efficiency/end-of-curve cases, interference below the track plane, and 135 combinations of gears, tyres and operating points. These combinations independently check `force × speed = power`, acceleration/mass consistency, total axle load and static moments.

The physical model remains idealized: no-load speed and stall force describe different operating points; peak mechanical power is not a continuous or electrical rating; traction, drag and rotating inertia are excluded. Static axle balance does not predict handling. The model's assumptions agree with [Pololu's motor/gearing explanation](https://www.pololu.com/docs/0J21/5.c); [maxon's simulation guidance](https://support.maxongroup.com/hc/en-us/articles/360013761160-Motor-data-and-simulation) explains why motor tolerances and real measurements still matter.

## Verification performed

- JavaScript syntax checks passed.
- All **33 model and builder tests passed**, including the four Unix builder tests run with the bundled Bash runtime and its utilities. No skipped builder tests in that run. The subsequent numeric-import changes also passed all 29 model tests and the expanded UI tests; builder source was unchanged.
- Expanded Electron UI tests passed: four pages, saved-only analysis, all calculation topics, comparisons, library CRUD/search/backup, file imports/exports, invalid data, quota failures, stale saves, recovery, discard confirmation, numeric normalization, remembered themes, help links and narrow-window overflow checks.
- The actual Electron main-process test passed: isolated app data, sandbox and context isolation enabled, no renderer Node access, denied notification permission and popup creation, successful setup-file downloads, and a second process reusing the existing instance.
- Inspected desktop Telemetry/Analyze and narrow light-theme captures. Verified that the generated Windows executable contains the stopwatch icon.
- Final local Windows portable packaging succeeded with `--publish never`. Package outputs are under `dist/review/`; no package was uploaded. The packaged renderer and main-process files match the final working sources byte for byte. Native Linux/macOS package builds were not run.
- Inspected the application archive: build dependencies are not shipped as application modules. Checked lockfile metadata, manual-only workflow permissions and package filenames.
- The maximum 20,000-pair gear search completed in approximately 69 ms on this machine; this is a local observation, not a cross-device performance guarantee.

Desktop tests and screenshots use only isolated profiles and example data under `test-results/`. The real user's saved setups were not loaded or modified.

## Remaining release checks

1. **Native Linux/macOS verification.** Build and launch on supported systems; exercise install/update/uninstall, file export/import, user-data persistence, macOS Intel/Apple Silicon behavior and Linux desktop integration. Mocked builder tests cannot establish that the native packages install and run correctly. The manual build workflow remains build-only and was not dispatched.
2. **Build dependency advisory.** `npm audit` reported 15 moderate dependency-chain entries rooted in one minimatch advisory, with no high or critical entries. [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) describes pattern-amplification denial of service and names 11.0.1 as patched. The current upstream electron-builder/app-builder-lib version is 26.18.0, and it still declares minimatch `^10.2.5`. npm suggested downgrading electron-builder to 20.23.1; that is not a suitable automatic fix. Older transitive consumers also use minimatch's old callable API, so a blanket major override would be incompatible. This is build tooling, not bundled application code. The inspected build matching options do not enable the advisory's optimization-level-2 path and patterns come from repository configuration. Keep build configuration trusted, track the upstream fix, and recheck the audit before release. No dependency change was made to conceal the finding.
3. **Distribution trust.** Windows remains unsigned. macOS is configured for ad-hoc signing without Developer ID/notarization. These are documented distribution limitations, not claims of completed native signing verification.

Review scope does not include physical car measurements, every possible display/OS configuration, or a full accessibility certification. No release was created.
