# Build 7 athlete feedback

Implemented September 6, 2026 on `design/field-guide`.

## Behavior

- Event start and elapsed-duration fields use separate numeric hours/minutes controls. Clock hours are 0–23; durations support multi-day races. Event submission rejects malformed or zero durations. Checkpoint cutoffs and local/live actual reports use date and time pickers, retain the calendar date, and pass through existing chronology validation. Times are explicitly in the device timezone.
- Race operations opens to **Race planning** from **Plan aid-station stops**. All stations expose their planned minutes, presets and Save action. This projection excludes actual reports and actual start corrections. The **Race day** entry point has the timer and actual reports. A finish-goal calculator shows required moving speed after subtracting planned stops; it does not silently change the saved moving-time target.
- Each race can have named mandatory requirements with quantities and linked race gear. Packed status counts active assigned gear worn/carried by the athlete. Removing/retiring gear makes the requirement incomplete; it does not remove the requirement. Rules are user-entered from the official guide, not a bundled assertion of any event’s current regulations. Printed plans include the requirement checklist.
- Gear creation/editing and drop-bag creation/editing accept photos from the photo library. Gear and bag details display them. Save is blocked while a form photo is copying. Photos are copied into app documents and store relative references, so transient picker files and app sandbox relocation do not break them.
- A race can attach/replace/remove an official PDF, keep it offline, and open/share it through the native share sheet. The file is validated and copied before the event reference is saved. The exported planning PDF names the guide and reminds users to share its original separately.
- Brand selection includes common brands, searchable selection, Other, and custom brands from existing inventory. Unlisted existing brands remain editable.

## Compatibility and limits

The existing moving-time interpretation is preserved: planned stops extend elapsed finish time. Existing plans require no destructive migration. Optional event/bag fields are absent on old records. Previously entered invalid prose must be corrected using structured controls when saving that time field.

Attachments are device-local, not uploaded to live team rooms. Crew receive the original PDF through the explicit share action. Removing an attachment detaches it from the record; unused copied files may remain in app documents until app deletion. Photos of reusable bags belong to the individual bag, not its contents template. Physical-device gallery/file-provider acceptance remains useful alongside simulator checks.

This change does not upload another TestFlight build.

## Validation

- TypeScript and iOS Release simulator build pass.
- 178 Jest tests pass, with three pre-existing TODOs. New tests exercise two-versus-ten-minute station timing, original-plan isolation from actual reports, mandatory quantity/packing/deletion behavior, numeric/native date/time controls, sandbox relocation, file type/size rejection and copy failures.
- ESLint has no errors; existing style-warning backlog remains.
- Native simulator evidence is in workspace `reports/UltraEdge-build7-feedback/`. Planning navigation, saving 2/10-minute stops, and separate race-day controls pass. Brand selection, photo-library import, gear photo cold relaunch, drop-bag photo save/display, mandatory quantity matching/packed status, PDF import and sharing after cold relaunch also pass. Read-only saved-data assertions verify these records and copied files survive app update. Native flows were staged; selectors required explicit keyboard dismissal and taps on file thumbnails. Logs preserve failed selector attempts as well as passing reruns.
