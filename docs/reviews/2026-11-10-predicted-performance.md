# Predicted Performance review — 10 November 2026

## Scope

Reviewed the new advisor model, renderer, styling, routing, help, setup serialization and extended run snapshots. Existing uncommitted chassis/branding work was retained. No app version change, commit, push or release was performed.

## Implemented and checked

- Optional symptom-first entry without a library setup; observation-only by default, including when the bundled example is present.
- Progressive optional context and measurement inputs, six calculation areas, explanation/trade-off/test guidance and links to all workshop tools.
- Separate baseline and proposed vertical mass/gearing/magnetic changes; no mutation of running mass, motor or gear inputs.
- Component CG and approximate inertia, confirmed static support-edge geometry, bounded magnetic angle interpolation, method/rail gates and unknown-versus-zero handling.
- Setup/file/library persistence with legacy defaults; incomplete measurement tables retained without manufactured results. Numeric syntax/range errors preserve the last valid persisted workspace.
- Captured physical/prediction test evidence independent from later library edits, with recursive test content excluded and legacy chassis-only snapshots preserved.
- No dynamically inferred grip, safe corner speed, drift recovery time, diagnosis probability or lap-time gain. Hardware integration excluded.

## Findings fixed

1. Help’s generic action navigated to Telemetry instead of the prediction page. Routed through shared input focusing and gave the prediction help action an accurate label.
2. An invalid optional advanced numeric field initially suppressed all advice. Validation now withholds that input while preserving symptom guidance; persistence still rejects invalid numeric fields.
3. Support geometry could be combined with a different entered running mass. Explicit consistency checks now withhold the combined result.
4. A vertical move could claim impossible existing part mass/moment combinations, including moving the entire car mass from a different initial height. Those comparisons are rejected.
5. CG uncertainty could imply an impossible residual moment. Such bounds are withheld and explained.
6. Single-driven-gear substitution could bypass an entered compound train. The comparison is withheld and directs the user to the compound tool.
7. Symptom advice initially appeared only in the handling category. Slow/braking/fade/hopping/consistency advice now appears in the appropriate area; throttle/coast/brake and corner-phase observations refine the test.
8. The first layout collapsed the source controls. User testing showed this hid whether stock data was included; the source selector is now always visible, with saved-setup selection still expandable.

## Validation

- JavaScript syntax checks: passed.
- Full unit suite: 143 tests; 138 passed, 5 skipped, zero failures. Skips are four opt-in Unix shell checks and the optional live Paddock host integration. Local mock-host tests passed outside the filesystem/network-restricted sandbox.
- New Prediction UI suite passed: no-library start, all inputs optional, escaping, proposals, save/load/reload, historical evidence, incomplete table recovery, help navigation and area/route transitions.
- Existing UI suites passed: pages, workshop, magnetic, chassis, shell, Paddock race UI, race analysis, race progress and manual laps. Prediction and chassis suites rerun after final changes.
- Prediction layout checked for horizontal overflow at 390, 760 and 1440px in light/dark; rendered desktop dark and narrow light screenshots visually inspected. No renderer console errors in the UI suite.
- `git diff --check`: passed (repository line-ending normalization warnings only).

## Practical limits

Class-rule prose is recorded, not automatically interpreted; numeric checks remain in Class limits. “Measured” is a user declaration, not certification. Mass/geometry models are bounded analytical comparisons, not a validated dynamic slotcar simulator. Captured setup byte limits remain enforced. These limits are explicit in the interface and calculation guide, rather than represented as precise predictions.

## Follow-up calculation and presentation audit — 10 November 2026

The user’s 19 mm tyre / 18 mm gear / 17 mm optional gap target exposed a product error: the inverse target calculation was being presented as a useful tyre size and negative wear allowance. Explaining its arithmetic did not make those outputs suitable for this app. The current result is 0.5 mm actual gear clearance; the unsupported target generates neither a tyre recommendation nor a wear-life estimate. Saved input is retained rather than silently changed.

