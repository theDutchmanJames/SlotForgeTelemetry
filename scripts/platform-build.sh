#!/usr/bin/env bash
# Shared local builder; compatible with macOS Bash 3.2. Inspired by Timing's builders.
set -euo pipefail
platform="${1:-}"
shift || true
mode=ask
quick=0
pause=1
APP_NAME='SlotForge Telemetry'
APP_ID=slotforge-telemetry
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
wait_for_enter() { if [ "$pause" = 1 ] && [ -t 0 ]; then read -r -p 'Press Enter to close. ' answer || true; fi; }
fail() { printf '\n%s\n' "$*" >&2; wait_for_enter; exit 1; }
trap 'fail "Build stopped. Read the error above; no successful build is being reported."' ERR
usage() {
  cat <<'HELP'
SlotForge Telemetry local builder
  --install     Build, then install for this user.
  --no-install  Build only; outputs are in dist/linux or dist/mac.
  --uninstall   Remove the copy installed by this builder; keep saved setups.
  --quick       Reuse available dependencies and skip checks.
  --no-pause    Do not wait for Enter at the end.
  --help        Show this help.
Without an install option, asks after building when run interactively.
Requires Node.js 22.12+ and npm. Run the Linux builder on Linux and the Mac
builder on macOS. Initial builds need internet access. Quick mode may still
download packaging tools. Builds never publish a release.
HELP
}
for arg in "$@"; do
  case "$arg" in
    --install) mode=install ;;
    --no-install) mode=build ;;
    --uninstall) mode=uninstall ;;
    --quick) quick=1 ;;
    --no-pause) pause=0 ;;
    -h|--help) usage; exit 0 ;;
    *) fail "Unknown option: $arg. Use --help." ;;
  esac
done
case "$platform:$(uname -s)" in
  linux:Linux|mac:Darwin) ;;
  *) fail 'Run build-linux.sh on Linux, or build-mac.command on macOS.' ;;
esac
[ "$(id -u)" != 0 ] || fail 'Run this as your normal user, without sudo.'

