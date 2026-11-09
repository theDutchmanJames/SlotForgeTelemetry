# Testing & planning implementation review

Scope: all eleven tools proposed in the slotcar-calculation research, their input validation, saved setup/library compatibility, live previews, saved analysis, graphs, calculation help and local lap-record snapshots. Existing magnetic-downforce and branding work is preserved. The parked SQLite work and Paddock host API are unchanged. App version remains 0.8.1; no push or release was performed.

## Implementation phases

1. Pure calculation model and bounded optional fields; backward-compatible setup/library serialization.
2. Telemetry tool selector and live results; saved-only Analyze selector, measurement tables, three measured-data graphs; individual Settings help topics.
3. Read-only lap windows from manual and Paddock runs, dated source snapshots, explicit comparison-condition confirmation; documentation and regression review.

## Findings repaired

- Whole-number HTML fields initially inherited a fractional minimum, causing valid integer values to fail browser step validation. Their HTML minima now match whole-number steps.
- Native textarea styling did not match the app themes. New inputs now use the family background, text, border, focus and category conventions.
- Unrelated numeric controls could influence setup-save validation. The shared numeric scan now checks named setup inputs only; snapshot-window validation is handled locally.
- A loaded motor reading could imply shaft power above electrical input, including a zero-current reading. Efficiency is now withheld and the inconsistent measurement is identified. Electrical input/efficiency require explicit steady-DC confirmation.
- A single lap appeared to have zero consistency spread. Its spread is now unavailable; multiple observations are required.
- Extremely close braking timestamps could overflow deceleration arithmetic. Non-finite derived results are rejected with a precision/units message.
- Braking charts originally linked to a table with derived interval results only. The table now also includes start/end measured speeds.
- Controlled-test source identity was retained in the setup but absent from saved analysis. Saved analysis now shows the dated provenance explicitly.
- Appending a lap snapshot now resets condition confirmation and validates the complete proposed append before touching the draft. Imported/manual source records are never modified.
- The Windows release-check block had inconsistent indentation around existing magnetic/progress checks. It is normalized, with the new workshop suite and explicit failure propagation included.

## Review boundaries

- Geometry, units, known worked examples, zero/unknown handling, invalid row syntax, non-finite numbers, ordering, unreachable ballast targets and immutable single-stage inputs are covered.
- Tyre life is an observational extrapolation, not guaranteed service life. Measurement ranges are input bounds, not confidence intervals. No automatic grip or lap-time prediction was added.
- Multi-support chassis reactions are not inferred from a two-support balance model. Rotating-mass calculations use declared geometry and count actual component mass only once.
- Motor stall/no-load/loaded rows remain distinct; no voltage extrapolation or cross-test synthetic running power is generated.
- Slow valid laps remain in snapshots; pit/invalid laps are excluded. Snapshot identity and date are recorded, and later source corrections do not silently rewrite a historical experiment.
- All user labels and imported provenance are escaped before rendering. No extra network permissions or dependencies were added.

## Validation

- Full Node suite: 110 passed, no failures or skips, including the real Paddock-source localhost fixture with artificial data and simulated Unix builder workflows.
- Eight Electron suites passed: pages/library, shell, Paddock imports, race analysis, progress, manual laps, magnetic measurements and the new workshop workflow.
- Focused workshop tests cover all eleven tools, setup and library round trips, legacy defaults, limits, failure paths, saved-versus-draft analysis, snapshot copying, escaping, help navigation and 760px layout.
- Light and dark analysis screenshots and narrow input screenshots inspected. Hidden-window test capture uses offscreen rendering so snapshots reflect the current view.
- JavaScript syntax and whitespace checks passed. The focused workshop unit/UI checks are repeated after final review fixes.

All tests use disposable profiles and synthetic measurements. No physical motor, car, track, meter or tyre set was calibrated or validated by these checks. Native Linux/macOS packages were not built in this Windows review.
