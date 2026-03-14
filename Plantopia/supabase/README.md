# Plantopia — Supabase Setup

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose the Singapore region (or closest to your users)
3. Note your **Project URL** and **anon key** from Project Settings → API

## 2. Run the Database Migrations

In order, run each file in the Supabase SQL Editor (Dashboard → SQL Editor → New Query):

1. `migrations/001_initial_schema.sql` — creates tables: users, plants, plant_care, tasks, chat_messages
2. `migrations/002_rls_policies.sql` — enables Row-Level Security and creates policies
3. `migrations/003_storage.sql` — creates the `plant-images` storage bucket

## 3. Environment Variables

Create a `.env` file at the project root (copy from `.env.example`):

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # only needed server-side
```

## 4. Deploy Edge Functions

Install the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
```

Set the Anthropic API key secret:
```bash
supabase secrets set ANTHROPIC_API_KEY=your-key-here
```

Deploy all functions:
```bash
supabase functions deploy identify-plant
supabase functions deploy botanist-chat
supabase functions deploy generate-care
```

## 5. Storage Bucket

The migration creates the `plant-images` bucket automatically. Verify it exists at:
Dashboard → Storage → Buckets

Images are uploaded with path: `{user_id}/{timestamp}.jpg`

## 6. Authentication

Supabase Auth is enabled by default. The app uses anonymous auth for now.
To enable email/password auth: Dashboard → Authentication → Providers → Email.
