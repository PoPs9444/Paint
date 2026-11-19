import Cocoa

// Draws the app icon at a given pixel size.
func drawIcon(_ px: Int) -> Data {
    let rep = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: px, pixelsHigh: px, bitsPerSample: 8, samplesPerPixel: 4,
                               hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0)!
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = NSGraphicsContext(bitmapImageRep: rep)
    let s = CGFloat(px) / 1024
    let ctx = NSGraphicsContext.current!.cgContext
    ctx.scaleBy(x: s, y: s)

    // squircle background
    let bg = NSBezierPath(roundedRect: NSRect(x: 100, y: 100, width: 824, height: 824), xRadius: 185, yRadius: 185)
    NSGradient(colors: [NSColor(red: 0.16, green: 0.47, blue: 0.98, alpha: 1), NSColor(red: 0.45, green: 0.25, blue: 0.92, alpha: 1)])!.draw(in: bg, angle: -60)

    // canvas sheet
    let sheet = NSBezierPath(roundedRect: NSRect(x: 210, y: 250, width: 604, height: 500), xRadius: 40, yRadius: 40)
    NSColor(white: 0, alpha: 0.25).setFill()
    NSBezierPath(roundedRect: NSRect(x: 214, y: 236, width: 604, height: 500), xRadius: 40, yRadius: 40).fill()
    NSColor.white.setFill(); sheet.fill()

    // paint blobs
    let colors: [NSColor] = [.systemRed, .systemOrange, .systemYellow, .systemGreen, .systemTeal]
    for (i, c) in colors.enumerated() {
        c.setFill()
        NSBezierPath(ovalIn: NSRect(x: 260 + CGFloat(i) * 92, y: 600, width: 72, height: 72)).fill()
    }
    // squiggle stroke
    let sq = NSBezierPath()
    sq.move(to: NSPoint(x: 270, y: 420))
    sq.curve(to: NSPoint(x: 520, y: 430), controlPoint1: NSPoint(x: 330, y: 560), controlPoint2: NSPoint(x: 440, y: 300))
    sq.curve(to: NSPoint(x: 700, y: 470), controlPoint1: NSPoint(x: 600, y: 560), controlPoint2: NSPoint(x: 650, y: 380))
    sq.lineWidth = 46; sq.lineCapStyle = .round
    NSColor(red: 0.16, green: 0.47, blue: 0.98, alpha: 1).setStroke(); sq.stroke()

    // brush
    ctx.saveGState()
    ctx.translateBy(x: 700, y: 330); ctx.rotate(by: .pi / 4)
    NSColor(red: 0.55, green: 0.33, blue: 0.18, alpha: 1).setFill()
    NSBezierPath(roundedRect: NSRect(x: -26, y: 40, width: 52, height: 330), xRadius: 26, yRadius: 26).fill()
    NSColor(white: 0.82, alpha: 1).setFill()
    NSBezierPath(rect: NSRect(x: -30, y: -10, width: 60, height: 70)).fill()
    NSColor(red: 0.93, green: 0.11, blue: 0.14, alpha: 1).setFill()
    let tip = NSBezierPath()
    tip.move(to: NSPoint(x: -30, y: -10)); tip.curve(to: NSPoint(x: 0, y: -120), controlPoint1: NSPoint(x: -34, y: -60), controlPoint2: NSPoint(x: -10, y: -100))
    tip.curve(to: NSPoint(x: 30, y: -10), controlPoint1: NSPoint(x: 10, y: -100), controlPoint2: NSPoint(x: 34, y: -60)); tip.close(); tip.fill()
    ctx.restoreGState()

    NSGraphicsContext.restoreGraphicsState()
    return rep.representation(using: .png, properties: [:])!
}

let out = CommandLine.arguments[1]
try? FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)
for (name, px) in [("icon_16x16", 16), ("icon_16x16@2x", 32), ("icon_32x32", 32), ("icon_32x32@2x", 64), ("icon_128x128", 128),
                   ("icon_128x128@2x", 256), ("icon_256x256", 256), ("icon_256x256@2x", 512), ("icon_512x512", 512), ("icon_512x512@2x", 1024)] {
    try! drawIcon(px).write(to: URL(fileURLWithPath: "\(out)/\(name).png"))
}
