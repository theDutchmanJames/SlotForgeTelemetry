# Testing & planning

Open **Telemetry → Testing & planning** in the setup-input navigation. Choose one of eleven optional tools. The current tool has a live result panel. Save the setup, then open **Analyze → Setup analysis → Testing & planning** for its saved measurements, tables and available graphs.

All measurements belong to the saved setup and travel with setup files and library backups. Older setups open with these optional fields blank. The separate scenarios do not silently replace motor ratings, car mass or the main single-stage gearing. The existing four main pages remain unchanged.

Use decimal points. A blank numeric input means unknown; zero means measured zero. Row inputs show their format as a placeholder. Separate columns with `|` where indicated; separate numeric pairs or lap times with commas. Use `-` for an unmeasured optional motor value or an absent class limit. No example measurements are inserted automatically. Limits are 50 rows per tool, 100 lap times per test run and eight compound gear stages, also subject to the displayed field-length limits.

## Tools and assumptions

| Tool | Inputs and results | Important boundary |
| --- | --- | --- |
| Tyre preparation & life | Minimum diameter for gear clearance; diameter for the setup's target rollout; left/right diameter and circumference mismatch; measured diameter spread; wear per 100 laps and remaining-life estimates | Uses one tyre set's measured history. Restart after truing or replacement. The forecast uses the latest history diameter, not the fitted diameter. An interval with zero observed wear cannot provide a finite upper life estimate. Gear clearance does not establish motor/chassis clearance. Diameter spread is not radial runout/TIR. |
| Electrical losses | Location, simultaneous loaded supply/rail voltages and actual current; voltage drop, percentage drop, loop resistance and power loss | Only confirmed steady DC produces results. PSU current capacity is not current drawn. Digital/PWM waveforms need appropriate measurement equipment. |
| Motor test records | Label each motor/test/date; record mode, rotation direction, voltage, RPM, optional current and torque-arm readings; calculate torque and simultaneous loaded power | No-load and stall tests are never combined into measured running power. Electrical power/efficiency require confirmed steady DC. Efficiency above 100% is suppressed with a measurement warning. This is a record/calculation tool, not instructions for physically stalling a motor. |
| Race strategy | Base mean lap, race laps, incident rate and extra recovery loss, stops and extra stop loss; expected duration and extra-stop break-even distance | Do not double-count losses already present in the base mean. Explicit zero removes a loss category. A scenario is not an official result or a virtual fuel simulation. Only subsequent laps recover a mid-race stop's cost. |
| Ballast planning | Independent front/rear support readings, separation, multiple added/removed parts, target rear share and ballast position; solve static loads and target ballast | Choose front axle with guide clear or guide with front wheels clear. Do not use the two-support model with three simultaneously load-bearing supports. Part removal must correspond to actual parts. No grip or optimal balance prediction. |
| Controlled A–B–A tests | Chronological runs with A/B labels, conditions and measured laps; per-run means, medians and middle-50% spread; equal-weight comparison of run means; return-to-A drift | Confirm comparable conditions to expose the direct B−A change. Run means have equal weight even if lap counts differ. No statistical significance or causal claim. A single lap does not give a useful consistency spread. |
| Class limits | Class/revision, named measurement locations, values and optional lower/upper limits; signed margins and within/outside status | Checks only entered numerical requirements. This is not a compliance certificate. Record units and the official measurement procedure, including separate motor/chassis/guide requirements. |
| Compound gears & geometry | Actual compound stages plus standard spur module or diametral pitch; overall ratio/rollout/axle speed, pitch diameters and centre distance | Simple idlers are not extra reductions. Standard geometry assumes unshifted external spur gears with matching module and pressure angle. Proprietary crown/anglewinder gears need actual compatibility checks. |
| Rotating mass | Component masses, inner/outer radii, speed relative to axle and a measured/assumed force at one operating point; equivalent inertia mass and ideal acceleration | Uniform annulus approximation. Main car mass must already include listed parts. Unlisted motor/axle inertia is omitted. Traction, drag, losses and compliance are excluded. |
| Braking & coast-down | Measured time/speed trace; interval distance and mean deceleration, recorded-window distance and duration | Trapezoidal integration assumes linear speed changes between samples. Only a trace ending at zero has a stopping-distance label; no extrapolation. Rising speed is retained and identified. Lap times and controller percentages cannot provide this trace. |
| Measurement ranges | Absolute diameter, RPM and pull bounds applied to current setup values; output intervals for rollout, no-load speed, gear clearance and magnetic force | Worst-case bounds, not confidence intervals. Tooth counts and gear outside diameter are treated as exact. Impossible input bounds are rejected rather than silently clipped. |

Each tool also has a dedicated **Settings → Calculations** entry with formulas, a worked example and limitations. Saved analysis includes graphs for tyre wear, controlled-run pace and measured braking/coast-down. Tables remain available alongside the graphs.

For controlled tests, the basic row is `Run label | A or B | lap seconds`. To record incidents, use `Run label | A or B | lap seconds | incident count | measured incident loss seconds`. Unknown incident values use `-`. These columns document observations and are not added to the lap mean, because recovery time may already be present in the laps.

## Reusing lap records

In Controlled A–B–A tests, choose **Refresh available runs**, select a manual or Paddock run, choose A/B and a starting valid-lap position, then **Append lap snapshot**. Up to 100 valid, non-pit laps are copied from that position. The status states how many were copied out of the eligible run; invalid and pit laps are not used. Slow valid laps remain included.

The copied window and source identity/date are saved with the setup. Conditions reset to unconfirmed after each append. Review lane, driver, voltage, tyre and other conditions before enabling direct comparison. A snapshot deliberately stays unchanged if its source is later corrected or withdrawn; refresh the experiment explicitly when needed. This preserves the evidence used for a historical setup test. Original manual and Paddock records remain untouched.

This feature reads only Telemetry's existing local run list. It adds no host endpoint, network credentials or writes to Paddock.

## Calculation references and research

Forum discussions motivated the tools; individual tuning claims are not universal formulas. The models use elementary geometry, static moments, DC circuit power, rotational energy and integration of measured speed.

- [SlotRacer: motor performance testing](https://slotracer.online/community/showthread.php?tid=1539) — why individual motor records and test conditions matter. The app does not adopt automatic low-voltage-to-high-voltage stall extrapolation.
- [maxon: motor data and simulation](https://support.maxongroup.com/hc/en-us/articles/360013761160-Motor-data-and-simulation) — temperature, tolerances and the limits of motor simulations.
- [BSCRA: repairing track power faults](https://www.slotcarracing.org.uk/trackbuild/maintpower.htm) — diagnosing track voltage loss under load.
- [SlotRacer: gearing explained](https://slotracer.online/community/showthread.php?tid=1157) — rollout, multi-stage arrangements and gear compatibility caveats.
- [KHK: ABCs of gearing](https://khkgears.us/media/fqrlut1m/abcs-of-gearing-b.pdf) — standard gear terminology and geometry.
- [SlotRacer: tuning](https://slotracer.online/manual/tuning.php) — truing and testing ballast changes.
- [SlotRacer: equal lane lengths](https://slotracer.online/community/showthread.php?mode=linear&pid=6775&tid=1174) — practical examples of condition differences despite equal distance.
- [RCS64: race examples](https://rcs64.com/getting-the-most-out-of-rcs64/) — pit strategy; its virtual tyre/fuel settings are distinct from physical wear.

No real car, motor bench, magnetic tester or track was calibrated by this software validation. Results depend on the measurements and assumptions supplied.
