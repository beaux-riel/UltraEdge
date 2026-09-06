# Fictional overnight release fixture

Moonridge 100 is a **fictional** 100-mile, 28-hour rehearsal starting Saturday September 19, 2026 at 05:00 and ending Sunday at 09:00. Nothing in these files is a real course, contact, or fueling prescription. The synthetic GPX is a straight northbound line with nine elevation waves, 2,001 points and approximately 100 miles. It is for rendering tests only and must not be used for navigation.

The JSON contains one event, 12 checkpoints, three crew members with event-specific multi-role assignments, 20 gear items and allocations, and three checkpoint-linked bags. The final bag is intentionally empty. Crew details use reserved example.com email addresses and fictional 555 phone numbers. Overnight instructions, a newline, a long event name, and literal `<mandatory>`/`&` text exercise PDF output.

## Seed a disposable release simulator

Terminate UltraEdge first so in-memory AsyncStorage cannot overwrite the fixture. Obtain its **data** container using `xcrun simctl get_app_container <simulator-UDID> com.beaux.ultraedge data`, then pass that returned path explicitly:

```sh
python3 docs/release/fixtures/seed-simulator.py --container '/absolute/CoreSimulator/Devices/.../data/Containers/Data/Application/...'
```

The script refuses paths outside a CoreSimulator application data container and requires its metadata identifier to be `com.beaux.ultraedge`. It does not launch, terminate, select, or reset a simulator, contact a service, or modify onboarding. Existing unrelated records remain; re-seeding replaces only fixture identities. Before writes, it backs up the native storage directory and any prior fixture GPX inside a timestamped `fixture-backup-*` directory in the supplied container. Re-seeding intentionally resets changes made to the fictional fixture.

Storage format was verified against installed AsyncStorage 2.2.0 `ios/RNCAsyncStorage.mm`: `Library/Application Support/com.beaux.ultraedge/RCTAsyncLocalStorage_V1/manifest.json`; values are JSON-encoded strings, with values longer than 1,024 UTF-16 units in UTF-8 MD5(key) files referenced by null manifest entries. Checkpoints use an event-ID map; other fixture collections use arrays. The script resolves the local GPX URI against the supplied container.

## Expected native/PDF assertions

- Event remains September 19 in America/Vancouver; distance reads 100 mi, climb 12,400 ft, goal 28:00 and cutoff 32:00.
- Twelve checkpoints appear in increasing distance, from Cedar Base at 0 to Dawn Meadow at 100 miles.
- Arrival labels preserve Saturday/Sunday overnight handoff distinction. Moonrise Camp notes retain spare lighting and warm-layer instructions.
- Alex River has Crew Chief / Driver; Jordan Vale has Pacer / Finish logistics. All three fictional contacts appear in the PDF.
- Twenty allocated gear items appear. Spare batteries have quantity two and the literal note `Replace batteries at Moonrise Camp <mandatory>.` renders visibly without becoming HTML.
- Three named bags appear at North Fork, Moonrise Camp, and Owl Hollow. The empty reserve bag remains in the PDF with “No items listed.”
- Route map and elevation profile appear; start and finish and checkpoint markers align along the synthetic line. Inspect pagination, clipping, and long notes in the generated PDF and share sheet.
- Cold-start offline and verify all records and the local route persist.
- For failed-route testing, use a copy of the fixture and replace the route with malformed XML through the picker: prior route must remain. If the saved file is unavailable, PDF export must ask before proceeding and the resulting PDF must state “Course Route Unavailable.”
- Deleting the fictional event must remove its relationships and bags without deleting reusable crew or gear inventory; inspect after relaunch.

These are expected assertions, not a claim of native test completion. Fixture seeding bypasses create/edit UI and therefore cannot certify those input journeys.
