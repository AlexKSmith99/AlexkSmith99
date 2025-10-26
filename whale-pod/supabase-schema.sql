-- Whale Pod Database Schema for Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  age INTEGER,
  gender TEXT,
  hometown TEXT,
  profile_picture TEXT,
  bio TEXT,
  instagram TEXT,
  linkedin TEXT,
  facebook TEXT,
  github TEXT,
  portfolio_website TEXT,
  resume_url TEXT,
  connections_count INTEGER DEFAULT 0,
  privacy_settings JSONB DEFAULT '{"profile_visibility": "everyone", "show_social_links": true, "show_pursuit_history": true, "show_reviews": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pursuits table
CREATE TABLE pursuits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  team_size_min INTEGER NOT NULL DEFAULT 2,
  team_size_max INTEGER NOT NULL DEFAULT 8,
  team_size_flexible BOOLEAN DEFAULT false,
  location TEXT NOT NULL,
  projected_duration TEXT,
  pursuit_types TEXT[] NOT NULL,
  pursuit_categories TEXT[],
  ownership_structure TEXT,
  decision_system TEXT NOT NULL DEFAULT 'standard_vote',
  decision_system_note TEXT,
  meeting_cadence TEXT NOT NULL,
  meeting_cadence_note TEXT,
  attendance_style TEXT NOT NULL DEFAULT 'Mandatory',
  attendance_note TEXT,
  accountability_mechanics TEXT[],
  roles TEXT[],
  experience_level TEXT,
  current_stage TEXT,
  age_restriction TEXT,
  continue_accepting_after_kickoff BOOLEAN DEFAULT false,
  requires_interview BOOLEAN DEFAULT false,
  requires_resume BOOLEAN DEFAULT false,
  application_questions TEXT[],
  status TEXT NOT NULL DEFAULT 'awaiting_kickoff',
  current_members_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT,
  is_admin BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  attendance_count INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  UNIQUE(pursuit_id, user_id)
);

-- Pursuit applications table
CREATE TABLE pursuit_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answers JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pursuit_id, applicant_id)
);

-- Team boards table
CREATE TABLE team_boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pursuit_id)
);

-- Board tasks table
CREATE TABLE board_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES team_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Meeting notes table
CREATE TABLE meeting_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  agenda TEXT,
  attendees UUID[],
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team gallery table
CREATE TABLE team_gallery (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
  work_ethic INTEGER NOT NULL CHECK (work_ethic >= 1 AND work_ethic <= 5),
  flexibility INTEGER NOT NULL CHECK (flexibility >= 1 AND flexibility <= 5),
  quality_of_work INTEGER NOT NULL CHECK (quality_of_work >= 1 AND quality_of_work <= 5),
  punctuality INTEGER NOT NULL CHECK (punctuality >= 1 AND punctuality <= 5),
  leadership INTEGER NOT NULL CHECK (leadership >= 1 AND leadership <= 5),
  reliability INTEGER NOT NULL CHECK (reliability >= 1 AND reliability <= 5),
  easy_to_work_with INTEGER NOT NULL CHECK (easy_to_work_with >= 1 AND easy_to_work_with <= 5),
  articulation INTEGER NOT NULL CHECK (articulation >= 1 AND articulation <= 5),
  charisma INTEGER NOT NULL CHECK (charisma >= 1 AND charisma <= 5),
  niceness INTEGER NOT NULL CHECK (niceness >= 1 AND niceness <= 5),
  creativity INTEGER NOT NULL CHECK (creativity >= 1 AND creativity <= 5),
  technical_skills INTEGER NOT NULL CHECK (technical_skills >= 1 AND technical_skills <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(reviewer_id, reviewee_id, pursuit_id)
);

-- Connections table
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_1 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_2 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2)
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  pursuit_id UUID REFERENCES pursuits(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
  proposal TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  votes_for UUID[],
  votes_against UUID[],
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Kick proposals table
CREATE TABLE kick_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pursuit_id UUID NOT NULL REFERENCES pursuits(id) ON DELETE CASCADE,
  target_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  votes JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_pursuits_creator ON pursuits(creator_id);
CREATE INDEX idx_pursuits_status ON pursuits(status);
CREATE INDEX idx_pursuits_created_at ON pursuits(created_at DESC);
CREATE INDEX idx_team_members_pursuit ON team_members(pursuit_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_applications_pursuit ON pursuit_applications(pursuit_id);
CREATE INDEX idx_applications_applicant ON pursuit_applications(applicant_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_pursuit ON messages(pursuit_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pursuits ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE pursuit_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kick_proposals ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Pursuits policies
CREATE POLICY "Pursuits are viewable by everyone" ON pursuits FOR SELECT USING (true);
CREATE POLICY "Users can create pursuits" ON pursuits FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their pursuits" ON pursuits FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete their pursuits" ON pursuits FOR DELETE USING (auth.uid() = creator_id);

-- Team members policies
CREATE POLICY "Team members are viewable by everyone" ON team_members FOR SELECT USING (true);
CREATE POLICY "Creators can add team members" ON team_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM pursuits WHERE id = pursuit_id AND creator_id = auth.uid())
);
CREATE POLICY "Creators can remove team members" ON team_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM pursuits WHERE id = pursuit_id AND creator_id = auth.uid())
);

-- Applications policies
CREATE POLICY "Applications viewable by creator and applicant" ON pursuit_applications FOR SELECT USING (
  auth.uid() = applicant_id OR
  EXISTS (SELECT 1 FROM pursuits WHERE id = pursuit_id AND creator_id = auth.uid())
);
CREATE POLICY "Users can create applications" ON pursuit_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Creators can update application status" ON pursuit_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM pursuits WHERE id = pursuit_id AND creator_id = auth.uid())
);

-- Messages policies
CREATE POLICY "Users can view their messages" ON messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = recipient_id OR
  EXISTS (SELECT 1 FROM team_members WHERE pursuit_id = messages.pursuit_id AND user_id = auth.uid())
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Notifications policies
CREATE POLICY "Users can view their notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Anyone can create notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pursuits_updated_at BEFORE UPDATE ON pursuits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON pursuit_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_boards_updated_at BEFORE UPDATE ON team_boards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON board_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON meeting_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
