# Whale Pod - Connect, Pursue, Achieve Together

**Whale Pod** is a mobile app that connects people who want to pursue similar goals together in small, intimate teams of 2-8 members. Whether you're learning a new skill, building a business, staying accountable, or just looking for like-minded friends, Whale Pod helps you find your pod and achieve more together.

## Features

### Core Features

#### 🎯 **Pursuit Creation & Discovery**
- Create detailed pursuits with customizable parameters
- Browse and filter pursuits by type, category, location, and status
- Support for 11 pursuit types: Education, Friends, Problem, Business, Lifestyle, Hobby, Side Hustle, Travel, Discussion, New Endeavor, Accountability
- Custom categories and tags for easy discovery

#### 👥 **Team Formation**
- Team sizes from 2-8 members (flexible or firm)
- Application system with custom questions
- Optional interview and resume requirements
- Admin approval system for team building
- View team member profiles before applying

#### 📋 **Team Board (Trello-like)**
- Kanban-style task management
- Drag-and-drop functionality
- Task status tracking (To Do, In Progress, Done)
- Priority levels and task assignment
- Real-time collaboration

#### 💬 **Communication**
- Direct messaging between users
- Group chat for pursuit teams
- Real-time message notifications
- Connection system to build your network

#### 📝 **Meeting Management**
- Meeting notes and agendas
- Attendance tracking
- Meeting history
- Google Calendar integration (planned)

#### 🖼️ **Team Gallery**
- Photo sharing within teams
- Visual documentation of progress
- Shared memories and milestones

#### ⭐ **Review System**
- Comprehensive peer reviews with 12 metrics:
  - Work Ethic
  - Flexibility
  - Quality of Work
  - Punctuality
  - Leadership
  - Reliability
  - Easy to Work With
  - Articulation
  - Charisma
  - Niceness
  - Creativity
  - Technical Skills
- Public or private review display
- Average ratings on profiles

#### 🔐 **Privacy & Settings**
- Customizable profile visibility
- Control over social link display
- Hide/show pursuit history
- Manage review visibility

#### 🗳️ **Decision Systems**
- Standard voting
- Admin ultimate say
- Delegated decision making
- Weighted voting
- Team member removal voting

## Tech Stack

### Frontend
- **React Native** - Cross-platform mobile development
- **Expo** - React Native framework
- **TypeScript** - Type-safe code
- **React Navigation** - Navigation library
- **NativeWind** - Tailwind CSS for React Native

### Backend
- **Supabase** - Backend as a Service
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - Row Level Security (RLS)
  - File storage

### Additional Libraries
- `expo-image-picker` - Image selection
- `expo-document-picker` - Document selection
- `react-native-draggable-flatlist` - Drag-and-drop lists
- `@react-native-async-storage/async-storage` - Local storage

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- A Supabase account (free tier works)
- iOS Simulator (Mac) or Android Emulator / Physical device

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd whale-pod
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Set Up Supabase

