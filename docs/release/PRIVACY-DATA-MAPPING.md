# Privacy declaration evidence — September 6, 2026

Source changes, not approved/published App Store Connect answers. Native `ios/UltraEdge/PrivacyInfo.xcprivacy` and Expo `app.json` declare matching categories; required-reason API entries in the native manifest are unchanged. Rebuild and review the aggregate privacy report before release. Do not reuse build 8's empty collection declaration.

The user explicitly confirms **Beaux Walton** as legal operator and **hello@heybeaux.dev** as the approved private privacy/support/abuse email. These facts supersede earlier drafts awaiting operator/contact confirmation. Mailbox deliverability and operational response are untested; no email was sent. No phone number, address, copyright approval, retention duration or SLA is inferred from this confirmation.

## Declared collection

All entries are linked to the guest identity, not used for tracking, and have `NSPrivacyCollectedDataTypePurposeAppFunctionality` as their purpose.

| Apple category / manifest suffix | Evidence and rationale |
| --- | --- |
| Name / `Name` | Team display names; optional real names can be supplied, including names in logistics labels. |
| User ID / `UserID` | Supabase guest UUID in memberships, observations, blocks and reports. Pseudonymous is not automatically unlinked. |
| Fitness / `Fitness` | Shared race distance/start/target timing and checkpoint exercise observations. This includes exercise-related data without HealthKit; not a declaration of local-only weight collection. |
| Other User Content / `OtherUserContent` | Event/checkpoint names, stops/logistics, and retained relevant plan evidence. Client `makeLiveSnapshot` uses an explicit upload allowlist. |
| Customer Support / `CustomerSupport` | In-app abuse report reason/details and associated evidence stored in the private queue. Declared rather than relying on the optional-feedback exemption. |
| Other Data Types / `OtherDataTypes` | Connection/security metadata associated with authentication. Supabase documents retained auth event logs including user ID, IP and user-agent. This is a conservative mapping for documented provider behavior; operator must verify actual project/log settings and purposes, and revise this category if the confirmed use requires a more specific Apple category. No geographic inference from IP is implemented in the app. |

`src/lib/liveRaceSync.ts`, `src/lib/liveRaceModel.ts`, and `supabase/collaboration/001_live_rooms.sql` / `002_safety.sql` are the implementation evidence. Data transmitted only to fulfill a request in real time is distinct from retained collection, but rooms, guest identity and reports persist. Ongoing optional collaboration is not treated as exempt optional feedback. These interpretations follow [Apple's App privacy details](https://developer.apple.com/app-store/app-privacy-details/) and [collection manifest guidance](https://developer.apple.com/documentation/bundleresources/describing-data-use-in-privacy-manifests).

## Not inferred as collected by this feature

Crew email/phone fields, personal notes, GPX files, gear photos and PDF guides are excluded from the collaboration allowlist; local profile/weight entries are not uploaded through it. User-selected exports and third-party map/file services need separate assessment, not an automatic blanket “no collection” claim. Free-form text can contain private data; users should avoid entering it in shared names, labels or reports. The app does not promise an automated detector will strip sensitive text.

## Owner verification required

- [Supabase Auth Audit Logs](https://supabase.com/docs/guides/auth/audit-logs) documents default authentication event logging and example IP/user-agent fields. Confirm the actual project configuration, region, externally retained logs, diagnostic/security uses, retention and backups before final policy and App Privacy answers. No exact duration or guaranteed Canada-only processing is asserted here; the in-app unverified region claim was removed.
- Confirm network behavior and integrated SDK manifests on the release candidate. Review any additional diagnostics/usage data or provider IP-derived location behavior; do not hide it under Other Data Types if Apple's more specific categories apply.
- Queue evidence survives room closure but cascades if either related guest identity is deleted. No automatic retention purge is implemented; see `COLLABORATION-SAFETY-OPERATIONS.md`. Publish only confirmed retention practices.
- Evidence is bounded and may be partial: owner plans above 262,144 serialized bytes become a 16,000-character serialized-text excerpt; subject observations are capped at 100 rows / 131,072 bytes. Stable room/subject IDs, plan revision, reason/details and truncation counts/flags remain. Do not describe reports as storing a complete copy of every shared plan or observation history.
- Publish and externally verify the intended privacy/support links with the confirmed Beaux Walton / hello@heybeaux.dev operator/contact details, validate mailbox delivery/monitoring separately, and update App Store Connect separately. Source URLs are not proof that policy/support pages are live. Identity/contact approval does not establish operational response.
- In Xcode Organizer, generate the new archive's Privacy Report; inspect the app and SDK aggregate against actual traffic and these disclosures. Validate required-reason codes independently. Review submitted labels with the responsible operator, not as a substitute for their approval.
