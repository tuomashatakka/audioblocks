# AudioBlocks

## Google Authentication Setup

This project supports two methods of Google authentication:

1. **NextAuth.js with Google Provider** - The primary authentication method
2. **Direct Supabase Auth** - Alternative method for reference

### Prerequisites

- A Supabase project set up
- A Google Cloud Platform project with OAuth 2.0 credentials

### Setup Instructions

#### 1. Configure Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Set up the OAuth consent screen if you haven't already
   - Choose "External" user type (unless you're restricting to your organization)
   - Fill in the required app information
   - Add scopes for `userinfo.email`, `userinfo.profile`, and `openid`
   - Add your email as a test user if in testing mode
6. Create OAuth client ID credentials
   - Application type: Web application
   - Name: AudioBlocks (or your preferred name)
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://your-production-domain.com` (for production)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (for NextAuth)
     - `https://your-supabase-project.supabase.co/auth/v1/callback` (for Supabase Direct)
     - `http://localhost:3000` (for Supabase redirect)
7. Click "Create" and note your Client ID and Client Secret

#### 2. Configure Supabase Authentication

1. Go to your Supabase dashboard at [https://app.supabase.com/](https://app.supabase.com/)
2. Select your project
3. Navigate to "Authentication" > "Providers"
4. Find "Google" in the list of providers and enable it
5. Enter your Google OAuth credentials:
   - Client ID: Your Google Client ID
   - Client Secret: Your Google Client Secret
   - Authorized Redirect URIs: Your Supabase callback URL  
     (This should be automatically set to `https://your-project.supabase.co/auth/v1/callback`)
6. Click "Save"

#### 3. Setup Database Permissions

To properly handle authentication and permissions:

1. Navigate to the SQL Editor in your Supabase dashboard
2. Run the migration scripts located in the `/supabase/migrations/` directory:
   - First run `create_users_table.sql` to set up the users table (if using NextAuth adapter)
   - Then run `grant_permissions.sql` to set up the permissions for the 'daw' schema

#### 4. Environment Variables

Update your `.env` file with the following variables:

```
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-key

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Testing the Authentication

We've included multiple ways to test the authentication:

1. **Login Page**: Navigate to `/login` to see both authentication options
2. **Auth Test Page**: Navigate to `/auth-test` for a detailed debug page that shows the status of both authentication methods

### Troubleshooting

- **"Error: Callback"**: This typically means there's an issue with the Google OAuth callback URLs. Make sure they are correctly configured in the Google Cloud Console and match the URLs in your application.
- **Credential issues**: Ensure your Google Client ID and Client Secret are correctly copied into both Supabase Dashboard and your `.env` file.
- **Session issues**: If authentication succeeds but you're immediately logged out, check that you have the correct `NEXTAUTH_SECRET` set.

#### Database Permission Errors

If you encounter any of these permission errors:

- `permission denied for schema daw`
- `permission denied for table projects`
- `permission denied for sequence projects_id_seq`

Follow these steps to fix them:

1. Go to the Supabase dashboard for your project
2. Navigate to the SQL Editor
3. Run the following scripts in this order:
   - `supabase/migrations/grant_permissions.sql` (for general schema permissions)
   - `supabase/migrations/fix_project_permissions_simple.sql` (for projects table permissions)
   - `supabase/migrations/fix_uuid_conversion.sql` (for UUID conversion)

These scripts will:
- Grant the necessary permissions for both the `public` and `daw` schemas
- Set up Row Level Security (RLS) policies if needed
- Configure permissions for all related sequences
- Set default privileges for future tables

If you continue to experience permission issues, you can examine your database structure using:
- `supabase/migrations/examine_database.sql`

This will help identify which schemas and tables exist, so you can adjust permissions accordingly.

#### UUID Format Errors

If you encounter errors like:
- `invalid input syntax for type uuid: "102169462898509022468"`

This happens because Google Auth IDs are numeric strings, not UUIDs, and Supabase tables often expect UUID format for ID fields.

The solution implemented in this project:
1. A utility function `ensureUuid()` in `src/utils/auth/idConversion.ts` converts any ID to a valid UUID
2. The project now uses this to convert Google IDs to UUIDs before database operations
3. A database function `google_id_to_uuid()` is available as a fallback if needed

This approach ensures consistent handling of IDs regardless of the authentication method used.

#### Missing Column Errors

If you encounter errors like:
- `Could not find the 'user_id' column of 'projects' in the schema cache`

This happens when the code tries to access a column that doesn't exist in the database table.

To fix this:
1. Run the `supabase/migrations/examine_projects_table.sql` script to check the current table structure
2. Run the `supabase/migrations/update_projects_table.sql` script to add any missing columns
3. Make sure your application code uses the correct column names (e.g., `owner_id` instead of `user_id`)

The updated project code now dynamically checks the table structure before inserting data, which helps prevent these errors.

#### Row Level Security (RLS) Policy Errors

If you encounter errors like:
- `new row violates row-level security policy for table "projects"`

This means the Row Level Security policies are preventing your operation. These policies restrict which rows a user can access based on their identity.

To fix this:
1. Run the `supabase/migrations/fix_rls_policies.sql` script to set up permissive policies
2. Make sure your Supabase service role key is set correctly in the `.env` file
3. Ensure that the `owner_id` in the projects table matches the authenticated user's ID

The current implementation tries two approaches:
- First using the service role (which bypasses RLS)
- Then falling back to the standard authenticated user approach

For production, you should customize the RLS policies to match your specific security requirements.

#### Session Expiration Issues

If you encounter errors like:
- `No active Supabase session found`
- `Your session has expired. Please log in again`

These indicate that the Supabase authentication session has expired or is not being properly managed. To fix this:

1. Make sure you're using the singleton Supabase client from `lib/supabase.ts`
2. Use the "Refresh Session" button on the login page to manually refresh your token
3. If you continue to have issues, try signing out and signing back in

Session management has been improved with:
- Session refreshing capabilities in the UI
- Better error handling and user feedback
- Singleton pattern for the Supabase client to prevent multiple instances

#### Foreign Key Constraint Errors

If you encounter errors like:
- `insert or update on table "projects" violates foreign key constraint "projects_owner_id_fkey"`
- `Key is not present in table "users".`

These indicate a relationship issue between tables. The project creation process needs to ensure user data exists first. To fix this:

1. Run the `supabase/migrations/create_users_and_projects_tables.sql` script to set up proper tables and relationships
2. The updated code now automatically syncs user data before creating projects
3. A new `create_project` RPC function handles the entire process server-side

Database structure improvements:
- Added automatic user syncing from auth.users to public.users
- Created an RPC function for safer project creation
- Implemented proper foreign key relationships between tables

For more detailed setup instructions, refer to:
- [NextAuth.js Google Provider Documentation](https://next-auth.js.org/providers/google)
- [Supabase Google OAuth Documentation](https://supabase.com/docs/guides/auth/social-login/auth-google)

*An attempt to make collaborating with an all-computer-producer group a single kitty step more easy* (⌒‿⌒) 

## Why This Project Exists

*You ask:* How could we ever come to a resolution on which DAW to use, who hosts our projects in their cloud – and why TF are people that use fRuiTy LoooPs DigiTaL AudIo Work StatIon the only ones to actually get anything released? :D (I'm as mad as you for that... it's supposed to be for 15y.o. boys doing dubstep n such am i right or what)

*We answer:* A collaborative web-based DAW that everyone can access from anywhere, regardless of their platform or preferences!

## Features

- Project management with cloud storage
- Multi-track editing with intuitive UI
- Audio waveform visualization
- Collaborative editing in real-time
- User authentication
- Cross-platform (works in any modern browser)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project

### Installation

1. Clone the repository
```bash
git clone https://github.com/your-username/audioblocks.git
cd audioblocks
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Copy the `.env.example` file to `.env.local` and fill in your Supabase details:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. Run the development server
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Authentication

The application uses a simple username/password authentication system with the following default credentials:

- Username: `demo`
- Password: `password`

You can also register a new user from the registration page.

## Database Schema

The application uses Supabase with the following schema:

### daw.users
- `id` (uuid, primary key)
- `username` (text, unique)
- `password_hash` (text)
- `created_at` (timestamp)

### daw.projects
- `id` (uuid, primary key)
- `name` (text)
- `created_at` (timestamp)
- `owner_id` (uuid, foreign key to daw.users)

### daw.tracks
- `id` (uuid, primary key)
- `project_id` (uuid, foreign key to daw.projects)
- `name` (text)
- `order` (integer)
- `created_at` (timestamp)

### daw.blocks
- `id` (uuid, primary key)
- `track_id` (uuid, foreign key to daw.tracks)
- `start_time` (integer)
- `end_time` (integer)
- `audio_url` (text)
- `created_at` (timestamp)

## Troubleshooting

### Database Sync Issues

If you encounter issues with database synchronization:

1. Make sure your Supabase project has the correct schema:

```sql
CREATE EXTENSION IF NOT EXISTS hstore;

CREATE SCHEMA IF NOT EXISTS daw;

CREATE TABLE IF NOT EXISTS daw.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS daw.projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  owner_id uuid REFERENCES daw.users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daw.tracks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES daw.projects (id) ON DELETE CASCADE,
  name text NOT NULL,
  "order" integer NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS daw.blocks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  track_id uuid REFERENCES daw.tracks (id) ON DELETE CASCADE,
  start_time integer NOT NULL,
  end_time integer NOT NULL,
  audio_url text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);
```

2. Run the manual initialization script:

```bash
node scripts/init-local-db.js
```

## Credits

Original demo and vibe code in lovable.dev

## License

This project is licensed under the MIT License - see the LICENSE file for details.