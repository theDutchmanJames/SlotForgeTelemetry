# Paddock integration boundary

**Paddock owns the host API. Telemetry owns its client.**

Use the [Paddock-owned handoff](host-handoff/README.md) and [current client contract notes](CONTRACT.md). The handoff was copied unchanged from Paddock's `integration-handoff/telemetry-v1` on 1 November 2026, including its licence and artificial fixtures.

`telemetry-export.cjs` and its companion test are an obsolete initial host prototype retained for reference. They are not shipped in Telemetry and must not replace Paddock's expanded implementation. `install-host.cjs` is retired: it exits without writing any files.

For app users, follow [Connect to Paddock](../../docs/PADDOCK-RESULTS.md). Both apps require compatible builds; editing host source is not an installation step.
