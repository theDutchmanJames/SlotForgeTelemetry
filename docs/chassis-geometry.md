# Chassis geometry and balance

The Telemetry workbench provides a visible **Chassis geometry & balance** shortcut. Enter measurements there and save the setup; **Analyze → Chassis geometry & balance** reads only that saved version. The original Weight & ballast and Testing & planning tools retain their original meanings.

## Measure the triangle

- **L: guide pivot to rear axle** — along the chassis centreline, between the guide pivot centre and rear axle centre.
- **T: rear tyre contact centre spacing** — between the centres of the two rear contact patches, not axle shaft length or overall tyre width.
- **Wheelbase** — front axle centre to rear axle centre; this remains the existing Weight & ballast input.

The geometry assumes a centred guide and parallel rear tyres. If measuring outside width is easier, enter outside-to-outside width O and the individual left/right tyre widths wL and wR. Telemetry estimates T = O − (wL + wR)/2. This uses geometric tyre centres; rounded profiles, unequal contact patches or camber can make the actual support centres different. The outside width must accommodate both tyre widths.

For the symmetric triangle:

```
Guide angle (degrees) = 2 atan(T / (2L)) × 180/π
Length/width ratio   = L/T
Equal side length   = sqrt(L² + (T/2)²)
Guide ahead of front axle = L − wheelbase
```

A negative last value means the pivot is behind the front axle. L = 100 mm and T = 60 mm give 33.3985°, 1.6667:1 and 104.4031 mm. Contact positions are drawn to scale; tyre symbols and the optional front-axle reference line are schematic, not measurements of tyre shape/front track.

There is no universal ideal angle, width or ratio. These are descriptive geometry values and stay neutral in comparisons.

## Choose the actual weighing supports

1. **Front axle + rear axle:** guide clear; support span S is wheelbase.
2. **Guide support + rear axle:** front wheels clear; enter an actual support span or explicitly assume the front support is at the guide pivot.
3. **Guide support + individual rear tyres:** as above, with a separate reading for each rear tyre.
4. **Mixed guide/front-wheel support:** geometry and notes are retained, but no tripod balance or ballast prediction is produced.

The geometric guide pivot and the effective front weighing support can differ. Braids contact an area, and that area's resultant support force need not pass through the pivot. A measured front-support span assumes a centred front resultant. Measure it on your fixture or use the pivot approximation explicitly; do not silently interchange the two.

Prepare the car as raced, motor off. Use a level non-magnetic fixture, tare the scales with any support pieces fitted, and support the car at its normal attitude. Only the selected contacts may carry load. Three scales are convenient; one scale with matching-height substitute supports can work if the attitude and contact arrangement are maintained. Do not measure on steel that attracts the motor or traction magnets. Check that the guide blade is not bottoming on the fixture.

Enter one reading or up to 20 repeated readings per support, separated by spaces, commas or newlines. Use decimal points. Blank means unknown; zero means a measured zero. Confirm the weighing conditions before calculating balance. Changing the weighing mode or pivot/measured reference resets that confirmation.

## Calculate horizontal CG

Use x behind the front weighing support and y to the car's right, looking down with the nose forward. G, RL and RR are scale readings in grams (mass-equivalent support reactions), not separate masses of parts. Under gravity alone the common acceleration factor cancels in these expressions.

```
M = G + RL + RR
CG x = S × (RL + RR) / M
CG y = T × (RR − RL) / (2M)
Front share = G / M × 100%
Rear-left share of rear load = RL / (RL + RR) × 100%
```

Whole-car shares in the table use M; the explicitly labelled rear-only shares use RL + RR. With no rear load, the rear-only percentages are undefined. Two-support weighing produces longitudinal CG only. Missing dimensions leave corresponding CG values unavailable, while complete support readings can still show measured load shares.

Level readings do not determine CG height. Front wheels loaded alongside the guide, magnetic attraction, support offsets, contact movement and chassis compliance can invalidate the simple point-support interpretation. No cornering, grip, rollover or deslot threshold is inferred.

## Ballast planning

Enter each part's mass and centre-of-mass position. Add/remove use one position; move uses old and new positions. Negative x is ahead of the front support and negative y is left. Two-support planning requires y = 0 because it cannot resolve lateral reactions.

For an added mass m:

```
ΔG  = m × (1 − x/S)
ΔRL = m × x/(2S) − m × y/T
ΔRR = m × x/(2S) + m × y/T
```

