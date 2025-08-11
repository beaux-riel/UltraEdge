# UltraEdge Schema Changes

This document outlines the major schema changes implemented in the August 2025 update.

## Overview of Changes

The database schema has been completely redesigned to better support the UltraEdge application's requirements for endurance event crew and supply management. The new schema provides improved tracking of items, dropbags, aid stations, and athlete performance.

## Key Improvements

1. **Separated Event-Specific Data**: Created `EventDropbags` to handle event-specific instances of dropbags
2. **Enhanced Item Management**: Added `UserItems` for personal inventory tracking
3. **Better Consumption Tracking**: Improved consumption tracking with location and timing
4. **Performance Analytics**: Added tables for tracking athlete performance and aid station visits
5. **Deployment Tracking**: Added `DropbagDeployments` to track physical dropbag movements
6. **Enhanced Metadata**: Added timestamps, status fields, and better organization
7. **Constraint Handling**: Structure now supports the rule that items can't be in multiple dropbags for the same event
8. **Inventory Management**: Better tracking of available vs. reserved quantities
9. **Template System**: Improved dropbag template functionality
10. **Support System**: Added comprehensive pacer, support vehicle, and athlete kit tracking
11. **Mobile Crew Support**: Support vehicle location tracking for real-time coordination

## Major Table Changes

### Core Entities
- Renamed `profiles` to `users` with expanded fields
- Added `athlete_profiles` for athlete-specific information
- Renamed `races` to `events` with expanded fields
- Redesigned `aid_stations` to be event-independent

### Event-Specific Relationships
- Added `event_aid_stations` to link aid stations to events
- Renamed `crew_members` to `crew` with expanded fields
- Added `event_crew` to link crew to events
- Redesigned `aid_station_crew` to link to event_aid_stations

### Items and Inventory Management
- Replaced `gear_items` and `nutrition_items` with unified `items` table
- Added `user_items` for personal inventory tracking
- Added `item_requirements` for tracking item dependencies

### Dropbag System
- Renamed `drop_bag_templates` to `dropbags` with template flag
- Added `event_dropbags` for event-specific instances
- Added `dropbag_items` for tracking items in dropbags
- Added `dropbag_deployments` for tracking physical dropbag movements

### Consumption and Performance Tracking
- Added `event_consumption` for tracking item consumption
- Added `athlete_event_performance` for tracking athlete performance
- Added `aid_station_visits` for tracking aid station visits

### Support and Performance Tracking
- Added `pacers` for tracking pacers
- Added `support_vehicles` for tracking support vehicles
- Added `support_vehicle_crew` for tracking crew in support vehicles
- Added `athlete_kits` for tracking athlete gear
- Added `athlete_kit_items` for tracking items in athlete kits
- Added `support_vehicle_inventory` for tracking items in support vehicles

## Migration Notes

This schema change is a complete replacement of the previous schema. All existing data will need to be migrated to the new schema. The migration process should:

1. Back up all existing data
2. Drop all existing tables
3. Create the new tables
4. Migrate data from the backup to the new tables

## Business Rules Enforcement

- The `UserItems.availableQuantity` and `reservedQuantity` fields help enforce finite item quantities
- Event-specific dropbag instances prevent the same physical item from being in multiple dropbags for one event
- Consumption tracking updates available quantities for future events
- Item requirements are tracked for validation during dropbag packing
- Pacer assignments track both athlete and pacer with specific aid station segments
- Support vehicle crew can have multiple members with different roles
- Athlete kits separate mandatory gear from carried nutrition/hydration for better organization