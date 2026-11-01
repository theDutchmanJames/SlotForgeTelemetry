#!/usr/bin/env bash
# SlotForge Telemetry macOS builder. Double-click in Finder or run in Terminal.
exec bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scripts/platform-build.sh" mac "$@"
