# UltraEdge Schema Upgrade

This document outlines the enhanced database schema designed to support the new features for UltraEdge.

## Schema Changes Overview

The updated schema transitions from a simple JSONB-based storage approach to a fully relational database model. This change provides:

1. Better data integrity through proper relationships
2. More efficient queries for specific data
3. Support for complex features and relationships
4. Improved performance for large datasets

## New Features Supported

### Race Planning Features
- Important date/times (gear pickup, mandatory briefing)
- Cutoff time/duration of event
- Goal time/duration
- Aid station ETAs (auto-calculated + manual override)
- Race results (including DNF)
- Hiking poles allowed flag
- Pacer allowed flag with starting point
- Mandatory gear list for pacer
- Race timer with aid station check-in/out

### Course Notes
- General race notes
- Distance-specific notes

### Aid Station Features
- Crew member allocation
- Additional nutrition/hydration options
- Washroom availability

### Drop Bag Features
- Named drop bag templates for reuse
- Drop bag assignment to aid stations

### Gear List Features
- Item descriptions/notes
- Item weights
- Race load calculation

### Crew List Features
- Crew member roles
- Crew responsibilities
- Crew-specific notes
- Plan sharing with crew

### Nutrition/Hydration Plan Features
- Nutrition timing + calorie goals
- Hydration timing + volume goals
- Nutrition weight tracking
- Dietary preferences

## Migration Process

The migration from the old schema to the new schema involves:

1. Creating the new tables and relationships
2. Migrating existing data from the JSONB format to the relational tables
3. Updating application code to use the new schema

### Data Migration

A migration function `migrate_race_data()` has been created to automatically transfer data from the old `race_backups` table to the new relational tables. This function:

1. Reads all race backups from the old table
2. For each race in the backup:
   - Creates a new race record in the `races` table
   - Creates aid station records in the `aid_stations` table
   - Preserves all existing data

## Implementation Notes

### Row Level Security

All tables have Row Level Security (RLS) enabled to ensure users can only access their own data. Policies have been created for each table to enforce this security model.

### Indexes

Indexes have been added to foreign keys and frequently queried columns to improve performance.

### Triggers

Triggers have been added to automatically update the `updated_at` timestamp when records are modified.

## Future Considerations

1. After successful migration, the `race_backups` table can be deprecated
2. Additional indexes may be needed based on query patterns
3. Consider adding full-text search capabilities for notes and descriptions

## Database Diagram

```
profiles
  ↑
  |
  +-- races
       |
       +-- aid_stations
       |    |
       |    +-- aid_station_checkins
       |    |
       |    +-- aid_station_crew
       |         |
       |         +-- crew_members
       |
       +-- race_crew
       |    |
       |    +-- crew_members
       |
       +-- race_drop_bags
       |    |
       |    +-- drop_bag_templates
       |
       +-- race_gear
       |    |
       |    +-- gear_items
       |
       +-- pacer_gear
       |
       +-- nutrition_plans
       |    |
       |    +-- nutrition_plan_items
       |         |
       |         +-- nutrition_items
       |
       +-- course_notes
```