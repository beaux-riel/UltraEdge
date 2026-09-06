# Reproduce local release verification

Use the clean release checkout, Node 22 and Xcode 26.6 (the versions used for this run). Keep secrets out of command arguments and logs. The committed iOS project is authoritative; do not regenerate it with Expo prebuild.

```sh
npm ci
npx jest --runInBand --watchman=false
npm run typecheck
npx eslint . --ext .ts,.tsx,.js,.jsx --quiet
cd ios
pod install --deployment
cd ..
ULTRAEDGE_DISABLE_WATCHMAN=1 SENTRY_DISABLE_AUTO_UPLOAD=true xcodebuild \
  -workspace ios/UltraEdge.xcworkspace -scheme UltraEdge \
  -configuration Release -sdk iphonesimulator \
  -destination 'platform=iOS Simulator,id=YOUR_SIMULATOR_UDID' \
  -derivedDataPath /tmp/ultraedge-release-derived \
  CODE_SIGNING_ALLOWED=NO ONLY_ACTIVE_ARCH=YES build
```

The Watchman overrides avoid an observed local daemon hang without resetting a shared daemon or changing other projects. The environment flag changes Metro file discovery only, not application behavior. A successful simulator build is not a signed archive, physical-device test, TestFlight upload or App Store approval.

Install the resulting `Build/Products/Release-iphonesimulator/UltraEdge.app` with `xcrun simctl install`. Use a disposable simulator; preserve any existing user test data. Run the smoke matrix and record the exact commit and artifact checksum. The fictional fixture instructions are in `fixtures/README.md`; seeding is not proof that creation forms work.

The optional broken third-party Claude workflow has been replaced by an explicitly manual review checklist. A passing checklist job does not represent an automated code review. Local checks have not been run by remote CI until these commits are pushed at the approved gate.
