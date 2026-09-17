#!/bin/bash
set -euo pipefail
task_repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$task_repo_dir"
case "${1:-}" in
    ""|--simulator|--device-release) ;;
    *) echo "Usage: bash scripts/check-ios.sh [--simulator|--device-release]" >&2; exit 2 ;;
esac
swift test --package-path ios
task_check_dir="$(mktemp -d /tmp/coai-ios-checks.XXXXXX)"
trap 'rm -f "$task_check_dir/checks"; rmdir "$task_check_dir"' EXIT

swiftc ios/COAI/Core/NavigationPolicy.swift ios/COAI/Core/RestClock.swift scripts/test-ios-core.swift -o "$task_check_dir/checks"
"$task_check_dir/checks"
xcrun --sdk macosx swiftc -swift-version 5 ios/COAI/Core/NavigationPolicy.swift scripts/test-ios-webkit.swift -o "$task_check_dir/checks"
"$task_check_dir/checks"
swiftc -frontend -parse ios/COAI/COAIApp.swift ios/COAI/COAIWebView.swift ios/COAI/RestTimerView.swift ios/COAI/ApplePurchaseService.swift ios/COAI/Core/PurchaseDelivery.swift ios/COAI/COAIDownload.swift ios/COAI/Core/DownloadPolicy.swift
plutil -lint ios/COAI/Info.plist ios/COAI.xcodeproj/project.pbxproj
plutil -lint ios/COAI/PrivacyInfo.xcprivacy
xmllint --noout ios/COAI.xcodeproj/xcshareddata/xcschemes/COAI.xcscheme

if [[ "${1:-}" == "--simulator" || "${1:-}" == "--device-release" ]]; then
    if ! xcodebuild -version; then
        echo "BLOCKED: installer et initialiser Xcode complet, puis relancer --simulator. Aucun binaire iPhone validé."
        exit 2
    fi
    if [[ "$1" == "--device-release" ]]; then
        xcodebuild -project ios/COAI.xcodeproj -scheme COAI -configuration Release \
            -sdk iphoneos -destination 'generic/platform=iOS' \
            -derivedDataPath ios/DerivedDataDevice CODE_SIGNING_ALLOWED=NO build
        task_app="ios/DerivedDataDevice/Build/Products/Release-iphoneos/COAI.app"
        cmp ios/COAI/PrivacyInfo.xcprivacy "$task_app/PrivacyInfo.xcprivacy"
        test "$(/usr/libexec/PlistBuddy -c 'Print :CFBundleSupportedPlatforms:0' "$task_app/Info.plist")" = "iPhoneOS"
        xcrun lipo "$task_app/COAI" -verify_arch arm64
        echo "PASS: unsigned Release built for iPhone arm64 with privacy manifest. NOT signed, installed, archived or App Store validated."
    else
      xcodebuild -project ios/COAI.xcodeproj -scheme COAI -configuration Debug \
        -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
        -derivedDataPath ios/DerivedData CODE_SIGNING_ALLOWED=NO build
    cmp ios/COAI/PrivacyInfo.xcprivacy ios/DerivedData/Build/Products/Debug-iphonesimulator/COAI.app/PrivacyInfo.xcprivacy
    echo "PASS: privacy manifest included in simulator app; App Store privacy audit still required."
    fi
else
    echo "Core et syntaxe vérifiés uniquement. Pour compiler l’interface : bash scripts/check-ios.sh --simulator"
fi
