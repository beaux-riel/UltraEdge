# App icon

The field-guide identity now uses a trail-lime alpine silhouette with a negative-space ascending trail on graphite. Generated using the built-in imagegen tool, then resized with macOS sips.

Production assets: `assets/icon.png` and the matching native `ios/UltraEdge/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png`; both are opaque 1024×1024 PNGs. Android's adaptive foreground has extra safe-area padding with a graphite background configured in app.json. The web favicon uses the same mark at 48×48.

Generation prompt: Create one production app icon for UltraEdge, a premium ultramarathon race-planning app. Square full bleed opaque cool graphite #171C20 background. Center a bold geometric alpine ridge / ascending trail emblem in trail lime #C3E76B. Two sharp mountain summits with an angular ascending negative-space trail cut through the lower form as one cohesive compact symbol. Premium outdoor equipment brand, disciplined Swiss graphic design, crisp silhouette with generous clear space for OS masks. No text, letters, border, rounded outer corners, shadows, glow, gradients, texture, mockup, or scenery.

Validation: Apple's actool successfully compiled the native asset catalog for iPhone and iPad Simulator. Native and Expo icon files are byte-identical; dimensions and lack of alpha verified. The 60×60 rendering was visually inspected. Android configuration updated, but no Android runtime build was tested. No app logic changed; no new TestFlight upload in this change.
