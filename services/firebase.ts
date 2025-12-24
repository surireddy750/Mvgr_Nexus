
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  orderBy, 
  serverTimestamp,
  increment,
  getDocs,
  deleteDoc,
  limit,
  deleteField
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js';
import { 
  User, 
  Club, 
  Post, 
  CollegeEvent, 
  ChatMessage, 
  Comment, 
  AppNotification, 
  ChatChannel, 
  Project,
  MentorshipSession,
  Badge
} from '../types';

/**
 * MVGR NEXUS Production Firebase Configuration
 */
const firebaseConfig = {
  apiKey: "AIzaSyAXwyHpdXH8cZSzuBB9IJQlFsTilcJMjFQ",
  authDomain: "mvgrnexus.firebaseapp.com",
  projectId: "mvgrnexus",
  storageBucket: "mvgrnexus.firebasestorage.app",
  messagingSenderId: "498740087022",
  appId: "1:498740087022:web:60b3f5dfd789cd1856cbff",
  measurementId: "G-N06HENB0RM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

class FirebaseService {
  // --- AUTH ---
  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          callback(userDoc.data() as User);
        } else {
          const newUser: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.email?.split('@')[0] || 'User',
            role: 'student',
            joinedClubs: [],
            interests: [],
            skills: [],
            achievements: [],
            badges: [],
            points: 0,
            isVerified: false
          };
          callback(newUser);
        }
      } else {
        callback(null);
      }
    });
  }

  async login(email: string, role: 'student' | 'admin' | 'faculty'): Promise<User> {
    const tempPass = "MVGR_NEXUS_DEFAULT_PASS"; 
    let firebaseUser;
    
    try {
      const res = await signInWithEmailAndPassword(auth, email, tempPass);
      firebaseUser = res.user;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials' || err.code === 'auth/auth-not-found') {
        const res = await createUserWithEmailAndPassword(auth, email, tempPass);
        firebaseUser = res.user;
      } else {
        throw err;
      }
    }

    const userRef = doc(db, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      const newUser: User = {
        uid: firebaseUser.uid,
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
      await setDoc(userRef, newUser);
      return newUser;
    }
    return userSnap.data() as User;
  }

  async logout() { await signOut(auth); }

  async getUserById(uid: string): Promise<User | undefined> {
    const docSnap = await getDoc(doc(db, 'users', uid));
    return docSnap.exists() ? docSnap.data() as User : undefined;
  }

  async getUsers(limitCount: number = 50): Promise<User[]> {
    const q = query(collection(db, 'users'), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as User);
  }

  // --- NOTIFICATIONS ---
  async getNotifications(userUid: string): Promise<AppNotification[]> {
    const q = query(collection(db, 'notifications'), where('userUid', '==', userUid), orderBy('timestamp', 'desc'), limit(50));
    try {
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as AppNotification));
    } catch (e) {
      return [];
    }
  }

  async markNotificationsAsRead(userUid: string) {
    const q = query(collection(db, 'notifications'), where('userUid', '==', userUid), where('isRead', '==', false));
    const snap = await getDocs(q);
    const updates = snap.docs.map(d => updateDoc(d.ref, { isRead: true }));
    await Promise.all(updates);
  }

  async createNotification(notif: Partial<AppNotification>) {
    await addDoc(collection(db, 'notifications'), {
      ...notif,
      timestamp: Date.now(),
      isRead: false
    });
  }

  // --- CLUBS ---
  async getClubs(): Promise<Club[]> {
    const snap = await getDocs(collection(db, 'clubs'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Club));
  }

  async getClubById(id: string): Promise<Club | undefined> {
    const docSnap = await getDoc(doc(db, 'clubs', id));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Club : undefined;
  }

  onClub(clubId: string, callback: (club: Club | undefined) => void) {
    return onSnapshot(doc(db, 'clubs', clubId), (doc) => {
      callback(doc.exists() ? { id: doc.id, ...doc.data() } as Club : undefined);
    });
  }

  async createClub(data: Partial<Club>, adminUid: string): Promise<Club> {
    const docRef = await addDoc(collection(db, 'clubs'), {
      ...data,
      adminUid,
      members: [adminUid],
      pendingRequests: [],
      status: 'approved',
      memberRoles: { [adminUid]: 'Founder' },
      createdAt: serverTimestamp()
    });
    
    // Create initial lounge channel
    await addDoc(collection(db, 'channels'), {
      clubId: docRef.id,
      name: 'lounge'
    });

    return { id: docRef.id, ...data, adminUid, members: [adminUid], status: 'approved' } as Club;
  }

  async updateClub(id: string, data: Partial<Club>) {
    const clubRef = doc(db, 'clubs', id);
    await updateDoc(clubRef, data);
  }

  async requestToJoinClub(clubId: string, userUid: string) {
    const clubRef = doc(db, 'clubs', clubId);
    await updateDoc(clubRef, {
      pendingRequests: arrayUnion(userUid)
    });
    
    const club = await this.getClubById(clubId);
    if (club) {
      await this.createNotification({
        userUid: club.adminUid,
        title: 'New Join Request',
        message: `A student has requested to join ${club.name}`,
        type: 'request'
      });
    }
  }

  async approveJoinRequest(clubId: string, userUid: string) {
    const clubRef = doc(db, 'clubs', clubId);
    await updateDoc(clubRef, {
      pendingRequests: arrayRemove(userUid),
      members: arrayUnion(userUid)
    });
    await updateDoc(doc(db, 'users', userUid), {
      joinedClubs: arrayUnion(clubId)
    });
    await this.createNotification({
      userUid,
      title: 'Club Admittance',
      message: 'Your request to join the club has been approved.',
      type: 'approval'
    });
  }

  async rejectJoinRequest(clubId: string, userUid: string) {
    const clubRef = doc(db, 'clubs', clubId);
    await updateDoc(clubRef, {
      pendingRequests: arrayRemove(userUid)
    });
  }

  async removeMember(clubId: string, userUid: string) {
    const clubRef = doc(db, 'clubs', clubId);
    const userRef = doc(db, 'users', userUid);
    
    await Promise.all([
      updateDoc(clubRef, {
        members: arrayRemove(userUid),
        [`memberRoles.${userUid}`]: deleteField()
      }),
      updateDoc(userRef, {
        joinedClubs: arrayRemove(clubId)
      })
    ]);
    
    const club = await this.getClubById(clubId);
    await this.createNotification({
      userUid,
      title: 'Membership Terminated',
      message: `Your operative status in ${club?.name || 'the organization'} has been revoked by leadership.`,
      type: 'rejection'
    });
  }

  async assignClubRole(clubId: string, userUid: string, role: string) {
    const clubRef = doc(db, 'clubs', clubId);
    await updateDoc(clubRef, {
      [`memberRoles.${userUid}`]: role
    });
    await this.createNotification({
      userUid,
      title: 'Role Reassigned',
      message: `Your new status in the organization has been updated to: ${role}`,
      type: 'role_assigned'
    });
  }

  // --- EVENTS ---
  async getEvents(): Promise<CollegeEvent[]> {
    const q = query(collection(db, 'events'), where('status', '==', 'approved'), orderBy('date', 'asc'));
    try {
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as CollegeEvent));
    } catch (e) {
      const snap = await getDocs(collection(db, 'events'));
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as CollegeEvent)).filter(ev => ev.status === 'approved');
    }
  }

  async getPendingEvents(clubId: string): Promise<CollegeEvent[]> {
    const q = query(
      collection(db, 'events'), 
      where('clubId', '==', clubId), 
      where('status', '==', 'pending')
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as CollegeEvent));
  }

  async proposeEvent(event: Partial<CollegeEvent>) {
    await addDoc(collection(db, 'events'), {
      ...event,
      status: 'pending',
      summary: '',
      createdAt: serverTimestamp()
    });
  }

  async approveEvent(eventId: string, summary: string) {
    await updateDoc(doc(db, 'events', eventId), {
      status: 'approved',
      summary: summary
    });
  }

  async rejectEvent(eventId: string): Promise<void> {
    await updateDoc(doc(db, 'events', eventId), {
      status: 'rejected'
    });
  }

  // --- POSTS ---
  async getPosts(clubId?: string): Promise<Post[]> {
    let q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    if (clubId) q = query(q, where('clubId', '==', clubId));
    try {
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
    } catch (e) {
       const snap = await getDocs(collection(db, 'posts'));
       let results = snap.docs.map(d => ({ id: d.id, ...d.data() } as Post));
       if (clubId) results = results.filter(p => p.clubId === clubId);
       return results.sort((a,b) => b.timestamp - a.timestamp);
    }
  }

  async addPost(post: Partial<Post>) {
    await addDoc(collection(db, 'posts'), {
      ...post,
      timestamp: Date.now(),
      likes: [],
      comments: []
    });
  }

  async addComment(postId: string, comment: Partial<Comment>) {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      comments: arrayUnion({
        ...comment,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now()
      })
    });
  }

  async toggleLikePost(postId: string, userUid: string) {
    const postRef = doc(db, 'posts', postId);
    const snap = await getDoc(postRef);
    if (snap.exists()) {
      const likes = snap.data().likes || [];
      if (likes.includes(userUid)) {
        await updateDoc(postRef, { likes: arrayRemove(userUid) });
      } else {
        await updateDoc(postRef, { likes: arrayUnion(userUid) });
      }
    }
  }

  // --- MESSAGING ---
  onChannels(containerId: string, callback: (channels: ChatChannel[]) => void) {
    const q = query(collection(db, 'channels'), where('clubId', '==', containerId));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatChannel)));
    });
  }

  onMessages(containerId: string, channelId: string, callback: (msgs: ChatMessage[]) => void) {
    const q = query(
      collection(db, 'messages'), 
      where('clubId', '==', containerId), 
      where('channelId', '==', channelId), 
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
  }

  async sendMessage(msg: Partial<ChatMessage>) {
    await addDoc(collection(db, 'messages'), {
      ...msg,
      timestamp: Date.now()
    });
  }

  async createChannel(containerId: string, name: string) {
    const docRef = await addDoc(collection(db, 'channels'), {
      clubId: containerId,
      name
    });
    return { id: docRef.id, clubId: containerId, name } as ChatChannel;
  }

  async deleteChannel(channelId: string) {
    await deleteDoc(doc(db, 'channels', channelId));
  }

  // --- DIRECT MESSAGES ---
  getDMChannelId(uid1: string, uid2: string) {
    return [uid1, uid2].sort().join('_');
  }

  onDirectMessages(channelId: string, callback: (msgs: ChatMessage[]) => void) {
    const q = query(
      collection(db, 'messages'), 
      where('clubId', '==', 'direct'), 
      where('channelId', '==', channelId), 
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
    });
  }

  async sendDirectMessage(sender: User, recipientUid: string, text: string) {
    const channelId = this.getDMChannelId(sender.uid, recipientUid);
    await addDoc(collection(db, 'messages'), {
      clubId: 'direct',
      channelId,
      senderUid: sender.uid,
      senderName: sender.displayName,
      text,
      timestamp: Date.now()
    });
  }

  async getConversations(userUid: string): Promise<User[]> {
    const q = query(collection(db, 'messages'), where('clubId', '==', 'direct'));
    const snap = await getDocs(q);
    const uids = new Set<string>();
    snap.docs.forEach(d => {
      const parts = d.data().channelId.split('_');
      if (parts.includes(userUid)) {
        const otherId = parts.find((id: string) => id !== userUid);
        if (otherId) uids.add(otherId);
      }
    });
    const users = await Promise.all(Array.from(uids).map(id => this.getUserById(id)));
    return users.filter((u): u is User => !!u);
  }

  // --- GAMIFICATION & POINTS ---
  async awardPoints(userUid: string, amount: number, reason: string) {
    const userRef = doc(db, 'users', userUid);
    await updateDoc(userRef, {
      points: increment(amount),
      achievements: arrayUnion({
        id: Math.random().toString(36).substr(2, 9),
        title: reason,
        date: Date.now(),
        type: 'skill',
        description: reason
      })
    });
  }

  async getLeaderboard(): Promise<User[]> {
    const q = query(collection(db, 'users'), orderBy('points', 'desc'), limit(50));
    try {
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as User);
    } catch (e) {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => d.data() as User).sort((a,b) => b.points - a.points);
    }
  }

  async getBadgeDefinitions(): Promise<Badge[]> {
    const snap = await getDocs(collection(db, 'badge_definitions'));
    if (snap.empty) {
       return [
        { id: 'b1', name: 'Nexus Pioneer', description: 'Early adopter of the MVGR Nexus hub.', icon: 'Zap', color: 'indigo', category: 'milestone' },
        { id: 'b2', name: 'Code Maestro', description: 'Validated expertise in programming languages.', icon: 'Terminal', color: 'emerald', category: 'skill' },
       ] as Badge[];
    }
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Badge));
  }

  async getRecentAchievements(): Promise<any[]> {
    const q = query(collection(db, 'users'), limit(10));
    const snap = await getDocs(q);
    const achievements: any[] = [];
    snap.docs.forEach(d => {
      const u = d.data() as User;
      if (u.achievements && u.achievements.length > 0) {
        achievements.push({
          userName: u.displayName,
          achievement: u.achievements[u.achievements.length - 1].title
        });
      }
    });
    return achievements;
  }

  // --- STORAGE ---
  async uploadMedia(file: File): Promise<string> {
    const storageRef = ref(storage, `nexus/${Date.now()}_${file.name}`);
    const snap = await uploadBytes(storageRef, file);
    return await getDownloadURL(snap.ref);
  }

  // --- PROJECTS ---
  onProject(projectId: string, callback: (project: Project | undefined) => void) {
    return onSnapshot(doc(db, 'projects', projectId), (doc) => {
      callback(doc.exists() ? { id: doc.id, ...doc.data() } as Project : undefined);
    });
  }

  async getProjects(): Promise<Project[]> {
    const snap = await getDocs(collection(db, 'projects'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Project));
  }

  async createProject(data: Partial<Project>) {
    const docRef = await addDoc(collection(db, 'projects'), {
      ...data,
      status: 'recruiting',
      members: [data.ownerUid],
      pendingApplicants: [],
      memberRoles: { [data.ownerUid!]: 'Mission Lead' },
      createdAt: serverTimestamp()
    });
    
    // Auto-provision tactical channels
    const defaultChannels = ['coordination', 'intel-sharing'];
    for (const name of defaultChannels) {
      await addDoc(collection(db, 'channels'), {
        clubId: docRef.id,
        name
      });
    }

    return { id: docRef.id, ...data } as Project;
  }

  async updateProjectStatus(projectId: string, status: Project['status']) {
    await updateDoc(doc(db, 'projects', projectId), { status });
  }

  async assignProjectRole(projectId: string, userUid: string, role: string) {
    const projRef = doc(db, 'projects', projectId);
    await updateDoc(projRef, {
      [`memberRoles.${userUid}`]: role
    });
  }

  async applyToProject(projectId: string, userUid: string) {
    const projRef = doc(db, 'projects', projectId);
    await updateDoc(projRef, {
      pendingApplicants: arrayUnion(userUid)
    });
  }

  async approveProjectApplicant(projectId: string, userUid: string) {
    const projRef = doc(db, 'projects', projectId);
    await updateDoc(projRef, {
      pendingApplicants: arrayRemove(userUid),
      members: arrayUnion(userUid)
    });
  }

  async rejectProjectApplicant(projectId: string, userUid: string) {
    const projRef = doc(db, 'projects', projectId);
    await updateDoc(projRef, {
      pendingApplicants: arrayRemove(userUid)
    });
  }

  async removeProjectMember(projectId: string, userUid: string) {
    const projRef = doc(db, 'projects', projectId);
    await updateDoc(projRef, {
      members: arrayRemove(userUid),
      [`memberRoles.${userUid}`]: deleteField()
    });
    
    await this.createNotification({
      userUid,
      title: 'Project Deauthorization',
      message: `You have been removed from the project mission team.`,
      type: 'rejection'
    });
  }

  // --- MENTORSHIP ---
  async getMentors(): Promise<User[]> {
    const q = query(collection(db, 'users'), where('points', '>=', 300));
    try {
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data() as User);
    } catch (e) {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map(d => d.data() as User).filter(u => u.points >= 300);
    }
  }

  async requestMentorship(data: any) {
    await addDoc(collection(db, 'mentorships'), {
      ...data,
      status: 'pending',
      timestamp: Date.now()
    });
    await this.createNotification({
      userUid: data.mentorUid,
      title: 'Mentorship Request',
      message: 'A student is seeking your guidance.',
      type: 'mentorship'
    });
  }
}

export const firebase = new FirebaseService();