1. Create a new project at [https://supabase.com](https://supabase.com)
2. In your Supabase project dashboard:
   - Go to **Settings** → **API**
   - Copy your **Project URL** and **anon public** key
3. Go to **SQL Editor** and run the entire `supabase-schema.sql` file to create all tables and policies

### Step 4: Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Step 5: Run the App

```bash
# Start the development server
npm start

# Run on iOS simulator (Mac only)
npm run ios

# Run on Android emulator/device
npm run android

# Run in web browser (limited functionality)
npm run web
```

## Project Structure

```
whale-pod/
├── src/
│   ├── components/        # Reusable UI components
│   │   └── PursuitCard.tsx
│   ├── config/           # Configuration files
│   │   └── supabase.ts   # Supabase client setup
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx
│   ├── navigation/       # Navigation setup
│   │   └── AppNavigator.tsx
│   ├── screens/          # Screen components
│   │   ├── auth/         # Authentication screens
│   │   ├── feed/         # Main feed
│   │   ├── messages/     # Messaging
│   │   ├── notifications/
│   │   ├── profile/      # User profiles
│   │   ├── pursuit/      # Pursuit CRUD
│   │   ├── review/       # Review system
│   │   ├── settings/
│   │   └── team/         # Team features (board, notes, gallery)
│   ├── services/         # API services
│   │   ├── pursuitService.ts
│   │   ├── teamBoardService.ts
│   │   ├── messageService.ts
│   │   ├── connectionService.ts
│   │   ├── notificationService.ts
│   │   ├── reviewService.ts
│   │   └── voteService.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   └── utils/            # Utility functions
├── assets/               # Images, fonts, etc.
├── App.tsx              # Root component
├── package.json
├── supabase-schema.sql  # Database schema
└── README.md
```

## Database Schema

The app uses Supabase (PostgreSQL) with the following main tables:

- **profiles** - User profiles and settings
- **pursuits** - Created pursuits/goals
- **team_members** - Members of each pursuit
- **pursuit_applications** - Applications to join pursuits
- **team_boards** - Team project boards
- **board_tasks** - Tasks on team boards
- **meeting_notes** - Meeting notes and agendas
- **team_gallery** - Photo galleries for teams
- **reviews** - Peer reviews
- **connections** - User connections
- **messages** - Direct and group messages
- **notifications** - User notifications
- **votes** - Voting proposals
- **kick_proposals** - Member removal proposals

See `supabase-schema.sql` for the complete schema with indexes and Row Level Security policies.

## Key Screens

### Authentication
- **Login** - Email/password authentication
- **Signup** - Create account with email verification

### Main Tabs
- **Feed** - Browse and search pursuits
- **Messages** - View conversations
- **Create** - Create new pursuit
- **Notifications** - View activity
- **Profile** - Your profile and settings

### Pursuit Flow
1. **Create Pursuit** - Detailed form with all pursuit parameters
2. **Pursuit Detail** - View full pursuit information
3. **Apply** - Fill out application with custom questions
4. **Applications** - Review incoming applications (creators only)

### Team Features
1. **Team Detail** - Central hub for team activities
2. **Team Board** - Kanban-style task management
3. **Meeting Notes** - Document meetings and discussions
4. **Team Gallery** - Share photos and milestones

## How to Use

### Creating a Pursuit

1. Tap the **Create** tab
2. Fill in all required fields:
   - Title and detailed description
   - Team size (2-8 members)
   - Location
   - Pursuit types (select up to 3)
   - Categories
   - Meeting cadence and attendance expectations
   - Decision system
   - Optional: roles, experience level, age restrictions
3. Set up application requirements
4. Tap "Create Pursuit"

### Applying to a Pursuit

1. Browse pursuits in the **Feed**
2. Tap on a pursuit to view details
3. Tap "Apply to Join"
4. Answer the application questions
5. Submit and wait for creator approval

### Managing Your Team

Once your pursuit is active:

1. **Team Board**: Manage tasks and track progress
2. **Meeting Notes**: Document discussions and decisions
3. **Gallery**: Share team photos
4. **Messages**: Communicate with team members
5. **Reviews**: After completion, review team members

## Pursuit Types & Categories

### Pursuit Types
- **Education** - Learn skills together
- **Friends** - Find like-minded friends
- **Problem** - Solve challenges together
- **Business** - Build ventures
- **Lifestyle** - Improve daily habits
- **Hobby** - Pursue interests
- **Side Hustle** - Create income streams
- **Travel** - Explore together
- **Discussion** - Deep conversations
- **New Endeavor** - Try something new
- **Accountability** - Stay on track together

### Example Use Cases

- **"Learn React Native - Build Apps Together"**
  - Type: Education, Side Hustle
  - Categories: tech, coding, mobile-dev

- **"Morning Runners Club - Get Fit"**
  - Type: Lifestyle, Accountability
  - Categories: fitness, health, running

- **"Start a Podcast about Tech"**
  - Type: Business, Side Hustle
  - Categories: tech, media, podcasting

- **"Board Game Night Crew"**
  - Type: Friends, Hobby
  - Categories: games, social, fun

## Privacy & Security

- All data is stored securely in Supabase with Row Level Security (RLS)
- Users control visibility of their profiles, social links, and pursuit history
- Email verification required for account creation
- Reviews can be made public or private
- Team member removal requires voting (configurable)

## Roadmap / Future Features

- [ ] Google Calendar integration for automatic meeting scheduling
- [ ] Push notifications (currently using in-app notifications)
- [ ] Video call integration
- [ ] Premium memberships (unlimited pursuits)
- [ ] Advanced search and filtering
- [ ] Pursuit recommendations based on interests
- [ ] Progress tracking and analytics
- [ ] Export team data
- [ ] Mobile app stores (iOS App Store, Google Play)

## Contributing

This is a personal project, but contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Troubleshooting

### Common Issues

**"No Such Module" errors**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
```

**Supabase connection errors**
- Verify your `.env` file has correct credentials
- Check that you've run the `supabase-schema.sql` file
- Ensure your Supabase project is active

**Image picker not working**
```bash
# Install required dependencies
npx expo install expo-image-picker
```

**Navigation errors**
```bash
# Reinstall navigation dependencies
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
```

## Support

For questions or issues:
- Check the [Expo documentation](https://docs.expo.dev)
- Check the [Supabase documentation](https://supabase.com/docs)
- Create an issue in this repository

## License

MIT License - feel free to use this project for your own purposes.

## Acknowledgments

- Built with React Native and Expo
- Backend powered by Supabase
- Inspired by the need to pursue goals together rather than alone

---

**Made with ❤️ for ambitious individuals who achieve more together.**
