# Aid Stations Count Fix

This document describes the changes made to fix the issue with counting aid stations in the RaceDetailsScreen.

## Problem

The RaceDetailsScreen was using `raceData.numAidStations` to display the number of aid stations for a race. However, now that aid station data is being stored as individual rows in the `aid_stations` table in Supabase, this property is no longer accurate.

## Solution

Modified the RaceDetailsScreen.js file to count the aid stations from the `aidStations` array instead of using the `numAidStations` property:

1. Changed the display of aid station count in the race stats section:
   ```javascript
   {raceData.aidStations ? raceData.aidStations.length : 0}
   ```

2. Changed the display of aid station count in the race description:
   ```javascript
   `${raceData.name} is a ${raceData.distance} ${
     raceData.distanceUnit || "mile"
   } race with approximately ${raceData.elevation} ${
     raceData.elevationUnit || "ft"
   } of elevation gain. The race features ${
     raceData.aidStations ? raceData.aidStations.length : 0
   } aid stations along the course.`
   ```

## How It Works

The SupabaseContext.js file already fetches aid stations from the database and maps them to the race object as an array. By using `raceData.aidStations.length`, we get an accurate count of the aid stations associated with a race.

## Benefits

1. The aid station count is now dynamically calculated based on the actual aid stations in the database
2. This approach is more resilient to changes in the database schema
3. The count will always be in sync with the actual aid stations displayed in the app