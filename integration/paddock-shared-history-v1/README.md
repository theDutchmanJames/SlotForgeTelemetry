# Paddock shared history (Telemetry client)

Telemetry reads every accepted race from **Paddock on this computer** through Paddock's trusted-local shared-history API. That includes races Timing saved to a *Shared library* in the newer `history-v1` format, which Paddock leaves out of the network Telemetry-v1 index.

The fixtures in `fixtures/` are copied unchanged from Paddock's handoff (`integration-handoff/shared-racing-history-v1/implemented` and `qualified`, plus `local-library-v1/fixtures/discovery.json`). Paddock owns these contracts; Telemetry owns only its client.

## What the client does

1. **Discovery.** It reads `*.json` descriptors from Paddock's per-user folder (`%LOCALAPPDATA%/SlotForge/local-libraries/v1/` on Windows). The folder and files must be private to the current user, not redirected, and at most 8 KiB. The rules are the same as SlotForge Timing's. The descriptor token stays in the main process and is never saved, logged or sent to the renderer.
2. **Status.** `GET /v1/status` with `X-SlotForge-Extensions: shared-history-v1`. The client verifies `localInstanceId`, the database ID, `permissions.timingResults` and `capabilities.sharedHistory.features.historyReads`.
3. **Listing.** `GET /v1/shared-history/sessions?state=all&limit=50`, followed through `nextPage`. Every page must belong to one snapshot.
4. **Downloads.** Only new or changed identities are downloaded, compared on `accepted.revision`, `contentHash` and `state`. The client reads the head, then every lap page per participant using the `resultToken`.
5. **Integrity.** Lap pages are put back into the participants, and the SHA-256 canonical hash must equal `accepted.contentHash`. For `timing-v1` that is the payload; for `history-v1` it is the complete bundle. `timing-v1` payloads also pass the existing timing-v1 validator.
6. **Consistency.** `GET /v1/shared-history/status` must still report the listing snapshot as its cursor. Otherwise the import retries from a fresh listing, and the previous library is kept until an import completes.
7. **Recovery.** A 401 or `INSTANCE_CHANGED` response means Paddock restarted and rotated its credential, so the client rediscovers the descriptor and retries. `SNAPSHOT_CHANGED` and `RESULT_CHANGED` trigger a fresh retry.

Withdrawn sessions are kept as tombstones without a body. Sessions with a format this client does not know are counted and reported, never guessed.

## Mapping history-v1 for analysis

`src/shared-history-projection.cjs` maps a verified bundle into the timing-v1-shaped payload that `RaceModel` uses:

| history-v1 | Telemetry |
| --- | --- |
| `personalRecordEligible` | `recordEligible`, used for a run's best eligible lap |
| `trackRecordEligible` | `trackRecordEligible`, used by Records |
| Overall `classification` | `standings`; their `effects` become `adjustments` |
| Unknown lap time | Kept in the lap table; never counts towards pace, charts or records |
| Unknown crossing time | Sorted by lap number; consecutive-lap metrics are unavailable |
| Lap without a stint (historical) | Grouped by the lap's own heat, lane and driver |
| Unknown start date | Saved date if known; the run is flagged `dateUnknown` |

The cache is `paddock-shared-history-v1.json` in Telemetry's profile. It is separate from the network cache (`paddock-results-v1.json`), and every entry is re-verified against its hash on load. When the same collection exists in both caches, the local copy replaces the network import in the analysis screens.
