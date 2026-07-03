# Fastlane — TestFlight builds for UltraEdge iOS

Builds the committed `ios/` project directly (no `expo prebuild`), signs with
Xcode automatic signing, and uploads to TestFlight via an App Store Connect
API key.

## One-time setup

1. **Install gems** (needs Ruby ≥ 3.0 — use Homebrew/rbenv Ruby, not macOS system Ruby):

   ```sh
   bundle install
   ```

2. **Create an App Store Connect API key**
   - App Store Connect → Users and Access → Integrations → App Store Connect API
   - Generate a key with the **App Manager** role, note the **Key ID** and
     **Issuer ID**, and download the `.p8` file (only downloadable once).

3. **Configure env vars**

   ```sh
   cp fastlane/.env.example fastlane/.env
   # fill in ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH, ASC_TEAM_ID
   ```

   fastlane auto-loads `fastlane/.env`. Never commit it.

4. Make sure the app record exists in App Store Connect with bundle ID
   `com.beaux.ultraedge`, and that you're signed into Xcode with your Apple ID
   (Xcode → Settings → Accounts) so automatic signing can create profiles.

## Lanes

```sh
# Build a Release .ipa locally without uploading (sanity check)
bundle exec fastlane ios build

# Bump build number, build, and upload to TestFlight
bundle exec fastlane ios beta
```

- `beta` sets the build number to `latest TestFlight build + 1`, archives
  `ios/UltraEdge.xcworkspace` (scheme `UltraEdge`, Release), and uploads via
  pilot with `skip_waiting_for_build_processing` — processing status appears
  in App Store Connect a few minutes later.
- Pods are installed automatically by the lane if `ios/Pods` is missing/stale.
- Artifacts land in `build/` (gitignored).
