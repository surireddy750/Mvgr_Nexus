
import { User, Club, Post, CollegeEvent, ChatMessage, Comment, AppNotification, ChatChannel, Project, MentorshipSession, Badge, Achievement } from '../types';

const INITIAL_CLUBS: Club[] = [
  {
    id: 'c1',
    name: 'MVGR Tech Wizards',
    description: 'A community for coding enthusiasts and tech innovators.',
    adminUid: 'admin1',
    members: ['admin1'],
    pendingRequests: [],
    category: 'Technology',
    logoUrl: 'https://picsum.photos/seed/tech/200',
    memberRoles: { 'admin1': 'Founder' },
    status: 'approved'
  }
];

const DUMMY_PERSONNEL: User[] = [
  {
    uid: 'u101',
    email: 'k.sharma@mvgrce.edu.in',
    displayName: 'Karan Sharma',
    role: 'student',
    joinedClubs: ['c1'],
    interests: ['React', 'TypeScript', 'UI Design'],
    skills: ['Frontend', 'Figma'],
    achievements: [{ id: 'a1', title: 'Hackathon Finalist', date: Date.now(), type: 'event', description: 'Top 5 in Build-It 2024' }],
    badges: ['b1', 'b2'],
    points: 450,
    isVerified: true
  },
  {
    uid: 'u102',
    email: 's.reddy@mvgrce.edu.in',
    displayName: 'Sneha Reddy',
    role: 'student',
    joinedClubs: [],
    interests: ['Python', 'Machine Learning', 'Data Analysis'],
    skills: ['AI', 'Data Science'],
    achievements: [{ id: 'a2', title: 'Academic Excellence', date: Date.now(), type: 'skill', description: '9.8 CGPA' }],
    badges: ['b2'],
    points: 380,
    isVerified: true
  },
  {
    uid: 'u103',
    email: 'a.kumar@mvgrce.edu.in',
    displayName: 'Ankit Kumar',
    role: 'student',
    joinedClubs: [],
    interests: ['IoT', 'Robotics', 'Embedded C'],
    skills: ['Hardware', 'Sensors'],
    achievements: [],
    badges: ['b1'],
    points: 210,
    isVerified: true
  }
];

const BADGE_DEFINITIONS: Badge[] = [
  { id: 'b1', name: 'Nexus Pioneer', description: 'Early adopter of the MVGR Nexus hub.', icon: 'Zap', color: 'indigo', category: 'milestone' },
  { id: 'b2', name: 'Code Maestro', description: 'Validated expertise in programming languages.', icon: 'Terminal', color: 'emerald', category: 'skill' },
  { id: 'b3', name: 'Event Legend', description: 'Attended over 10 college workshops.', icon: 'Calendar', color: 'amber', category: 'participation' },
  { id: 'b4', name: 'Top Contributor', description: 'High engagement in community discussions.', icon: 'MessageSquare', color: 'blue', category: 'contribution' },
  { id: 'b5', name: 'Visionary', description: 'Created a high-impact club or project.', icon: 'Eye', color: 'violet', category: 'milestone' }
];

class MockFirebase {
  private users: User[] = [];
  private clubs: Club[] = [];
  private channels: ChatChannel[] = [];
  private posts: Post[] = [];
  private events: CollegeEvent[] = [];
  private projects: Project[] = [];
  private mentorships: MentorshipSession[] = [];
  private messages: ChatMessage[] = [];
  private notifications: AppNotification[] = [];
  private currentUser: User | null = null;
  
  private listeners: { [key: string]: Set<(data: any) => void> } = {};

