# Quick Setup Guide for Whale Pod

## Prerequisites
- Node.js (v16+)
- Expo CLI: `npm install -g expo-cli`
- A Supabase account (free)

## Setup Steps

### 1. Install Dependencies
```bash
cd whale-pod
npm install
```

### 2. Set Up Supabase

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (2-3 minutes)
3. Go to **Settings** → **API**
4. Copy your **Project URL** and **anon public** key
5. Go to **SQL Editor** and click **New Query**
6. Paste the entire contents of `supabase-schema.sql`
7. Click **Run** to create all tables and policies

### 3. Configure Environment

1. Create a `.env` file:
```bash
cp .env.example .env
```

2. Edit `.env` with your credentials:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 4. Run the App

```bash
# Start Expo
npm start

# Then choose:
# - Press 'i' for iOS simulator (Mac only)
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app on your phone
```

## First Time Using the App

1. **Sign Up**: Create an account with your email
2. **Verify Email**: Check your email for verification link
3. **Log In**: Sign in with your credentials
4. **Edit Profile**: Add your bio, social links, and profile picture
5. **Browse Feed**: Explore existing pursuits or create your own!

## Test the Features

### Create a Test Pursuit
1. Tap the **Create** tab
2. Fill in:
   - Title: "Test Pursuit - Learn React Native"
   - Description: (at least 50 characters)
   - Team Size: 2-4
   - Location: "Remote"
   - Pursuit Type: Education
   - Meeting Cadence: "Weekly on Mondays"
3. Submit

### Apply to Your Own Pursuit (Testing)
1. Create a second account (use another email or temp email)
2. Browse the feed and find your pursuit
3. Apply with sample answers
4. Switch back to first account
5. Go to notifications and review the application

### Test Team Board
1. Once you have a team, go to **Team Detail**
2. Tap **Team Board**
3. Add tasks and move them between columns

## Troubleshooting

### Can't connect to Supabase?
- Check your `.env` file has the correct URL and key
- Make sure you ran the SQL schema
- Verify your Supabase project is active

### App won't start?
```bash
# Clear cache
rm -rf node_modules
npm install
expo start -c
```

### Navigation errors?
```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
```

## Next Steps

- Customize the app colors in `tailwind.config.js`
- Add your Google Calendar API key for meeting scheduling
- Deploy to Expo Application Services (EAS) for TestFlight/Play Store

## Need Help?

- Read the full `README.md` for detailed documentation
- Check [Expo docs](https://docs.expo.dev)
- Check [Supabase docs](https://supabase.com/docs)
