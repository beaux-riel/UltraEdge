# Fat Dog KML import

The second user export is KML with an XML filename. Its 136 LineString sections contain exactly the same 8,434 route samples as the prior GPX; its 15 Point placemarks produce identical checkpoints, descriptions, elevations and estimated distances.

Added content-based KML normalization before staging a course. The saved file is GPX so existing previews, reload and checkpoint recovery use the same parser. XML text is serialized safely. Supports a single course placemark with ordered LineString sections (including MultiGeometry) and Point checkpoints. Rejects invalid coordinates, point-only files, competing course placemarks and section gaps exceeding 50 meters. Does not fetch KML links or icons. KMZ and gx:Track are not supported.

Validation: 148 tests passed, 3 todo across 26 suites; TypeScript and diff checks passed. Original KML and GPX compare exactly in regression tests; each imports into persistence and reimports without duplicates. iOS production JS export succeeded with ULTRAEDGE_DISABLE_WATCHMAN=1. Native device acceptance and TestFlight upload have not been performed for these changes.
