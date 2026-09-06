# Race operations candidate

Implemented locally; not uploaded to TestFlight. Live shared team rooms are implemented and verified separately; see LIVE-COLLABORATION.md. The existing account-services boundary remains disabled.

## Features

- Race operations entry on event detail; checkpoint detail opens its stop/timer editor.
- Optional per-checkpoint support, first-aid and pacing-start duties for event crew.
- Target moving duration (HH:MM) plus planned stop minutes drives expected finish and station arrivals/departures.
- Best/expected/slow travel windows with configurable 0–50% variation, default 10%. Fixed stops are not scaled.
- Position preview at a chosen number of hours after start, plus expected current position during an explicitly started race. These are distance-based estimates, not location tracking.
- Actual start clock and editable start time. Runner/crew arrival/departure reports can be entered as local YYYY-MM-DDTHH:MM or recorded now. Each source has one editable report per station/event kind; the two sources receive equal weight. Individual reports remain visible and removable; discrepancies over ten minutes are flagged.
- Latest observed checkpoint anchors future ETAs. Observed dwell is subtracted before recalibrating travel pace; missing dwell uses the planned duration. Arrival without departure retains the planned stop.
- Event vehicles, optional crew owner, travelling crew, whole-bag and item/gear cargo allocations. A person/item is assigned to one vehicle; bag items inherit the bag vehicle unless individually overridden.
- PDF uses the calculated arrivals and includes windows, stops, duties, vehicle manifest and time reports.
- Current app icon reused for native launch branding on graphite, including iOS storyboard and Android launch assets.

## Persistence and validation

`@ultraedge/race-operations` stores event-keyed records using the existing serialized local-plan operation lock. Event deletion journals removal of the operations record. Loading/saving excludes deleted checkpoint, crew and cargo references. Existing event packing/templates remain separate.

Invalid durations, invalid actual starts and reversed chronological reports are rejected. Report edits replace only their source; saves read current storage under the lock. Projections require a valid start, positive total distance and target, and nondecreasing checkpoint distances within the course.

## Limits

Times use the device timezone. Estimates do not account for terrain, fatigue, closures, or real GPS position. An unrecorded stop uses its planned duration. The local editor records reports on this device. The separate live team room exchanges individually authored reports across phones; local plan updates must be published explicitly. First-aid duty is a logistical label, not qualification verification. Confirm crew access with the race guide.

The target-as-moving-time interpretation was explicitly communicated to the user as an assumption. Existing target values are preserved, and the event form labels this meaning.

## Verification

- TypeScript check passes.
- Jest: 170 passing tests, 3 pre-existing todos across 29 suites.
- New cases cover ultra durations, stop propagation, two-source averaging/correction, observed dwell, arrival-only anchors, invalid chronology, missing distances, scenario progress, colocated stations, serialized writes, orphan cleanup and event isolation/deletion.
- iOS Release simulator build succeeds with `ULTRAEDGE_DISABLE_WATCHMAN=1`; the machine-wide Watchman daemon otherwise stalls bundling/test discovery. Jest uses `--watchman=false`.
- Native acceptance evidence is stored in workspace `reports/UltraEdge-operations/` (updated as checks finish).

Native checks passed: editing and saving a 30-minute station stop, creating a vehicle, recording runner 11:00 and crew 11:10 arrival reports, and cold-relaunch persistence of their 11:05 average. PDF export verification is recorded separately in the workspace report.

Native PDF export succeeded: the same 11:05 average, 30-minute stop and recalculated 16:40 finish appear in both the timeline and checkpoint table. Native station support, vehicle owner, travelling crew and whole-bag cargo selections were verified in persisted storage.
