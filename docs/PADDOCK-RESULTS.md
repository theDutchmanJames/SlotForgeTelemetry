# Race results from Paddock

Available in Telemetry 0.7.0. Paddock owns its host API; use a Paddock build with Telemetry result-download support. Older Paddock builds may not advertise this capability. The calculator and previously imported results remain usable offline.

## Connect and import

1. In Paddock, open **Connections → Dealership Mode** and turn it on. This is also needed when Paddock runs on the same computer as Telemetry. Keep Paddock running.
2. In Telemetry, open **Settings → Connect to Paddock**.
3. Choose **Find Paddock on this network**, then select your collection. If the search finds nothing, check Dealership Mode, the network and any firewall, or type the address and port shown in Paddock.
4. Enter the Dealership password and choose **Connect**. Telemetry imports your results straight away. A browse-only password cannot access race results.
5. Open **Laps**, pick the car, track and lane, select a run and choose **Full lap analysis** to explore its measured laps. A run separates a car's laps by lane and recorded driver.

Use **Import / refresh results** later to fetch new or corrected sessions. Only reviewed sessions that Timing has delivered to Paddock are imported, not unfinished live races.

Telemetry remembers the collection and address you used last (in `paddock-connection-v1.json` in its profile), but never the password. Paddock chooses a new port every time it starts, so when you open **Connect to Paddock** Telemetry searches for that collection again and fills in its new address. Choose **Forget** to clear it. Passwords stay in memory only; disconnecting or closing Telemetry forgets them. Imported results stay on your computer and can be read offline. No Timing/Paddock result or car specification is edited by Telemetry.

## Paddock on this computer

When Paddock runs on the same computer as Telemetry, use this connection. It imports **every** race in the collection, including races Timing saved to a **Shared library**. Those races use Paddock's newer `history-v1` format, which Paddock does not offer over the network.

1. Start Paddock. Check that **Connections → Paddock on this computer** is on; it is on by default.
2. In Telemetry, open **Settings → Connect to Paddock** and choose **Connect to Paddock on this computer**. No password is needed: Paddock trusts apps running under the same Windows user. If several collections are open, choose one.
3. Telemetry imports the races straight away. After that it reconnects by itself when it starts, and checks for new races whenever you switch back to Telemetry (at most every 30 seconds). **Refresh races** in Settings, or **Refresh results** in Analyze and Library, checks immediately.

How it works:

- **Credentials stay private.** Telemetry finds Paddock through a private connection file that Paddock keeps for your user account. It refuses that file if the folder is not private to you or is redirected. The credential in it stays in Telemetry's background process: it is never shown, saved or exported.
- **Paddock restarts are handled.** Paddock changes its credential every time it starts, and Telemetry picks up the new one automatically.
- **Every race is verified.** Telemetry downloads only new or changed races and checks each against the content fingerprint Paddock accepted. A race that does not match is left out and reported. If Paddock changes during an import, the import starts again. A failed import keeps your previous races.
- **Corrections and withdrawals follow Paddock.** A corrected race replaces the old version, and a withdrawn race leaves analysis and records.
- **One combined library.** If you also imported the same collection over the network, the races read on this computer replace that import in analysis, so nothing is counted twice.

How Shared-library races appear in analysis:

- **Records:** Shared-library races record separately whether a lap counts as a personal best and whether it counts as a track record. Records use the track-record flag, and a run's best eligible lap uses the personal one.
- **Missing details stay missing.** Historical races imported into Paddock can lack lap times, crossing times, lanes or dates. Such laps appear in lap tables but never count towards pace, charts or records.
- **Classification:** the overall classification and its penalties appear as the session classification and adjustments.

Saved races from this connection live in `paddock-shared-history-v1.json`, and the selected collection in `paddock-local-v1.json`, both in Telemetry's profile. Developer details: [integration/paddock-shared-history-v1](../integration/paddock-shared-history-v1/README.md).

## Explore and compare

