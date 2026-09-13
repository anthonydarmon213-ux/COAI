import AppKit

// Lossless RGB encoding for Apple's app icon asset (no alpha channel).
for file in CommandLine.arguments.dropFirst() {
    let url = URL(fileURLWithPath: file)
    let data = try Data(contentsOf: url)
    guard let source = NSBitmapImageRep(data: data),
          let rgb = NSBitmapImageRep(bitmapDataPlanes: nil, pixelsWide: source.pixelsWide,
              pixelsHigh: source.pixelsHigh, bitsPerSample: 8, samplesPerPixel: 3,
              hasAlpha: false, isPlanar: false, colorSpaceName: .deviceRGB,
              bytesPerRow: source.pixelsWide * 3, bitsPerPixel: 24) else { fatalError("Invalid icon") }
    for y in 0..<source.pixelsHigh {
        for x in 0..<source.pixelsWide {
            guard let color = source.colorAt(x: x, y: y), color.alphaComponent == 1 else { fatalError("Transparent pixel") }
            rgb.setColor(color, atX: x, y: y)
        }
    }
    guard let png = rgb.representation(using: .png, properties: [:]) else { fatalError("PNG failed") }
    try png.write(to: url, options: .atomic)
}
