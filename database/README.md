# Database setup

Supabase now owns all database provisioning directly through SQL. Run the files
in numerical order from the Supabase SQL Editor (or via `psql`) against the
project database:

1. `001_schema.sql` – creates the enums, tables, indexes, and base defaults.
2. `010_functions.sql` – installs helper functions/triggers for timestamps and
   admin checks.
3. `020_policies.sql` – grants Supabase roles the required privileges, enables
   Row Level Security, and creates the per-table policies.

The scripts are designed for a freshly created database. If you need to re-run
them on an existing project, make sure to drop conflicting objects first or wrap
the statements in conditional guards as needed.

Storage bucket policies for the `car-images` bucket still have to be created via
the Supabase Dashboard (Storage > Policies) because they live in the `storage`
schema. Keep those in sync with the admin policies defined here if you add new
roles or tables.
