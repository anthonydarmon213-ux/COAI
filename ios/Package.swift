// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "COAICore",
    platforms: [.macOS(.v13), .iOS(.v16)],
    products: [.library(name: "COAICore", targets: ["COAICore"])],
    targets: [
        .target(name: "COAICore", path: "COAI/Core"),
        .testTarget(name: "COAICoreTests", dependencies: ["COAICore"], path: "Tests")
    ]
)
