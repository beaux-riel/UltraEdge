# Race Units Fix

This document describes the changes made to fix the issue with race distanceUnits and elevationUnits not being captured correctly.

## Problem

Race distance units and elevation units were not being properly saved to the Supabase database and retrieved when needed. This caused inconsistencies in how race distances and elevations were displayed in the app.

## Solution

1. Added new columns to the `races` table in Supabase:
   - `distance_units` (default: 'miles')
   - `elevation_units` (default: 'ft')

2. Modified the `saveRaceToSupabase` function in `SupabaseContext.js` to include these units when saving race data:
   ```javascript
   const raceData = {
     // ... existing fields
     distance_units: race.distanceUnit || 'miles',
     elevation_units: race.elevationUnit || 'ft',
     // ... other fields
   };
   ```

3. Modified the `fetchRacesFromSupabase` function to include these units when retrieving race data:
   ```javascript
   racesObject[race.id] = {
     // ... existing fields
     distanceUnit: race.distance_units || 'miles',
     elevationUnit: race.elevation_units || 'ft',
     // ... other fields
   };
   ```

## Migration

A new migration file `20250411020300_add_unit_columns.sql` was created to add the missing columns to the `races` table. This migration:

1. Checks if the columns already exist
2. Adds them with default values if they don't exist

## Testing

After applying these changes, the app should:
1. Save the user's preferred distance and elevation units with each race
2. Retrieve and display these units correctly when viewing race details
3. Maintain consistency between the app's local storage and the Supabase database

## Future Considerations

- Consider adding unit conversion functionality to allow users to switch between units for existing races
- Ensure that aid station distances are displayed in the same units as the race distance