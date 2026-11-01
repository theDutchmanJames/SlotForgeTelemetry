# Building SlotForge Telemetry

An offline desktop workbench for the SlotForge family. Version 0.6.2 adds static ballast placement, longitudinal centre of gravity, driven-gear clearance and clearer theoretical result labels.

## Open the app

On Windows, open `dist/SlotForgeTelemetry-0.6.2-windows-x64-Portable.exe`. This portable build needs no Node.js installation. It is unsigned.

For development, run `npm ci` and `npm start` with Node.js 22.12 or newer, or use `Start SlotForge Telemetry.cmd`. The renderer also works directly in a modern browser; browser and desktop storage are separate.

## Four pages

- **Telemetry:** edit a working draft and see live gearing, speed, rollout, power and power-to-weight. All calculation inputs are visible in the input column. The Setup inputs shortcuts jump to gearing, motor, tyres/clearance, weight/ballast, gear finder and lap speed. Analyze provides an Edit these inputs shortcut for each topic. Balance and clearance update live when their inputs are entered. Save setup updates its library entry; Save as copy creates a separate snapshot.
- **Analyze:** select a saved setup to explore motor curves, an operating-point slider, weight/ballast, tyre wear, gear candidates and lap calculations. Compare setups shows two saved snapshots with absolute/percentage differences and no graphs. Colours highlight the selected performance metrics; tradeoffs and incompatible rating conditions stay neutral.
- **Library:** search and sort saved setups, inspect details, edit in Telemetry, analyze, compare, rename, duplicate or delete. Delete has confirmation and undo. Import/export backs up the whole library.
- **Settings:** eight family presets and custom colours, plus explanations of every calculation with formulas, worked examples and assumptions. The header Light/Dark switch remembers a preferred preset for each mode.

The interface and drivetrain icons use Paddock's original SVG paths, bundled in `renderer/paddock-icons.js`. Motor icons are blue, gearing amber, tyres violet and weight teal; the same category colours identify panels, results, analysis topics and calculation help. Light themes use darker variants for contrast. Comparison red/green remains reserved for performance differences. The earlier custom shaded artwork has been replaced.

## Saved data and compatibility

The draft autosaves independently from the library. Editing it never changes saved analysis until you explicitly save. Loading a library entry asks before replacing the draft. Export file/Open file preserve the existing individual setup JSON format. A legacy reference field remains round-trippable for compatibility; the new comparison view uses full library entries.

Library backups are validated completely before import; imports create copies. Limits are 500 entries, 2 MB and 2,000 characters per note. Invalid stored libraries are left untouched, and failed writes never report success. Export a backup before clearing app data or moving devices.

The existing storage keys and desktop profile directory, SlotForge Calculator, are retained. No Paddock database, account, server or network service is required.

## Calculation basis

The original `renderer/performance-model.js` is unchanged from Paddock commit `908916faf6572b0dd9a087fd6a813798081af0e7`. See SOURCE-NOTICES.txt for provenance.

Speed uses fitted outside tyre diameter. In rim mode, diameter = rim + twice radial tyre thickness. No-load speed is a theoretical ceiling, not a predicted lap speed.

Motor curves require Brushed DC, confirmed stall torque and matching RPM/torque test voltages. They use a linear ideal motor model. Voltage entries describe measurement conditions; they do not rescale RPM. Stall force applies at zero speed. Peak mechanical power is not a continuous rating.

Weight calculations use total mass or the sum of both axle readings. Acceleration uses curve force, an explicit efficiency assumption and mass; it excludes traction limits, rotational inertia and drag. Ballast placement uses wheelbase, a position between the axles and level axle scale readings to calculate static load shares and longitudinal centre of gravity; the guide must be clear and magnetic pull absent. Driven-gear clearance uses measured outside diameter and fitted/worn tyre diameter, with warnings at zero or negative clearance. Estimated wheel force and power apply the assumed drivetrain efficiency at the saved motor operating point. Tyre wear reruns speed, rollout and force at a smaller diameter and estimates rear axle height change. Gear finder ranks up to 20 integer combinations by target rollout; real parts compatibility must be checked separately. Applying a candidate creates a draft change, requiring an explicit save.

Lap average uses measured lane distance and time. Scale speed is a simple size conversion, not full-size vehicle physics. Settings contains detailed formulas and examples for these calculations.