### Reviewed areas

| Area | Checks and outcome |
| --- | --- |
| Motor, gearing and rollout | Verified teeth ratio, circumference, RPM/minute conversion, gf·cm → N·m, radius-based force, linear brushed-DC operating points and peak power. Added a sweep of realistic gearing and tyre sizes checking wheel force × road speed = wheel power, including efficiency and endpoint zeroes. No voltage rescaling or RPM-based handling verdict. |
| Tyre dimensions and clearance | Added a shared 1:32 calculation envelope: fitted tyre diameter 8–30 mm; optional gear-gap target 0–3 mm; driven gear diameter up to 30 mm. These are supported application bounds, not manufacturer fit guarantees or class rules. Raw legacy measurements remain readable. Out-of-scope inputs cannot produce dependent tyre dimensions, speed or force. Actual gap and gear protrusion are separate results. |
| Tyre wear and preparation | Actual clearance is independent of optional targets. Remaining usable diameter cannot be negative. Below-minimum diameter is a positive shortfall. Life starts at fitted diameter, using history only for wear rate (latest history diameter is a fallback when fitted diameter is absent). Zero wear does not become infinite life; absent history stays unknown. Oversized rollout-derived tyre targets are withheld. |
| Rim calculation | Clarified that the formula requires measured tyre-seat diameter and rubber thickness at that seat, not an arbitrary catalogue flange diameter. Direct fitted outside diameter remains preferred. |
| Weight, force and acceleration | Verified g/kg conversion, matched operating points, efficiency and mass fallback. The force/mass acceleration remains an explicitly ideal calculation, not a traction-limited acceleration prediction. Magnetic pull is not added to inertial mass. |
| Static support and ballast | Verified support load and moment conservation, guide/front-axle distinctions, CG coordinates and triangle-edge distances. Fixed moves/removals of more mass than exists and near-singular automatic ballast solutions. Automatic additions must fit both the current-mass planning cap and any entered maximum; infeasible additions are not displayed as suggestions. |
| Component mass properties | Verified mass-weighted x/y/z, point-mass and uniform-box inertia terms, completeness and mass reconciliation. Partial inventories do not supply whole-car CG. Vertical ballast changes preserve appropriate moments. |
| Magnetic measurements | Verified gf/N conversion, total static support, bounded height/angle interpolation, repeat statistics and matched measurement basis. A worn motor projection below rail level no longer displays negative running clearance or supplies a magnetic estimate. Signed measured slopes remain valid quantities. |
| Setup comparison | Fixed colours so only the selected goal is judged. Incompatible test voltages/magnetic conditions no longer produce comparison deltas. Percentage quantities use percentage-point deltas. No universal “higher RPM is better” verdict. |
| Electrical and bench records | Verified steady-DC voltage drop, current-based resistance/loss, torque-arm units and simultaneous mechanical/electrical power. Pulsed/unknown electrical conditions and impossible efficiency are withheld by existing checks. |
| Standard gear geometry | Verified module/diametral-pitch conversion and external-spur centre distance. Oversized derived pitch diameters and corresponding centre distance are withheld. Proprietary fixed-diameter slotcar gears still require actual part compatibility; no tooth-count-to-outside-diameter inference was added. |
| Rotating inertia | Verified annulus inertia, squared speed ratio, equivalent mass and inclusion of physical component mass only once. All listed components must fit total car mass. |
| Braking/coast-down | Verified time differences, km/h to m/s, trapezoidal distance and mean deceleration. A partial record is not called a full stopping distance; signed acceleration remains meaningful when speed increases. |
| Strategy, class limits and uncertainty | Verified additive incident/pit costs, break-even equations, explicit-zero versus unknown, bounds and class inequalities. Diameter uncertainty now reports clear gap and possible protrusion separately, never negative clearance. Entered bounds are not statistical confidence. |
| Lap statistics and continuity | Verified validity/pit/record eligibility, mean, interpolated median/IQR, best-five windows and opening/closing windows. Fixed windows and chart segments crossing timestamp gaps/overlaps despite adjacent lap numbers. Corrected synthetic “continuous” fixtures to have matching durations and timestamps; individual times and ordinary averages are unchanged. |
| Assistant and persistence | Workbench inclusion stays visible; stock results are shown, note-only fields are labelled, and each area explains useful optional next inputs with working links. Null metric tables are no longer labelled calculated; real zeroes and table-only tools remain visible. Library round trips, legacy data, immutable snapshots, escaping, theme and responsive checks passed. |

