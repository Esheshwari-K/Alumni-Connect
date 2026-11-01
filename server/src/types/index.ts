export type UserRole = 'student' | 'alumni' | 'admin';
export type AccountStatus = 'active' | 'pending' | 'suspended';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type MentorshipStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';
export type SessionStatus = 'available' | 'booked' | 'completed' | 'cancelled';
export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';
export type OpportunityType = 'internship' | 'full-time' | 'part-time' | 'event' | 'referral' | 'other';
export type OpportunityStatus = 'active' | 'closed' | 'draft';
export type ApplicationStatus = 'submitted' | 'under_review' | 'shortlisted' | 'selected' | 'rejected' | 'withdrawn';

export interface User {
  id: string;
  full_name: string;
  email: string;
  password_hash?: string;
  role: UserRole;
  account_status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface StudentProfile {
  id: string;
  user_id: string;
  usn: string | null;
  programme: string | null;
  department: string | null;
  semester_or_year: string | null;
  skills: string | null;
  interests: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlumniProfile {
  id: string;
  user_id: string;
  headline: string | null;
  company: string | null;
  job_title: string | null;
  graduation_year: number | null;
  department: string | null;
  skills: string | null;
  bio: string | null;
  linkedin_url: string | null;
  verification_status: VerificationStatus;
  verification_reason: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminProfile {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface MentorshipRequest {
  id: string;
  student_id: string;
  alumni_id: string;
  message: string;
  topics: string | null;
  status: MentorshipStatus;
  created_at: string;
  updated_at: string;
  student_name?: string;
  student_email?: string;
  student_department?: string;
  student_programme?: string;
  alumni_name?: string;
  alumni_company?: string;
  alumni_job_title?: string;
}

export interface MentorshipSession {
  id: string;
  alumni_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string | null;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  alumni_name?: string;
  alumni_company?: string;
  alumni_job_title?: string;
}

export interface Booking {
  id: string;
  session_id: string;
  student_id: string;
  alumni_id: string;
  scheduled_at: string;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
  session_title?: string;
  meeting_link?: string;
  duration_minutes?: number;
  student_name?: string;
  student_email?: string;
  alumni_name?: string;
  alumni_company?: string;
  alumni_job_title?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  receiver_name?: string;
}

export interface Opportunity {
  id: string;
  posted_by: string;
  title: string;
  description: string;
  opportunity_type: OpportunityType;
  company: string;
  location: string;
  required_skills: string | null;
  application_url: string | null;
  deadline: string | null;
  status: OpportunityStatus;
  created_at: string;
  updated_at: string;
  poster_name?: string;
  poster_company?: string;
}

export interface Application {
  id: string;
  opportunity_id: string;
  student_id: string;
  resume_url: string | null;
  cover_letter: string | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
  opportunity_title?: string;
  opportunity_company?: string;
  opportunity_location?: string;
  student_name?: string;
  student_email?: string;
  student_programme?: string;
  student_department?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  email_notifications: boolean;
  in_app_notifications: boolean;
  created_at: string;
  updated_at: string;
}
