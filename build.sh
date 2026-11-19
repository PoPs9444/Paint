#!/bin/bash
# Builds Paint.app next to this script (universal when the Intel toolchain is available).
#   ./build.sh          build Paint.app
#   ./build.sh --zip    also create Paint-macOS.zip for distribution
set -euo pipefail
cd "$(dirname "$0")"

# Fall back to the Command Line Tools when Xcode is missing or its license is not accepted.
if ! xcrun lipo -archs /bin/ls >/dev/null 2>&1; then
  export DEVELOPER_DIR=/Library/Developer/CommandLineTools
fi

APP="Paint.app"
BUILD=".build"
MIN_MACOS="12.0"
rm -rf "$APP" "$BUILD"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources" "$BUILD"

echo "→ Compiling for Apple Silicon…"
xcrun swiftc -O -target "arm64-apple-macos$MIN_MACOS" -o "$BUILD/Paint-arm64" native/main.swift -framework Cocoa -framework WebKit
if xcrun swiftc -O -target "x86_64-apple-macos$MIN_MACOS" -o "$BUILD/Paint-x86_64" native/main.swift -framework Cocoa -framework WebKit >/dev/null 2>&1; then
  echo "→ Compiled for Intel too — creating a universal binary"
  xcrun lipo -create "$BUILD/Paint-arm64" "$BUILD/Paint-x86_64" -output "$APP/Contents/MacOS/Paint"
else
  echo "→ Intel toolchain unavailable — building Apple Silicon only"
  cp "$BUILD/Paint-arm64" "$APP/Contents/MacOS/Paint"
fi

echo "→ Bundling resources…"
cp native/Info.plist "$APP/Contents/Info.plist"
cp -R web "$APP/Contents/Resources/web"

echo "→ Building app icon…"
ICONSET="$BUILD/AppIcon.iconset"; mkdir -p "$ICONSET"
for size in 16 32 128 256 512; do
  sips -z $size $size native/AppIcon.png --out "$ICONSET/icon_${size}x${size}.png" >/dev/null
  sips -z $((size * 2)) $((size * 2)) native/AppIcon.png --out "$ICONSET/icon_${size}x${size}@2x.png" >/dev/null
done
iconutil -c icns "$ICONSET" -o "$APP/Contents/Resources/AppIcon.icns"

codesign --force --deep --sign - "$APP" >/dev/null 2>&1 || true

if [[ "${1:-}" == "--zip" ]]; then
  rm -f Paint-macOS.zip
  ditto -c -k --keepParent "$APP" Paint-macOS.zip
  echo "→ Packaged Paint-macOS.zip"
fi

rm -rf "$BUILD"
echo "✓ Built $(pwd)/$APP"