### Reference checks

- [Slot.it 2025 parts catalogue](https://slot.it/wp-content/uploads/2024/12/SLOT.IT-SPAREPARTS-2025-web-ok-1.pdf): checked mounted tyre sizes and distinction between wheel and fitted tyre dimensions. The app’s wider 8–30 mm envelope is a product scope decision, not a quoted industry standard.
- [Slot.it crowns and pinions](https://www.slot.it/INGLESE/KitPart/Technique/TecPinions.html): different tooth counts can share an outside diameter; actual gear diameter must remain an independent input.
- [NSR setup guide](https://nsrslot.com/wp-content/uploads/2025/12/guidaElaborazione_GB.pdf): checked representative AW/SW/IL gearing and wheel/tyre setup context.
- [Slot.it anglewinder mount reference](https://slot.it/Download/FAQ_PDF_en/33-Slot.itAWMotorPods.en.pdf): motor-mount offset changes chassis height; tyre radius change is not a universal whole-car clearance calculation.
- [maxon motor data and simulation](https://support.maxongroup.com/hc/en-us/articles/360013761160-Motor-data-and-simulation): checked motor-model basis and the distinction between ideal curves and actual operating conditions.

### Follow-up validation

- 156 automated tests: **151 passed, 5 skipped, zero failures**. The skips remain four optional Unix-shell builder tests and the live Paddock-host test. Local mock-host, storage and import tests passed outside the restricted filesystem/network sandbox.
- All ten Electron suites passed: pages, prediction, workshop, chassis, magnetic, shell, Paddock connection, race analysis, progress and manual laps. Changed lap suites were rerun after the continuity fix.
- New regression tests reproduce the exact screenshot inputs, test gap/protrusion across realistic diameter pairs, preserve legacy raw inputs, cover unknown/zero wear, check motor-energy identities, reject near-singular ballast suggestions and break lap windows at timestamp pauses.
- Desktop tyre-results screenshot visually checked: 19 mm tyre and 0.5 mm gap, no oversized recommendation or negative wear allowance. Responsive and light/dark checks remain in the UI suites.
- Syntax and whitespace checks passed. No version bump, commit, push or release in this work.

### Input examples and data readiness follow-up

- Moved all example placeholders into labelled help outside inputs: workshop measurements, support readings, magnetic measurements, manual laps, setup/part names and Paddock address. Instructions for note fields also remain visible outside the fields. Neutral optional/search prompts remain.
- Added input-presence labels without treating entered text as validated data. Help is associated with inputs through `aria-describedby`; existing validation descriptions are retained. Example text is never assigned to input values or persisted as measurements.
- Manual lap examples and instructions follow the chosen units and paste format without converting or changing the user's text.
- Predicted Performance identifies its current-workbench source and shows recorded data, actual results and optional gaps separately. Added per-record validation and targeted prompts for partial wear/braking records, missing electrical mode, incomplete A/B tests and entered class limits. Zero wear does not trigger a request to repeat an existing minimum diameter. Excluded workbench measurements do not produce re-entry prompts.
- Regression suite: 158 tests, 153 passed, five optional skips. Prediction-specific tests also passed after the final zero-wear/missing-gear refinements. Syntax and whitespace checks passed.
- Six affected Electron suites passed: prediction, workshop, magnetic, chassis, manual laps and pages. Checked external examples and prediction results visually; responsive/theme assertions include 390, 760 and 1440 px. Test profiles are isolated from the user's data.
- No version change, commit, push or release.
