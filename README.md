# UltraEdge

UltraEdge is an open-source race preparation app for ultramarathon runners and crews. The V1 release scope is a **free planner on one device**, with PDF sharing for crew handoffs. Release readiness and device verification are tracked in [the release package](docs/release/V1-RELEASE-PACKAGE.md).

## Plan your event

- Create events and checkpoints with distances, cutoffs, access details and notes.
- Organize gear and weights, food and hydration supplies, and drop bags.
- Keep crew contacts and assign roles for each event.
- Import GPX routes and inspect the route and elevation profile.
- Export an event's race plan as a PDF to share with your crew.

Editable planning data lives on the device. Export a PDF before travel and keep a copy outside the app. PDFs are readable copies, not restorable backups. Deleting the app can remove local plans. Map backgrounds may require a connection; download/import your route before heading out.

Cloud sync, automatic backups, crew invitations/notifications, live tracking/predictions, and paid subscriptions are outside V1. Nutrition and hydration are packing/notes tools, not a timed fueling prescription. Supabase and RevenueCat integration code remains in the repository for future work; its presence does not mean those services are enabled or verified for release.

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

For the native iOS development build, use `npm run ios` after setting up Xcode. Release work uses the committed iOS project and [Fastlane](fastlane/README.md). Read the lane before running it: even a build can install pods and change signing settings. The beta lane uploads externally and requires release-owner approval. EAS is not the verified release route.

Never commit credentials or copy production secrets into test fixtures. Backend migrations and billing setup require a separate validated deployment plan; do not apply legacy migrations to production as a development setup step.

## Contributing

Prefer small changes tied to an athlete journey. Test failure and restart behavior for persistence changes, and verify critical journeys in release-mode iOS: JavaScript checks alone do not certify device behavior. Report what you exercised, the build/device, and what remains unverified. Preserve existing user data.

## License and contact

MIT; see [LICENSE](LICENSE). Maintained by [Beaux](https://github.com/beaux-riel). Report reproducible issues in [GitHub Issues](https://github.com/beaux-riel/UltraEdge/issues). Include app version and reproduction steps; do not post private routes, contacts or credentials.