## Verification and packaging

`npm test` runs model tests; `npm run check` checks JavaScript syntax. `npm run test:ui` exercises all four pages in an isolated Electron profile under test-results, including saved-only analysis, comparisons, library lifecycle, backup/import, failed storage, theme preferences and narrow layouts. Screenshots are saved there.

`npm run dist` builds the Windows portable executable. `npm run pack` builds an unpacked application.

### Linux and macOS builders

These follow [SlotForge Timing's local builder workflow](https://github.com/theDutchmanJames/SlotForgeTiming/blob/main/build-linux.sh). Run each builder on its own operating system with Node.js 22.12+ and npm installed. Initial builds need internet access. Normal builds use `npm ci` with the committed lockfile, then run syntax checks and model tests before packaging.

| Platform | Normal build | Quick build | Outputs |
| --- | --- | --- | --- |
| Linux | `bash build-linux.sh` | `bash build-linux-quick.sh` | AppImage and DEB in `dist/linux/`, for the host's x64 or arm64 architecture |
| macOS | `bash build-mac.command` | `bash build-mac-quick.command` | Universal DMG and ZIP in `dist/mac/`, containing Intel and Apple Silicon support |

Both accept `--install`, `--no-install`, `--uninstall`, and `--no-pause`. Without an install option, interactive builds ask whether to install; unattended builds only package. Quick mode reuses available dependencies and skips tests/checks, so use it only for revisions already checked. It may still download packaging tools.

For example: `bash build-linux.sh --no-install --no-pause`. On macOS, run `chmod +x build-mac*.command` once to enable double-clicking the builders in Finder. The `bash` commands work without changing executable permissions.

Linux installation copies the AppImage and icon under `${XDG_DATA_HOME:-$HOME/.local/share}/slotforge-telemetry` and adds an applications-menu entry. The shortcut uses AppImage extract-and-run so FUSE is not required; it keeps Chromium's sandbox enabled. Linux systems that restrict unprivileged user namespaces may require administrator configuration before Electron apps can run. The DEB can instead be installed with the distribution's package manager.

macOS installation uses `~/Applications/SlotForge Telemetry.app`. It replaces only copies previously installed by this builder, and refuses to update a running app. The universal app uses an ad-hoc signature; it is **not Developer ID signed or notarized**. These builders do not remove quarantine attributes or change Gatekeeper settings.

Uninstall removes the builder-installed program and its shortcut, keeping saved setups and settings in the existing **SlotForge Calculator** profile directory (`~/.config/SlotForge Calculator` on Linux, normally; `~/Library/Application Support/SlotForge Calculator` on macOS). It does not uninstall a DEB or an app dragged elsewhere from a DMG.

For packaging directly after `npm ci`, use `npm run dist:linux -- --publish never` or `npm run dist:mac -- --publish never` on the corresponding OS. The scripts never publish a release. Platform outputs have separate folders, and filenames identify architecture. Both use `assets/icon.png`; Windows continues to use `assets/icon.ico`. Package metadata points to the SlotForge Telemetry repository.

Windows is the tested runtime. The Linux/macOS builders have local syntax and mocked workflow checks; native packaging, installation and runtime verification remain to be performed on Linux and macOS.

The SlotForge Source-Available License is retained; see LICENSE.

Engineering references: [Pololu motor and gearing principles](https://www.pololu.com/docs/0J21/5.c), [OpenStax rolling motion](https://openstax.org/books/university-physics-volume-1/pages/11-1-rolling-motion), [OpenStax static equilibrium](https://openstax.org/books/university-physics-volume-1/pages/12-2-examples-of-static-equilibrium), [NIST conversion factors](https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9), and [Maxon motor-model limitations](https://support.maxongroup.com/hc/en-us/articles/360013761160-Motor-data-and-simulation). Ballast balance and gear clearance are derived ideal geometry/static-equilibrium calculations, not measured handling predictions.

## GitHub package builds

Run **Actions → Build app packages → Run workflow** on the intended commit. Native Windows, Linux x64 and macOS runners install locked dependencies, run checks and produce downloadable workflow artifacts. Windows also runs the isolated desktop checks. This workflow does not create tags, GitHub releases or release drafts, and it does not publish anything to Releases. The Mac app is ad-hoc signed, not Developer ID signed or notarized.
