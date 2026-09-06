# Local native smoke flows

Run with `maestro --device <explicit-UDID> test <flow.yaml>` on a disposable UltraEdge simulator. These flows never upload to Maestro Cloud. Never run the deletion flow against real race data.

- `onboarding.yaml`: requires introduction visible; verifies all slides, final action and relaunch.
- `fixture-export.yaml`: requires seeded Moonridge fixture and completed onboarding, starting on Home; verifies calendar date and native PDF share sheet. It leaves the share sheet open.
- `delete-fictional-fixture.yaml`: requires Moonridge fixture plus a separately created event named `Native smoke 50K`. Deletes the fictional fixture and verifies the unrelated event remains after restart. The delete icon coordinate is for the tested iPhone 17 Pro layout.
- `privacy-support.yaml`: opens local policy content without opening the external support link.

Use `fixtures/README.md` to prepare fictional data. Seeding bypasses creation forms. Run the full TestFlight/device matrix separately and record exact candidate identity. Assertions use native accessibility labels; earlier attempts using just “Events” or “Export Race Plan” failed because tab/icon labels contain additional text, then passed with corrected selectors.

## Athlete workflow regression

`workflow-all.yaml` requires a freshly installed app on a **disposable iPhone simulator**. It creates fictional QA Alpine 100 / QA Forest 50 races through the UI, a shared gear item and crew member, a drop-bag checkpoint, a packed vest, and a saved template reused in another race. It asserts relaunch persistence and opens native PDF sharing. No data is seeded and nothing is sent externally.

Run `maestro --device <QA-UDID> test docs/release/maestro/workflow-all.yaml`, then `python3 docs/release/scripts/verify-native-workflow.py <QA-UDID>`. The latter only reads the app's simulator storage, validating independent packing quantities, crew roles, checkpoint scope, and bag item IDs. Do not point this flow at personal race data. Screenshots are written to the working directory.
