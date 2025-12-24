
export type UserRole = 'student' | 'admin' | 'faculty';

export interface Achievement {
  id: string;
  title: string;
  date: number;
  type: 'event' | 'project' | 'skill' | 'badge';
  description: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  category: 'contribution' | 'skill' | 'participation' | 'milestone';
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  clubId?: string; 
  joinedClubs: string[];
  interests: string[];
  skills: string[];
  achievements: Achievement[];
  badges: string[]; // Badge IDs
  points: number;
  isVerified: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  ownerUid: string;
  ownerName: string;
  status: 'recruiting' | 'in-progress' | 'completed';
  requiredSkills: string[];
  members: string[];
  pendingApplicants: string[];
  tags: string[];
  memberRoles?: Record<string, string>;
}

export interface MentorshipSession {
  id: string;
  mentorUid: string;
  menteeUid: string;
  topic: 'Placement' | 'Research' | 'Startup' | 'Academic';
  status: 'pending' | 'active' | 'completed';
  message: string;
}

export interface Club {
  id: string;
  name: string;
  description: string;
  adminUid: string;
  members: string[];
  pendingRequests: string[];
  category: string;
  logoUrl?: string;
  memberRoles?: Record<string, string>;
  status: 'pending' | 'approved' | 'rejected';
}

export interface ChatChannel {
  id: string;
  clubId: string;
  name: string;
  restrictedToRoles?: string[];
}

export interface Post {
  id: string;
  clubId: string;
  clubName: string;
  authorName: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'file';
  fileName?: string;
  timestamp: number;
  comments: Comment[];
  likes: string[];
  tags?: string[];
}

export interface Comment {
  id: string;
  userUid: string;
  userName: string;
  text: string;
  timestamp: number;
  isFlagged?: boolean;
}

export interface CollegeEvent {
  id: string;
  clubId: string;
  title: string;
  description: string;
  date: string;
  summary: string; // Mandatory for AI highlights
  location: string;
  type: 'Workshop' | 'Competition' | 'Seminar' | 'Hackathon';
  requiredSkills?: string[];
  status: 'pending' | 'approved' | 'rejected';
  proposedByUid?: string;
  proposerName?: string;
  videoUrl?: string;
}

export interface ChatMessage {
  id: string;
  clubId: string;
  channelId: string;
  senderUid: string;
  senderName: string;
  text: string;
  timestamp: number;
}

export interface AppNotification {
  id: string;
  userUid: string;
  title: string;
  message: string;
  type: 'request' | 'approval' | 'rejection' | 'role_assigned' | 'post_like' | 'project_invite' | 'mentorship';
  timestamp: number;
  isRead: boolean;
}
