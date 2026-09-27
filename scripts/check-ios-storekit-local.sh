#!/bin/bash
set -euo pipefail
# Local Xcode StoreKit only. No physical destination or production scheme.
task_repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$task_repo_dir"
task_simulator_id="${1:-}"
if [[ ! "$task_simulator_id" =~ ^[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}$ ]]; then
    echo "Usage: bash scripts/check-ios-storekit-local.sh <UUID simulateur iPhone>" >&2
    exit 2
fi
task_derived_dir="$(mktemp -d /tmp/coai-storekit-local.XXXXXX)"
echo "Preuves locales conservées dans : $task_derived_dir"
xcodebuild -project ios/COAI.xcodeproj -scheme COAIStoreKitLocal -configuration Debug \
    -destination "platform=iOS Simulator,id=$task_simulator_id" \
    -parallel-testing-enabled NO -derivedDataPath "$task_derived_dir" \
    CODE_SIGNING_ALLOWED=YES CODE_SIGN_IDENTITY=- DEVELOPMENT_TEAM= \
    CODE_SIGN_ENTITLEMENTS=StoreKitTests/LocalTesting.entitlements test
echo "PASS StoreKit Xcode local uniquement. Serveur simulé, aucun achat réel ni preuve Sandbox/App Store."
