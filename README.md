<p align="center">
  <img src="assets/icon.png" width="128" height="128" alt="UltraEdge alpine trail mark in trail lime on graphite">
</p>

<h1 align="center">UltraEdge</h1>
<p align="center"><strong>Your field guide from race preparation to race day.</strong></p>
<p align="center">Course · Timing · Gear · Crew</p>

UltraEdge is a free race preparation and race-day planning app for ultramarathon runners and crews. Build a plan on your device, organize every aid-station stop, and share the details your team needs through exported PDFs or optional private live team rooms.

The **Field Guide** identity pairs cool graphite, off-white and trail lime with an alpine trail mark, clear numerical typography, and light and dark themes. The home screen puts your next race first; the race overview brings the course, timing and preparation together. See the [visual design notes](docs/design/field-guide.md) and [app icon](docs/design/app-icon.md).

## Plan the course and the clock

- Create events with structured date, time and duration inputs, including multi-day moving-time targets.
- Import GPX, GPX XML exports and supported KML courses. Inspect the route and elevation profile, and import course waypoints as checkpoints.
- Add aid stations, cutoffs, access details and notes. Attach the official race-guide PDF for offline access and sharing.
- Open **Plan aid-station stops** to set planned minutes at each station and see projected arrivals, departures and finish time, with best/expected/slow windows.
- Use the finish-goal calculator to see the moving speed required after allowing for stops. The saved target represents **moving time**; planned stops extend the elapsed finish time.

## Pack for each race

- Maintain a gear inventory with weights, photos and a searchable brand selector, including **Other** and custom brands.
- Define event-specific mandatory requirements, quantities and linked gear. Check whether the required items are assigned and packed to travel with the athlete.
- Organize food, hydration and drop bags, reuse bag-content templates, and photograph individual bags so they are easy to recognize at aid stations.
- Assign crew roles and station duties per event. Plan vehicles, travelling crew and bag/item cargo allocations.
- Export a race-plan PDF with the timeline, station details, mandatory checklist and crew logistics.

Mandatory requirements are entered from the event's official guide; the app does not maintain an authoritative race-rule catalogue. Nutrition and hydration features organize supplies and notes, rather than prescribe a timed fueling plan.

## Record race day and coordinate your crew

**Race planning** preserves the original projection. **Race day** provides the actual-start clock and runner/crew arrival and departure reports, using date/time controls or a record-now action. Recorded progress updates race-day estimates while keeping individual observations available for correction.

Optional **Live team sharing** lets an owner publish a race snapshot and invite crew with a private code. Participants submit their own timing observations; the owner explicitly publishes later plan changes. Reports queue locally when a request fails, and the room shows pending reports and its last successful sync.

Live rooms refresh every 10 seconds while open in the foreground and when the app returns to the foreground. They do not provide background GPS tracking or push notifications. Timing and position estimates are distance-based; terrain, fatigue and actual GPS position are not modeled. See [race operations](docs/release/RACE-OPERATIONS.md) and [live collaboration](docs/release/LIVE-COLLABORATION.md) for the model and verification details.

## Your data and offline use

Editable plans, imported courses, gear photos, drop-bag photos and attached guides are stored on your device. Import your course and guide before travel; map backgrounds may require a connection. Export a plan PDF and keep a copy outside the app. PDFs are readable handoffs, not restorable backups, and deleting the app can remove local data.

Live sharing is opt-in and sends a limited race snapshot and team observations. Contact phone numbers, emails, personal notes, GPX files and attachments are excluded. Share an attached official guide separately through the native share sheet; the exported plan references it but does not embed its pages.

Live-room access uses an installation-specific guest identity, with no email/password recovery or owner transfer. A new crew device needs an invitation. Owners can remove members or close a room, and participants can delete their collaboration identity and associated server data. Legacy account services, general cloud sync, automatic backups and paid subscriptions remain disabled.

## Release status

**iOS 1.0.0 build 8** is the TestFlight candidate represented by this README. It includes structured inputs, mandatory gear, planned aid-station stops, gear/bag photos, official guide attachments and brand selection. See the [athlete feedback notes](docs/release/BUILD7-FEEDBACK.md) for detailed behavior and limitations.

The build 8 source passed 178 tests (with three existing TODOs), TypeScript and iOS Release checks. Critical planning, attachment and persistence journeys were exercised in the iOS Simulator. This does not establish complete physical-device or Android acceptance. Public-release readiness and remaining gates are tracked in the [release package](docs/release/V1-RELEASE-PACKAGE.md); dated verification notes describe the state at the time they were written.

## Development

The app uses Expo SDK 54, React Native 0.81.5, React 19 and TypeScript. Use Node.js 20 as in CI, npm, and Xcode for local iOS builds.

```sh
git clone https://github.com/beaux-riel/UltraEdge.git
cd UltraEdge
npm ci
npm start
```

```sh
npm run typecheck
npm test -- --runInBand
npm run lint
```

For a native iOS development build, use `npm run ios` after setting up Xcode. Release work uses the committed iOS project and [Fastlane](fastlane/README.md). Read the lane before running it: a build can install pods and change signing settings. The beta lane uploads to TestFlight and requires release-owner approval. EAS is not the verified release route.

The local planner does not require legacy account services. Live collaboration requires a configured Supabase URL and public client key, guest authentication, and the separate [collaboration schema](supabase/collaboration/001_live_rooms.sql). Review the [collaboration deployment and data boundary](docs/release/LIVE-COLLABORATION.md) before configuring a backend. Never embed service-role credentials, commit secrets, or apply legacy migrations to production as a setup step.

## Contributing and support

Prefer small changes tied to an athlete journey. Test failure and restart behavior for persistence changes, preserve existing user data, and verify critical journeys in release-mode iOS. Report what you exercised, the build/device, and what remains unverified.

Maintained by [Beaux](https://github.com/beaux-riel). Report reproducible issues in [GitHub Issues](https://github.com/beaux-riel/UltraEdge/issues), including the app version and reproduction steps. Keep private routes, contacts and credentials out of public reports.
