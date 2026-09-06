# Support/privacy publication draft — owner gate

The static files in `site/` are local drafts, not published pages. They contain no scripts, analytics, external fonts, invented contact email, or unverified custom domain. Relative links allow hosting the directory at a GitHub Pages project subpath. No deployment workflow or remote configuration has been changed.

## Owner details and metadata to supply

| Field | Required owner decision/value |
| --- | --- |
| Public support contact | Confirm Beaux monitors the canonical GitHub issue tracker; supply a private email/form for sensitive support and privacy requests if available. Update both pages with that real contact before release. |
| Policy operator | Confirm the legal person/entity responsible for the app and the appropriate public contact details; add them to the privacy page. |
| Hosting | Approve an actual publicly accessible HTTPS host and deployment approach. GitHub Pages is a candidate, not an assumed enabled service. |
| Support URL | Actual deployed URL to `site/index.html`, verified anonymously on a phone. |
| Privacy URL | Actual deployed URL to `site/privacy.html`, verified anonymously on a phone. |
| App Review contact | Owner’s real name, email and telephone in App Store Connect; do not publish these in the site without authorization. |
| Copyright | Owner-confirmed year and rights-holder text for App Store metadata. |
| Store availability | Owner-confirmed territories, seller/trader declarations and release timing. |

Support and privacy must also be reachable in the app once final URLs exist. Apple requires the privacy policy link both in the listing and within the app: [App Review Guidelines, privacy](https://developer.apple.com/app-store/review/guidelines/#privacy).

## Candidate evidence and publication checks

The draft reflects `App.tsx` mounting only local planning/profile providers, `ACCOUNT_SERVICES_ENABLED = false`, local AsyncStorage/file persistence, native `react-native-maps`, system file/photo selection, and explicit PDF sharing. It does not promise offline map backgrounds, editable-plan restoration, or that device backups never contain app data.

Before publication, verify the exact release binary/network behavior, including legacy GPX paths, native SDK initialization, OS diagnostics and photo handling. Update the policy if actual behavior differs. Do not infer the App Store privacy answers solely from this draft: [Apple’s app privacy guidance](https://developer.apple.com/app-store/app-privacy-details/) distinguishes on-device processing from collection and requires evaluating third-party services. Final disclosure decisions remain pending this evidence and owner review.

Confirm the support tracker is enabled and appropriate for public support; a public issue tracker is not a private contact channel. The current pages instruct users not to post sensitive details and to request private contact first. The owner must provide an effective private route before a sensitive request can be handled.

Confirm policy operator/contact and wording, supported version/date, working relative and external links, mobile readability and accessibility, and no private information in examples. Record deployed URLs and checks here after the separately approved publication. Update app links and App Store Connect fields at their authorized gates.

Deleting the app removes local app data; offloading preserves data. The draft distinguishes app deletion from deleting shared PDFs and system backups. There is no single clear-all-data control in the current app. Do not claim it exists.
