# Build 3 verification — September 5, 2026

**Ready for an approved internal TestFlight upload; not approved for App Store release.**

Candidate source: `4e687ad` on `release/v1-readiness`, based on canonical main plus the four PR #17 commits. This source has not been pushed, merged, or checked by remote CI. Subsequent documentation-only commits do not alter the candidate binary.

## Artifacts

- App version 1.0.0, build 3, bundle ID `com.beaux.ultraedge`.
- Xcode 26.6 (17F113), iOS 26.5 SDK, committed native project.
- Release simulator build, signed distribution archive, and local IPA export all succeeded.
- Existing Apple Distribution identity and App Store provisioning profile used; no signing assets created and no provisioning update requested.
- `codesign --verify --deep --strict` passed on archived app.
- IPA SHA-256: `6e709ec1daefba316a48bdf5510b30a8d3117f0db5d559765d158d0763bdc18d`.
- Final simulator JS bundle SHA-256: `ec64f2a57c29f7fbc7ceb9989e930a9cb1902456289724e7a136a70feb6d774f`. Archive bundle SHA-256: `a441681456d8064bc084d62eafbe62259f8ed828342e9fe08d51558da1fb68c2`.
- Durable local artifacts and evidence: sibling workspace directory `../reports/UltraEdge-build3/`, including IPA, full archive/dSYMs, native PDF and screenshots. Build logs remain local; they are not committed because build environments can contain private configuration.
- The local export logged an unavailable Xcode account token but still succeeded with the existing signing identity/profile. This does not certify upload credentials or server acceptance.

## Automated evidence

All **122 tests passed across 20 suites**, with **3 existing TODO tests**. TypeScript passed. Full repository ESLint completed with **zero errors**; warnings remain. Diff whitespace check passed. Date/PDF cases also passed with explicit Vancouver and Tokyo time zones.

Coverage now includes storage read/write failures, journal recovery, partial relationship deletion, crew migration retry, overlapping saves/conflicts, deleted-parent rejection, profile/weight recovery and conversions, malformed GPX/import rollback, sandbox relocation, PDF print/share failure, list error/retry behavior, and disabled service startup.

A hung machine-wide Watchman caused the first local Jest/bundler attempts to wait. Tests used `--watchman=false`; Metro used `ULTRAEDGE_DISABLE_WATCHMAN=1`. No shared daemon was reset. The obsolete third-party review action is replaced with an explicitly manual checklist, which is not automated code review.

## Native observations

On iPhone 17 Pro simulator, iOS 26.5:

- Release launch showed onboarding and the planner; no black screen or Metro server required.
- Completed all four onboarding slides and the final action; cold launch retained completion.
- Created `Native smoke 50K` through the actual event form. Input/save navigation worked. A test needed to dismiss the keyboard by tapping a label; that was an automation adjustment.
- Loaded the fictional overnight 100-mile fixture (12 checkpoints, three crew with multiple roles, 20 gear allocations, three bags). This exercises rendering and persistence, not all creation forms.
- Reproduced the calendar-date bug as September 18 for a September 19 race, fixed it, then asserted **Saturday September 19** on the rebuilt native screen.
- Generated a five-page PDF and opened the native share sheet. Reviewed every rendered page and extracted text: route, profile, all expected records and packing notes are present without horizontal clipping.
- Reproduced GPX unavailability when installing an app update moved its sandbox. The repaired build resolves the same saved URI against the new Documents directory. Reinstallation and PDF export then passed **without re-importing, reseeding, or rewriting that saved URI**.
- Dismissed the share sheet and exported again successfully.
- Opened Profile → Privacy & Support and confirmed the local policy content renders.
- Deleted the populated fictional event through the UI; after cold launch the unrelated manually created event remained. Direct storage inspection confirmed zero fixture event/checkpoint/crew-assignment/gear-allocation/bag records, while reusable three crew and 20 gear inventory items remained.

Additional native layout checks on the immediately preceding release build (same onboarding implementation): iPhone SE 3rd generation passed Skip/relaunch, then all slides/final action with the largest accessibility text size and dark appearance; iPad mini passed all slides/final action/relaunch. These are limited layout checks, not complete VoiceOver/device-matrix certification.

## Remaining gates and limitations

1. Owner approval to push the release branch and upload build 3 to **internal TestFlight**; then remote CI and Apple processing must pass. Nothing has been pushed, merged, uploaded, or submitted.
2. Physical iPhone testing of the exact TestFlight binary: airplane-mode cold start, native GPX picker (valid/malformed/cancel/large), create/edit checkpoint/crew/bag/gear journeys, legacy upgrade, PDF save/share to another app, denied permissions, VoiceOver and full large-text/rotation matrix. These have **not** been certified by this simulator run.
3. Support/privacy pages exist as local drafts and an offline in-app screen. Public hosting/URLs, operator/private contact, App Store listing/screenshots/age rating/privacy answers/review contact still need owner decisions and publication at the approved gate.
4. No production backend/billing changes were made. Auth, cloud sync, purchases, Sentry and related promises are disabled for this free local V1. Re-enabling them requires the original backend/account/billing release gates.
5. Native traffic observation and final privacy answers remain unverified. Absence of JS client startup does not certify all OS/native SDK network behavior.
6. PDF pagination polish: a long gear note can span pages, and checkpoint headers are not repeated on the continuation page. All fixture text is retained.
7. Previous GPX versions/cache files can remain in local Documents after replacement or event deletion. They are not referenced by deleted plans; complete local removal currently requires Delete App. No editable-plan backup/restore exists.

This evidence supports a beta candidate, not a claim that the production definition of done is met.
