# Changelog

## Unreleased

### Library: every setup in one binder (remake)

- **One list of all your setups, in a section per car.** Each row shows gearing, tyre, weight, top speed and the **best lap driven with that gearing** (from your runs of that car with the same pinion and gear). Cars without setups show with a *New setup* button; setups without a car have their own section.
- **Favourites:** star a setup. Filters: *All*, *Favourites*, *Driven*, *Not driven yet*, next to search and sort.
- **Tick several setups** for one action bar: *Compare* (two or three, on the Setups page), *Export files* (one setup file each) and *Delete* (one confirmation, with Undo).
- **The selected setup is a spec card:** gearing, ratio, top speed, weight, power-to-weight and rear tyre, where it was driven, notes, and *Open on the workbench*, *Compare with…*, *Setup sheet*, *Rename*, *Duplicate*, *Export file* and *Delete*.
- **Cars & tracks** sit below the setups on the same page: cars as a list beside the selected car, tracks under them. The side list is gone; *Library → Garage* links scroll to Cars & tracks.
- A favourite is stored with the setup in the library file. Older Telemetry versions open the file and ignore the star.

### Setups: what does this change do? (remake)

Analyze is now **Setups**, built around one question: what does a change do?

- **Your setups by car** in a list beside the page. Click one to read its results, with the topics (Performance, Gear finder, Weight & ballast…) right under the list.
- **Tick one or two more** to compare, up to three at once. **The workbench now** can be one of them, so you can see what a change does before you save it. Click another setup's name to make it the base.
- **The Change Sheet** replaces the 20-row comparison table:
  - **In short:** a plain verdict per setup, such as "quicker on the straight (+11.1% no-load speed) and pulls less out of a corner", "8 g lighter" or "more power for its weight".
  - **What you changed:** the inputs that differ, named as on the workbench, in your units.
  - **What it does:** only the results that moved, each with a bar: green when better for that result, red when worse, grey for results that depend on the track (ratio, rollout, weight).
  - **New result: pull per kg**, how hard the car accelerates its own weight.
  - Results that did not change, need a value in each setup, or were measured on a different basis (another motor test voltage, other magnetic conditions) fold away into one line each, instead of rows of "Unavailable". The same-basis rules are unchanged.
- With one saved setup, Compare uses the workbench now as the second.

### Laps: every run on one wall (remake)

Your laps used to be spread over six pages: Track day, Analyze › Laps, Compare runs, Progress, Records and Library › Race results. They now have one page, **Laps**, in the top bar between Track day and Analyze. Every run of a car on the same track and lane lands on one wall, whether it came from Paddock, Track day or was typed in.

- **Pick the car, then the track and lane.** Cars are tiles, newest first; the tracks and lanes it ran on are chips with their number of runs.
- **A scoreboard:** the record (and the run it was set in), the pace now (typical lap of the last three runs), how much you gained since the first run, and how consistent the last run was.
- **The wall:** one row per run, newest on top, one square per lap, coloured from green (at the record) to red (6% slower). The record lap is purple, the best lap of each run is outlined, excluded and pit laps are hatched in their place. Switch the colours to compare each lap with its own run's typical lap instead. Twelve runs show at first, the rest one click away; a long run shows its first 40 laps.
- **What changed** is marked between runs (for example *pinion 9 → 10*), read from the gearing, motor, tyres and weight each run was driven with.
- **What moved the pace:** every setup change on that track and lane with the typical lap before and after it.
- **The selected run** opens beside the wall: its laps as a small chart, stints, the comparison with the run before, what it was raced with, and its actions: *Compare with the run before*, *Full lap analysis*, and for runs you typed in or logged on Track day, *Edit laps* and *Delete*.
- **New: a note and a kind on every run** (Practice, Test, Club night, Qualifying, Race, Endurance), also on races imported from Paddock. They are saved apart from the laps, so imported races stay exactly as imported, and they are part of every backup.
- The full lap analysis and the comparison of two runs are unchanged, now under Laps with *Back to the wall*. Records, Progress and Library › Race results are replaced by the wall; old links land on the Laps page.
- *More* holds Connect to Paddock, Export imported races, and the backup and restore of typed-in laps.

### SlotForge look, first step

Telemetry starts to follow the new shared SlotForge look of Timing and Paddock (`SlotForgeRestyle.md`). This step changes the foundations; the page layouts follow page by page.