# Install paths are fixed app-specific children; never remove the parent directories.
if [ "$platform" = linux ]; then
  data_home="${XDG_DATA_HOME:-$HOME/.local/share}"
  case "$data_home" in /*) ;; *) fail 'XDG_DATA_HOME must be an absolute path.' ;; esac
  install_path="$data_home/$APP_ID"
  desktop_file="$data_home/applications/$APP_ID.desktop"
else
  install_path="$HOME/Applications/$APP_NAME.app"
fi
if [ "$mode" = uninstall ]; then
  if [ "$platform" = mac ] && pgrep -x "$APP_NAME" >/dev/null 2>&1; then fail 'Quit SlotForge Telemetry before uninstalling it.'; fi
  if [ "$platform" = linux ]; then
    rm -f -- "$desktop_file" "$install_path/SlotForgeTelemetry.AppImage" "$install_path/icon.png"
    rmdir -- "$install_path" 2>/dev/null || true
  else
    # Only bundles marked by our installer may be removed automatically.
    if [ -f "$install_path.slotforge-installed" ]; then
      rm -rf -- "$install_path"
      rm -f -- "$install_path.slotforge-installed"
    elif [ -e "$install_path" ]; then
      fail "This builder did not install $install_path. Remove that copy in Finder."
    fi
  fi
  printf 'Removed the builder-installed app. Saved setups and settings are kept.\n'
  wait_for_enter; exit 0
fi

command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1 || fail 'Install Node.js 22.12+ and npm, then run this builder again.'
node -e 'const [m,n]=process.versions.node.split(".").map(Number);process.exit(m>22||(m===22&&n>=12)?0:1)' || fail 'Node.js 22.12 or newer is required.'
[ -f assets/icon.png ] || fail 'Missing assets/icon.png. Restore the bundled Telemetry icon.'
printf '\nBuilding %s for %s\n' "$APP_NAME" "$platform"
if [ "$quick" = 1 ] && node -e 'const fs=require("fs");require.resolve("electron-builder/cli.js");if(!fs.existsSync(require("electron")))process.exit(1)' >/dev/null 2>&1; then
  printf 'Quick mode: reusing installed dependencies.\n'
else
  npm ci --include=dev
fi
if [ "$quick" = 1 ]; then
  printf 'Quick mode: skipping checks. Use a normal build before sharing a release.\n'
else
  npm run check
  npm test
fi
version="$(node -p "require('./package.json').version")"
if [ "$platform" = linux ]; then
  arch="$(node -p 'process.arch')"
  case "$arch" in x64|arm64) ;; *) fail 'The Linux builder supports x64 and arm64 hosts.' ;; esac
  output="$ROOT/dist/linux"
  appimage_arch="$arch"; deb_arch="$arch"
  if [ "$arch" = x64 ]; then appimage_arch=x86_64; deb_arch=amd64; fi
  appimage="$output/SlotForgeTelemetry-$version-linux-$appimage_arch.AppImage"
  deb="$output/SlotForgeTelemetry-$version-linux-$deb_arch.deb"
  # Clear only these exact outputs so an earlier build cannot be reported as success.
  rm -f -- "$appimage" "$deb"
  npm run dist:linux -- --publish never
  [ -s "$appimage" ] && [ -s "$deb" ] || fail 'The build did not produce both the AppImage and DEB.'
  chmod +x "$appimage"
else
  output="$ROOT/dist/mac"
  dmg="$output/SlotForgeTelemetry-$version-mac-universal.dmg"
  zip="$output/SlotForgeTelemetry-$version-mac-universal.zip"
  rm -f -- "$dmg" "$zip"
  npm run dist:mac -- --publish never
  bundle="$output/mac-universal/$APP_NAME.app"
  [ -s "$dmg" ] && [ -s "$zip" ] && [ -d "$bundle" ] || fail 'The build did not produce the universal app, DMG and ZIP.'
fi
printf '\nBuild complete: %s\n' "$output"
if [ "$mode" = ask ] && [ -t 0 ]; then
  read -r -p "Install $APP_NAME for this user? [y/N] " answer || answer=n
  case "$answer" in y|Y|yes|YES) mode=install ;; esac
fi
if [ "$mode" = install ]; then
  if [ "$platform" = linux ]; then
    # Desktop Exec quoting cannot safely represent these characters without escaping.
    case "$install_path" in *[\"\$\`\\%]*|*$'\n'*|*$'\r'*) fail 'The installation path contains characters unsupported by this menu shortcut.' ;; esac
    mkdir -p "$install_path" "$data_home/applications"
    cp "$appimage" "$install_path/SlotForgeTelemetry.AppImage.new"
    chmod +x "$install_path/SlotForgeTelemetry.AppImage.new"
    mv -f "$install_path/SlotForgeTelemetry.AppImage.new" "$install_path/SlotForgeTelemetry.AppImage"
    cp assets/icon.png "$install_path/icon.png"
    # Extract-and-run works without a system FUSE installation; keep Chromium's sandbox enabled.
    cat > "$desktop_file" <<ENTRY
[Desktop Entry]
Type=Application
Name=SlotForge Telemetry
Comment=Slot car gearing and setup calculator
Exec=env APPIMAGE_EXTRACT_AND_RUN=1 "$install_path/SlotForgeTelemetry.AppImage"
Icon=$install_path/icon.png
Terminal=false
Categories=Utility;
Keywords=slot car;calculator;gearing;
ENTRY
    if command -v update-desktop-database >/dev/null 2>&1; then update-desktop-database "$data_home/applications" || true; fi
    printf 'Installed in your applications menu: %s\n' "$install_path"
  else
    pgrep -x "$APP_NAME" >/dev/null 2>&1 && fail 'Quit SlotForge Telemetry before installing an update.'
    mkdir -p "$HOME/Applications"
    if [ -e "$install_path" ] && [ ! -f "$install_path.slotforge-installed" ]; then fail "An existing app is at $install_path. Move it in Finder before installing this copy."; fi
    staging="$(mktemp -d "$HOME/Applications/.slotforge-telemetry.XXXXXX")"
    ditto "$bundle" "$staging/$APP_NAME.app"
    backup=''
    if [ -e "$install_path" ]; then backup="$staging/previous.app"; mv "$install_path" "$backup"; fi
    if ! mv "$staging/$APP_NAME.app" "$install_path"; then
      if [ -n "$backup" ]; then mv "$backup" "$install_path"; fi
      fail "Installation failed; staging files are in $staging."
    fi
    touch "$install_path.slotforge-installed"
    rm -rf -- "$staging"
    printf 'Installed: %s\n' "$install_path"
  fi
fi
wait_for_enter
