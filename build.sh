#!/bin/bash
# Builds Paint.app next to this script.
set -euo pipefail
cd "$(dirname "$0")"
export DEVELOPER_DIR="${DEVELOPER_DIR:-/Library/Developer/CommandLineTools}"
APP="Paint.app"
BUILD=".build"
rm -rf "$APP" "$BUILD"
mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources" "$BUILD"

swiftc -O -o "$APP/Contents/MacOS/Paint" native/main.swift -framework Cocoa -framework WebKit
cp native/Info.plist "$APP/Contents/Info.plist"
cp -R web "$APP/Contents/Resources/web"

swiftc -O -o "$BUILD/make_icon" native/make_icon.swift -framework Cocoa
"$BUILD/make_icon" "$BUILD/AppIcon.iconset"
iconutil -c icns "$BUILD/AppIcon.iconset" -o "$APP/Contents/Resources/AppIcon.icns"

codesign --force --deep --sign - "$APP" >/dev/null 2>&1 || true
rm -rf "$BUILD"
echo "Built $(pwd)/$APP"
