import Cocoa
import WebKit
import UniformTypeIdentifiers

// MARK: - Title bar drag area (the web view would otherwise swallow window drags)

final class DragBar: NSView {
    let label = NSTextField(labelWithString: "Untitled - Paint")

    override init(frame: NSRect) {
        super.init(frame: frame)
        label.font = .systemFont(ofSize: 14, weight: .semibold)
        label.textColor = NSColor(white: 0.9, alpha: 1)
        label.translatesAutoresizingMaskIntoConstraints = false
        addSubview(label)
        NSLayoutConstraint.activate([
            label.leadingAnchor.constraint(equalTo: leadingAnchor, constant: 88),
            label.centerYAnchor.constraint(equalTo: centerYAnchor),
        ])
    }
    required init?(coder: NSCoder) { fatalError() }

    override var mouseDownCanMoveWindow: Bool { true }
    override func mouseDown(with event: NSEvent) {
        if event.clickCount == 2 {
            let action = UserDefaults.standard.string(forKey: "AppleActionOnDoubleClick") ?? "Maximize"
            if action == "Minimize" { window?.performMiniaturize(nil) } else if action != "None" { window?.performZoom(nil) }
        } else {
            window?.performDrag(with: event)
        }
    }
}

// MARK: - App

final class AppDelegate: NSObject, NSApplicationDelegate, NSWindowDelegate, WKScriptMessageHandler, WKNavigationDelegate {
    var window: NSWindow!
    var webView: WKWebView!
    var dragBar: DragBar!
    var ready = false
    var dirty = false
    var forceClosing = false
    var pendingOpen: [URL] = []
    var formatPopup: NSPopUpButton?
    weak var savePanel: NSSavePanel?

    let formats: [(String, UTType)] = [("PNG", .png), ("JPEG", .jpeg), ("BMP", .bmp), ("TIFF", .tiff), ("GIF", .gif)]

