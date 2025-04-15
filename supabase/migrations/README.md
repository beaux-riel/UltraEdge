# Database Migrations

This directory contains SQL migration scripts for the Supabase database.

## Migration Files

- `20250408_add_missing_columns.sql`: Adds missing columns to the profiles table to support user data backup functionality.

## How to Apply Migrations

1. Log in to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the migration script content
4. Run the script

## Schema Changes

The following columns were added to the `profiles` table:

- `profile_image`: TEXT - Stores the URL or base64 data of the user's profile image
- `location`: TEXT - Stores the user's location
- `bio`: TEXT - Stores the user's biography
- `preferences`: JSONB - Stores user preferences like distance units, elevation units, etc.
- `stats`: JSONB - Stores user statistics like races planned, completed, etc.
- `achievements`: JSONB - Stores user achievements

These changes ensure that all user data can be properly backed up to and restored from Supabase.