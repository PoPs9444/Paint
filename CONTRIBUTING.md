# Contributing to Paint

Thanks for taking the time to contribute! 🎨

## Getting started

```bash
git clone https://github.com/PoPs9444/Paint.git
cd Paint
./build.sh && open Paint.app
```

For quick UI work you can skip compiling: serve `web/` with `python3 -m http.server 8000 -d web` and open it in a browser.

## Project layout

| Path | What lives there |
|---|---|
| `native/main.swift` | Cocoa window, web view host, menus, file / clipboard / print bridge |
| `web/app.js` | The paint engine: tools, history, layers, selection, shapes, text |
| `web/style.css` | The ribbon and panel styling |
| `build.sh` | Builds and packages `Paint.app` |

## Guidelines

- **Keep it simple.** Paint is meant to be fast and approachable, so prefer small, focused features over heavy ones.
- **No dependencies.** The app ships with zero third-party code; please keep it that way.
- **One change per pull request**, with a clear description and screenshots for UI changes.
- **Test by hand:** draw, undo/redo, save and reopen the file, and check both zoomed-in and zoomed-out views.
- Match the existing code style (2-space indent in JS/CSS, 4 spaces in Swift).

## Reporting bugs

Use the [bug report template](https://github.com/PoPs9444/Paint/issues/new?template=bug_report.md). Include your macOS version, the steps to reproduce and, if possible, a screenshot.

## Releasing (maintainers)

1. Update `CHANGELOG.md` and the version in `native/Info.plist`.
2. Tag the commit: `git tag v1.x.y && git push --tags`.
3. The **Build** workflow attaches `Paint-macOS.zip` to the GitHub release automatically.
