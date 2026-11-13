# Driver Feedback

Guided redesign implemented 13 November 2026. Entry: Driver Feedback in the main menu, or Help me with my car on the workbench. The former Analyze → Predicted Performance link redirects to Driver Feedback. This is a local, deterministic advisor; no network, AI service, sensor, IMU or LiDAR is used.

## User flow and storage

All advisor inputs are optional. Observation-only is the default, even when the workbench contains the bundled example. A symptom produces practical checks immediately. “Not sure” is a useful state. Additional questions refine the advice without gating access.

Workbench numbers are opt-in. The page edits the current workbench, not a library entry in place. Loading a saved setup uses the existing replacement confirmation and returns to the advisor. Saving creates/updates a library snapshot; export includes the same optional fields. Older setups receive blank/unknown defaults. Partial component and angle tables are retained and flagged without inventing results. Invalid numeric or selection values cannot replace the last valid persisted workspace.

The five steps are Your experience, First checks, Your setup, Look deeper, and Try & learn. Optional measurement areas connect body mass, tyres, drivetrain, support geometry, CG height, magnetic attraction, component inventory, yaw measurements, braking and lap tests. Supporting workshop results keep their original assumptions and units. Source observations and numeric estimates are distinguished; no overall score, probability of diagnosis, inferred friction coefficient or automatic “better motor” ranking is produced. Free-text goals, constraints and rules are recorded and displayed, not interpreted by a language model.

### Knowing which inputs matter

The workbench inclusion control and source name remain visible. Each area shows available stock-data results and targeted optional next inputs, with an explanation of the calculation or advice each enables and a direct input link. Empty metric tables are omitted; a known zero remains a result. Tools that produce tables rather than summary metrics also show their available records. Stock gearing/RPM/diameter yield ratio, rollout and a no-load speed ceiling; ideal peak power and power-to-mass require the existing matched-rating checks. Entered total mass does not locate its centre of gravity or diagnose grip.

Field hints distinguish saved context from active inputs. Track, tyre and controller prose are notes only; they do not assign grip, voltage or braking values. Selected behaviour, phase, throttle, location and mechanical checks refine the relevant guidance. Body weight location is qualitative. Rail response and measurement-basis choices gate magnetic comparisons. Numeric class limits remain separate from rule notes.

Tyre preparation explicitly separates **current gap below the driven gear**, calculated as (fitted tyre diameter − gear outside diameter) / 2, from an optional **required gap**. With a 19 mm tyre and 18 mm gear, current gap is 0.5 mm regardless of an entered target. An out-of-range optional gap target cannot generate an oversized tyre recommendation or a negative wear allowance. Supported 1:32 tyre calculations use an 8–30 mm diameter envelope and 0–3 mm optional clearance requirement; these are application scope limits, not universal racing rules. Existing stored values remain intact. Usable wear is nonnegative; a real below-minimum tyre has a separate positive shortfall. Remaining life starts at the fitted diameter, falling back to the last history diameter only when fitted diameter is absent.

## Physical comparisons

### Mass and CG

Running mass uses the entered total car mass, or the sum of both front and rear scale readings when total mass is blank. The source is shown in Driver Feedback; partial readings do not supply total mass. Existing separate ballast plans are not silently applied. Vertical move of an existing part of mass m: h′ = h + m(z′ − z)/M. Addition: M′ = M + m, h′ = (Mh + mz′)/M′. Existing-part moves must leave a physically nonnegative vertical mass moment; moving the entire mass must agree with the baseline CG. Horizontal position is unchanged only for a strictly vertical move. Use the existing chassis planner for horizontal add/remove/move effects.

An optional absolute height bound propagates through these linear formulas with all other inputs held exact. Bounds inconsistent with nonnegative height or a known part's moment are withheld. They are not confidence intervals and do not include component mass/position uncertainty.