  constructor() {
    this.loadFromStorage();
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith('mvgr_')) {
        this.loadFromStorage();
        this.triggerAllListeners();
      }
    });
  }

  private loadFromStorage() {
    this.users = JSON.parse(localStorage.getItem('mvgr_users') || JSON.stringify(DUMMY_PERSONNEL));
    this.clubs = JSON.parse(localStorage.getItem('mvgr_clubs') || JSON.stringify(INITIAL_CLUBS));
    this.channels = JSON.parse(localStorage.getItem('mvgr_channels') || '[]');
    this.posts = JSON.parse(localStorage.getItem('mvgr_posts') || '[]');
    this.events = JSON.parse(localStorage.getItem('mvgr_events') || '[]');
    this.projects = JSON.parse(localStorage.getItem('mvgr_projects') || '[]');
    this.mentorships = JSON.parse(localStorage.getItem('mvgr_mentorships') || '[]');
    this.messages = JSON.parse(localStorage.getItem('mvgr_messages') || '[]');
    this.notifications = JSON.parse(localStorage.getItem('mvgr_notifications') || '[]');
    this.currentUser = JSON.parse(localStorage.getItem('mvgr_current_user') || 'null');
  }

  private triggerAllListeners() {
    Object.keys(this.listeners).forEach(key => {
      if (key.startsWith('messages_')) {
        const parts = key.replace('messages_', '').split('_');
        const containerId = parts[0];
        const channelId = parts[1];
        this.notify(key, this.messages.filter(m => m.clubId === containerId && m.channelId === channelId));
      } else if (key.startsWith('club_')) {
        const clubId = key.replace('club_', '');
        this.notify(key, this.clubs.find(c => c.id === clubId));
      } else if (key.startsWith('channels_')) {
        const containerId = key.replace('channels_', '');
        this.notify(key, this.channels.filter(c => c.clubId === containerId));
      } else if (key.startsWith('project_')) {
        const projectId = key.replace('project_', '');
        this.notify(key, this.projects.find(p => p.id === projectId));
      }
    });
  }

  private save() {
    localStorage.setItem('mvgr_users', JSON.stringify(this.users));
    localStorage.setItem('mvgr_clubs', JSON.stringify(this.clubs));
    localStorage.setItem('mvgr_channels', JSON.stringify(this.channels));
    localStorage.setItem('mvgr_posts', JSON.stringify(this.posts));
    localStorage.setItem('mvgr_events', JSON.stringify(this.events));
    localStorage.setItem('mvgr_projects', JSON.stringify(this.projects));
    localStorage.setItem('mvgr_mentorships', JSON.stringify(this.mentorships));
    localStorage.setItem('mvgr_messages', JSON.stringify(this.messages));
    localStorage.setItem('mvgr_notifications', JSON.stringify(this.notifications));
    localStorage.setItem('mvgr_current_user', JSON.stringify(this.currentUser));
  }

  private notify(key: string, data: any) {
    if (this.listeners[key]) {
      this.listeners[key].forEach(callback => callback(data));
    }
  }

  async uploadMedia(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async awardPoints(userUid: string, amount: number, reason: string) {
    const user = this.users.find(u => u.uid === userUid);
    if (user) {
      user.points = (user.points || 0) + amount;
      if (!user.achievements) user.achievements = [];
      user.achievements.push({
        id: Math.random().toString(36).substr(2, 9),
        title: `Points Awarded`,
        date: Date.now(),
        type: 'skill',
        description: reason
      });
      this.save();
    }
  }

  onMessages(containerId: string, channelId: string, callback: (msgs: ChatMessage[]) => void) {
    const key = `messages_${containerId}_${channelId}`;
    if (!this.listeners[key]) this.listeners[key] = new Set();
    this.listeners[key].add(callback);
    callback(this.messages.filter(m => m.clubId === containerId && m.channelId === channelId));
    return () => { this.listeners[key].delete(callback); };
  }

  onChannels(containerId: string, callback: (channels: ChatChannel[]) => void) {
    const key = `channels_${containerId}`;
    if (!this.listeners[key]) this.listeners[key] = new Set();
    this.listeners[key].add(callback);
    callback(this.channels.filter(c => c.clubId === containerId));
    return () => { this.listeners[key].delete(callback); };
  }

  onClub(clubId: string, callback: (club: Club | undefined) => void) {
    const key = `club_${clubId}`;
    if (!this.listeners[key]) this.listeners[key] = new Set();
    this.listeners[key].add(callback);
    callback(this.clubs.find(c => c.id === clubId));
    return () => { this.listeners[key].delete(callback); };
  }

  onProject(projectId: string, callback: (project: Project | undefined) => void) {
    const key = `project_${projectId}`;
    if (!this.listeners[key]) this.listeners[key] = new Set();
    this.listeners[key].add(callback);
    callback(this.projects.find(p => p.id === projectId));
    return () => { this.listeners[key].delete(callback); };
  }

  async login(email: string, role: 'student' | 'admin' | 'faculty'): Promise<User> {
    if (!email.endsWith('@mvgrce.edu.in')) {
      throw new Error('Only @mvgrce.edu.in emails are allowed');
    }
    let user = this.users.find(u => u.email === email);
    if (!user) {
      user = {
        uid: Math.random().toString(36).substr(2, 9),
        email,
        displayName: email.split('@')[0],
        role,
        joinedClubs: [],
        interests: [],
        skills: [],
        achievements: [],
        badges: [],
        points: 0,
        isVerified: false
      };
      this.users.push(user);
    }
    this.currentUser = user;
    this.save();
    return user;
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  logout() {
    this.currentUser = null;
    this.save();
  }

  async getUserById(uid: string): Promise<User | undefined> {
    return this.users.find(u => u.uid === uid);
  }

  async getUsers(limitCount: number = 50): Promise<User[]> {
    return this.users.slice(0, limitCount);
  }

  async getNotifications(userUid: string): Promise<AppNotification[]> {
    return this.notifications.filter(n => n.userUid === userUid).sort((a, b) => b.timestamp - a.timestamp);
  }

  async markNotificationsAsRead(userUid: string) {
    this.notifications.filter(n => n.userUid === userUid).forEach(n => n.isRead = true);
    this.save();
  }

  async getClubs(): Promise<Club[]> {
    return this.clubs || [];
  }

  async getClubById(id: string): Promise<Club | undefined> {
    return this.clubs.find(c => c.id === id);
  }

  async createClub(data: Partial<Club>, adminUid: string): Promise<Club> {
    const newClub: Club = {
      id: Math.random().toString(36).substr(2, 9),
      name: data.name || 'Untitled Club',
      description: data.description || '',
      adminUid,
      members: [adminUid],
      pendingRequests: [],
      category: data.category || 'General',
      logoUrl: data.logoUrl || `https://picsum.photos/seed/${data.name}/200`,
      status: 'approved',
      memberRoles: { [adminUid]: 'Founder' }
    };
    this.clubs.push(newClub);
    
    this.channels.push({
      id: Math.random().toString(36).substr(2, 9),
      clubId: newClub.id,
      name: 'lounge'
    });

    this.save();
    return newClub;
  }

  async updateClub(id: string, data: Partial<Club>) {
    const idx = this.clubs.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.clubs[idx] = { ...this.clubs[idx], ...data };
      this.save();
      this.notify(`club_${id}`, this.clubs[idx]);
    }
  }

  async requestToJoinClub(clubId: string, userUid: string) {
    const club = this.clubs.find(c => c.id === clubId);
    if (club) {
      if (!club.pendingRequests) club.pendingRequests = [];
      if (!club.pendingRequests.includes(userUid) && !club.members.includes(userUid)) {
        club.pendingRequests.push(userUid);
        this.save();
        this.notify(`club_${clubId}`, club);
      }
    }
  }

  async approveJoinRequest(clubId: string, userUid: string) {
    const club = this.clubs.find(c => c.id === clubId);
    if (club) {
      club.pendingRequests = (club.pendingRequests || []).filter(uid => uid !== userUid);
      if (!club.members) club.members = [];
      if (!club.members.includes(userUid)) club.members.push(userUid);
      
      const user = this.users.find(u => u.uid === userUid);
      if (user) {
        if (!user.joinedClubs) user.joinedClubs = [];
        if (!user.joinedClubs.includes(clubId)) user.joinedClubs.push(clubId);
      }
      
      this.save();
      this.notify(`club_${clubId}`, club);
    }
  }

  async rejectJoinRequest(clubId: string, userUid: string) {
    const club = this.clubs.find(c => c.id === clubId);
    if (club) {
      club.pendingRequests = (club.pendingRequests || []).filter(uid => uid !== userUid);
      this.save();
      this.notify(`club_${clubId}`, club);
    }
  }

  async removeMember(clubId: string, userUid: string) {
    const club = this.clubs.find(c => c.id === clubId);
    if (club) {
      club.members = (club.members || []).filter(uid => uid !== userUid);
      if (club.memberRoles) delete club.memberRoles[userUid];
      
      const user = this.users.find(u => u.uid === userUid);
      if (user) {
        user.joinedClubs = (user.joinedClubs || []).filter(id => id !== clubId);
      }
      
      this.save();
      this.notify(`club_${clubId}`, club);
    }
  }

  async assignClubRole(clubId: string, userUid: string, role: string) {
    const club = this.clubs.find(c => c.id === clubId);
    if (club) {
      if (!club.memberRoles) club.memberRoles = {};
      club.memberRoles[userUid] = role;
      this.save();
      this.notify(`club_${clubId}`, club);
    }
  }

  async awardBadge(userUid: string, badgeId: string) {
    const user = this.users.find(u => u.uid === userUid);
    if (user && !user.badges.includes(badgeId)) {
      user.badges.push(badgeId);
      this.save();
    }
  }

  async getEvents(): Promise<CollegeEvent[]> {
    return (this.events || []).filter(e => e.status === 'approved');
  }

  async getPendingEvents(clubId: string): Promise<CollegeEvent[]> {
    return (this.events || []).filter(e => e.clubId === clubId && e.status === 'pending');
  }

  async proposeEvent(event: Partial<CollegeEvent>) {
    const newEvent: CollegeEvent = {
      id: Math.random().toString(36).substr(2, 9),
      clubId: event.clubId || '',
      title: event.title || 'Untitled Proposal',
      description: event.description || '',
      date: event.date || '',
      location: event.location || '',
      type: event.type || 'Workshop',
      status: 'pending',
      summary: '',
      proposedByUid: event.proposedByUid,
      proposerName: event.proposerName
    };
    this.events.push(newEvent);
    this.save();
  }

  async approveEvent(eventId: string, summary: string) {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.status = 'approved';
      event.summary = summary;
      this.save();
    }
  }

  async rejectEvent(eventId: string) {
    const event = this.events.find(e => e.id === eventId);
    if (event) {
      event.status = 'rejected';
      this.save();
    }
  }

  async getPosts(clubId?: string): Promise<Post[]> {
    if (clubId) return (this.posts || []).filter(p => p.clubId === clubId);
    return this.posts || [];
  }

  async addPost(post: Partial<Post>) {
    const newPost: Post = {
      id: Math.random().toString(36).substr(2, 9),
      clubId: post.clubId || '',
      clubName: post.clubName || '',
      authorName: post.authorName || '',
      content: post.content || '',
      mediaUrl: post.mediaUrl,
      mediaType: post.mediaType,
      fileName: post.fileName,
      timestamp: Date.now(),
      comments: [],
      likes: []
    };
    this.posts.push(newPost);
    this.save();
  }

  async toggleLikePost(postId: string, userUid: string) {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      if (!post.likes) post.likes = [];
      if (post.likes.includes(userUid)) {
        post.likes = post.likes.filter(uid => uid !== userUid);
      } else {
        post.likes.push(userUid);
      }
      this.save();
    }
  }

  async addComment(postId: string, comment: Partial<Comment>) {
    const post = this.posts.find(p => p.id === postId);
    if (post) {
      const newComment: Comment = {
        id: Math.random().toString(36).substr(2, 9),
        userUid: comment.userUid || '',
        userName: comment.userName || '',
        text: comment.text || '',
        timestamp: Date.now()
      };
      post.comments.push(newComment);
      this.save();
    }
  }

  async sendMessage(msg: Partial<ChatMessage>) {
    const newMsg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      clubId: msg.clubId || '',
      channelId: msg.channelId || '',
      senderUid: msg.senderUid || '',
      senderName: msg.senderName || '',
      text: msg.text || '',
      timestamp: Date.now()
    };
    this.messages.push(newMsg);
    this.save();
    this.notify(`messages_${newMsg.clubId}_${newMsg.channelId}`, this.messages.filter(m => m.clubId === newMsg.clubId && m.channelId === newMsg.channelId));
  }

  async createChannel(containerId: string, name: string) {
    const newChannel: ChatChannel = {
      id: Math.random().toString(36).substr(2, 9),
      clubId: containerId,
      name
    };
    this.channels.push(newChannel);
    this.save();
    this.notify(`channels_${containerId}`, this.channels.filter(c => c.clubId === containerId));
    return newChannel;
  }

  async deleteChannel(channelId: string) {
    const channel = this.channels.find(c => c.id === channelId);
    if (channel) {
      const containerId = channel.clubId;
      this.channels = this.channels.filter(c => c.id !== channelId);
      this.save();
      this.notify(`channels_${containerId}`, this.channels.filter(c => c.clubId === containerId));
    }
  }

  async getProjects(): Promise<Project[]> {
    return this.projects || [];
  }

  async createProject(data: Partial<Project>) {
    const projectId = Math.random().toString(36).substr(2, 9);
    const newProject: Project = {
      id: projectId,
      title: data.title || '',
      description: data.description || '',
      ownerUid: data.ownerUid || '',
      ownerName: data.ownerName || '',
      status: 'recruiting',
      requiredSkills: data.requiredSkills || [],
      members: [data.ownerUid || ''],
      pendingApplicants: [],
      tags: data.tags || [],
      memberRoles: { [data.ownerUid || '']: 'Mission Lead' }
    };
    this.projects.push(newProject);
    
    // Auto-provision tactical channels
    const defaultChannels = ['coordination', 'technical-specs', 'intel-sharing'];
    defaultChannels.forEach(name => {
      this.channels.push({
        id: Math.random().toString(36).substr(2, 9),
        clubId: projectId,
        name
      });
    });

    this.save();
    return newProject;
  }

  async updateProjectStatus(projectId: string, status: Project['status']) {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      project.status = status;
      this.save();
      this.notify(`project_${projectId}`, project);
    }
  }

  async assignProjectRole(projectId: string, userUid: string, role: string) {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      if (!project.memberRoles) project.memberRoles = {};
      project.memberRoles[userUid] = role;
      this.save();
      this.notify(`project_${projectId}`, project);
    }
  }

  async applyToProject(projectId: string, userUid: string) {
    const project = this.projects.find(p => p.id === projectId);
    if (project && !project.members.includes(userUid) && !project.pendingApplicants.includes(userUid)) {
      project.pendingApplicants.push(userUid);
      this.save();
      this.notify(`project_${projectId}`, project);
    }
  }

  async approveProjectApplicant(projectId: string, userUid: string) {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      project.pendingApplicants = (project.pendingApplicants || []).filter(id => id !== userUid);
      if (!project.members.includes(userUid)) {
        project.members.push(userUid);
      }
      this.save();
      this.notify(`project_${projectId}`, project);
    }
  }

  async rejectProjectApplicant(projectId: string, userUid: string) {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      project.pendingApplicants = (project.pendingApplicants || []).filter(id => id !== userUid);
      this.save();
      this.notify(`project_${projectId}`, project);
    }
  }

  async removeProjectMember(projectId: string, userUid: string) {
    const project = this.projects.find(p => p.id === projectId);
    if (project) {
      project.members = (project.members || []).filter(uid => uid !== userUid);
      if (project.memberRoles) delete project.memberRoles[userUid];
      this.save();
      this.notify(`project_${projectId}`, project);
    }
  }

  async getMentors(): Promise<User[]> {
    return this.users.filter(u => u.points > 300 || u.role === 'admin');
  }

  async requestMentorship(data: any) {
    this.save();
  }

  async getConversations(userUid: string) {
    const dmIds = new Set(this.messages.filter(m => m.clubId === 'direct' && m.channelId.includes(userUid)).map(m => m.channelId.split('_').find(id => id !== userUid)));
    return Promise.all(Array.from(dmIds).map(uid => this.getUserById(uid || '')));
  }

  getDMChannelId(uid1: string, uid2: string) {
    return [uid1, uid2].sort().join('_');
  }

  onDirectMessages(channelId: string, callback: (msgs: ChatMessage[]) => void) {
    const key = `messages_direct_${channelId}`;
    if (!this.listeners[key]) this.listeners[key] = new Set();
    this.listeners[key].add(callback);
    callback(this.messages.filter(m => m.clubId === 'direct' && m.channelId === channelId));
    return () => { this.listeners[key].delete(callback); };
  }

  async sendDirectMessage(sender: User, recipientUid: string, text: string) {
    const channelId = this.getDMChannelId(sender.uid, recipientUid);
    const msg: ChatMessage = {
      id: Math.random().toString(36).substr(2, 9),
      clubId: 'direct',
      channelId,
      senderUid: sender.uid,
      senderName: sender.displayName,
      text,
      timestamp: Date.now()
    };
    this.messages.push(msg);
    this.save();
    this.notify(`messages_direct_${channelId}`, this.messages.filter(m => m.clubId === 'direct' && m.channelId === channelId));
  }

  async getLeaderboard(): Promise<User[]> {
    return [...this.users].sort((a, b) => b.points - a.points);
  }

  async getBadgeDefinitions(): Promise<Badge[]> {
    return BADGE_DEFINITIONS;
  }

  async getRecentAchievements(): Promise<any[]> {
    return [];
  }
}

export const firebase = new MockFirebase();