- **Titles** of pages, panels and windows are in Barlow Condensed: bold, italic and in capitals. **Results and figures** such as ratios, speeds, power and the gear chart are in Roboto Mono, with their units in the normal type. Both fonts are bundled (SIL Open Font License).
- **One flat button family:** the main action of a screen is filled in the accent, normal actions are flat grey, occasional tools are outlined, and Delete and Remove are red text. Small buttons are 28 px high, the others 32 px.
- **One blue focus ring** for keyboard use everywhere.
- The accent is kept for the main action, the selected thing and focus: a highlighted figure is no longer red.
- Thin scroll bars and file buttons in the theme's colours.

### Settings in the new look

- **A side list** groups the sections into *Workbench* (Appearance, Units, Calculations explained) and *Data and connections* (Connect to Paddock, Backups, Updates). Under each name a short line shows its state, such as the theme, "Metric", "Not connected", the last backup or the version.
- **Units** is a section of its own. Each value is a small segmented choice (km/h · mph, g · oz…) instead of a drop-down list.
- **Every section is one calm sheet:** a head that says what it is for, then groups of slim rows with the name and one line on the left and the control on the right.
  - Backups puts *Back up now*, the backup folder, the extra copy and *Save* / *Restore* in their own rows.
  - Updates shows the version facts as rows, the newest version as a small status pill, and automatic checks as a switch.
  - Connect to Paddock separates *this computer* from *another computer*, with the address and password as rows.
- On a narrow window the side list becomes a row of buttons on top.

### Analyze in the new look

- **A side list** beside the page holds the modes: *Setups* (Analysis, Compare) and *Track laps* (Laps, Compare, Progress, Records). The topics of Analysis sit right under it in their three groups, so the page itself starts with the setup and its results.
- Topics with nothing saved for the setup are shown in a lighter grey and still open.
- **Calmer cards and charts:** result cards, charts, lap summaries and side panels have plain borders. Colour stays on the small icon tiles and the open item's icon.
- On a narrow window the side list becomes rows of buttons above the page.

### Library in the new look

- **A side list** holds Saved setups, Race results and Garage, each with a short line such as "2 saved setups", "5 imported races" or "3 cars · 1 track".
- **One toolbar above your setups:** *Open workbench* first, then *Import library* and *Export library*, with search (with a magnifier) and sort on the right.
- **Garage cards:** each car shows its photo edge to edge, or a car icon when there is none, with the name in capitals, maker and class, setups and runs, and where it comes from. *Add car* is the main button of the Garage.
- The selected setup's buttons are plain: no more coloured edges on Analyze and Compare.

### Workbench in the new look

- **The setup bar:** the setup name is large, in the title type, in a field with a pencil, so it is clear you can type in it. The car sits under it with a *Manage cars* link to the Garage. The saved state is a small tag in the top corner: a yellow dot for a draft or unsaved changes, a green tick once it is saved in the library. Underneath, one row holds every tool: New setup, *Load example* (no longer a small floating link), Open file, Export file and Setup sheet on the left, *Save as copy* and *Save setup* on the right.
- **Quick setup / Measure the car / Plan & test / Everything** is now a row of tabs above both inputs and results. Each tab says what it shows, such as "Gear chart, lap speed, track tests", and the open one is underlined in the accent colour.
- **The gear chart always shows your current gearing**, even when it is outside the Gear finder ranges: the chart widens to include it and says so. The current cell has a clear outline and a dot, and its pinion and gear are marked at the edges of the chart.
- **Input and result folders** are plain boxes with their name in the title type and a chevron. An open folder gets a thin accent line on its left and shows its icon in colour; closed folders are grey. Pinned result groups show a grey Pin.

### Track day in the new look

- **A short note under the title** explains the page: change one thing, drive, enter your laps. Each run is compared with the one before it, and saved runs also appear in Analyze.
- **Current setup** is a list of rows, with the name on the left and the value on the right in the numbers type, so long values such as the rollout stay on one line.
- **Compare with last run** and **Today's runs** are quiet tables: small grey column names, thin lines and times in the numbers type. Each change shows as a small green (faster) or red (slower) chip.
- *Save run* is a normal-height button, and lap times are typed in the numbers type.

### Driver Feedback in the new look

- **A short note under the title** says what the page does, that measurements are optional, and that your answers are saved with the setup on the workbench.
- **The five steps** are a side list like Settings and the Library. The open step is lifted in grey, with its number in Driver Feedback's green.
- **One accent:** the main buttons (*Show my first checks*, *Use my setup*…) use the theme's accent like every other page, instead of green. Green stays on icons and the open step.
- Optional sections open from plain names with a small arrow instead of blue links. *Next useful question* and *How does your car behave?* (on the workbench) are quiet boxes with a thin accent line.
- In the top menu, Driver Feedback is marked like the other pages when it is open.

