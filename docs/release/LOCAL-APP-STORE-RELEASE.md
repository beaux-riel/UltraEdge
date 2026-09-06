# Free local-only App Store candidate

September 6, 2026: Beaux authorized App Review submission and previously specified that this first release is free and local-only. Cloud backup, online sharing and in-app messaging are reserved for a future monetised release.

This candidate includes the reviewed attachment lifecycle fixes and hosted privacy/support links. Both live-room UI entry points are removed. Online collaboration implementation remains dormant for future development; no collaboration backend migration is deployed for this release. App collection manifests are empty and tracking is disabled. App Privacy, screenshots and review metadata must match this candidate before submission.

Validation: 36 Jest suites / 215 tests pass (3 TODO), TypeScript passes. Use Jest with --watchman=false on this host. For signed archives use EXPO_NO_DOTENV=1 and ULTRAEDGE_DISABLE_WATCHMAN=1. The installed release bundle is in the source repository vendor/bundle for Ruby 3.4.0; select Homebrew Ruby and the absolute BUNDLE_PATH when building from this worktree. Do not print or commit fastlane/.env.

Website updated through heybeaux/heybeaux-web PR 19, merged through the configured GitHub deployment integration. Store privacy/support URLs, local-only description/review instructions and age-rating changes are saved. Submission and processed-build verification are tracked separately under workspace reports/UltraEdge-distribution.
