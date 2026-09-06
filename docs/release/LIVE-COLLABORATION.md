# Live race collaboration candidate — September 6, 2026

Implemented with private team rooms on the existing UltraEdge Supabase project (`lgmbgsgzytifqjquqqor`, Canada Central). The project was paused; its restore request succeeded, database/auth/REST became healthy, and the additive migration in `supabase/collaboration/001_live_rooms.sql` was applied. Guest authentication was enabled. Legacy account, premium and cloud-backup features remain disabled.

## Workflow

The race operations card offers **Live team sharing**. The owner publishes a snapshot of race timing, station stops and logistics. Crew open **Events → Join / open a live team race**, enter a display name and the private invitation code. Local timing observations are not uploaded as if authored by shared participants: use the live room for team observations. Local plan changes are published explicitly by the owner, with revision checks.

Each installation has its own Supabase guest identity with a session in secure storage. The owner is the runner; invited participants report as crew. Guest access is tied to that installation, without email/password recovery or owner transfer. Reloading team races recovers server rooms for the same retained identity. A new phone requires a new crew invitation. This limitation is explained before sharing.

Only members can fetch a room or submit their own observations. Owner controls publication, membership and closing the room. Removing a member rotates the invitation code. Shared room deletion cascades its data. The panel also supports leaving, removing a cached copy and deleting the guest identity and associated server data. Lifecycle changes wait for in-flight sync before clearing storage so a delayed response cannot restore deleted cached data.

## Synchronization and estimates

Observations save to a durable local outbox before network upload. Requests carry unique IDs and per-author/checkpoint/kind revisions. Retries are idempotent; stale corrections require refresh and a new correction. A failed request leaves pending evidence visible. The user can explicitly discard a pending queue to resolve conflicts. No last-write-wins overwrite of another person's report occurs.

The open room checks for updates every 10 seconds while foregrounded, and on returning to the foreground. Requests time out after 15 seconds. This is foreground polling, not continuous background synchronization or push notifications. Pending reports do not change the shared projection until accepted. Last successful sync and pending counts are visible; offline copies remain readable.

All phones use an absolute published start time. Each phone displays that instant in its own timezone. Individual reports remain visible. Multiple crew observations are averaged first, then weighted equally with the runner observation. Contradictory chronological observations suppress the ETA projection while retaining the evidence for correction. Best/expected/slow progress and station ETAs use the same distance-based model as local operations.

## Data boundary

Uploads use an explicit field allowlist for race timing and checkpoints. Contact phone numbers, emails, personal notes and GPX files are excluded. Display names, vehicle/cargo labels and station duties are shared. Private tables have RLS enabled and no direct anon/authenticated grants; the membership-checked RPC is the access path. Snapshot structure/size, membership, report author, checkpoint, observation time and plan/report revisions are validated server-side. In-app privacy/support text and unpublished website drafts describe optional sharing and deletion. Public privacy publication and App Store privacy answers still need to match this candidate before public release.

## Verification

- 170 unit/workflow tests pass, with 3 existing todos. TypeScript passes.
- `node scripts/test-live-collaboration.cjs`: 14 checks against the live backend, using three disposable guest identities and a synthetic room. Covers nonmember/table denial, crew publication denial, retry deduplication, stale corrections, author spoofing, invalid departure/checkpoint, plan conflicts, revocation/invitation rotation, leave and close. Those scripted identities are deleted afterward.
- Outbox tests simulate network loss, a successful server write followed by lost local acknowledgement, revoked access, and cache removal during an in-flight sync.
- Two separate iOS simulators created/joined a real backend room. Runner 11:00 and crew 11:10 observations produced 11:05 in the shared view. Owner cold-relaunch acceptance and final evidence are in workspace `reports/UltraEdge-operations/`.
- iOS Release simulator build succeeds. Keychain testing requires simulated entitlements: pass `CODE_SIGN_ENTITLEMENTS=/tmp/ue-simulator-keychain.plist` with the real app identifier and keychain group to Xcode. Xcode embeds these in the simulator entitlement section. Do not add restricted simulator entitlements directly to an ad-hoc code signature: macOS refuses to launch it. Distribution signing is unchanged.

Not uploaded to TestFlight in this task. Physical-phone, native offline/reconnect and background behavior acceptance remain separate from the simulator and mocked-network checks above.

Final native checks: owner cold restart retained the 11:05 shared average; owner stopped sharing and deleted its collaboration identity; crew deleted its identity. Both UI deletion flows passed. Supabase now reports ACTIVE_HEALTHY.