### The top bar in the new look

- **One slim bar:** the six pages sit in three groups on a dark track: Telemetry and Track day, Analyze and Driver Feedback, Library and Settings. The open page is lifted in grey with its icon in the accent colour.
- **Status lights on the right:** the Paddock connection and the save state are a small pill next to Light / Dark, so the separate grey line under the menu is gone. In narrower windows the words go first (hover the light to read them), then the page names; the icons always stay.
- The grey line under the menu is gone; the version number stays in the footer.

### New versions, the same way as every SlotForge app

- **Once at start:** Telemetry looks for a new version about five seconds after it opens, and not again until the next start. When nothing is new, nothing happens.
- **A window shows a new version:** its number, a few lines on what is new, your copy (for example *Windows · installer*), the release date and the file for your copy with its size. It replaces the small notice in the top bar.
- **Download** saves that file in your Downloads folder, shows its progress (with *Cancel*), checks that it is complete and matches the release, then offers *Show in folder* and one line on how to install it. Telemetry never runs or installs anything by itself.
- **Skip this version** keeps the window away until an even newer version is out. Closing the window only hides it until the next start.
- **Settings → Updates** shows this version, the newest version, when Telemetry last looked, a switch for the check at start, *Check now* (which always shows the window when there is something newer, even a skipped version) and a button to open the window again.
- The Windows downloads are now called `SlotForgeTelemetry-X.Y.Z-Setup-x64.exe` and `…-Portable-x64.exe`, like the other SlotForge apps.

### Finishing touches

- **Every table** has the same quiet look: small grey capitals over the columns, thin lines between rows and a light highlight on hover. The selected setup in the Library is lifted in grey. The gear chart keeps its own grid.
- **Calculations explained** reads more calmly: the topics are small grey chips, with the open topic lifted and its icon in colour. Formulas, examples and limits sit in plain boxes.
- The last coloured edges are gone. *A useful starting point*, *Ready to look deeper?*, chassis snapshots and the ballast planner are quiet boxes, some with a thin accent line.

## 0.14.0 — 17 November 2026 · Track day, Garage and backups

### Faster with a full library

Measured with 200 setups, 300 imported races, 300 lap sessions and 40 cars:

- **Start-up:** the page is ready in about half the time (1.2 s → 0.5 s), and the window opens while stored races and laps are still being checked.
- **Searching races** reacts about five times faster (≈ 240 ms → 45 ms per keystroke). Dates and numbers now reuse one formatter instead of building a new one for every row and figure.
- **Changing pages:** Analyze, Library and Driver Feedback open in about 20–40 ms instead of 100–140 ms. The saved library is only checked again when it has changed, and a page opened by a button is no longer drawn twice.
- **Typing on the workbench** costs about 5 ms per key instead of 20 ms. Driver Feedback recalculates when you open it rather than on every key, and the draft is saved shortly after you stop typing instead of on every keystroke. It is still saved straight away when Telemetry closes, reloads or loses focus, and before a backup is made. Typing while a restore is being confirmed can never overwrite the restored data.
- **`npm run perf`:** measures start-up, page changes, typing and storage calls in a throwaway profile with a heavy example library (`--empty` for a first start, `--json <file>` to keep the numbers).

### New version notice

- **Telemetry tells you when a new version is out,** the same way Paddock does. Installed and portable copies ask GitHub for the newest published release about 15 seconds after start-up, then at most twice a day (every 3 hours after a failed check).
  - A notice in the top bar offers **Download**, which opens the release page in your browser, and **Not now**, which hides it until an even newer version appears.
  - Telemetry never downloads or installs anything itself. Only the version number is requested; the page it opens is built from this app's own repository and the checked version number.
  - Drafts and pre-releases are ignored, and a new release waits an hour so every download is attached first.
- **Settings → Updates:** this version, the newest version, when it last checked, **Check now**, and a switch to turn automatic checks off. Development copies only check on Check now.

### README pictures

- **New pictures of the app:** the README now shows the current version, including Track day and the garage.
- **`npm run screenshots`:** remakes every README picture from the real app, in a temporary profile filled with example setups, cars and laps only.

### Backups and file storage

