Supabase setup and schema

1) Create a Supabase project
   - Go to https://app.supabase.com and create a new project (or use the CLI).

2) Apply the SQL schema
   - Download the DB connection details (host, user, password) or get the full connection string from the project.
   - Run the schema file in `supabase/schema.sql` against the Postgres database. Example using `psql`:

     psql "postgres://<db_user>:<db_pass>@<db_host>:5432/<db_name>" -f supabase/schema.sql

   - Alternatively, use the Supabase SQL editor in the dashboard and paste the contents of `supabase/schema.sql`.

3) Add credentials to your app
   - Copy `.env.local.example` to `.env.local` and fill `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and optionally `SUPABASE_SERVICE_ROLE_KEY`.

4) Install the client library

   npm install @supabase/supabase-js

5) Usage
   - The project includes `lib/supabase.js` which exports `supabase` (client) and `supabaseAdmin` (service-role client when available).

Security notes
   - Keep the `SUPABASE_SERVICE_ROLE_KEY` secret (do not expose it to the browser).
   - Use `supabaseAdmin` only in server-side code (API routes or server components).
