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
