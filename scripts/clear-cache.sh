#!/usr/bin/env bash
# clear-cache.sh — Full cache reset for Daily Devotion (Expo SDK 54 / RN 0.81)
# Run from the project root: bash scripts/clear-cache.sh
# Clears: Metro, Expo, Watchman, Babel, Hermes, npm, iOS build artifacts.
# ─────────────────────────────────────────────────────────────────────────────

set -e
cd "$(dirname "$0")/.."
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║       Daily Devotion — Full Cache Clear              ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

PLATFORM=$(uname -s)

# ── 1. Kill Metro if running ──────────────────────────────────────────────────
echo "▸ Stopping Metro bundler..."
pkill -f "metro" 2>/dev/null || true
pkill -f "react-native start" 2>/dev/null || true
pkill -f "expo start" 2>/dev/null || true

# ── 2. Expo cache ─────────────────────────────────────────────────────────────
echo "▸ Clearing Expo cache..."
npx expo --clear 2>/dev/null || true
rm -rf .expo 2>/dev/null || true

# ── 3. Metro / Babel / Hermes cache ──────────────────────────────────────────
echo "▸ Clearing Metro & Babel cache..."
rm -rf /tmp/metro-* 2>/dev/null || true
rm -rf /tmp/haste-* 2>/dev/null || true

if [ "$PLATFORM" = "Darwin" ]; then
  # macOS — Temp dirs
  rm -rf "$TMPDIR/metro-cache" 2>/dev/null || true
  rm -rf "$TMPDIR/react-native-packager-cache-*" 2>/dev/null || true
  rm -rf "$TMPDIR/metro-bundler-cache-*" 2>/dev/null || true
  rm -rf "$TMPDIR/haste-map-*" 2>/dev/null || true
  # Hermes bytecode cache
  rm -rf "$TMPDIR/com.facebook.ReactNative.hermes" 2>/dev/null || true
elif [ "$PLATFORM" = "Linux" ]; then
  rm -rf /tmp/metro-cache 2>/dev/null || true
  rm -rf /tmp/react-native-packager-cache-* 2>/dev/null || true
  rm -rf /tmp/metro-bundler-cache-* 2>/dev/null || true
  rm -rf /tmp/haste-map-* 2>/dev/null || true
fi

# ── 4. Watchman ───────────────────────────────────────────────────────────────
if command -v watchman &>/dev/null; then
  echo "▸ Clearing Watchman state..."
  watchman watch-del-all 2>/dev/null || true
else
  echo "  (Watchman not installed — skipping)"
fi

# ── 5. node_modules ───────────────────────────────────────────────────────────
echo "▸ Removing node_modules..."
rm -rf node_modules

# ── 6. npm / yarn cache ───────────────────────────────────────────────────────
echo "▸ Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

# ── 7. dist / build artifacts ────────────────────────────────────────────────
echo "▸ Removing dist/ folder..."
rm -rf dist 2>/dev/null || true

# ── 8. iOS build artifacts (macOS only) ──────────────────────────────────────
if [ "$PLATFORM" = "Darwin" ] && [ -d "ios" ]; then
  echo "▸ Cleaning iOS build folder..."
  rm -rf ios/build 2>/dev/null || true
  rm -rf ios/DerivedData 2>/dev/null || true
  if [ -d "ios/Pods" ]; then
    echo "▸ Removing CocoaPods (will be reinstalled)..."
    rm -rf ios/Pods 2>/dev/null || true
    rm -f ios/Podfile.lock 2>/dev/null || true
  fi
fi

# ── 9. Reinstall ──────────────────────────────────────────────────────────────
echo ""
echo "▸ Reinstalling npm dependencies..."
npm install

# ── 10. iOS pod install (macOS only) ─────────────────────────────────────────
if [ "$PLATFORM" = "Darwin" ] && [ -f "ios/Podfile" ]; then
  echo "▸ Running pod install..."
  cd ios && pod install --repo-update && cd ..
fi

echo ""
echo "✅  Cache cleared and dependencies reinstalled."
echo ""
echo "   Start the dev server:   npx expo start --clear --dev-client"
echo "   Rebuild native binary:  npx expo run:ios"
echo ""
