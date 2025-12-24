
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { firebase } from '../services/firebase';
import { geminiService } from '../services/gemini';
import { User, Club, CollegeEvent } from '../types';
import { 
  Check, 
  X,
  Sparkles,
  Loader2,
  Settings,
  ShieldCheck,
  Calendar,
  AlertCircle,
  Plus,
  Rocket,
  Users,
  ChevronRight,
  LayoutGrid,
  Info,
  Send,
  Image as ImageIcon,
  Film,
  Paperclip,
  Trash2,
  FileText,
  UserPlus,
  UserCheck,
  UserX,
  Mail,
  Zap,
  ShieldAlert,
  ShieldOff,
  Edit,
  CheckCircle2,
  Search,
  Video,
  Camera,
  Upload,
  UserMinus
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface AdminDashboardProps { user: User; }

type DashboardTab = 'broadcast' | 'events' | 'members';

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [managedClubs, setManagedClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);
  const [pendingProposals, setPendingProposals] = useState<CollegeEvent[]>([]);
  const [pendingMembers, setPendingMembers] = useState<User[]>([]);
  const [activeMembers, setActiveMembers] = useState<User[]>([]);
  const [isSummarizing, setIsSummarizing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>('broadcast');
  
  // Personnel search state
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Role assignment state
  const [editingMemberUid, setEditingMemberUid] = useState<string | null>(null);
  const [roleInput, setRoleInput] = useState('');

  // Post Creation State
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'file' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Event Creation State
  const [showEventModal, setShowEventModal] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventVideoFile, setEventVideoFile] = useState<File | null>(null);
  const [eventVideoPreview, setEventVideoPreview] = useState<string | null>(null);
  const [eventUploadProgress, setEventUploadProgress] = useState(0);
  const eventVideoInputRef = useRef<HTMLInputElement>(null);
  const [newEventData, setNewEventData] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    type: 'Workshop' as CollegeEvent['type']
  });

  // Create Club State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [clubLogoFile, setClubLogoFile] = useState<File | null>(null);
  const [clubLogoPreview, setClubLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [newClubData, setNewClubData] = useState({
    name: '',
    category: 'Technology',
    description: ''
  });

  // Edit Club State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editClubData, setEditClubData] = useState<Partial<Club>>({});
  const [isUpdatingClub, setIsUpdatingClub] = useState(false);
  const [editLogoFile, setEditLogoFile] = useState<File | null>(null);
  const [editLogoPreview, setEditLogoPreview] = useState<string | null>(null);
  const editLogoInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const allClubs = await firebase.getClubs();
      // System admins see all clubs, founders see only theirs
      const myClubs = user.role === 'admin' 
        ? allClubs 
        : allClubs.filter(c => c.adminUid === user.uid);
      
      setManagedClubs(myClubs);
      
      if (myClubs.length > 0) {
        const active = selectedClub ? myClubs.find(c => c.id === selectedClub.id) || myClubs[0] : myClubs[0];
        setSelectedClub(active);
        
        const [proposals, pendingData, activeData] = await Promise.all([
          firebase.getPendingEvents(active.id),
          Promise.all((active.pendingRequests || []).map(uid => firebase.getUserById(uid))),
          Promise.all((active.members || []).map(uid => firebase.getUserById(uid)))
        ]);
        
        setPendingProposals(proposals);
        setPendingMembers(pendingData.filter((u): u is User => !!u));
        setActiveMembers(activeData.filter((u): u is User => !!u));
      }
    } catch (e) {
      console.error("Load failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user.uid]);

  const handleSelectClub = async (club: Club) => {
    setSelectedClub(club);
    setLoading(true);
    const [proposals, pendingData, activeData] = await Promise.all([
      firebase.getPendingEvents(club.id),
      Promise.all((club.pendingRequests || []).map(uid => firebase.getUserById(uid))),
      Promise.all((club.members || []).map(uid => firebase.getUserById(uid)))
    ]);
    setPendingProposals(proposals);
    setPendingMembers(pendingData.filter((u): u is User => !!u));
    setActiveMembers(activeData.filter((u): u is User => !!u));
    setLoading(false);
    // Clear local tab state
    setPostContent('');
    setSelectedFile(null);
    setFilePreview(null);
    setEditingMemberUid(null);
    setMemberSearchQuery('');
  };

  const filteredActiveMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return activeMembers;
    const query = memberSearchQuery.toLowerCase();
    return activeMembers.filter(m => 
      m.displayName.toLowerCase().includes(query) || 
      m.email.toLowerCase().includes(query)
    );
  }, [activeMembers, memberSearchQuery]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
    setFileType(type);

    if (type === 'image' || type === 'video') {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleEventVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEventVideoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setEventVideoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleClubLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setClubLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setClubLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleEditLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setEditLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreatePost = async () => {
    if (!selectedClub || (!postContent.trim() && !selectedFile)) return;

    setIsPosting(true);
    setUploadProgress(10); 
    try {
      let mediaUrl = '';
      let fileName = '';

      if (selectedFile) {
        setUploadProgress(30);
        mediaUrl = await firebase.uploadMedia(selectedFile);
        fileName = selectedFile.name;
        setUploadProgress(70);
      }

      await firebase.addPost({
        clubId: selectedClub.id,
        clubName: selectedClub.name,
        authorName: user.displayName,
        content: postContent,
        mediaUrl: mediaUrl || undefined,
        mediaType: fileType || undefined,
        fileName: fileName || undefined
      });

      await firebase.awardPoints(user.uid, 20, `Broadcasted update to ${selectedClub.name}`);
      
      setPostContent('');
      setSelectedFile(null);
      setFilePreview(null);
      setFileType(null);
      setUploadProgress(100);
      setTimeout(() => setUploadProgress(0), 1000);
      alert('Transmission successful.');
    } catch (error) {
      alert('Transmission failed.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub) return;
    setIsCreatingEvent(true);
    setEventUploadProgress(10);
    try {
      let videoUrl = '';
      if (eventVideoFile) {
        setEventUploadProgress(40);
        videoUrl = await firebase.uploadMedia(eventVideoFile);
        setEventUploadProgress(80);
      }

      await firebase.proposeEvent({
        ...newEventData,
        clubId: selectedClub.id,
        proposedByUid: user.uid,
        proposerName: user.displayName,
        videoUrl: videoUrl || undefined
      });

      setEventUploadProgress(100);
      setShowEventModal(false);
      setNewEventData({ title: '', description: '', date: '', location: '', type: 'Workshop' });
      setEventVideoFile(null);
      setEventVideoPreview(null);
      await loadData();
      alert('Mission proposal logged in the queue.');
    } catch (error) {
      alert('Mission logging failed.');
    } finally {
      setIsCreatingEvent(false);
      setEventUploadProgress(0);
    }
  };

  const handleApproveMember = async (applicantUid: string) => {
    if (!selectedClub) return;
    try {
      await firebase.approveJoinRequest(selectedClub.id, applicantUid);
      await loadData();
    } catch (e) {
      alert('Failed to approve member.');
    }
  };

  const handleRejectMember = async (applicantUid: string) => {
    if (!selectedClub) return;
    try {
      await firebase.rejectJoinRequest(selectedClub.id, applicantUid);
      await loadData();
    } catch (e) {
      alert('Failed to reject member.');
    }
  };

  const handleRemoveMember = async (memberUid: string) => {
    if (!selectedClub) return;
    
    // Founders cannot be removed by this UI
    if (memberUid === selectedClub.adminUid) {
      alert("Mission Foundations are locked. Founders cannot be deauthorized via this protocol.");
      return;
    }
    
    if (!window.confirm(`SECURITY ALERT: You are about to revoke the operative clearance for this member from ${selectedClub.name}. This action is immediate. Proceed?`)) return;
    
    try {
      await firebase.removeMember(selectedClub.id, memberUid);
      // Immediately refresh the view
      await loadData();
    } catch (e) {
      alert('Member removal protocol failed.');
    }
  };

  const handleAssignRole = async (memberUid: string) => {
    if (!selectedClub || !roleInput.trim()) return;
    try {
      await firebase.assignClubRole(selectedClub.id, memberUid, roleInput);
      setEditingMemberUid(null);
      await loadData();
    } catch (e) {
      alert('Role assignment failed.');
    }
  };

  const handleCreateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      let logoUrl = `https://picsum.photos/seed/${newClubData.name}/400`;
      if (clubLogoFile) {
        logoUrl = await firebase.uploadMedia(clubLogoFile);
      }

      await firebase.createClub({
        ...newClubData,
        logoUrl,
      }, user.uid);
      
      await firebase.awardPoints(user.uid, 200, `Established new organization: ${newClubData.name}`);
      setShowCreateModal(false);
      setNewClubData({ name: '', category: 'Technology', description: '' });
      setClubLogoFile(null);
      setClubLogoPreview(null);
      await loadData();
      alert('Organization established.');
    } catch (error) {
      alert('Failed to establish organization.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateClub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClub) return;
    setIsUpdatingClub(true);
    try {
      let logoUrl = editClubData.logoUrl;
      if (editLogoFile) {
        logoUrl = await firebase.uploadMedia(editLogoFile);
      }

      await firebase.updateClub(selectedClub.id, {
        ...editClubData,
        logoUrl
      });
      
      setShowEditModal(false);
      setEditLogoFile(null);
      setEditLogoPreview(null);
      await loadData();
      alert('Collective protocol updated.');
    } catch (error) {
      alert('Failed to update collective.');
    } finally {
      setIsUpdatingClub(false);
    }
  };

  const handleApproveEvent = async (proposal: CollegeEvent) => {
    setIsSummarizing(proposal.id);
    try {
      const summary = await geminiService.summarizeEvent(proposal);
      await firebase.approveEvent(proposal.id, summary);
      if (proposal.proposedByUid) {
        await firebase.awardPoints(proposal.proposedByUid, 100, `Event proposal approved: ${proposal.title}`);
      }
      await loadData();
    } catch (error) {
      alert('Protocol error during summarization.');
    } finally {
      setIsSummarizing(null);
    }
  };

  if (loading && managedClubs.length === 0) return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="animate-spin text-indigo-600" size={48} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" />

      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 flex items-center italic tracking-tight">
                <Rocket className="mr-3 text-indigo-600" /> Establish New Org
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateClub} className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <input type="file" ref={logoInputRef} className="hidden" onChange={handleClubLogoChange} accept="image/*" />
                <div 
                  onClick={() => logoInputRef.current?.click()}
                  className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-indigo-600 group transition-all overflow-hidden relative"
                >
                  {clubLogoPreview ? (
                    <img src={clubLogoPreview} className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={32} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  )}
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3">Organization Logo</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Organization Name</label>
                <input required type="text" placeholder="e.g. Robotics Collective" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600" value={newClubData.name} onChange={e => setNewClubData({...newClubData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Category</label>
                <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={newClubData.category} onChange={e => setNewClubData({...newClubData, category: e.target.value})}>
                  {['Technology', 'Social Service', 'Cultural', 'Sports', 'Entrepreneurship'].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mission Statement</label>
                <textarea required rows={4} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none resize-none" value={newClubData.description} onChange={e => setNewClubData({...newClubData, description: e.target.value})} />
              </div>
              <button type="submit" disabled={isCreating} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl disabled:opacity-50">
                {isCreating ? <Loader2 className="animate-spin mx-auto" /> : 'Initialize Registry'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 flex items-center italic tracking-tight">
                <Edit className="mr-3 text-indigo-600" /> Update Collective Protocol
              </h3>
              <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleUpdateClub} className="space-y-6">
              <div className="flex flex-col items-center mb-6">
                <input type="file" ref={editLogoInputRef} className="hidden" onChange={handleEditLogoChange} accept="image/*" />
                <div 
                  onClick={() => editLogoInputRef.current?.click()}
                  className="w-24 h-24 rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-indigo-600 group transition-all overflow-hidden relative"
                >
                  <img src={editLogoPreview || editClubData.logoUrl} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                    <Upload size={20} className="text-white" />
                  </div>
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-3">Update Identity (Logo)</p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Organization Name</label>
                <input disabled type="text" className="w-full p-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-400 cursor-not-allowed" value={editClubData.name} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mission Statement</label>
                <textarea required rows={4} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none resize-none" value={editClubData.description} onChange={e => setEditClubData({...editClubData, description: e.target.value})} />
              </div>
              <button type="submit" disabled={isUpdatingClub} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl disabled:opacity-50">
                {isUpdatingClub ? <Loader2 className="animate-spin mx-auto" /> : 'Synchronize Registry'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showEventModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 flex items-center italic tracking-tight">
                <Calendar className="mr-3 text-indigo-600" /> New Mission Entry
              </h3>
              <button onClick={() => setShowEventModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <input required type="text" placeholder="Mission Title" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={newEventData.title} onChange={e => setNewEventData({...newEventData, title: e.target.value})} />
              <textarea required rows={3} placeholder="Mission Description" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none resize-none" value={newEventData.description} onChange={e => setNewEventData({...newEventData, description: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={newEventData.date} onChange={e => setNewEventData({...newEventData, date: e.target.value})} />
                <input required type="text" placeholder="Coordinates/Location" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={newEventData.location} onChange={e => setNewEventData({...newEventData, location: e.target.value})} />
              </div>
              <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={newEventData.type} onChange={e => setNewEventData({...newEventData, type: e.target.value as any})}>
                {['Workshop', 'Competition', 'Seminar', 'Hackathon'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual Asset (Optional Video)</label>
                <input type="file" ref={eventVideoInputRef} className="hidden" onChange={handleEventVideoChange} accept="video/*" />
                <button type="button" onClick={() => eventVideoInputRef.current?.click()} className="w-full p-4 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center space-x-3 text-slate-400 hover:border-indigo-600 hover:text-indigo-600 transition-all">
                  <Video size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest">{eventVideoFile ? eventVideoFile.name : 'Select Tactical Video'}</span>
                </button>
                {eventVideoPreview && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-black">
                    <video src={eventVideoPreview} className="w-full h-full object-contain" controls />
                    <button type="button" onClick={() => {setEventVideoFile(null); setEventVideoPreview(null);}} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg shadow-lg"><Trash2 size={16} /></button>
                  </div>
                )}
                {eventUploadProgress > 0 && (
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all" style={{ width: `${eventUploadProgress}%` }}></div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={isCreatingEvent} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl disabled:opacity-50">
                {isCreatingEvent ? <Loader2 className="animate-spin mx-auto" /> : 'Log Mission'}
              </button>
            </form>
          </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 pb-8 border-b border-slate-200">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-indigo-400 shadow-xl border border-slate-800">
            <Settings size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Command Center</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Authorized Access • {user.displayName}</p>
          </div>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center space-x-3 shadow-xl hover:bg-indigo-700 transition-all active:scale-95">
          <Plus size={20} />
          <span>Establish Organization</span>
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-xs font-black text-slate-900 mb-8 uppercase tracking-widest flex items-center">
              <LayoutGrid className="mr-3 text-indigo-600" /> Managed Collectives
            </h3>
            <div className="space-y-4">
              {managedClubs.length === 0 ? (
                <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No active organizations</p>
                </div>
              ) : managedClubs.map(club => (
                <button 
                  key={club.id} 
                  onClick={() => handleSelectClub(club)} 
                  className={`w-full flex items-center p-4 rounded-2xl transition-all border text-left ${
                    selectedClub?.id === club.id 
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' 
                      : 'bg-white border-slate-100 hover:border-indigo-200'
                  }`}
                >
                  <img src={club.logoUrl || `https://picsum.photos/seed/${club.id}/200`} className={`w-10 h-10 rounded-xl object-cover mr-4 ${selectedClub?.id === club.id ? 'border-2 border-white/40' : 'border border-slate-100'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] font-black uppercase tracking-tight truncate ${selectedClub?.id === club.id ? 'text-white' : 'text-slate-900'}`}>{club.name}</p>
                    <p className={`text-[9px] font-bold uppercase ${selectedClub?.id === club.id ? 'text-indigo-200' : 'text-slate-400'}`}>{club.members.length} Members</p>
                  </div>
                  {club.pendingRequests?.length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-2 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
                  <ChevronRight size={16} className={`ml-2 ${selectedClub?.id === club.id ? 'text-white/50' : 'text-slate-300'}`} />
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-8">
          {selectedClub ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                 <div className="flex items-center space-x-4">
                    <img src={selectedClub.logoUrl || `https://picsum.photos/seed/${selectedClub.id}/200`} className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-slate-100" />
                    <div>
                       <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight italic">{selectedClub.name}</h2>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{selectedClub.category} Protocol</p>
                    </div>
                 </div>
                 <button 
                  onClick={() => { setEditClubData(selectedClub); setEditLogoPreview(null); setShowEditModal(true); }}
                  className="px-6 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center justify-center space-x-2"
                >
                   <Edit size={14} />
                   <span>Edit Protocol</span>
                 </button>
              </div>

              <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200">
                <button onClick={() => setActiveTab('broadcast')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'broadcast' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Tactical Broadcast</button>
                <button onClick={() => setActiveTab('events')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'events' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                  Mission Log {pendingProposals.length > 0 && <span className="absolute -top-1 -right-1 bg-indigo-600 text-white w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center border-2 border-slate-100">{pendingProposals.length}</span>}
                </button>
                <button onClick={() => setActiveTab('members')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'members' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>
                  Personnel {pendingMembers.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center border-2 border-slate-100 shadow-lg shadow-red-100">{pendingMembers.length}</span>}
                </button>
              </div>

              {activeTab === 'broadcast' && (
                <section className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm p-8 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center"><Send size={18} className="mr-3 text-indigo-600" /> Tactical Broadcast</h2>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">To: {selectedClub.name}</span>
                  </div>
                  <div className="space-y-6">
                    <textarea rows={3} placeholder="Brief the community on latest updates..." className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600 transition-all resize-none shadow-inner" value={postContent} onChange={e => setPostContent(e.target.value)} />
                    {selectedFile && (
                      <div className="relative group rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 aspect-video">
                        {fileType === 'image' && <img src={filePreview!} className="w-full h-full object-cover" />}
                        {fileType === 'video' && <video src={filePreview!} className="w-full h-full object-cover" controls />}
                        {fileType === 'file' && <div className="w-full h-full flex items-center justify-center p-8"><FileText size={48} className="text-indigo-600" /></div>}
                        <button onClick={() => {setSelectedFile(null); setFilePreview(null);}} className="absolute top-4 right-4 p-3 bg-red-500 text-white rounded-2xl opacity-0 group-hover:opacity-100 transition-all shadow-xl active:scale-90"><Trash2 size={20} /></button>
                      </div>
                    )}
                    {uploadProgress > 0 && <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div></div>}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="flex space-x-2">
                        <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl border border-slate-100 transition-all" title="Image"><ImageIcon size={20} /></button>
                        <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl border border-slate-100 transition-all" title="Video"><Film size={20} /></button>
                        <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl border border-slate-100 transition-all" title="Document"><Paperclip size={20} /></button>
                      </div>
                      <button onClick={handleCreatePost} disabled={isPosting || (!postContent.trim() && !selectedFile)} className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-3">
                        {isPosting ? <Loader2 className="animate-spin" size={20} /> : <><Send size={18} /><span>Deploy Transmission</span></>}
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'events' && (
                <section className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/20">
                    <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest flex items-center"><Calendar size={18} className="mr-3" /> Mission Protocols</h3>
                    <button onClick={() => setShowEventModal(true)} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center space-x-2 shadow-lg shadow-indigo-100">
                      <Plus size={14} />
                      <span>Log New Mission</span>
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {pendingProposals.length === 0 ? (
                      <div className="p-24 text-center">
                        <ShieldCheck size={48} className="mx-auto text-slate-200 mb-6" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest italic">No pending event transmissions</p>
                      </div>
                    ) : (
                      pendingProposals.map(proposal => (
                        <div key={proposal.id} className="p-8 hover:bg-slate-50/10 transition-all">
                          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                            <div className="flex-1">
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[8px] font-black rounded-lg border border-indigo-100 uppercase tracking-widest">{proposal.type}</span>
                              <h4 className="text-xl font-black text-slate-900 uppercase italic mt-3 tracking-tight">{proposal.title}</h4>
                              <div className="flex items-center space-x-4 mt-2">
                                <span className="text-[10px] text-slate-400 font-bold flex items-center"><Calendar size={12} className="mr-1.5" /> {new Date(proposal.date).toLocaleDateString()}</span>
                                <span className="text-[10px] text-slate-400 font-bold flex items-center"><Plus size={12} className="mr-1.5" /> Proposed by {proposal.proposerName}</span>
                              </div>
                              <p className="text-sm text-slate-500 mt-6 leading-relaxed font-medium bg-slate-50 p-6 rounded-2xl border border-slate-100">{proposal.description}</p>
                              
                              {proposal.videoUrl && (
                                <div className="mt-6 rounded-3xl overflow-hidden border border-slate-200 bg-black aspect-video max-h-72">
                                   <video src={proposal.videoUrl} className="w-full h-full object-contain" controls />
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-3 w-full md:w-auto">
                              <button onClick={() => handleApproveEvent(proposal)} disabled={!!isSummarizing} className="flex-1 md:flex-none bg-emerald-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-600 transition-all flex items-center justify-center space-x-2">
                                {isSummarizing === proposal.id ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                <span>Authorize</span>
                              </button>
                              <button onClick={() => firebase.rejectEvent(proposal.id).then(loadData)} className="p-4 text-red-500 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors"><X size={20} /></button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              )}

              {activeTab === 'members' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Pending Section */}
                  <section className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100">
                      <h3 className="text-xs font-black text-amber-600 uppercase tracking-[0.3em] flex items-center">
                        <ShieldAlert size={16} className="mr-2" /> Pending Clearances
                      </h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {pendingMembers.length === 0 ? (
                        <div className="p-16 text-center">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No pending admission signals</p>
                        </div>
                      ) : (
                        pendingMembers.map(applicant => (
                          <div key={applicant.uid} className="p-8 flex flex-col md:flex-row justify-between items-center gap-6 group hover:bg-slate-50/50 transition-colors">
                            <div className="flex items-center space-x-6 w-full">
                              <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 font-black text-2xl border border-amber-100">
                                {applicant.displayName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate">{applicant.displayName}</h4>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{applicant.email}</p>
                              </div>
                            </div>
                            <div className="flex space-x-3 w-full md:w-auto">
                              <button onClick={() => handleApproveMember(applicant.uid)} className="flex-1 md:flex-none bg-emerald-500 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center space-x-2">
                                <UserCheck size={18} />
                                <span>Authorize</span>
                              </button>
                              <button onClick={() => handleRejectMember(applicant.uid)} className="p-4 text-red-500 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors"><UserX size={20} /></button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  {/* Active Section */}
                  <section className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                    <div className="p-8 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center">
                        <Users size={16} className="mr-2" /> Active Operatives
                      </h3>
                      
                      <div className="relative w-full sm:w-64">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                         <input 
                           type="text" 
                           placeholder="Filter by name or email..."
                           className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-600/10 transition-all"
                           value={memberSearchQuery}
                           onChange={e => setMemberSearchQuery(e.target.value)}
                         />
                      </div>
                    </div>

                    <div className="divide-y divide-slate-50">
                      {filteredActiveMembers.length === 0 ? (
                        <div className="p-16 text-center">
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">No operatives match the search protocol</p>
                        </div>
                      ) : filteredActiveMembers.map(member => (
                        <div key={member.uid} className="p-8 flex flex-col md:flex-row justify-between items-center gap-6 group hover:bg-slate-50/50 transition-colors animate-in fade-in duration-300">
                          <div className="flex items-center space-x-6 w-full">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-2xl border border-indigo-100">
                              {member.displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate">{member.displayName}</h4>
                              <div className="flex items-center mt-1 space-x-3">
                                <span className="text-[10px] text-indigo-600 font-black uppercase tracking-widest flex items-center"><Zap size={10} className="mr-1" /> {member.points} XP</span>
                                <span className="text-slate-200 text-xs">|</span>
                                <div className="flex items-center space-x-2">
                                  {editingMemberUid === member.uid ? (
                                    <div className="flex items-center space-x-2 animate-in fade-in duration-200">
                                      <input 
                                        autoFocus
                                        type="text"
                                        placeholder="Enter Protocol Status..."
                                        className="text-[9px] font-black uppercase bg-slate-50 border border-indigo-100 px-3 py-1 rounded-lg outline-none focus:ring-2 focus:ring-indigo-600/10"
                                        value={roleInput}
                                        onChange={e => setRoleInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAssignRole(member.uid)}
                                      />
                                      <button onClick={() => handleAssignRole(member.uid)} className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-lg"><CheckCircle2 size={14} /></button>
                                      <button onClick={() => setEditingMemberUid(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"><X size={14} /></button>
                                    </div>
                                  ) : (
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">
                                      {selectedClub.adminUid === member.uid ? 'Founder' : (selectedClub.memberRoles?.[member.uid] || 'Operative')}
                                      {/* Only show edit if current user is owner OR system admin */}
                                      {(selectedClub.adminUid === user.uid || user.role === 'admin') && member.uid !== user.uid && (
                                        <button 
                                          onClick={() => { setEditingMemberUid(member.uid); setRoleInput(selectedClub.memberRoles?.[member.uid] || 'Operative'); }}
                                          className="ml-2 p-1 text-slate-300 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                                        >
                                          <Edit size={10} />
                                        </button>
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex space-x-3 w-full md:w-auto">
                            {member.uid !== user.uid && member.uid !== selectedClub.adminUid && (
                              <button 
                                onClick={() => handleRemoveMember(member.uid)} 
                                className="flex-1 md:flex-none bg-red-50 text-red-500 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center space-x-2 border border-red-200 shadow-sm"
                                title="Revoke Clearance"
                              >
                                <UserMinus size={18} />
                                <span>Deauthorize</span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 bg-white border border-slate-200 rounded-[2.5rem] text-center shadow-sm opacity-50">
               <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-8">
                  <LayoutGrid size={48} className="text-slate-200" />
               </div>
               <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Command System Active</h3>
               <p className="text-slate-400 mt-4 max-w-xs font-bold uppercase text-[10px] tracking-widest leading-loose">Select an organization from the side control panel to manage its personnel and event protocols.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
