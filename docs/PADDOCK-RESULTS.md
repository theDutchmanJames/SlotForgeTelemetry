# Race results from Paddock

Available in Telemetry 0.7.0. Paddock owns its host API; use a Paddock build with Telemetry result-download support. Older Paddock builds may not advertise this capability. The calculator and previously imported results remain usable offline.

## Connect and import

1. In Paddock, start Dealership hosting. Keep that computer and Paddock running.
2. In Telemetry, open **Settings → Connect to Paddock**.
3. Choose **Find Paddock on this network**, then select your host. If discovery finds nothing, type the address and port shown in Paddock.
4. Enter the Dealership password and choose **Connect**. Older sharing modes use their Timing credential. A browse-only password cannot access race results.
5. Choose **Import / refresh results**. This downloads reviewed sessions that Timing has already delivered to Paddock, not unfinished live races.
6. Open **Analyze → Lap analysis**, select a run and explore its measured laps. A run separates a car's laps by lane and recorded driver.

Passwords stay in memory only. Disconnecting or closing Telemetry forgets them. Imported results stay on your computer and can be read offline. No Timing/Paddock result or car specification is edited by Telemetry.

## Explore and compare

- **Lap analysis** shows best eligible lap, median pace, middle-50% consistency spread, a five-lap rolling median, best uninterrupted five-lap run, individual lap details, and captured car specifications.
- Excluded pit/invalid laps can be displayed but remain excluded from pace statistics. Slow valid laps remain included. A single valid lap does not establish consistency.
- Long charts retain sampled extrema to avoid excessive drawing work. The lap selector and paginated table keep every recorded lap available.
- **Compare runs** uses a graph-free table. Different track/lane/source suppresses benefit colours. Even matching driver names and IDs do not establish a person's identity across participants or sessions. Tick the confirmation only when you know the runs have the same driver and comparable conditions; colours then highlight lower or higher values.
- Classified race results already include race adjustments. These remain separate from measured lap durations. A classification belongs to the whole session/car, not just the selected lane/driver.
- **Records** means best eligible laps in the imported data, grouped by Paddock database, Timing source, track, lane and car. It is not a copy of Timing's entire official track-record or personal-best database. Older undelivered sessions, independent Timing installations and missing measurements can make it incomplete.

## Stints, progress and reports

**Lap analysis → Lap scope** focuses the chart, metrics and recorded-lap table on one recorded stint. The **Stint analysis** table below the chart shows each recorded period for the selected lane and driver, including empty periods, heat names and session-relative start/end times. Select a stint there to focus the analysis above.

Each stint shows included/recorded laps, pit and other-invalid counts, median pace, middle-50% spread, best consecutive five-lap mean, and longest uninterrupted sequence. Opening/closing pace compares the median of the first five and last five laps of the longest continuous valid, non-pit sequence. It requires at least ten laps, never overlaps the windows, and breaks on excluded/missing laps or stint/heat changes. Equal-length sequences use the earliest. These changes describe measured pace, without attributing it to warm-up, wear or setup changes. Pit-lap counts do not establish the number or duration of stops.

**Compare runs → Lap progression** adds an A/B overlay above the existing comparison table. A uses a solid blue/category-motor trace; B uses a dashed tyre-category trace. Both share a time scale and recorded-sequence axis. Excluded laps keep their sequence positions as gaps; shorter runs stop at their final recorded position. This alignment is not a simultaneous race gap, track position or sector comparison. The sequence inspector supports keyboard entry and reads every recorded lap, including excluded laps and positions absent from a shorter run. Return to **Summary** for the graph-free view.

**Analyze → Progress** follows a car across recorded sessions. Choose a car/track/lane group, a minimum of 1, 5 (default) or 10 included laps, and median pace, best eligible lap or consistency spread. Collection, Timing source, session type and recorded lane length also separate groups. Driver runs remain separate observations even when they share a session or timestamp. The collection/search filters above apply to this history too.

Choose a run and a reference to see numerical changes alongside historical technical specifications and component lists. The default reference is the latest qualifying run with an earlier start time; runs sharing a timestamp need explicit selection. A lower number is an observation, not proof that a setup change helped. Sample sizes and driver/conditions remain visible. Unknown specifications remain labelled as unrecorded; signing metadata and component-list order do not count as setup changes.

The chart shows the latest 200 qualifying runs at their actual start dates, without interpolation. Missing metrics have no plotted point. Selectors and the paginated history table retain every qualifying run; the chart identifies when an older selection falls outside its window. Corrected, withdrawn and quarantined evidence follows the existing import rules. **Analyze selected run** opens its laps, and **Compare these runs** opens the A/B comparison.

**What this run shows / What these runs show** explains measured pace, central consistency spread, uninterrupted five-lap pace and sample coverage. Comparisons distinguish a lower best lap from an unchanged or higher median. Samples under five included laps and (when both have at least five) a twofold sample-size imbalance are flagged. These are descriptive rules, not statistical significance or confidence estimates. Excluded laps remain excluded, and missing metrics remain unavailable. Known lane-length or session-type differences also prevent benefit colours in Compare runs.

