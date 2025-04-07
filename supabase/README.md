# Supabase Integration for Ultra Endurance Planner

This directory contains the necessary files to set up Supabase for the Ultra Endurance Planner app, enabling cloud backup functionality for premium users.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com/) and sign up or log in
2. Create a new project
3. Note your project URL and anon key (public API key)

### 2. Set Up Database Schema

1. In your Supabase project, go to the SQL Editor
2. Copy the contents of `schema.sql` from this directory
3. Paste and run the SQL in the Supabase SQL Editor

### 3. Configure Authentication

1. In your Supabase project, go to Authentication → Settings
2. Enable Email auth provider
3. Configure any additional settings as needed (password strength, etc.)

### 4. Update App Configuration

1. Open `/src/context/SupabaseContext.js`
2. Replace the placeholder values with your actual Supabase URL and anon key:

```javascript
const SUPABASE_URL = 'https://your-project-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

## Database Structure

### Profiles Table

Stores user profile information and premium status:

- `id`: UUID (references auth.users)
- `name`: Text
- `email`: Text (unique)
- `is_premium`: Boolean
- `created_at`: Timestamp
- `updated_at`: Timestamp

### Race Backups Table

Stores user race data backups:

- `id`: UUID
- `user_id`: UUID (references auth.users)
- `races_data`: JSONB (contains all race data)
- `backup_date`: Timestamp
- `created_at`: Timestamp

## Security

The database is configured with Row Level Security (RLS) to ensure users can only access their own data. The policies are set up so that:

1. Users can only view, update, and delete their own profile data
2. Users can only view, insert, update, and delete their own race backup data

## Premium Features

The following features are restricted to premium users:

1. Cloud backup of race data
2. Cloud restore of race data

The premium status is stored in the `is_premium` field of the profiles table.