- **Lap analysis** shows best eligible lap, median pace, middle-50% consistency spread, a five-lap rolling median, best uninterrupted five-lap run, individual lap details, and captured car specifications.
- Excluded pit/invalid laps can be displayed but remain excluded from pace statistics. Slow valid laps remain included. A single valid lap does not establish consistency.
- Long charts retain sampled extrema to avoid excessive drawing work. The lap selector and paginated table keep every recorded lap available.
- **Compare runs** uses a graph-free table. Different track/lane/source suppresses benefit colours. Even matching driver names and IDs do not establish a person's identity across participants or sessions. Tick the confirmation only when you know the runs have the same driver and comparable conditions; colours then highlight lower or higher values.
- Classified race results already include race adjustments. These remain separate from measured lap durations. A classification belongs to the whole session/car, not just the selected lane/driver.
- **The record** on the Laps page is the best eligible lap in the data held by Telemetry for one car, track and lane, across imported races and your own runs. It is not a copy of Timing's entire official track-record or personal-best database. Older undelivered sessions, independent Timing installations and missing measurements can make it incomplete.

## Stints, progress and reports

**Lap analysis → Lap scope** focuses the chart, metrics and recorded-lap table on one recorded stint. The **Stint analysis** table below the chart shows each recorded period for the selected lane and driver, including empty periods, heat names and session-relative start/end times. Select a stint there to focus the analysis above.

Each stint shows included/recorded laps, pit and other-invalid counts, median pace, middle-50% spread, best consecutive five-lap mean, and longest uninterrupted sequence. Opening/closing pace compares the median of the first five and last five laps of the longest continuous valid, non-pit sequence. It requires at least ten laps, never overlaps the windows, and breaks on excluded/missing laps or stint/heat changes. Equal-length sequences use the earliest. These changes describe measured pace, without attributing it to warm-up, wear or setup changes. Pit-lap counts do not establish the number or duration of stops.

**Compare runs → Lap progression** adds an A/B overlay above the existing comparison table. A uses a solid blue/category-motor trace; B uses a dashed tyre-category trace. Both share a time scale and recorded-sequence axis. Excluded laps keep their sequence positions as gaps; shorter runs stop at their final recorded position. This alignment is not a simultaneous race gap, track position or sector comparison. The sequence inspector supports keyboard entry and reads every recorded lap, including excluded laps and positions absent from a shorter run. Return to **Summary** for the graph-free view.

**Laps** shows every run of a car on the same track and lane on one wall: imported races, Track day runs and typed-in sessions together. Pick the car, then the track and lane. The scoreboard shows the record (best record-eligible lap), the pace now (median of the valid laps of the last three runs), the change in typical lap since the first run, and the middle-50% spread of the last run. Each run is a row of lap squares coloured against the record, or against the run's own median; excluded and pit laps keep their place. Changes in the recorded gearing, motor, rear tyre or weight between two runs are marked on the wall, and **What moved the pace** lists them with the median lap before and after. These are observations: driver and conditions may differ. Select a run for its laps, stints, setup, a note and a kind (kept in `run-notes-v1.json`, apart from the imported evidence), **Compare with the run before** and **Full lap analysis**.

**What this run shows / What these runs show** explains measured pace, central consistency spread, uninterrupted five-lap pace and sample coverage. Comparisons distinguish a lower best lap from an unchanged or higher median. Samples under five included laps and (when both have at least five) a twofold sample-size imbalance are flagged. These are descriptive rules, not statistical significance or confidence estimates. Excluded laps remain excluded, and missing metrics remain unavailable. Known lane-length or session-type differences also prevent benefit colours in Compare runs.

**Export comparison report**, available when comparing two runs, downloads a self-contained HTML file. Open it in a browser to read or print. It contains the selected car/driver/session labels, measured statistics, findings, captured setup differences, source identities/revisions/content hashes and separate supplied classifications/adjustments. It contains no connection password or complete lap library. A confirmation made in the comparison is recorded as the user's confirmation. The report is a snapshot and does not update after later corrections or withdrawals.

These features work with existing offline imports and require no additional Paddock API capability.

## Refresh and corrections

Refresh reads a paged index pinned to a result snapshot and downloads only new or changed session documents. Receipt-only warnings also trigger a download. Unrelated private database edits do not interrupt a snapshot import. Sessions flagged as needing correction are named on the Laps page and excluded from analysis and records. Corrections replace prior versions; withdrawals no longer contribute to analysis or records. A full successful refresh reconciles missing sessions after a host restore. Failed, invalid or interrupted transfers leave the previous library intact.

When the host advertises change notifications, Telemetry waits for small notifications while connected and imports updated results automatically after the first successful import. Unsupported hosts use manual refresh. Notification failures back off; disconnect stops network activity. Host identity is checked on every result request.

## Library and backup

