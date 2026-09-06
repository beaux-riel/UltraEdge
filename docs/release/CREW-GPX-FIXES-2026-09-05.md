# Crew roles and GPX checkpoint fixes

Crew creation from a race now advances directly to role selection. The new member is selected and shown first. Edit roles is available on the race and on each race assignment in crew detail. Roles remain independent across races.

GPX import reads waypoints and named route/track points, including namespaced files, and saves them with the course in a recoverable journaled operation. Coordinates, names, description and elevation are retained. Course mileage is projected onto the closest segment. Existing checkpoint data is preserved and same-name/same-coordinate markers are deduplicated. Ordinary track samples do not become checkpoints. Import checkpoints from GPX can recover markers from an already attached file.

Distances are estimates, especially for loops/out-and-back courses. Imported markers use Other until the athlete confirms their type; access permissions and cutoffs are not invented. The user's specific file was not supplied. Proprietary extension-only checkpoint formats and waypoint-only files without course geometry are not covered. Failed saves retain staged GPX files to permit journal recovery.

Validation: 25 Jest suites pass (141 tests, 3 pre-existing TODO); TypeScript passes; changed production files lint clean after removing a redundant try/catch. iOS Hermes export succeeds at /tmp/ultraedge-crew-gpx-export. GPX tests cover 20 markers, interpolated distance, metadata, namespaces, invalid coordinates, repeat import, preservation, interrupted persistence recovery and deleted races. Crew tests cover direct creation handoff, choosing multiple roles, editing and cross-race independence.

No new native simulator acceptance or TestFlight upload performed in this task. Verify the user's original GPX and physical-device flow on the next candidate.
