# Field guide redesign

Approved by Beaux on September 5, 2026 after review of the Home / Race Plan concept.

The shared palette now uses cool graphite, off-white and trail lime, with native system typography and bundled monospaced numerical figures. Primary buttons use dark text on lime in both themes. Selected form controls, list actions and headers were adjusted to retain contrast. Existing theme preferences remain respected.

Home emphasizes the nearest future active event, then an undated active plan, then another saved event. Past dates are explicitly labeled. Preparation rows link to the real course, checkpoints and event crew assignment. The hero mountain is a bundled generated illustration, not race geography. Names with an em dash retain their qualifier as subtitle text.

Race detail now places real GPX course data immediately after rounded presentation-only distance/ascent metrics. Stored precision is unchanged. Preview distance markers are hidden to keep the course visible; full-screen markers remain configurable. GPX measurements remain labeled separately from event figures. Metric cells reflow at accessibility text sizes; display headings adapt and body text continues scaling.

## Verification

- TypeScript passes.
- Jest: 122 passed, three existing todo, 20 suites.
- ESLint: zero errors; 1,445 warnings remain in the repository.
- Release-mode iOS Simulator build succeeds.
- iPhone 17 Pro dark: Home, Fat Dog race overview, GPX map preview and native PDF share sheet exercised.
- iPhone SE light/accessibility-large: home, historical race title and reflowing metrics exercised. Final home subtitle refinement additionally checked at standard size in dark mode.
- Real historical Fat Dog fixture retained, without inventing confirmed 2027 details. SE fixture seeder backed up and preserved unrelated data.

The first automation run used an exact PDF button selector that failed; the existing icon contributes to the accessibility label. The wildcard selector completed the export successfully. The local Watchman daemon stalled initial checks; use `--watchman=false` for Jest and `ULTRAEDGE_DISABLE_WATCHMAN=1` for native release builds.

This is a local redesign candidate. No new TestFlight upload or store/production changes are included. This is focused visual smoke coverage, not renewed verification of every V1 journey or a complete VoiceOver audit. Existing production-release limitations remain.
