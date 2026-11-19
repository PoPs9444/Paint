# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- The brush (5 px) is now the default tool at launch, so you can start drawing immediately.
- New images now fill the window by default instead of a small 640 × 480 sheet. A fixed size can still be set in Settings.
- `build.sh --install` installs the app into /Applications so Spotlight finds it.

## [1.0.0] - 2026-11-19

### Added
- New app icon: rainbow paint stroke and brush.
- Native macOS app: translucent window, custom title bar, full menu bar, Finder "Open With" support.
- Drawing tools: pencil, six brushes (brush, calligraphy ×2, marker, crayon, watercolor), airbrush, eraser, fill bucket with tolerance, color picker, text with font controls.
- 20 editable shapes with outline / fill / outline + fill modes.
- Rectangular and free-form selection with move, resize, duplicate, transparent mode, crop and delete.
- Image transforms: rotate, flip, resize & skew, invert colors, blur and pixelate.
- Layers with opacity, visibility, reorder, duplicate and merge.
- Undo / redo, zoom 10%–800%, gridlines, canvas resize handles.
- Color L / color R workflow, 28-color palette, HSV picker, persistent custom colors.
- Open PNG, JPEG, BMP, GIF, TIFF, HEIC, WebP; save as PNG, JPEG, BMP, TIFF, GIF; print; drag and drop.
- System clipboard integration for copy / cut / paste of images.

[1.0.0]: https://github.com/PoPs9444/Paint/releases/tag/v1.0
