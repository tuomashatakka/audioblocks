# Setting Up Google OAuth for AudioBlocks

This guide will walk you through setting up Google OAuth for your AudioBlocks application using Supabase authentication.

## 1. Create OAuth Credentials in Google Cloud Console

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
     - `http://localhost:3000/api/auth/callback/google` (for development)
     - `https://your-production-domain.com/api/auth/callback/google` (for production)
7. Click "Create" and note your Client ID and Client Secret

## 2. Configure Supabase Authentication

1. Go to your Supabase dashboard at [https://app.supabase.com/](https://app.supabase.com/)
2. Select your project
3. Navigate to "Authentication" > "Providers"
4. Find "Google" in the list of providers and enable it
5. Enter your Google OAuth credentials:
   - Client ID: Your Google Client ID
   - Client Secret: Your Google Client Secret
   - Authorized Redirect URIs: 
     - Your Supabase URL + `/auth/v1/callback` (e.g., `https://lsouwwmarglclztmyjla.supabase.co/auth/v1/callback`)
6. Click "Save"

## 3. Update Your Environment Variables

Update your `.env` file with the following variables:

```
# Supabase Service Role Key (from Supabase dashboard > Settings > API)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret # Generate with: openssl rand -base64 32

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

For production, update the `NEXTAUTH_URL` to your production domain.

## 4. Testing

1. Run your application with `npm run dev` or `bun dev`
2. Navigate to any page with the login button
3. Click "Sign in with Google"
4. You should be redirected to Google's authentication page
5. After authenticating, you should be redirected back to your application

## Troubleshooting

- **Callback URL Error**: Ensure your callback URLs are correctly configured in both Google Cloud Console and Supabase
- **Redirect URI Mismatch**: The redirect URI must exactly match what you've configured in Google Cloud Console
- **CORS Issues**: Make sure your origins are properly set in Google Cloud Console
- **Invalid Client Secret**: Double-check that you've copied the correct client secret from Google Cloud Console