**Export comparison report**, available in Compare runs and Progress when two runs are selected, downloads a self-contained HTML file. Open it in a browser to read or print. It contains the selected car/driver/session labels, measured statistics, findings, captured setup differences, source identities/revisions/content hashes and separate supplied classifications/adjustments. It contains no connection password or complete lap library. A confirmation made in Compare runs is recorded as the user's confirmation; Progress reports do not inherit it. The report is a snapshot and does not update after later corrections or withdrawals.

These features work with existing offline imports and require no additional Paddock API capability.

## Refresh and corrections

Refresh reads a paged index pinned to a result snapshot and downloads only new or changed session documents. Receipt-only warnings also trigger a download. Unrelated private database edits do not interrupt a snapshot import. Sessions flagged as needing correction are listed in the library and excluded from analysis and records. Corrections replace prior versions; withdrawals no longer contribute to analysis or records. A full successful refresh reconciles missing sessions after a host restore. Failed, invalid or interrupted transfers leave the previous library intact.

When the host advertises change notifications, Telemetry waits for small notifications while connected and imports updated results automatically after the first successful import. Unsupported hosts use manual refresh. Notification failures back off; disconnect stops network activity. Host identity is checked on every result request.

## Library and backup

Open **Library → Race results** to browse imported runs, see import dates and view counts of withdrawn/quarantined sessions. **Export results** saves the imported evidence as JSON for a separate backup or inspection. This version does not import that export back into the app; the supported recovery source is Paddock.

The local `paddock-results-v1.json` cache is stored in Telemetry's existing application profile, separately from the setup library. An unreadable cache is never silently overwritten. **Settings → Connect to Paddock → Archive unreadable cache and rebuild** keeps the original beside the cache before starting fresh. Then reconnect to Paddock and import again. Calculator drafts, saved setups and themes are unaffected.

If the host does not support results, Telemetry explains that it needs a compatible Paddock build. If authentication is rate-limited, wait for the indicated delay. Repeatedly reconnecting or changing the port does not bypass that cooldown.

## Developer handoff

The [versioned contract](../integration/paddock-telemetry-v1/CONTRACT.md) and artificial fixtures define the client boundary. Telemetry owns the client; Paddock owns the host API. Core index/detail support is required; the optional `changes` capability enables quiet refreshes. No host modifications are made by the client at runtime.

Validation commands: `npm run check`, `npm test`, `npm run test:ui`, `npm run test:shell`, and `npm run test:paddock-ui`. The latter exercises the actual sandboxed preload/IPC bridge against a local fixture server and a disposable profile. An optional real-host integration test uses Paddock's completed source with artificial in-memory data: set `SLOTFORGE_PADDOCK_SOURCE` to that checkout, then run `node --test tests/paddock-host-interop.test.cjs`. Local HTTP interoperability has been verified; discovery/firewalls and a real two-computer connection still need verification.

## Manual lap data without Paddock

Available in Telemetry 0.8.0. No Paddock connection or Timing installation is needed.

1. Open **Analyze → Lap analysis → Add lap data** (also available in **Library → Race results**).
2. Enter a session name, car, track/layout, date/time and lane. Driver, source app/notebook, lane length, setup specifications and notes are optional. Use distinct names for different cars and layouts; reuse the same names to group their sessions in Progress. Use a separate session for each driver and lane.
3. Type or paste **one lap time per line**, or choose **Lap number + time** for two tab- or semicolon-separated columns. Optional headers are `Time` or `Lap;Time`. General CSV files with arbitrary columns are not imported automatically.
4. Select seconds (`10.235`, `10,235` or `1:02.345`) or whole milliseconds (`10235`). Seconds support at most three decimal places. Invalid lines show their line number; nothing is silently skipped.
5. Choose **Review lap times**. Check the parsed seconds and mark any **Invalid** or **Pit lap** entries. When re-reviewing edited times, existing flags stay attached to their lap numbers; check them if you inserted, removed or reordered laps. These remain stored but are excluded from pace, consistency and best-lap calculations.
6. Confirm the sequence only when it is one consecutive stint. Use numbered input to preserve missing-lap gaps. For selected or unordered laps, leave it unchecked: charts show individual points, and consecutive-lap metrics remain unavailable.
7. Choose **Save session & analyze**. Your entry is available offline in Lap analysis, Compare runs, Progress and Records. Manual entries are clearly labelled and do not merge with Paddock records.

Example, using numbered columns and seconds:

```text
Lap;Time
1;10.235
2;10.187
4;10.420
```

Lap 3 is missing, so a continuous sequence breaks there. Durations shown beside a manual sequence sum only the supplied times; they are not measured elapsed race time and omit gaps and stops. Manual entries supply no official classification, race adjustments or verified configuration captures. All valid, non-pit manual laps are eligible for the manual library’s best laps.

Manage entries in **Library → Race results → Manual lap library**. **Edit** corrects an existing session rather than duplicating it. **Delete** asks for confirmation. **Back up manual laps** exports a JSON library; **Restore backup** merges new entries and skips unchanged ones. A conflicting revision stops the entire restore rather than overwriting an edited session. These backups are separate from Paddock result exports and calculator setup files.

Limits: 10,000 laps per session, 1,000 manual sessions, 50 MiB per library/backup. A damaged library is preserved and blocks further writes. Export its original contents if needed, then choose **Recover from backup**. Telemetry validates the backup first and asks before archiving the damaged file and restoring it. Invalid backups, cancellation and failed replacement writes leave the original intact.
