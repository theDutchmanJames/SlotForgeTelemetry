#!/usr/bin/env bash
# SlotForge Telemetry Linux builder. See --help for build/install options.
exec bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/scripts/platform-build.sh" linux "$@"
