#!/bin/bash
set -euo pipefail
task_repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$task_repo_dir"
task_check_dir="$(mktemp -d /tmp/coai-ios-checks.XXXXXX)"
trap 'rm -f "$task_check_dir/checks"; rmdir "$task_check_dir"' EXIT

swiftc ios/COAI/Core/NavigationPolicy.swift ios/COAI/Core/RestClock.swift scripts/test-ios-core.swift -o "$task_check_dir/checks"
"$task_check_dir/checks"
xcrun --sdk macosx swiftc -swift-version 5 ios/COAI/Core/NavigationPolicy.swift scripts/test-ios-webkit.swift -o "$task_check_dir/checks"
"$task_check_dir/checks"
swiftc -frontend -parse ios/COAI/COAIApp.swift ios/COAI/COAIWebView.swift ios/COAI/RestTimerView.swift
plutil -lint ios/COAI/Info.plist ios/COAI.xcodeproj/project.pbxproj
xmllint --noout ios/COAI.xcodeproj/xcshareddata/xcschemes/COAI.xcscheme

if [[ "${1:-}" == "--simulator" ]]; then
    if ! xcodebuild -version; then
        echo "BLOCKED: installer et initialiser Xcode complet, puis relancer --simulator. Aucun binaire iPhone validé."
        exit 2
    fi
    xcodebuild -project ios/COAI.xcodeproj -scheme COAI -configuration Debug \
        -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
        -derivedDataPath ios/DerivedData CODE_SIGNING_ALLOWED=NO build
else
    echo "Core et syntaxe vérifiés uniquement. Pour compiler l’interface : bash scripts/check-ios.sh --simulator"
fi
