# UltraEdge 1.0.0 build 4

Packages the approved graphite / trail-lime field-guide redesign and matching alpine app icon for internal TestFlight testing.

Build number incremented from 3 to 4. App Store Connect reported builds 1–3 as VALID and IN_BETA_TESTING, each with usesNonExemptEncryption=false, immediately before this release. The native Info.plist now carries that existing declaration forward; this visual update does not change encryption behavior.

Validation: 122 Jest tests passed (three existing todo), TypeScript passed, signed device archive and App Store export succeeded. codesign --verify --deep --strict passed. Archive metadata confirms build 4 and the declaration; the actual archived 120px icon was decoded and visually inspected. The redesign's release Simulator and native PDF verification are documented in docs/design/field-guide.md.

Artifacts, upload and Apple processing receipt: ../reports/UltraEdge-build4 in the Astra workspace. Distribution remains internal; no external beta review or production release is requested. The historical Fat Dog rehearsal remains a separate fixture, not preloaded user data.