- **Automatic backups of everything:** one backup file holds all Telemetry data (saved setups, workbench draft, manual and Track day laps, garage, imported races and the Paddock car catalogue).
  - A backup is made when data changed: shortly after start-up, every 12 hours while open, and when quitting. The newest 10 are kept.
  - Optionally, each one is also copied to a folder of your choice, such as a USB stick or a cloud-synced folder.
- **Settings → Backups:** Back up now, Save a backup as…, Restore from a file…, Open backup folder, and a list of recent backups to restore. Before anything is replaced, every file in a backup is checked against its fingerprint and its own validator, and the current data is saved as a "before a restore" backup. Telemetry restarts afterwards.
- **Setups are plain files now:** the setup library, active setup and workbench draft live in Telemetry's profile folder next to the other data, written atomically. On first start they are copied from window storage, including unreadable data so recovery can still offer it, and the old copy is left in place as a safety net. Library rules, recovery and file formats are unchanged.

### Garage

- **Garage (Library → Garage):** cars and tracks in one place.
  - **Paddock cars** come in with each import from Paddock on this computer: name, maker, class, availability, current technical configuration and photo. They are read-only; edit them in Paddock. The catalogue is incremental, following Paddock's car change feed, and photos are verified against their SHA-256 fingerprint before use.
  - **Telemetry cars** can be added for cars that are not in Paddock.
  - **Tracks** store their lanes and lane lengths.
  - A car's detail shows its setups, best eligible lap per track and lane (imported races by Paddock car identity, manual and Track day runs by car name), and buttons to start a new setup or a Track day with it.
- **Setups name their car:** a **Car** choice next to the setup name, saved with the setup and its exported file. Older files have none, and older Telemetry versions ignore it.
- **Track day uses the garage:** car and track names are suggested, the workbench setup's car is preselected, and a garage track supplies the lane length that is saved with each run.

### Track day

- **Track day:** a new page for the change → drive → enter laps → compare loop at the track.
  - Set the car, track, lane and driver once; they are remembered on this device.
  - See the current workbench setup in large figures, note what you changed and type or paste lap times, with a live best, typical and spread preview.
  - **Compare with last run** shows a plain verdict ("typical pace faster by 0.250 s") with a better/worse table and the setup differences, even before you save.
  - Saved runs are ordinary manual lap sessions, with the gearing, tyre, weight and RPM snapshot attached, so Lap analysis, Progress, Compare runs and Records include them. **Today's runs** lists them with their change notes.

### Simpler workbench and Analyze

- **Simpler workbench:** a level switch above the inputs.
  - **Quick setup** (default) shows only gearing, motor, rear tyres and weight, with their results.
  - **Measure the car** adds tyre wear and clearance, axle loads, chassis geometry and magnetic downforce.
  - **Plan & test** holds the Gear finder, lap speed and Testing & planning.
  - **Everything** shows the full page as before.

  Hidden folders keep their values, and calculations always use every input. Jumping to an input from help, Analyze or Driver Feedback switches to a level that shows it, and the choice is remembered on this device.
- **Simpler Analyze navigation:** the six modes sit in two labelled groups, *Setups* (Analysis · Compare) and *Track laps* (Laps · Compare · Progress · Records). The eight setup topics are grouped as *Essentials*, *Measurements* and *Planning*. Topics with nothing saved for the selected setup are dimmed but still open, so it is clear where there is something to look at.
- Input examples are lighter: an empty field shows one short "Example, not used" line, and the example folds away once a value is entered.

### Units

- **Units:** **Settings → Units** offers Metric, Imperial or a custom mix of speed (km/h, mph), weight (g, oz), motor torque (gf·cm, oz·in, mN·m), small lengths (mm, in) and lap distance (m, ft).
  - The workbench inputs, live results, Analyze, the gear chart and Gear finder, setup comparison, the library and setup sheets follow the choice. Power-to-weight becomes W/lb with ounces.
  - Saved setups, files and backups always stay metric, so they remain compatible. A value typed in another unit is stored in metric.
  - Specialist tools (chassis geometry, magnetic downforce, Testing & planning, Driver Feedback) and Calculations explained stay metric for now.

### Paddock on this computer

- **Paddock on this computer:** connect to the Paddock collection on the same computer with one click and no password, and import every race in it. That includes races Timing saved to a Shared library (`history-v1`), which never appeared before.
  - Discovery uses Paddock's private local connection file, and the credential stays in the main process.
  - Imports are incremental. Every session is verified against Paddock's accepted content hash, and corrections and withdrawals follow Paddock.
  - Telemetry reconnects after Paddock restarts, imports automatically at startup, and refreshes when you return to the app.
  - Records use the track-record flag; a run's best lap uses the personal-record flag.
  - Historical gaps (unknown times, lanes or dates) stay unknown and never count towards pace.
  - Tested against Paddock's contract fixtures and, optionally, against Paddock's real local service (`SLOTFORGE_PADDOCK_SOURCE`).
