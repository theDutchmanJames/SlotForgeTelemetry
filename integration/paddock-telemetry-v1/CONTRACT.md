# Paddock → Telemetry analysis API v1

Paddock owns the host API; Telemetry owns the client. The authoritative specification is the [Paddock-owned contract](host-handoff/CONTRACT.md), copied unchanged with its schema, artificial fixtures and licence from Paddock's `integration-handoff/telemetry-v1` on 1 November 2026.

Telemetry implements the following parts of that contract:

- Existing Dealership password or legacy Timing credential, main-process GET requests, local discovery and explicit host identity.
- Complete unfiltered paged import pinned to the advertised result snapshot, with a small final status check and at most three attempts if the snapshot changes. Legacy revision-only hosts remain supported.
- Incremental downloads using `resultHash` (including receipt changes), canonical payload hash validation, and atomic offline caching.
- Corrections, withdrawals, removed sessions and restored lower revisions, keyed by database ID + Timing source ID + session ID.
- Optional long-poll notifications, catch-up after reconnect, bounded failure backoff and credential revocation handling.
- Quarantine of sessions flagged as needing correction; participant-scoped driver identities; measured laps kept separate from classified adjustments.

The client imports the whole permitted history before applying local browsing filters. It does not implement host-filtered browsing or the optional SSE transport.

The original artificial fixtures in `fixtures/` exercise the legacy interface. `host-handoff/fixtures/` contains Paddock's completed contract examples. The old host prototype is historical reference only. Its installer has been disabled and cannot change Paddock's checkout.

See [user instructions](../../docs/PADDOCK-RESULTS.md) and [review results](../../docs/PADDOCK-REVIEW.md).