Component rows use x behind the actual front weighing support, y to the right viewed nose-forward, z above the track, all in mm. CG is Σmᵢrᵢ/Σmᵢ. Partial inventories are labelled partial and cannot supply whole-car CG height. Complete inventory totals must agree with included running mass within the explicit 0.01 g consistency check; that tolerance is not an accuracy claim.

Yaw inertia: Σ[mᵢ((xᵢ−xCG)²+(yᵢ−yCG)²)+Izzᵢ]. Roll uses y,z and Ixx. Results are g·mm². Optional length/width/height approximate each part as a uniform box: Izz=m(l²+w²)/12, Ixx=m(w²+h²)/12. Without dimensions the self-inertia term is omitted and labelled a point-mass approximation. Body shells are not uniform solid boxes. These are comparison aids, not a prediction of slide recovery time; component movement and compliance are not simulated.

### Static support geometry

Only confirmed nonmagnetic guide + separate rear-tyre weighing can produce this result. Actual support span S is distinct from guide span. Support points are (0,0), (S,−T/2), (S,+T/2). For the measured horizontal CG (x,y), inward edge distances are (Tx/2−Sy)/hypot(S,T/2), (Tx/2+Sy)/hypot(S,T/2), and S−x. The minimum is reported in mm. The angle atan2(distance,h) is a geometric CG-to-edge angle.

It is explicitly NOT a measured rollover angle, dynamic acceleration limit, safe corner speed or deslot threshold. Mixed front-wheel/guide support is excluded. Inconsistent included total mass and support sums withhold the combined result. Magnetic force, guide lateral reaction below the track plane, banking, compliance, grip and transient dynamics are not represented in that geometric result. No universal tripod-angle target is used.

### Gearing

Driven/pinion ratio; rollout πD/ratio; no-load speed RPM×rollout×60/1,000,000 km/h. Proposed driven gear keeps the existing pinion, tyre and motor. Wheel-torque multiplier assumes matching motor torque and efficiency, not the same operating point at the same vehicle speed. Single-gear substitution is withheld if compound stages are entered. Gear fit and clearance require separate verification.

### Magnetic measurements

Net magnetic force only, with tare removed; gf × 0.00980665 gives N. Total lift, rear lift and gauss are not interchangeable with net force. Motor comparisons additionally require declared matched fixture/rails/installed gap and comparable RPM, plus responsive rails. Check mass, torque, fit, legality and force location independently. No rear-tyre-load or grip gain is inferred.

Angle records are signed −90° to +90°, nose-right positive viewed from above, motor off. Enter one mean at each angle with fixed measurement conditions. Linear interpolation is bounded by measured endpoints; no extrapolation or automatic left/right mirroring. Relative force at an angle is divided by the interpolated/recorded 0° force only if that value is nonzero. This is force retention, not grip retention. The installed gap and tester/rail conditions must remain comparable.

## Tests and evidence

One change at a time; comparable driver, lane, voltage, tyres, preparation and warm-up. A–B–A is an accessible check for drift; repeated runs and balanced/randomized order within comparable conditions are preferable for stronger conclusions. No independence claim for every lap within a run; no causal verdict from fastest laps. Record handling, incidents and recovery separately. Slow laps do not automatically identify incidents.

The existing workshop test tool accepts manual lap lists and copied manual/Paddock runs. Newly captured run evidence freezes canonical tyre diameter, motor/gearing, weight, magnetic readings, chassis, workshop measurements and advisor context. It excludes recursive test snapshots and test narrative. Old chassis-only evidence remains readable. Changes to run rows detach historical captures; changing a library setup cannot rewrite them. Explicitly record which proposals were physically fitted. Snapshot and setup byte limits continue to apply.

## Knowing which inputs are used

Driver Feedback reads the current Telemetry workbench, including unsaved edits, when “Use workbench numbers” is enabled. The guided measurement step separates recorded measurements, available results, and optional missing information or confirmations. Turning workbench numbers off excludes those measurements without deleting them.

Examples sit below inputs, labelled “Example only”, and never populate a setup. Measurement fields indicate whether actual text has been entered; this alone does not mean it is valid or sufficient for a calculation. The prediction page validates measurement records and distinguishes an empty record, a partial record, and one needing correction.