- **Paddock connection touch-up:**
  - The connection steps now follow Paddock's current menus (Connections → Dealership Mode) and drop the retired legacy-sharing wording.
  - Telemetry remembers the last collection and address (never the password) and finds the collection again when Paddock restarts on a new port. **Forget** clears it.
  - Connecting imports results straight away.
  - Unreachable hosts get plain explanations instead of "fetch failed", and an empty search explains the usual causes.
  - A full notification queue on Paddock no longer locks the host for 60 seconds.

### Gear chart and setup sheet

- **Gear chart:** a pinion × driven-gear grid over the Gear finder ranges, showing rollout, no-load speed or ratio. Cells within 1% / 3% of the target rollout are highlighted and the current gearing is outlined. On the workbench it is a live result group; clicking a cell applies that gearing to the draft. In Analyze → Gear finder, clicking opens the saved setup with that gearing. Large ranges are capped at 30 × 60 with a visible note.
- **Setup sheet:** download a printable one-page sheet of the workbench draft (**Setup sheet** next to Export file) or a saved setup (**Library → Setup sheet**). It includes inputs, calculated results, notes, a nearby-gearing table and an area for handwritten track notes. Print it or save it as PDF from the browser's print dialog.

### Installers

- Add a Windows installer (`…-windows-x64-Setup.exe`) next to the portable executable. It offers a current-user or all-users install, a choice of folder, Start menu and desktop shortcuts, and an uninstaller that keeps saved setups and laps.
- Every platform now has a portable app and an installer: Windows Portable.exe / Setup.exe, macOS ZIP / DMG, Linux AppImage / DEB.
- Add `build-windows.cmd`, a local Windows builder that checks, tests and verifies both outputs.

## 0.13.0 — 13 November 2026 · Symptom-specific Driver Feedback

- Give all ten starting behaviours distinct follow-up routes, including lack of power, controller response, tyre-to-rim slip, guide escape and deterioration during a run.
- Add optional questions with skip/revisit controls, editable answers, effort/equipment labels and easier alternatives.
- Incorporate SlotRacer setup-guide checks for tyre shoulders, body versus pod adjustments, analogue/digital systems and shared power effects.
- Separate inspection outcomes from setup-change results; retain uncertainty and unresolved findings without treating an inconclusive result as proof.
- Preserve an investigation in the library before opening a different symptom, carrying existing measurements forward.
- Add Start over with confirmation: clear feedback and test history while retaining car measurements and saved setups.
- Scope individual checks to relevant setup details, migrate older histories and prevent inactive answers or contradictory crossover loops from steering advice.
- Expand regression coverage for all routes, outcomes, saving, reset, cancellation, migration and responsive light/dark layouts.

## 0.12.0 — 13 November 2026 · Adaptive Driver Feedback

- Connect measured support geometry, body mass, ballast plans, tyres, magnetic force, gearing, electrical/braking tests and lap comparisons to specific advice with visible evidence.
- Choose the next useful question from missing relevant inputs; preserve simple observation-only use and keep unresolved findings visible.
- Add individual mechanical checks with setup-aware records, explicit reconfirmation and linked track-test outcomes.
- Include a searchable 79-record research catalogue and 12 curated, source-linked principles with counterexamples and limits.
- Preserve legacy outcomes and setup files; gate angle-force interpretation on motor-off, net-force measurements and responsive rails.
- Add model and desktop regression coverage for adaptive advice, questions, evidence and persistence.

## 0.11.0 — 13 November 2026 · Driver Feedback & visual ballast planning

- Replaced Predicted Performance with a dedicated Driver Feedback page and five guided steps, from a driving symptom and practical checks to optional measurements and a recorded test outcome. Existing links redirect to the new page.
- Reuse current workbench values and saved setups, clearly distinguish excluded or missing measurements, and retain the setup context for each recorded outcome. Added optional body-mass share and linked owner evidence without assigning model scores.
- Compact input and live-result folders reduce scrolling; live summaries, automatic result selection, pinning and remembered layout keep related calculations together.
- Place ballast on the chassis drawing, drag new or existing points, and refine positions with keyboard arrows or precise fields. Drawing-only placements need a mass but no car dimensions; measured support calculations stay separate until sufficient data is supplied.
- Preserve drawing calibration, ballast plans and feedback through setup/library saves and exports. Planned changes never overwrite measured car weight.
- Review fixes: Driver Feedback now reuses front-plus-rear scale totals; draft moves cannot reinterpret millimetres as drawing percentages after dimensions are removed. Updated guidance documentation and the Paddock navigation regression for the new menu.
- Added model and desktop regressions for guidance, shared data, outcome context, drawing coordinates, dragging, persistence, folders and responsive light/dark layouts; workbench/folder checks now run in release CI.

