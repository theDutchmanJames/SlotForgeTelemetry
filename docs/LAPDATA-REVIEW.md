# Lap analysis and manual-entry review — 1 November 2026

Reviewed every application change after the recorded v0.7.0 Paddock review (`889c35d`): stint scopes and pace windows, comparison overlays, Progress history, descriptive findings, HTML reports, manual-entry parsing and storage, IPC/preload access, backup and recovery, navigation/themes, documentation, tests and build wiring. Earlier review records were also checked for outstanding repairs. All findings below were repaired in the working copy; no commit, push or release was made.

## Findings repaired

| Severity | Finding | Repair and verification |
| --- | --- | --- |
| Medium | Correcting the duration of an invalid or pit lap reset its status to valid, potentially changing statistics and records. | Preserve inclusion flags by lap number when re-reviewing. Show an explicit reminder after edits to check flags when inserting, removing or reordering laps. Desktop regression corrects a pit lap's time and verifies both its new duration and retained exclusion in the saved file. The lookup now uses a map instead of repeated linear searches. |
| Medium | An unreadable manual library blocked ordinary writes and restore, leaving no usable recovery workflow. | Validate the selected backup, require explicit native confirmation, copy the damaged original to a unique archive, and atomically replace the library. Invalid input, cancellation and replacement-write failure preserve the original. Covered by model and desktop tests, including restart persistence. |
| Medium | Optional manual setup details accepted fractional teeth and nonnumeric/invalid values in backups. Some accepted strings became blank in numeric input fields. | Validate positive decimal/exponent values and whole tooth counts consistently before persistence/import. Reject unsupported numeric notation, nonfinite values and out-of-range teeth. Unit tests cover invalid values and valid scientific notation. |
| Low | Sub-millisecond differences could appear as coloured `+0.000 s` or `-0.000 s`, while the findings described them as unchanged. | Use one delta formatter and direction rule at the displayed millisecond precision. Rounded-zero differences are unsigned and neutral. Unit and actual comparison-UI tests cover a 0.2 ms mean difference. |
| Low | Manual comparisons and Progress described their source as Timing/Paddock or their setup as a historical capture. | Correct source/context labels and distinguish entered specifications from imported historical captures throughout the comparison, Progress and report wording. |
| Low | Closing the manual editor while a save was pending could allow the eventual response to close a subsequently opened editor. | Disable Cancel and prevent Escape while the save is pending; re-enable them after completion or failure. |
| Medium, carried forward | The earlier review left a build-only minimatch advisory unresolved. | Update electron-builder to 26.18.1 and pin tested compatible dependency replacements. npm audit now reports zero vulnerabilities. A clean lockfile install, matcher/ASAR API tests, application regressions and Windows portable packaging pass. |

## Dependency repair

The previous finding concerned [minimatch pattern amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249). The fixed tree uses minimatch 11.0.2. Older ASAR and directory-comparison callers expected minimatch's callable default API, so a matcher-only override was insufficient.

The checked-in overrides therefore pin `@electron/asar` 4.3.1 with `glob` 14.0.3, `@electron/universal` 3.0.6, `filelist` 2.0.2 and `minimatch` 11.0.2. They retain the public builder APIs and fit the application's existing Node 22.12+ requirement. The glob override also avoids the cancellation advisory reported during the update. Compatibility checks cover recursive/brace/dotfile/exclusion matching, the remaining legacy glob caller, file lists, archive creation/extraction/unpacked files and integrity headers. The universal builder's export and platform guard are tested on Windows; its archive-merge test runs on POSIX hosts. Native macOS universal binary creation still requires a macOS runner.

Keep these pins until electron-builder's supported dependency set supplies the fixes directly; removing or changing them should repeat the compatibility and packaging checks. Some legacy transitive build packages still emit deprecation warnings; the final npm security audit contains no reported vulnerabilities. Build dependencies are excluded from the shipped application archive.

## Verification completed

- Clean `npm ci` and `npm audit`: zero reported vulnerabilities.
- `npm run check`: all JavaScript syntax checks passed.
- `npm test`: **88 passed, zero failed, zero skipped**, with the bundled Bash runtime and read-only Paddock source fixture checks configured.
- All six desktop scripts passed: calculator/pages, actual Electron shell, Paddock connection/import, stint/overlay analysis, Progress/report export, and manual-entry workflows. Synthetic fixtures and isolated profiles were used throughout.
- Manual tests include invalid lines, decimal commas, clock times, milliseconds, lap-number gaps, inclusion flags, revision conflicts, backup merging, damaged-library recovery, failures, editing/reload, maximum 10,000-lap sessions and provenance.
- Analysis checks cover exclusion boundaries, non-overlapping pace windows, grouping identities, sample-size limits, corrections/withdrawals, comparison confirmation, report escaping and real HTML downloads.
- Dark/light and narrow-screen screenshots inspected, including manual entry, Progress and the comparison report.
- A Windows x64 portable build completed with `--publish never` under `test-results/review-secure-package/`. Its packaged renderer and main-process source files match the working source byte for byte; test profiles, design mockups and build dependencies are absent.
- `git diff --check` passed.

## Remaining verification boundaries

No known actionable code finding remains unresolved after these repairs. This is not a guarantee that every possible defect has been found.

Native Linux/macOS installation and runtime testing, macOS Intel/Apple Silicon universal packaging, and a real two-computer LAN test remain outstanding. Localhost host-contract and mocked builder checks do not substitute for those environments. Windows signing and macOS Developer ID/notarization remain the previously documented distribution limitations; this review does not claim to supply signing identities. No release or upload was performed.
