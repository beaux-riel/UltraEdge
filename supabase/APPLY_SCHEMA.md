# Applying the New Schema to Supabase

This document provides instructions for applying the new schema to your Supabase project.

## Prerequisites

- Supabase CLI installed (if using CLI method)
- Access to the Supabase project dashboard
- Database backup (recommended before making changes)

## Option 1: Using the Supabase Dashboard

1. **Backup Your Data**
   - Go to the Supabase Dashboard
   - Navigate to your project
   - Go to Database > Backups
   - Create a new backup

2. **Apply the Schema**
   - Go to the SQL Editor
   - Open a new query
   - Copy the contents of `migrations/20250811173500_new_schema.sql`
   - Paste into the SQL Editor
   - Run the query

3. **Verify the Changes**
   - Go to the Table Editor
   - Verify that all tables have been created correctly
   - Check that indexes and constraints are in place

## Option 2: Using the Supabase CLI

1. **Install the Supabase CLI** (if not already installed)
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link Your Project**
   ```bash
   supabase link --project-ref <your-project-id>
   ```

4. **Push the Migration**
   ```bash
   supabase db push
   ```

5. **Verify the Changes**
   - Go to the Supabase Dashboard
   - Navigate to your project
   - Go to the Table Editor
   - Verify that all tables have been created correctly

## Data Migration Considerations

Since this is a complete schema redesign, you'll need to migrate your data from the old schema to the new one. Here are some general steps:

1. **Export Existing Data**
   - Use the Supabase Dashboard to export data from existing tables
   - Alternatively, use the Supabase CLI or direct PostgreSQL commands

2. **Transform Data**
   - Create scripts to transform data from the old format to the new format
   - Map fields from old tables to new tables

3. **Import Data**
   - Use the Supabase Dashboard to import data into new tables
   - Alternatively, use the Supabase CLI or direct PostgreSQL commands

4. **Verify Data Integrity**
   - Check that all data has been migrated correctly
   - Verify relationships between tables

## Troubleshooting

If you encounter issues during the schema application:

1. **Check Error Messages**
   - Look for specific error messages in the SQL Editor or CLI output
   - Address each error individually

2. **Rollback if Necessary**
   - If major issues occur, restore from your backup
   - Try applying the schema changes in smaller batches

3. **Seek Help**
   - Consult the Supabase documentation
   - Reach out to the development team for assistance