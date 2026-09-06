# UltraEdge V1 release package

Draft for the free local-planner release. See [build 3 verification](VERIFICATION-2026-09-05.md) for completed local checks and remaining gates. The table below is the full TestFlight/device matrix, whose statuses remain NOT RUN until that exact uploaded candidate is tested. This file is preparation, not evidence of App Store submission or a completed device test. Every test below starts **NOT RUN**; replace its status only with a recorded result and candidate build identifier.

## Release boundary

One-device race preparation: events, checkpoints/cutoffs, gear/weights, food and hydration packing and notes, drop bags, event-specific crew contacts/roles, imported GPX and elevation, and PDF sharing. No payment is required. Editable plans do not sync between devices. PDFs cannot restore editable plans. Map backgrounds are not guaranteed offline. This app is not live tracking, turn-by-turn navigation, an emergency service or a timed fueling coach.

Before submission, verify all account and purchase entry points are absent from the local V1 candidate and that no auth, billing, cloud upload or diagnostics client starts unexpectedly. If authentication remains enabled, recovery, logout, deletion and account isolation become mandatory release gates with dedicated test accounts.

## Store copy draft

**Name:** UltraEdge Endurance

**Subtitle:** Race plans for runners & crews

**Promotional text:** Prepare your next ultra with checkpoints, gear, drop bags and crew details in one place. Share a PDF race plan before race day.

**Description:**

Prepare for the long miles with UltraEdge, a free race planner for ultramarathon runners and their crews.

Build your event plan with checkpoints, distances, cutoffs and notes. Organize the gear you will carry, the supplies you will pack, and the drop bags you will send ahead. Keep crew contacts and event roles together so the right information is easy to find.

Import a GPX route to review its shape and elevation. Export your race plan as a PDF and share it with your crew before race day.

Your editable plans are stored on this device. Save a copy of your PDF outside the app before travel; PDFs are readable copies and cannot restore an editable plan. Map backgrounds may need an internet connection. This version does not include cloud sync, automatic backups, live tracking or crew notifications. There are no subscriptions or in-app purchases.

**Keywords draft:** ultra,ultramarathon,running,trail,endurance,race,planner,crew,dropbag,GPX,gear

All copy must match the tested candidate. Do not publish screenshots containing real crew phone numbers, personal routes, or private health/profile details.

## App Review notes draft

UltraEdge is a free local race preparation tool. No review account or purchase is needed for the intended V1 candidate. Data remains on the device; the user can explicitly share a PDF using the system share sheet.

Suggested review path: finish or skip the introduction, create an event in Events, add checkpoints, assign gear and crew, add a drop bag, import a GPX file from Files, then export the event PDF. Route map backgrounds may need network access; the imported route/elevation and saved planning details are the offline scope.

Before sending these notes, run this path on the exact uploaded build and update names/instructions to match it. Provide a non-sensitive GPX sample to the reviewer through an approved accessible URL or attachment. No sample URL is published by this draft.

## Smoke-test record

Record candidate commit, build number, archive SHA-256, iOS/Xcode versions, device name/OS, tester/date, install type, network state, and screenshots/log locations. Test both a small iPhone and a physical iPhone; include iPad if the candidate supports it. Existing TestFlight build 2 is not evidence for new changes.

Use fictional crew contacts and a realistic overnight 100-mile/161-km event: at least 12 checkpoints, several cutoffs after midnight, mixed crew access/pacer points, three drop bags, 20 gear items, food/water notes, four crew members with multiple roles, long names and multiline notes. Include a multi-day event and miles/km variants. Keep an original fixture copy to detect lost values.

| Journey | Expected result | Status |
| --- | --- | --- |
| Clean install → onboarding Skip and final CTA, then cold restart | Both routes enter planner without account/payment; introduction stays dismissed | NOT RUN |
| Onboarding with VoiceOver, largest text and rotation | Text scrolls, actions remain reachable, current step understandable | NOT RUN |
| Create/edit realistic event and checkpoints; cold restart offline | Values, units, date, cutoff text and ordering remain correct | NOT RUN |
| Overnight cutoffs, miles/km and feet/meters | Display and PDF preserve meaning; no unannounced unit conversion or date ambiguity | NOT RUN |
| Gear, supplies, drop bags and crew assignment/edit/removal | Correct event and checkpoint relationships; no duplicate or missing roles | NOT RUN |
| Upgrade legacy crew-role data, including custom roles | Existing assignments survive restart; interrupted migration is recoverable | NOT RUN |
| Delete populated event and restart | Related assignments/checkpoints/bags/routes do not orphan or affect another event | NOT RUN |
| Storage read/write failure and rapid edits | User sees failure, prior data survives, retry does not replace it with empty state | NOT RUN |
| GPX valid, malformed, very large, no elevation, cancelled picker | Clear result; bad replacement retains old route; UI remains responsive | NOT RUN |
| Imported GPX → airplane mode → force quit/reopen | Saved route/elevation usable; missing map background is handled honestly | NOT RUN |
| Full PDF export with long notes, contacts, roles and multiple pages | All expected data present and legible; omissions/errors disclosed; system sharing works | NOT RUN |
| Export PDF then cancel share sheet; retry | No false failure/success, duplicate operations or stuck loading state | NOT RUN |
| Background/foreground, denied photo access, low connectivity | No crash, blocked navigation or lost edits | NOT RUN |
| VoiceOver, large text, dark mode, smallest supported phone/iPad | Labels, focus, contrast, form validation and primary actions usable | NOT RUN |
| Fresh install network observation and native artifact inspection | No unexpected cloud/auth/billing/diagnostic traffic; permissions/privacy match candidate | NOT RUN |
| Reinstall/data removal and local-data explanation | App makes device-only persistence and non-restorable PDF clear; no backup promise | NOT RUN |

## Remaining release requirements

- Capture current screenshots from the verified candidate: event list, event plan/checkpoints, drop bag/gear, crew roles, GPX/elevation, PDF. Include only screens actually exercised, at required sizes for supported devices.
- Publish and verify a reachable support page and privacy policy with owner approval. GitHub Issues is a development contact, not proof of a completed support/privacy listing. Confirm a support contact Beaux will monitor.
- Audit the actual release binary and configuration for data handling, third-party SDKs, required-reason API declarations and permission strings. Complete App Store privacy answers from that evidence, including any enabled diagnostics; do not assume local planning alone means no collection.
- Complete age rating, category, content rights, availability, review contact, screenshots and review notes in App Store Connect at the approved external gate.
- Confirm current Apple SDK/signing requirements with official sources when preparing the artifact. Record the reproducible archive and run the matrix on the exact TestFlight candidate after approved upload.
- Require no unresolved core-flow failure. Obtain separate approval to push/merge, mutate production/store configuration, upload TestFlight, and submit/release.

## Athlete-focused follow-up

Treat midnight/date/unit ambiguity, omitted crew instructions in PDFs, and silent lost plans as release blockers when reproduced. Confirm realistic PDF legibility on paper as well as a phone. Route replacement must never erase a usable offline route on failure. Free-text nutrition notes should remain clearly distinct from prescribed fueling targets. Do not expand V1 into navigation, live coordination or performance predictions to cover a documentation gap.