## 0.10.0 — 10 November 2026 · Setup guidance & chassis planning

- Moved examples outside input fields and clarified entered, missing and partial measurement records throughout the app. Predicted Performance reuses current workbench data and requests only relevant missing inputs or confirmations. Manual-lap examples follow the selected format and units.

- Audited calculations and their presentation for 1:32 setups. Actual gear clearance is independent of optional targets; unusable targets cannot produce oversized tyre recommendations or negative wear allowances. Tyre-life estimates now start at the fitted diameter.
- Separated gear protrusion from a clear gap, bounded automatic ballast suggestions, rejected impossible part moves and below-track motor-clearance scenarios, and corrected comparison goals and incompatible-rating deltas.
- Made assistant input sources visible, identified note-only fields, added targeted optional-input guidance and removed empty calculated-result tables.
- Corrected uninterrupted lap statistics and chart segments to respect timestamp gaps as well as excluded laps, numbering and stint boundaries.

- Added Analyze → Predicted Performance: optional symptom-led guidance, six calculation areas, context questions and practical tests, usable without a saved setup or measurements.
- Added independent what-if comparisons for ballast height/addition, gearing and matched motor pull; component CG/inertia estimates, static support-edge geometry and bounded magnetic angle interpolation.
- Saved observations, methods and proposals with setups; expanded new A–B–A captures to freeze drivetrain, workshop and prediction inputs while retaining legacy snapshots.
- Added help, source documentation and regression coverage for optional inputs, measurement gates, persistence, navigation and both themes.

- Added chassis geometry, scaled guide/rear-contact diagrams, explicit weighing modes, repeat readings, horizontal CG calculations and optional measurement bounds.
- Added two-dimensional ballast add/remove/move planning, rear-share target suggestions, mass-limit margins, saved analysis and neutral setup comparisons.
- Added frozen chassis setup evidence for controlled A–B–A runs, including manual and Paddock lap snapshots; changed run rows detach their prior evidence.
- Preserved legacy axle/guide ballast tools, with an explicit copy action into the new planner. Planned ballast never changes the main measured car mass.
- Applied the approved light/dark Telemetry SVG wordmark above the slogan, beside the existing app icon, and the small SlotForge SVG footer logo.
- Added calculation, persistence, desktop and responsive regression coverage; setup import/export now applies the same UTF-8 byte limit.

## 0.9.0 — 9 November 2026 · Measurements, testing & planning

- Added measured magnetic downforce, repeated readings, force/load conversions, clearance curves, bounded interpolation, tyre-wear scenarios and entered club-limit margins. Actual mass and motor calculations remain independent.
- Added eleven Testing & planning tools: tyre preparation/life, electrical losses, motor records, race strategy, multi-part ballast planning, controlled A–B–A tests, class limits, compound gears/geometry, rotating mass, braking/coast-down and measurement ranges.
- Integrated optional inputs with live results, saved-only analysis, measured-data graphs, setup/library exports and detailed calculation help. Older setups receive blank defaults.
- Added read-only lap snapshots from manual and Paddock runs for controlled tests, retaining source identity/date and explicit conditions confirmation. Original lap records are unchanged.
- Added theme-aware SlotForge header and footer wordmarks while preserving the existing text alignment.
- Expanded the README and measurement documentation; repaired validation, finite-result, consistency-spread, provenance and theme issues found during review.
- Added regression coverage for measurements and desktop workflows, including release-pipeline checks.

## 0.8.1 — 2 November 2026 · Gear & dial identity

- Replaced the stopwatch app icon with the approved Gear & dial design, combining a gear outline with a speedometer needle and scale.
- Use the same SVG in the app header and favicon, with matching PNG and multi-size Windows ICO exports for desktop packages and the README.
- Added the SlotForge App Collection brand logo and links to Timing, Paddock, Livery, Decals and Circuit in the README.
- Calculations, saved data and Paddock integration are unchanged.

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

