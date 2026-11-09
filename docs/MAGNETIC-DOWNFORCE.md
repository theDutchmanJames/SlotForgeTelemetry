# Magnetic downforce

Telemetry accepts **measured magnetic pull**, including the attraction of the motor to magnetic rails. Measurements are optional and belong to each saved calculator setup. They survive setup export/import, library backups, duplication and reopening. Older setups receive blank measurement fields.

## Measure consistently

Use a suitable magnetic-force tester and follow its instructions. Enter positive **pull-only gram-force (gf)**. A combined weight-plus-pull reading needs the independently measured car weight subtracted first; some instruments use a negative display or already subtract weight. Do not subtract weight twice. An ordinary weighing scale without a suitable fixture is not a downforce tester. Gauss is flux density, not force.

Repeat at the same height and position. Record the tester/method, rail material, motor orientation, additional traction magnets and whether the motor was off or running. For powered tests, include voltage and other conditions in setup notes. A reading with extra magnets is combined attraction, not an isolated motor measurement. Different testers and track rails are not automatically equivalent.

Use decimal points; separate pull readings with spaces, commas, semicolons or new lines. Up to 100 readings are supported. Zero is a measured zero; blank is unknown. Range means the observed maximum minus minimum, not measurement accuracy or a confidence interval.

## Calculations

- Mean = sum / count; force in N = mean in gf × 0.00980665.
- Relative pull = mean in gf / actual mass in g × 100.
- Static total support in N = (actual mass in g + mean pull in gf) × 0.00980665, on a flat stationary test arrangement. This includes any guide support and does not identify driven-tyre load.
- Total car weight takes precedence; otherwise both non-magnetic axle readings provide mass. Hypothetical added ballast is excluded.
- Limit margins = user-entered limit minus mean, and limit minus highest reading. A negative highest-reading margin means at least one measurement exceeds the entered limit. The club's official tester and procedure determine compliance.

Example: 19, 20 and 21 gf average 20 gf. An 80 g car has 0.196133 N magnetic attraction, 25% relative pull and 0.980665 N total static support (100 gf equivalent). Its actual mass remains 80 g. Magnetic data never changes power-to-weight, theoretical driving force, acceleration or ballast balance.

## Clearance curve and wear

Enter one row per measured clearance: `height in mm, pull in gf`. Heights refer to the motor underside and rail top; use the same reference surfaces for all points. Up to 50 unique heights are supported. Average repeated readings before entering a point. Points are sorted by height. Rising pull with increased gap produces a warning, not a silently altered curve.

Between adjacent points, `F(h) = F1 + (F2 − F1) × (h − h1) / (h2 − h1)`. Local slope is `(F2 − F1) / (h2 − h1)` in gf/mm. These are piecewise linear estimates, not a universal force law. No extrapolation is performed. A single point only answers its exact height. The measured mean remains separate from the curve's estimate.

For worn tyres, either enter measured motor clearance or explicitly select the approximation that the motor follows the rear axle. That approximation adds `(worn diameter − current diameter) / 2` to current clearance, assuming unchanged mounting. Chassis pitch, pod movement and tyre compression are excluded. A larger “worn” tyre gives no axle-wear estimate. Negative clearance never produces a curve estimate; zero clearance is flagged as contact with the rail-top plane. Re-measure when geometry or test conditions change.

## Interpretation and comparisons

Magnetic pull and relative load comparisons remain neutral: higher is not automatically better. Direct differences are withheld when recorded tester, rails, mounting, extra-magnet status or motor state are absent or differ. Even matching labels cannot establish identical conditions; consult notes, clearance and the actual test procedure. No tyre-friction, corner-speed or lap-time prediction is added. These records are calculator setup measurements; they do not alter imported race evidence.

## Sources

- [Slot.it MN13ch technical sheet](https://www.slot.it/immagini/schede_prod_EN/motors_GB/MN13ch_EN.pdf): motor casing openings and magnetic traction.
- [K&J Magnetics: Testing Magnet Strength](https://www.kjmagnetics.com/blog/testing-magnet-strength): force measurements, gaps and test materials.
- [K&J Magnetics: Steel Thickness](https://www.kjmagnetics.com/blog/steel-thickness-and-magnetic-fields): why target geometry matters.
- [Electric Dreams event measurement procedure](https://www.electricdreams.com/electric-dreams-announces-contingency-award-program-for-lemay-museum-transam-race/): distinguishing combined readings from pull-only readings.
- [Wednesday Night Racers class rules](https://wednesday-night-racers.mailchimpsites.com/racer-resin-classics): an example of a motor-downforce limit, not a universal default.

The formulas and their limited use in Telemetry are documented above; measurements cannot be inferred from motor RPM, torque or clearance alone.
