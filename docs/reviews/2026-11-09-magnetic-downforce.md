# Magnetic downforce implementation review

Reviewed 9 November 2026. Scope: new measurement model, setup serialization, library integration, live preview, saved analysis, wear connection, comparison, help, documentation and release-test wiring. The parked SQLite/Paddock migration is outside this change. Existing header/footer branding edits were preserved. No app version or release was changed.

## Behavior reviewed

- Force conversion uses 0.00980665 N/gf. Mean, observed range, relative weight, static support and mean/highest-reading limit margins use measured pull. Actual mass, ballast calculations, motor power and acceleration remain independent.
- Zero and missing values remain distinct. Invalid/oversized inputs, repeated curve heights and unsupported choices fail validation; invalid drafts do not overwrite the last valid workspace or saved setups.
- Curves sort measured points without changing measured values, interpolate adjacent points only and expose local slopes. Increasing force with increased clearance is flagged. Negative worn clearance has no estimated force. The axle approximation is explicit and disabled without valid tyre/clearance inputs.
- Older setup and library files receive optional blank defaults; round trips preserve readings, conditions and curves. Comparison remains neutral and requires matching recorded conditions for direct magnetic differences.
- User text is escaped. Inputs retain keyboard focus during live updates. Inline validation identifies invalid reading/curve fields. Light/dark themes and the app's 760px minimum window width were checked visually and automatically.

## Findings repaired

1. Very close curve heights could produce infinite interval slopes. Validation now rejects non-finite slopes.
2. Missing magnetic data could trigger a new comparison-basis warning for older setups. Missing metrics no longer introduce that warning.
3. The new measurement textareas initially lacked the app's theme styling. They now use the existing colors, focus styling and spacing.
4. Invalid curve feedback needed to appear beside the inputs as well as in the global summary. Added inline feedback and accessible invalid states.
5. Binary rounding in tyre-diameter arithmetic could put an expected endpoint just outside the curve. A machine-precision boundary tolerance accepts roundoff without meaningful extrapolation; a regression test exercises a 20.0 to 19.6 mm wear scenario.

## Validation

- JavaScript syntax checks passed.
- Full Node suite: **96 passed, 0 failed, 0 skipped**, including the real Paddock-source localhost fixture with artificial data.
- Eight focused magnetic tests passed again after the endpoint correction.
- All seven Electron suites passed: pages/library, desktop shell, Paddock imports, race analysis, race progress, manual laps and magnetic measurements. The focused magnetic suite was rerun after the styling and inline-validation changes.
- Setup/library export/import, saved analysis, invalid draft reload recovery, neutral comparison, help navigation, escaped markup, theme switching and narrow layouts are covered.
- `git diff --check` passed. The new magnetic UI suite is included in the Windows release workflow.

All desktop checks used isolated profiles. No real car, tester calibration, or physical track prediction was verified. The feature reports user measurements and bounded interpolation; it does not claim grip, cornering speed or lap-time prediction. No unresolved actionable findings remain within the reviewed scope.
