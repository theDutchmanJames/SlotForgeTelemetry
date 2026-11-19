# Release notes

Each release has its notes here (`vX.Y.Z.md`), and the same text is the GitHub release description
(`scripts/prepare-release.cjs` uses it for the draft).

## What's new: shown in the app

When Telemetry starts and finds a newer version, its update window shows the **What's new** section of
that release's notes. Telemetry reads only the lines under the heading `## What's new`, up to the next
heading, and shows them as plain text (bold, links and code marks are removed).

Keep it for users, short and concise:

- **At most six lines.** Longer lines are cut at about 280 characters.
- **One change per line**, best as `- **Name:** what it means for you.`
- **No "under the hood" changes** (tests, builds, code): put those under another heading, such as
  `## Verification` or `## Details`, which the app does not show.

```markdown
## What's new

- **New look:** calmer pages, a slim top bar and clearer buttons throughout.
- **Gear chart:** always shows your current gearing, even outside the Gear finder ranges.
```

The update window also needs the download for each copy attached to the release with its usual name:
`SlotForgeTelemetry-X.Y.Z-Setup-x64.exe`, `-Portable-x64.exe`, `-mac-universal.dmg`,
`-linux-x86_64.AppImage` and `-linux-amd64.deb`. The release workflow attaches all of them to the draft
before it is published, so every copy hears about the new version at the same time. GitHub lists a
SHA-256 fingerprint for each file, and Telemetry checks the download against it.

This is the same rule as in the other SlotForge apps (Circuit, Timing, Paddock).