    func applicationDidFinishLaunching(_ notification: Notification) {
        buildMenu()

        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: 1290, height: 820),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
                          backing: .buffered, defer: false)
        window.titlebarAppearsTransparent = true
        window.titleVisibility = .hidden
        window.title = "Paint"
        window.appearance = NSAppearance(named: .darkAqua)
        window.minSize = NSSize(width: 820, height: 560)
        window.delegate = self
        window.isReleasedWhenClosed = false
        if let vf = NSScreen.main?.visibleFrame {
            let w = min(1440, vf.width - 40), h = min(880, vf.height - 40)
            window.setFrame(NSRect(x: vf.midX - w / 2, y: vf.midY - h / 2, width: w, height: h), display: false)
        }
        window.setFrameAutosaveName("PaintMainWindow")

        let root = NSVisualEffectView()
        root.material = .hudWindow
        root.blendingMode = .behindWindow
        root.state = .active
        window.contentView = root

        let config = WKWebViewConfiguration()
        config.userContentController.add(self, name: "bridge")
        config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        webView = WKWebView(frame: root.bounds, configuration: config)
        webView.setValue(false, forKey: "drawsBackground")
        webView.allowsMagnification = false
        webView.allowsBackForwardNavigationGestures = false
        webView.navigationDelegate = self
        webView.autoresizingMask = [.width, .height]
        root.addSubview(webView)

        dragBar = DragBar(frame: NSRect(x: 0, y: root.bounds.height - 34, width: root.bounds.width, height: 34))
        dragBar.autoresizingMask = [.width, .minYMargin]
        root.addSubview(dragBar)

        if let res = Bundle.main.resourceURL?.appendingPathComponent("web") {
            webView.loadFileURL(res.appendingPathComponent("index.html"), allowingReadAccessTo: res)
        }

        window.makeKeyAndOrderFront(nil)
        window.makeFirstResponder(webView)
        NSApp.activate(ignoringOtherApps: true)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        if dirty && !forceClosing {
            window.makeKeyAndOrderFront(nil)
            js("paint.requestClose()")
            return .terminateCancel
        }
        return .terminateNow
    }

    func application(_ sender: NSApplication, openFiles filenames: [String]) {
        let urls = filenames.map { URL(fileURLWithPath: $0) }
        if ready { urls.forEach { openImage(at: $0, askFirst: true) } } else { pendingOpen += urls }
        sender.reply(toOpenOrPrint: .success)
    }

    func windowShouldClose(_ sender: NSWindow) -> Bool {
        if dirty && !forceClosing { js("paint.requestClose()"); return false }
        return true
    }

    // MARK: JS bridge

    func js(_ code: String) { webView.evaluateJavaScript(code, completionHandler: nil) }

    func jsString(_ s: String) -> String {
        let data = try! JSONSerialization.data(withJSONObject: [s])
        let str = String(data: data, encoding: .utf8)!
        return String(str.dropFirst().dropLast())
    }

    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? [String: Any], let action = body["action"] as? String else { return }
        switch action {
        case "ready":
            ready = true
            pendingOpen.forEach { openImage(at: $0, askFirst: false) }
            pendingOpen.removeAll()
        case "title":
            let t = body["title"] as? String ?? "Paint"
            dirty = body["dirty"] as? Bool ?? false
            dragBar.label.stringValue = t
            window.title = t
            window.isDocumentEdited = dirty
        case "save":
            guard let data = pngData(body["data"]) else { return }
            let path = body["path"] as? String ?? ""
            let name = body["name"] as? String ?? "Untitled"
            if !path.isEmpty { write(png: data, to: URL(fileURLWithPath: path)) } else { saveAs(png: data, name: name) }
        case "open":
            showOpenPanel()
        case "print":
            if let data = pngData(body["data"]) { printImage(data) }
        case "copy":
            if let data = pngData(body["data"]) {
                let pb = NSPasteboard.general
                pb.clearContents()
                pb.setData(data, forType: .png)
                if let img = NSImage(data: data), let tiff = img.tiffRepresentation { pb.setData(tiff, forType: .tiff) }
            }
        case "paste":
            if let url = clipboardImageDataURL() { js("paint.pasteImage(\(jsString(url)))") } else { js("paint.pasteInternal()") }
        case "forceClose":
            forceClosing = true
            window.close()
            NSApp.terminate(nil)
        default: break
        }
    }

    func pngData(_ any: Any?) -> Data? {
        guard let s = any as? String, let comma = s.firstIndex(of: ",") else { return nil }
        return Data(base64Encoded: String(s[s.index(after: comma)...]))
    }

    // MARK: Open

    func showOpenPanel() {
        let panel = NSOpenPanel()
        panel.allowedContentTypes = [.image]
        panel.allowsMultipleSelection = false
        panel.beginSheetModal(for: window) { [weak self] resp in
            guard resp == .OK, let url = panel.url else { return }
            self?.openImage(at: url, askFirst: false)
        }
    }

    func openImage(at url: URL, askFirst: Bool) {
        guard let src = CGImageSourceCreateWithURL(url as CFURL, nil) else { alert("Could not open \(url.lastPathComponent)."); return }
        let opts: [CFString: Any] = [kCGImageSourceCreateThumbnailFromImageAlways: true,
                                     kCGImageSourceCreateThumbnailWithTransform: true,
                                     kCGImageSourceThumbnailMaxPixelSize: 20000]
        guard let cg = CGImageSourceCreateThumbnailAtIndex(src, 0, opts as CFDictionary) ?? CGImageSourceCreateImageAtIndex(src, 0, nil) else {
            alert("Could not read \(url.lastPathComponent)."); return
        }
        let rep = NSBitmapImageRep(cgImage: cg)
        guard let png = rep.representation(using: .png, properties: [:]) else { return }
        let dataURL = "data:image/png;base64," + png.base64EncodedString()
        let fn = askFirst ? "paint.openFile" : "paint.loadImage"
        // Only formats we can write back keep their path; others become "Save As".
        let writable = ["png", "jpg", "jpeg", "bmp", "tif", "tiff", "gif"].contains(url.pathExtension.lowercased())
        js("\(fn)(\(jsString(dataURL)), \(jsString(url.lastPathComponent)), \(jsString(writable ? url.path : "")))")
        NSDocumentController.shared.noteNewRecentDocumentURL(url)
    }

    // MARK: Save

    func saveAs(png: Data, name: String) {
        let panel = NSSavePanel()
        savePanel = panel
        var base = (name as NSString).deletingPathExtension
        if base.isEmpty { base = "Untitled" }
        let ext = (name as NSString).pathExtension.lowercased()
        var idx = 0
        if ["jpg", "jpeg"].contains(ext) { idx = 1 } else if ext == "bmp" { idx = 2 } else if ["tif", "tiff"].contains(ext) { idx = 3 } else if ext == "gif" { idx = 4 }

        let popup = NSPopUpButton(frame: .zero, pullsDown: false)
        popup.addItems(withTitles: formats.map { $0.0 })
        popup.selectItem(at: idx)
        popup.target = self
        popup.action = #selector(formatChanged(_:))
        formatPopup = popup
        let lbl = NSTextField(labelWithString: "Format:")
        let stack = NSStackView(views: [lbl, popup])
        stack.edgeInsets = NSEdgeInsets(top: 8, left: 12, bottom: 8, right: 12)
        panel.accessoryView = stack
        panel.allowedContentTypes = [formats[idx].1]
        panel.nameFieldStringValue = base
        panel.canCreateDirectories = true
        panel.beginSheetModal(for: window) { [weak self] resp in
            guard let self = self else { return }
            if resp == .OK, let url = panel.url { self.write(png: png, to: url) } else { self.js("paint.onSaveCancelled()") }
        }
    }

    @objc func formatChanged(_ sender: NSPopUpButton) {
        savePanel?.allowedContentTypes = [formats[sender.indexOfSelectedItem].1]
    }

    func write(png: Data, to url: URL) {
        guard let rep = NSBitmapImageRep(data: png) else { return }
        let ext = url.pathExtension.lowercased()
        var out: Data?
        switch ext {
        case "jpg", "jpeg": out = flattened(rep).representation(using: .jpeg, properties: [.compressionFactor: 0.92])
        case "bmp": out = flattened(rep).representation(using: .bmp, properties: [:])
        case "tif", "tiff": out = rep.representation(using: .tiff, properties: [.compressionMethod: NSBitmapImageRep.TIFFCompression.lzw.rawValue])
        case "gif": out = rep.representation(using: .gif, properties: [:])
        default: out = png
        }
        guard let data = out else { alert("Could not encode the image."); js("paint.onSaveCancelled()"); return }
        do {
            try data.write(to: url, options: .atomic)
            NSDocumentController.shared.noteNewRecentDocumentURL(url)
            js("paint.onSaved(\(jsString(url.path)), \(jsString(url.lastPathComponent)))")
        } catch {
            alert("Could not save: \(error.localizedDescription)")
            js("paint.onSaveCancelled()")
        }
    }

    /// Image on white background without alpha (for JPEG / BMP).
    func flattened(_ rep: NSBitmapImageRep) -> NSBitmapImageRep {
        let w = rep.pixelsWide, h = rep.pixelsHigh
        guard let out = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: w, pixelsHigh: h, bitsPerSample: 8, samplesPerPixel: 3,
                                         hasAlpha: false, isPlanar: false, colorSpaceName: .deviceRGB, bytesPerRow: 0, bitsPerPixel: 0),
              let ctx = NSGraphicsContext(bitmapImageRep: out) else { return rep }
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = ctx
        NSColor.white.setFill()
        NSRect(x: 0, y: 0, width: w, height: h).fill()
        rep.draw(in: NSRect(x: 0, y: 0, width: w, height: h))
        NSGraphicsContext.restoreGraphicsState()
        return out
    }

    // MARK: Clipboard / print

    func clipboardImageDataURL() -> String? {
        let pb = NSPasteboard.general
        var cg: CGImage?
        if let urls = pb.readObjects(forClasses: [NSURL.self], options: [.urlReadingContentsConformToTypes: [UTType.image.identifier]]) as? [URL],
           let u = urls.first, let src = CGImageSourceCreateWithURL(u as CFURL, nil) {
            cg = CGImageSourceCreateImageAtIndex(src, 0, nil)
        }
        if cg == nil, let data = pb.data(forType: .png) ?? pb.data(forType: .tiff), let src = CGImageSourceCreateWithData(data as CFData, nil) {
            cg = CGImageSourceCreateImageAtIndex(src, 0, nil)
        }
        if cg == nil, let img = NSImage(pasteboard: pb) {
            var r = NSRect(origin: .zero, size: img.size)
            cg = img.cgImage(forProposedRect: &r, context: nil, hints: nil)
        }
        guard let image = cg, let png = NSBitmapImageRep(cgImage: image).representation(using: .png, properties: [:]) else { return nil }
        return "data:image/png;base64," + png.base64EncodedString()
    }

    func printImage(_ png: Data) {
        guard let rep = NSBitmapImageRep(data: png) else { return }
        let img = NSImage(size: NSSize(width: rep.pixelsWide, height: rep.pixelsHigh))
        img.addRepresentation(rep)
        let info = NSPrintInfo.shared.copy() as! NSPrintInfo
        info.horizontalPagination = .fit
        info.verticalPagination = .fit
        info.isHorizontallyCentered = true
        info.isVerticallyCentered = true
        info.orientation = rep.pixelsWide > rep.pixelsHigh ? .landscape : .portrait
        let page = info.imageablePageBounds.size
        let scale = min(1, page.width / img.size.width, page.height / img.size.height)
        let view = NSImageView(frame: NSRect(x: 0, y: 0, width: img.size.width * scale, height: img.size.height * scale))
        view.image = img
        view.imageScaling = .scaleProportionallyUpOrDown
        let op = NSPrintOperation(view: view, printInfo: info)
        op.runModal(for: window, delegate: nil, didRun: nil, contextInfo: nil)
    }

    func alert(_ text: String) {
        let a = NSAlert()
        a.messageText = "Paint"
        a.informativeText = text
        a.beginSheetModal(for: window, completionHandler: nil)
    }

    // MARK: Menu

    @objc func menuCommand(_ sender: NSMenuItem) {
        if let cmd = sender.representedObject as? String { js("paint.command(\(jsString(cmd)))") }
    }

    func item(_ title: String, _ cmd: String, _ key: String, _ mods: NSEvent.ModifierFlags = [.command]) -> NSMenuItem {
        let it = NSMenuItem(title: title, action: #selector(menuCommand(_:)), keyEquivalent: key)
        it.keyEquivalentModifierMask = mods
        it.representedObject = cmd
        it.target = self
        return it
    }

    func buildMenu() {
        let main = NSMenu()

        let appItem = NSMenuItem(); main.addItem(appItem)
        let appMenu = NSMenu()
        appMenu.addItem(withTitle: "About Paint", action: #selector(NSApplication.orderFrontStandardAboutPanel(_:)), keyEquivalent: "")
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Hide Paint", action: #selector(NSApplication.hide(_:)), keyEquivalent: "h")
        let other = appMenu.addItem(withTitle: "Hide Others", action: #selector(NSApplication.hideOtherApplications(_:)), keyEquivalent: "h")
        other.keyEquivalentModifierMask = [.command, .option]
        appMenu.addItem(.separator())
        appMenu.addItem(withTitle: "Quit Paint", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q")
        appItem.submenu = appMenu

        let fileItem = NSMenuItem(); main.addItem(fileItem)
        let file = NSMenu(title: "File")
        file.addItem(item("New", "new", "n"))
        file.addItem(item("Open…", "open", "o"))
        file.addItem(.separator())
        file.addItem(item("Save", "save", "s"))
        file.addItem(item("Save As…", "saveAs", "s", [.command, .shift]))
        file.addItem(.separator())
        file.addItem(item("Print…", "print", "p"))
        file.addItem(.separator())
        file.addItem(withTitle: "Close", action: #selector(NSWindow.performClose(_:)), keyEquivalent: "w")
        fileItem.submenu = file

        let editItem = NSMenuItem(); main.addItem(editItem)
        let edit = NSMenu(title: "Edit")
        edit.addItem(item("Undo", "undo", "z"))
        edit.addItem(item("Redo", "redo", "z", [.command, .shift]))
        edit.addItem(.separator())
        edit.addItem(withTitle: "Cut", action: #selector(NSText.cut(_:)), keyEquivalent: "x")
        edit.addItem(withTitle: "Copy", action: #selector(NSText.copy(_:)), keyEquivalent: "c")
        edit.addItem(withTitle: "Paste", action: #selector(NSText.paste(_:)), keyEquivalent: "v")
        edit.addItem(withTitle: "Select All", action: #selector(NSText.selectAll(_:)), keyEquivalent: "a")
        edit.addItem(item("Delete Selection", "delete", ""))
        editItem.submenu = edit

        let imgItem = NSMenuItem(); main.addItem(imgItem)
        let img = NSMenu(title: "Image")
        img.addItem(item("Crop to Selection", "crop", "x", [.command, .shift]))
        img.addItem(item("Resize and Skew…", "resize", "e"))
        img.addItem(.separator())
        img.addItem(item("Rotate Right 90°", "rotR", ""))
        img.addItem(item("Rotate Left 90°", "rotL", ""))
        img.addItem(item("Rotate 180°", "rot180", ""))
        img.addItem(item("Flip Horizontal", "flipH", ""))
        img.addItem(item("Flip Vertical", "flipV", ""))
        img.addItem(.separator())
        img.addItem(item("Invert Colors", "invert", "i", [.command, .shift]))
        img.addItem(item("Clear Image", "clear", ""))
        imgItem.submenu = img

        let viewItem = NSMenuItem(); main.addItem(viewItem)
        let view = NSMenu(title: "View")
        view.addItem(item("Zoom In", "zoomIn", "="))
        view.addItem(item("Zoom Out", "zoomOut", "-"))
        view.addItem(item("Actual Size", "zoom100", "0"))
        view.addItem(item("Fit to Window", "fit", "9"))
        view.addItem(.separator())
        view.addItem(item("Gridlines", "grid", "g"))
        view.addItem(item("Layers", "layers", "l"))
        view.addItem(.separator())
        let fs = view.addItem(withTitle: "Enter Full Screen", action: #selector(NSWindow.toggleFullScreen(_:)), keyEquivalent: "f")
        fs.keyEquivalentModifierMask = [.command, .control]
        viewItem.submenu = view

        let winItem = NSMenuItem(); main.addItem(winItem)
        let win = NSMenu(title: "Window")
        win.addItem(withTitle: "Minimize", action: #selector(NSWindow.performMiniaturize(_:)), keyEquivalent: "m")
        win.addItem(withTitle: "Zoom", action: #selector(NSWindow.performZoom(_:)), keyEquivalent: "")
        winItem.submenu = win
        NSApp.windowsMenu = win

        NSApp.mainMenu = main
    }
}

let app = NSApplication.shared
let delegate = AppDelegate()
app.delegate = delegate
app.setActivationPolicy(.regular)
app.run()