Imported runs appear on **Laps** with their collection; sessions needing correction are named at the top of the page. **Laps → More → Export imported races** saves the imported evidence as JSON for a separate backup or inspection. This version does not import that export back into the app; the supported recovery source is Paddock.

The local `paddock-results-v1.json` cache is stored in Telemetry's existing application profile, separately from the setup library. An unreadable cache is never silently overwritten. **Settings → Connect to Paddock → Archive unreadable cache and rebuild** keeps the original beside the cache before starting fresh. Then reconnect to Paddock and import again. Calculator drafts, saved setups and themes are unaffected.

If the host does not support results, Telemetry explains that it needs a compatible Paddock build. If authentication is rate-limited, wait for the indicated delay. Repeatedly reconnecting or changing the port does not bypass that cooldown. A busy notification queue on Paddock (more than ten watching apps) only pauses automatic refresh and does not lock the connection. When Paddock cannot be reached, Telemetry says why in plain words: connection refused (Dealership Mode off or a changed port), host unreachable, or timed out (often a firewall).

## Developer handoff

The [versioned contract](../integration/paddock-telemetry-v1/CONTRACT.md) and artificial fixtures define the client boundary. Telemetry owns the client; Paddock owns the host API. Core index/detail support is required; the optional `changes` capability enables quiet refreshes. No host modifications are made by the client at runtime.

Validation commands: `npm run check`, `npm test`, `npm run test:ui`, `npm run test:shell`, and `npm run test:paddock-ui`. The latter exercises the actual sandboxed preload/IPC bridge against a local fixture server and a disposable profile. An optional real-host integration test uses Paddock's completed source with artificial in-memory data: set `SLOTFORGE_PADDOCK_SOURCE` to that checkout, then run `node --test tests/paddock-host-interop.test.cjs`. Local HTTP interoperability has been verified; discovery/firewalls and a real two-computer connection still need verification.

## Manual lap data without Paddock

Available in Telemetry 0.8.0. No Paddock connection or Timing installation is needed.

1. Open **Laps → Add laps**.
2. Enter a session name, car, track/layout, date/time and lane. Driver, source app/notebook, lane length, setup specifications and notes are optional. Use distinct names for different cars and layouts; reuse the same names so their sessions share a wall on Laps. Use a separate session for each driver and lane.
3. Type or paste **one lap time per line**, or choose **Lap number + time** for two tab- or semicolon-separated columns. Optional headers are `Time` or `Lap;Time`. General CSV files with arbitrary columns are not imported automatically.
4. Select seconds (`10.235`, `10,235` or `1:02.345`) or whole milliseconds (`10235`). Seconds support at most three decimal places. Invalid lines show their line number; nothing is silently skipped.
5. Choose **Review lap times**. Check the parsed seconds and mark any **Invalid** or **Pit lap** entries. When re-reviewing edited times, existing flags stay attached to their lap numbers; check them if you inserted, removed or reordered laps. These remain stored but are excluded from pace, consistency and best-lap calculations.
6. Confirm the sequence only when it is one consecutive stint. Use numbered input to preserve missing-lap gaps. For selected or unordered laps, leave it unchecked: charts show individual points, and consecutive-lap metrics remain unavailable.
7. Choose **Save session & analyze**. The run opens on the Laps wall, offline, beside your other runs of that car, track and lane, including races imported from Paddock. Manual entries are labelled *Typed in* or *Track day*.

Example, using numbered columns and seconds:

```text
Lap;Time
1;10.235
2;10.187
4;10.420
```

Lap 3 is missing, so a continuous sequence breaks there. Durations shown beside a manual sequence sum only the supplied times; they are not measured elapsed race time and omit gaps and stops. Manual entries supply no official classification, race adjustments or verified configuration captures. All valid, non-pit manual laps are eligible for the manual library’s best laps.

Manage entries from the run on **Laps**. **Edit laps** corrects an existing session rather than duplicating it. **Delete** asks for confirmation. **Laps → More → Back up typed-in laps** exports a JSON library; **Restore backup** merges new entries and skips unchanged ones. A conflicting revision stops the entire restore rather than overwriting an edited session. These backups are separate from Paddock result exports and calculator setup files.

Limits: 10,000 laps per session, 1,000 manual sessions, 50 MiB per library/backup. A damaged library is preserved and blocks further writes. Export its original contents if needed, then choose **Recover from backup**. Telemetry validates the backup first and asks before archiving the damaged file and restoring it. Invalid backups, cancellation and failed replacement writes leave the original intact.