Removal subtracts these effects. Moving a part removes it at the old position and adds it at the new one without changing total mass. Changes are summed before testing final support loads; a negative change is legitimate, a negative final unrestrained support load is not. Zero load is the boundary of the support arrangement. Parts may be outside the triangle, but the final result must remain supportable. The app cannot verify that an allegedly removed/moved part exists at that location.

Example: G/RL/RR = 20/30/30 g, S = 100 mm, T = 60 mm. Initial M = 80 g, CG x = 75 mm and y = 0. Adding 10 g at x = 70 mm, y = +15 mm gives 23/31/36 g, M = 90 g, CG x = 74.4444 mm and y = +1.6667 mm.

Plans never modify the main measured car mass, motor calculations or magnetic measurements. The existing two-support planner can be copied deliberately into this tool; conditions must then be confirmed again. For axle plans, its span must agree with wheelbase. This copy replaces the new planner's weighing inputs and changes, not the original tool or main mass.

### Optional target

For desired rear fraction p and additional ballast at x:

```
m = (p × planned mass − planned rear load) / (x/S − p)
```

The target applies after all listed changes. The suggested addition is kept separate, not inserted into the plan. An already achieved target gives zero; a nonzero numerator with zero denominator is unreachable there. Negative added mass calls for a removal instead. A suggested lateral position must also leave all final loads non-negative. Mass-limit margins show whether the plan or target exceeds the entered maximum; they are not race certification.

## Measurement quality

Repeated readings report count, minimum, maximum and observed range. They do not establish accuracy. An optional absolute bound applies to each mean support reading and is not reduced by taking repeats. Supply a separate bound for an independent total-mass measurement to assess agreement: the allowable discrepancy is the sum of support bounds plus the independent mass bound.

CG, share and total-mass bounds are evaluated at support-reading interval corners with non-negative loads. Geometry is treated as exact. If bounds include zero total load, percentage/CG bounds are not reported. These are user-specified worst-case bounds, not statistical confidence intervals. Display resolution alone is not a valid accuracy specification.

## Saved comparisons and track evidence

Analyze shows the saved geometry, calculated CG markers, paired load-share bars, tables, notes and uncertainty information. Compare uses neutral numeric deltas; balance deltas require the same support mode, reference and span. Share differences use percentage points. No default performance verdict is assigned to geometry or balance.

In Testing & planning → Controlled A–B–A tests, select the saved setup used for an entered run and capture its chassis evidence. The same selection can accompany an appended manual/Paddock lap window. This freezes geometry, weighing method, readings, bounds and part changes, together with setup identity/name, capture time, run row and its exact text. Source edits never rewrite the captured inputs. A changed or moved run row detaches its old evidence until the user deliberately captures again. Capturing resets test conditions to unconfirmed.

Snapshots store only chassis-related inputs, so they cannot recursively include other snapshots or unrelated private notes. Limits are 20 captured runs and 40,000 characters per test setup; start a separate test setup for a longer programme. Planned parts remain labelled as planned: record which physical changes were made in test conditions. Snapshot schema v1 must retain its interpretation if future calculation models change.

All fields travel with setup exports and library backups. Legacy setups receive blank geometry and no invented readings; existing axle and guide tools are not migrated or reinterpreted. Setup export/import share a 100 KB UTF-8 byte limit.

## Sources and evidence limits

- [BSCRA measurement definitions](https://slotcarracing.org.uk/rules/diagram.htm): explicit guide-pivot/rear-axle measurement. Terminology varies elsewhere.
- [Professor Motor chassis articles](https://www.professormotor.com/category-s/203.htm): three-point principle and practical builder experiences; qualitative handling claims are not treated as predictive formulas.
- [SAMCA chassis guidance](https://www.samca.org.za/the-basics-slot-car-chassis-motors-bodies/): guide/braid and rear-tyre support, with front wheels potentially acting as outriggers.
- [Slot Car Corner balance-device instructions](https://res.cloudinary.com/slotcarcorner/image/upload/v1599324128/Slot_Car_Balance_Device_Instructions.pdf): balancing procedure and alternative axle/guide reference measurements.
- [UCLA static equilibrium](https://dbauer.physics.ucla.edu/5a/17-static-equilibrium/): zero resultant force and moment. Telemetry's support and ballast formulas are derived from these equations under the assumptions above.
- [SlotRacer tuning series](https://slotracer.online/community/showthread.php?pid=47054&tid=5204): practical experiments and the limitations of general balance targets.

The app intentionally does not allocate total magnetic pull to individual contacts, infer CG height from level readings, invent an ideal angle, or predict cornering/deslot speed. Actual lap tests remain the evidence for whether a change helped a particular car and driver.