Current tyre diameter, left/right measurements, diameter spread around one tyre, and wear history answer different questions. Wear rate requires at least two measurements from the same tyre set at increasing cumulative lap counts. A finite remaining-life estimate additionally requires a usable diameter limit and positive measured wear. The app asks for missing information rather than asking users to repeat measurements already supplied. Free-text conditions remain notes, not inferred grip coefficients or measurements.

## Research foundations and limits

- [NSR setup guide](https://nsrslot.com/wp-content/uploads/2025/12/guidaElaborazione_GB.pdf): setup depends on track, tyres and chassis/pod movement. Manufacturer recommendations are qualitative, not universal percentages.
- [Slot Car Corner checklist](https://res.cloudinary.com/slotcarcorner/image/upload/v1596410874/SCC_Tuning_Checklist.pdf): mechanical/guide/tyre checks before attributing symptoms to a single cause.
- [Zarkada & McLaughlin firsthand tuning](https://www.homeracingworld.com/slotcartuning.htm): symptom observations and measuring magnetic behaviour at different chassis angles. Test-specific observations are not universal validated coefficients.
- [K&J measurement FAQ](https://www.kjmagnetics.com/faq.asp): force versus field, fixture dependence.
- [Northwestern rigid-body mechanics](https://modernrobotics.northwestern.edu/nu-gm-book-resource/8-2-dynamics-of-a-single-rigid-body-part-1-of-2/): mass properties and inertia. Applying those equations does not validate a complete slotcar dynamics model.
- [NIST randomized block design](https://www.itl.nist.gov/div898/handbook/pri/section3/pri332.htm): controlling conditions and comparing repeated runs.
- [Maxon motor characteristics](https://www.maxongroup.com/medias/sys_master/8815460712478.pdf): loaded/thermal conditions matter. No unsupported motor temperature forecast is added.

Dynamic drift/recovery, traction-limited lap simulation and self-calibrating physical models remain outside the implemented prediction claims. Those require representative slotcar validation data; more equations alone would not establish their accuracy. IMU and LiDAR integration is excluded from this project plan.

## Guided investigation

Five steps move from observations to practical checks, an explicitly included workbench or saved setup, optional measurements, and a recorded test outcome. Existing setup fields are shared; changing a value in Driver Feedback updates the workbench draft but never silently updates a library entry. Rim-derived tyre diameter is read-only here; the rim/thickness tool remains its source.

Body share = complete body assembly mass / ready-to-drive car mass × 100. It requires a body lighter than the complete car and does not determine CG height or tipping risk. Net magnetic interpretation requires responsive rails and an explicitly confirmed net-force basis. Angle-force interpretation additionally requires included setup data and confirmed motor-off measurements in the same fixture. Existing support, component, proposal and workshop models retain their assumptions.

Owner evidence is linked to original reports. It prioritises investigations, not brand scores or universal ballast recommendations. No numerical correlation or trained prediction model is claimed.

The most recently recorded outcome retains the investigation context. Changes to setup, symptom, test description or outcome mark it as belonging to a different context; changing steps or the saved name does not. Save as a separate setup to retain multiple experiments. Workbench persistence, explicit library saves and exports use existing storage controls.


## Adaptive guidance and research integration

The guided page now combines the existing models through renderer/feedback-engine.js. Findings include the actual values and provenance: observations, confirmed support readings, conditional static geometry, calculated proposals, loaded DC measurements and comparable recorded runs. No probabilities, universal setup thresholds or learned car rankings are introduced.

Twelve curated research principles link 79 records across 61 source entries. The full catalogue is available in the page's optional research browser. Principles preserve unsuccessful tests, conflicting ballast preferences, mixed interventions, unknown magnet state and kit/specimen identity. Records are not counted as independent experiments or assigned numerical confidence weights. Descriptive records inform context; no motor-layout, paint-weight or manufacturer coefficient is derived. The archived HTML research library is the source for renderer/handling-evidence.js; record IDs must be taken from the explicit R-number, not model names such as Audi R8. Regression checks validate unique IDs, principle coverage and source links.

### How measurements change advice

- Body share is explained with its actual mass and qualitative body position. Confirmed support geometry and CG height produce an explicit baseline margin, with no inferred safe speed.
- Ballast plans show mass and support-load changes; a plan that reduces front support is highlighted during a guide-escape investigation. Vertical proposals explain whether model CG height actually decreases.
- Tyre changes preceding wheel lift select the grip/roll trade-off. Entered wear connects axle height, rollout and gear gap; measured force/gap data remain conditional. Diameter mismatch within entered measurement bounds prompts remeasurement rather than an established fault.
- Power-on sliding is combined with observed wheelspin and the gearing proposal's ideal wheel-torque multiplier. Layout conversions prompt a complete change record. No higher-RPM upgrade is recommended.
- Net magnetic force, motor-off angular measurements, steady-DC voltage drop and measured braking traces each retain their own eligibility rules. Missing or unsupported inputs cannot create a finding.
- Comparable A/B runs show run-mean pace and incidents per recorded lap together. Return-to-A drift remains explicit. Incident recovery is not added again to lap times that already include it.
- Entered class-limit conflicts and physical interference remain visible even when more than three recommendations exist. Additional checks are folded, not dropped.

### Questions and recorded checks

Questions prioritize known input conflicts, then simple observations, then missing prerequisites of relevant calculations. Existing values and confirmed zero readings are reused. Motor RPM, tyre-wear histories and braking traces are not indiscriminately requested for unrelated symptoms. The user may skip every question.

Individual guide, tyre, axle, body/pod, pickup and track inspections store their own relevant setup scope (check-log version 2). Changing a fitted tyre dimension requests another tyre/body check while preserving unrelated pickup checks. Changing the symptom, navigation or a hypothetical ballast/gear plan does not invalidate completed inspections. Affected checks retain their earlier status and can be rechecked individually. Version 1 histories remain readable and conservatively request rechecking when their old scope differs. A checklist never overrides a contradictory measurement.

Suggested tests have stable IDs plus the selected action text. A recorded unchanged test can advance the investigation without relying on guessed intent. Unresolved numeric findings and reported faults stay visible. Better/worse outcomes prompt repeat testing or restoration of the baseline. Legacy recorded outcomes are compared with new optional-field defaults so this update alone does not invalidate them. Setup exports and library saves include the new optional fields; A/B snapshots omit recursive check/outcome records.

Validation covers symptom-only use, changing geometry/body mass, guide-load plans, torque trade-offs, magnetic eligibility, electrical/braking records, faster-but-less-consistent runs, adaptive question prerequisites, legacy migration, scoped checks, record/source integrity, persistence, navigation, escaping and responsive light/dark layouts.

## Symptom-specific routes

The route layer in renderer/feedback-routes.js chooses observations and practical checks; feedback-engine.js joins those to eligible existing calculations. All choices are optional. The original symptom remains saved when answers lead into another investigation route. Inactive branch answers stay stored but cannot steer the active branch. Contradictory crossover sequences prompt review of the first movement instead of looping.

| Starting behaviour | Distinguishing follow-ups | Practical checks and optional calculations |
| --- | --- | --- |
| Tipping | Inside wheels lift, front leaves first, slide/catch, or local trip | Body/pod contact and tyre shoulders first; confirmed support loads, body share, CG height and separate ballast proposals for wheel lift. A local snag prioritises clearance and track inspection. |
| Rear sliding | Power, coast, braking or general; wheelspin and lower entry speed | Delivery and preparation, entry-speed comparison, or sideways-braking route. Reuse fitted tyre/gear data; only eligible net-force and support measurements inform further comparisons. |
| Sudden catching | Straightens, tips, hops or guide leaves; throttle event versus rail realignment | Cross into the resulting behaviour; inspect rubbing. Optional motor-off angle-force measurements require responsive rails and matching conditions. |
| Guide escape | Bump, acceleration, tight turns, one direction, everywhere or roll-first | Separate visible nose lift from electrical cutout. Inspect blade/braid/front contact and wire rotation; only the relevant branch suggests support/ballast comparisons. |
| Hopping | Straight, power, corners, local section or recent assembly work | Seating/roundness, gentler delivery, rubbing/movement or the worked assembly. Diameter variation remains distinct from measured radial runout. |
| Lacks power | Acceleration, straight speed, revs without motion, cutout, fade, tight turns or trigger travel | Separate tyre-to-rim slip, wheelspin and loose hardware. Check pickup and freedom before gearing. Distinguish full-trigger delivery from controller response; analogue/digital and shared-car effects select appropriate electrical checks. |
| Braking | Weak, abrupt, sideways or varying; adjustable response and direction | Controlled entry speed, system brake behaviour, contact and tyre/guide symmetry. Speed-time samples describe only their measured window; brake percentage is not deceleration. |
| Deterioration | Power, grip, guide, braking or pace; cooling, cleaning and other cars | Matched early/late runs and relevant component checks. Grip deterioration can use same-tyre wear history; it is not requested as a prerequisite for unrelated power loss. |
| Consistency | Repeated incident, unpredictable behaviour, lap variation, control trade-off or fade | Follow the dominant incident, compare preparation/traffic/warm-up, or use A–B–A runs and incidents against the selected driving goal. |
| Not sure | Closest observed movement | Observe one familiar section at a comfortable pace, then enter the matching route. |

Shared onset, recent-change and location questions refine relevant branches. Answers distinguish body screws from motor-pod work, and inspect recently trued tyre shoulders without prescribing generic sanding, lubricant, screw-turn counts or ballast quantities. Forum observations remain qualitative evidence, not causal coefficients or guaranteed fixes.

“Skip this question” advances without assigning a value. Review or change your answers retains active answered/skipped questions; revisit restores skipped measurement prompts too. Each recommendation states effort and equipment, its purpose, a way to check the result and an easier alternative. Reported faults and numeric conflicts stay visible even if their check is unavailable.

### Test outcomes and follow-up

Inspections offer fault found, no fault found, uncertain or unable to check. Setup/controller changes offer improved, no clear difference or worse; a different problem can also be recorded. No clear difference is inconclusive, never proof that a suspected cause is ruled out. Uncertain inspections remain unconfirmed. A linked no-fault inspection advances only that explicit check; unresolved measured findings persist. Better results prompt a repeat, worse results restoration of the baseline where practical, and reported faults correction before tuning around them.

Starting a separate investigation after a different problem opens a save dialog. A new library snapshot preserves the original investigation before a fresh symptom opens. Cancel or a failed save keeps the original draft. Existing car and advanced measurements carry forward; old route answers, outcome and proposed modification selection do not. The new draft is not bound to the old library entry.

### Additional setup-guide sources

The following SlotRacer manual chapters support the inspection and usability additions; selected suggestions link to the relevant chapter:

- [Basics](https://slotracer.online/manual/basics.php): inspection, contact and maintenance.
- [Tuning](https://slotracer.online/manual/tuning.php): tyre preparation, mechanical freedom and mounting adjustments.
- [Controllers](https://slotracer.online/manual/controllers.php): controller compatibility, response and braking.
- [Power](https://slotracer.online/manual/power.php): track supply and shared-load context.

These are practical guidance sources, separate from the 79-record handling catalogue. Their general recommendations are not silently converted into numerical laws or mandatory setup recipes.

### Starting over

The **Start over** button in the Driver Feedback header opens a confirmation. Confirming clears route answers, feedback notes, check history, skipped/unavailable choices and test results, then returns to Your experience. It preserves the car setup, advanced measurements, measurement-method notes and saved library entries. Workbench numbers return to opt-in. Cancel leaves the draft untouched. The reset detaches the current library binding, so a later save cannot silently update the previous investigation.
