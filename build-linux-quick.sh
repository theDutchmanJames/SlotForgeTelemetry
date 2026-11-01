#!/usr/bin/env bash
# Reuse installed dependencies and skip checks for an already-tested revision.
exec bash "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/build-linux.sh" --quick "$@"
