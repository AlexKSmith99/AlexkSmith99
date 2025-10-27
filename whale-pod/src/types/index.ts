// User Types
export interface User {
  id: string;
  email: string;
  name?: string;
  age?: number;
  gender?: string;
  hometown?: string;
  profile_picture?: string;
  bio?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  github?: string;
  portfolio_website?: string;
  resume_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  connections_count: number;
  privacy_settings: PrivacySettings;
  active_pursuits: Pursuit[];
  past_pursuits: Pursuit[];
  reviews: Review[];
}

export interface PrivacySettings {
  profile_visibility: 'everyone' | 'pursuit_applicants' | 'connections_only';
  show_social_links: boolean;
  show_pursuit_history: boolean;
  show_reviews: boolean;
}

// Pursuit Types
export type PursuitType =
  | 'Education'
  | 'Friends'
  | 'Problem'
  | 'Business'
  | 'Lifestyle'
  | 'Hobby'
  | 'Side Hustle'
  | 'Travel'
  | 'Discussion'
  | 'New Endeavor'
  | 'Accountability';

export type PursuitCategory =
  | 'Tech'
  | 'Sports'
  | 'Art'
  | 'Music'
  | 'Health'
  | 'Career'
  | 'Personal Growth'
  | 'Other';

export type DecisionSystem =
  | 'standard_vote'
  | 'admin_ultimate_say'
  | 'delegated'
  | 'weighted_voting';

export type MeetingAttendanceStyle =
  | 'Mandatory'
  | 'Optional'
  | 'Frequent';

export interface Pursuit {
  id: string;
  creator_id: string;
  creator?: User;
  title: string;
  description: string;
  team_size_min: number;
  team_size_max: number;
  team_size_flexible: boolean;
  location: string;
  projected_duration?: string;
  pursuit_types: PursuitType[];
  pursuit_categories: string[];
  ownership_structure?: string;
  decision_system: DecisionSystem;
  decision_system_note?: string;
  meeting_cadence: string;
  meeting_cadence_note?: string;
  attendance_style: MeetingAttendanceStyle;
  attendance_note?: string;
  accountability_mechanics?: string[];
  roles?: string[];
  experience_level?: string;
  current_stage?: string;
  age_restriction?: string;
  continue_accepting_after_kickoff: boolean;
  requires_interview: boolean;
  requires_resume: boolean;
  application_questions?: string[];
  status: 'awaiting_kickoff' | 'active' | 'closed' | 'delisted';
  current_members_count: number;
  members?: TeamMember[];
  created_at: string;
  updated_at: string;
}

export interface TeamMember {
  id: string;
  pursuit_id: string;
  user_id: string;
  user?: User;
  role?: string;
  is_admin: boolean;
  joined_at: string;
  attendance_count: number;
  tasks_completed: number;
}

export interface PursuitApplication {
  id: string;
  pursuit_id: string;
  applicant_id: string;
  applicant?: User;
  answers: { question: string; answer: string }[];
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

// Team Board Types
export interface TeamBoard {
  id: string;
  pursuit_id: string;
  created_at: string;
  updated_at: string;
}

export interface BoardTask {
  id: string;
  board_id: string;
  title: string;
  description?: string;
  assigned_to?: string;
  assigned_user?: User;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface MeetingNote {
  id: string;
  pursuit_id: string;
  title: string;
  content: string;
  agenda?: string;
  attendees: string[];
  meeting_date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TeamGallery {
  id: string;
  pursuit_id: string;
  photo_url: string;
  caption?: string;
  uploaded_by: string;
  created_at: string;
}

// Review Types
export interface Review {
  id: string;
  reviewer_id: string;
  reviewer?: User;
  reviewee_id: string;
  pursuit_id: string;
  pursuit?: Pursuit;
  work_ethic: number; // 1-5
  flexibility: number;
  quality_of_work: number;
  punctuality: number;
  leadership: number;
  reliability: number;
  easy_to_work_with: number;
  articulation: number;
  charisma: number;
  niceness: number;
  creativity: number;
  technical_skills: number;
  comment?: string;
  created_at: string;
}

// Connection Types
export interface Connection {
  id: string;
  user_id_1: string;
  user_id_2: string;
  status: 'pending' | 'accepted';
  created_at: string;
}

// Messaging Types
export interface Message {
  id: string;
  sender_id: string;
  sender?: User;
  recipient_id?: string;
  pursuit_id?: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_1_id: string;
  participant_2_id: string;
  last_message?: Message;
  updated_at: string;
}

// Notification Types
export interface Notification {
  id: string;
  user_id: string;
  type: 'application' | 'connection' | 'message' | 'acceptance' | 'meeting' | 'review';
  title: string;
  message: string;
  is_read: boolean;
  data?: any;
  created_at: string;
}

// Voting Types
export interface Vote {
  id: string;
  pursuit_id: string;
  proposal: string;
  created_by: string;
  votes_for: string[];
  votes_against: string[];
  status: 'active' | 'passed' | 'failed';
  created_at: string;
  closed_at?: string;
}

// Kick Member Proposal
export interface KickProposal {
  id: string;
  pursuit_id: string;
  target_user_id: string;
  reason: string;
  created_by: string;
  votes: { user_id: string; vote: boolean }[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}
