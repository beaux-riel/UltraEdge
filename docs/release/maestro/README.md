# Local native smoke flows

Run with `maestro --device <explicit-UDID> test <flow.yaml>` on a disposable UltraEdge simulator. These flows never upload to Maestro Cloud. Never run the deletion flow against real race data.

- `onboarding.yaml`: requires introduction visible; verifies all slides, final action and relaunch.
- `fixture-export.yaml`: requires seeded Moonridge fixture and completed onboarding, starting on Home; verifies calendar date and native PDF share sheet. It leaves the share sheet open.
- `delete-fictional-fixture.yaml`: requires Moonridge fixture plus a separately created event named `Native smoke 50K`. Deletes the fictional fixture and verifies the unrelated event remains after restart. The delete icon coordinate is for the tested iPhone 17 Pro layout.
- `privacy-support.yaml`: opens local policy content without opening the external support link.

Use `fixtures/README.md` to prepare fictional data. Seeding bypasses creation forms. Run the full TestFlight/device matrix separately and record exact candidate identity. Assertions use native accessibility labels; earlier attempts using just “Events” or “Export Race Plan” failed because tab/icon labels contain additional text, then passed with corrected selectors.
