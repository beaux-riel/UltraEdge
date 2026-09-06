# Athlete workflow QA — September 5, 2026

Scope: local iOS race planning, shared inventory and crew, reusable drop bags, race-specific vest packing, persistence and export. This work does not enable cloud sync or submit an App Store release.

## Changes

- Saved drop-bag templates live outside any race, with independent item copies when applied. Race and checkpoint are never stored on the template. Deleting the source race preserves templates; deleting templates preserves created bags.
- Race gear now supports quantity, In vest/Worn placement and Packed state independently for each event. PDF export includes these quantities and packing states.
- Creating gear or crew from a race offers an explicit assignment step with the new record selected. Crew selection preserves that selection after asynchronous loading. Creating from an empty selector avoids duplicate stale screens.
- Drop-bag gear selection now uses a native modal with a bounded scroll area above the form. The old absolute overlay was covered by the fixed Save footer; native testing exposed empty bags even though automation reported successful taps. The picker also dismisses the keyboard, handles the first item tap and blocks saving behind the open picker.

## Automated checks

133 tests pass across 24 suites; three pre-existing example TODOs remain. TypeScript passes. ESLint has no errors; the repository retains its existing large warning backlog. Tests cover provider remounts, shared-profile reuse, independent event quantities/roles, race/profile/gear deletion cleanup, template retention, write failure and retry, malformed storage preservation, assignment handoff and picker interaction.

Commands: `npm test -- --runInBand --watchman=false`, `npm run typecheck`, `npm run lint`.

## Native evidence

The parent agent uses a dedicated disposable iPhone 17 Pro simulator on iOS 26.5 (8A6FDAAE-A2ED-4F28-B841-40B9DE915338). All fictional races and records are entered through forms; no fixture seeding. The prior failed run exposed the keyboard bug and is retained in workspace reports. After the modal fix, native bag creation, template reuse, cold relaunch and PDF sharing passed. The saved data was separately read and asserted; successful taps alone were insufficient evidence in the earlier failed run.

Reproduction: `docs/release/maestro/workflow-all.yaml` followed by `docs/release/scripts/verify-native-workflow.py`. Native build uses `ULTRAEDGE_DISABLE_WATCHMAN=1` to avoid the machine-wide Watchman stall.

## Release limits

This is simulator and automated-test evidence, not a physical-device TestFlight acceptance pass. These changes are not in the already distributed build 4. The next release still needs a signed candidate and real-device acceptance of these workflows. GPX document import, route basemap availability, upgrade migration on a physical phone, and broad device/accessibility coverage were not re-certified by this targeted pass.

## Verified outcomes

- Created two races, a drop-bag checkpoint, gear and a crew profile through native forms.
- First race has two packed flasks in the vest and Alex as pacer. Second race reuses the same flask/profile with quantity one, unpacked state and driver role.
- Saved a one-item bag template; second-race copy retains the item, uses new item IDs and has no checkpoint inherited from the first race.
- Relaunch preserves records and packed state. Read-only simulator storage assertions pass.
- Native PDF opens in the iOS share sheet. The one-page document was extracted and visually checked: pacer role, flask quantity two, in-vest/packed state, bag contents and checkpoint name are present.

Evidence lives in workspace `reports/UltraEdge-workflow-qa/`: `bag-final.log`, `reuse-final.log`, `storage-verification.log`, `QA-Alpine-race-plan.pdf`, `native-pdf.txt`, screenshots and `simulator-bundle-sha256.txt`. Creation/checkpoint steps appear in `native-final.log`, which also records the pre-modal failure; this is a staged fix-and-rerun record, not a claim that the original uninterrupted flow passed.

The final native create-from-race shortcut also passes for a new crew member and headlamp (`handoff-final.log`); both are confirmed assigned in saved data.
