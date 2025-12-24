
// Added useMemo to the React imports to resolve the compilation error on line 59.
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { firebase } from '../services/firebase';
import { User, Club, ChatMessage, ChatChannel, Post } from '../types';
import { 
  Send, 
  MessageSquare, 
  ChevronLeft, 
  Users, 
  Hash, 
  Layout, 
  Clock, 
  Settings, 
  Shield, 
  Loader2, 
  FileText, 
  Download, 
  Star, 
  UserMinus, 
  Heart, 
  Image as ImageIcon, 
  Film, 
  Paperclip, 
  Trash2, 
  Plus,
  ShieldOff,
  ShieldCheck,
  Zap,
  MoreVertical,
  Camera,
  Upload,
  Save,
  Info
} from 'lucide-react';

interface ClubDetailProps { user: User; }

type ClubView = 'chat' | 'posts' | 'members' | 'settings';

const ClubDetail: React.FC<ClubDetailProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [clubMembers, setClubMembers] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<ClubView>('chat');
  
  // Admin Post State
  const [postContent, setPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | 'file' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Club Settings State
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Authoritative admin check: Founder OR explicitly assigned Admin role OR System Admin
  const isAdmin = useMemo(() => {
    if (!club) return false;
    if (user.role === 'admin') return true;
    if (club.adminUid === user.uid) return true;
    const userRole = club.memberRoles?.[user.uid]?.toLowerCase() || '';
    return userRole.includes('admin') || userRole.includes('president') || userRole.includes('lead');
  }, [club, user]);

  const isMember = club?.members.includes(user.uid);

  const loadClubData = async () => {
    if (!id) return;
    try {
      const c = await firebase.getClubById(id);
      setClub(c || null);
      if (c) {
        setEditName(c.name);
        setEditDesc(c.description);

        firebase.onChannels(id, (updated) => {
          setChannels(updated);
          if (updated.length > 0 && !activeChannelId) setActiveChannelId(updated[0].id);
        });
        
        firebase.onClub(id, (updatedClub) => {
          if (updatedClub) {
            setClub(updatedClub);
            Promise.all((updatedClub.members || []).map(uid => firebase.getUserById(uid)))
              .then(data => setClubMembers(data.filter((u): u is User => !!u)));
          }
        });

        const clubPosts = await firebase.getPosts(id);
        setPosts(clubPosts.sort((a, b) => b.timestamp - a.timestamp));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadClubData().then(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id || !activeChannelId) return;
    const unsubscribe = firebase.onMessages(id, activeChannelId, (msgs) => setMessages(msgs));
    return () => { if (unsubscribe) unsubscribe(); };
  }, [id, activeChannelId]);

  useEffect(() => {
    if (scrollRef.current && activeView === 'chat') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeView]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id || !activeChannelId) return;
    await firebase.sendMessage({ clubId: id, channelId: activeChannelId, senderUid: user.uid, senderName: user.displayName, text: newMessage });
    setNewMessage('');
  };

  const handleToggleLike = async (postId: string) => {
    if (!id) return;
    await firebase.toggleLikePost(postId, user.uid);
    const updated = await firebase.getPosts(id);
    setPosts(updated.sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleRemoveMember = async (memberUid: string) => {
    if (!id || !club) return;
    
    // Safety check for founder
    if (memberUid === club.adminUid) {
      alert("UNAUTHORIZED ACTION: Mission Founders cannot be deauthorized via standard protocol.");
      return;
    }
    
    if (window.confirm(`AUTHORITY OVERRIDE: Revoking operative status for this member from ${club.name}. Are you sure?`)) {
      try {
        await firebase.removeMember(id, memberUid);
        // The member list will refresh automatically via the onClub listener
      } catch (err) {
        alert("Action failed. Mission command communication error.");
      }
    }
  };

  // Settings Handlers
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUpdateIdentity = async () => {
    if (!club) return;
    setIsUpdating(true);
    try {
      let logoUrl = club.logoUrl;
      if (newLogoFile) {
        logoUrl = await firebase.uploadMedia(newLogoFile);
      }

      await firebase.updateClub(club.id, {
        name: editName,
        description: editDesc,
        logoUrl
      });
      
      setNewLogoFile(null);
      setLogoPreview(null);
      alert('Organization identity synchronized with the grid.');
    } catch (error) {
      alert('Protocol update failed. Check network link.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Admin Broadcast Handlers
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

  const handleCreatePost = async () => {
    if (!club || (!postContent.trim() && !selectedFile)) return;

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
        clubId: club.id,
        clubName: club.name,
        authorName: user.displayName,
        content: postContent,
        mediaUrl: mediaUrl || undefined,
        mediaType: fileType || undefined,
        fileName: fileName || undefined
      });

      await firebase.awardPoints(user.uid, 20, `Broadcasted update to ${club.name}`);
      
      setPostContent('');
      setSelectedFile(null);
      setFilePreview(null);
      setFileType(null);
      setUploadProgress(100);
      
      const clubPosts = await firebase.getPosts(club.id);
      setPosts(clubPosts.sort((a, b) => b.timestamp - a.timestamp));

      setTimeout(() => setUploadProgress(0), 1000);
    } catch (error) {
      alert('Transmission failed.');
    } finally {
      setIsPosting(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!club) return <Navigate to="/" />;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 h-[calc(100vh-120px)] flex flex-col">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.zip" />

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div className="flex items-center space-x-4">
          <Link to="/" className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft size={20} /></Link>
          <img src={club.logoUrl || `https://picsum.photos/seed/${club.id}/200`} className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-100" />
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">{club.name}</h1>
            <div className="flex items-center space-x-2 mt-0.5">
               <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">{club.category} • {club.members.length} Operatives</p>
               {isAdmin && <span className="bg-indigo-600 text-white text-[8px] font-black px-2 py-0.5 rounded flex items-center uppercase tracking-widest"><ShieldCheck size={10} className="mr-1" /> Admin Clearance</span>}
            </div>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
          <button onClick={() => setActiveView('chat')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'chat' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Chat</button>
          <button onClick={() => setActiveView('posts')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'posts' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Updates</button>
          <button onClick={() => setActiveView('members')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'members' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Members</button>
          {isAdmin && (
            <button onClick={() => setActiveView('settings')} className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'settings' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              <Settings size={14} className="inline mr-1" /> Settings
            </button>
          )}
        </div>
      </header>

      {!isMember && !isAdmin ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[2.5rem] p-10 text-center shadow-xl shadow-slate-200/40">
          <Shield className="text-slate-200 mb-6" size={64} />
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Protocol Access Restricted</h2>
          <p className="text-slate-500 mt-4 max-w-xs mb-10 font-medium">Join this organization to participate in secure channels and view mission updates.</p>
          <button onClick={() => firebase.requestToJoinClub(club.id, user.uid).then(() => alert('Request sent!'))} className="bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">Request Admission</button>
        </div>
      ) : (
        <div className="flex-1 flex gap-8 overflow-hidden">
          {activeView !== 'settings' && (
            <div className="w-64 flex flex-col space-y-4 hidden lg:flex">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 flex-1 shadow-sm overflow-y-auto custom-scrollbar">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-2">Active Channels</h3>
                <div className="space-y-1">{channels.map(ch => (
                  <button key={ch.id} onClick={() => setActiveChannelId(ch.id)} className={`w-full flex items-center px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${activeChannelId === ch.id ? 'bg-indigo-50 text-primary shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}><Hash size={16} className="mr-2" />{ch.name}</button>
                ))}</div>
              </div>
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl"><h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3 italic">Mission Statement</h3><p className="text-xs text-slate-300 leading-relaxed font-medium">{club.description}</p></div>
            </div>
          )}

          <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] flex flex-col overflow-hidden shadow-xl shadow-slate-200/20">
            {activeView === 'chat' ? (
              <>
                <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/20 custom-scrollbar">
                  {messages.map(msg => {
                    const isOwn = msg.senderUid === user.uid;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[80%] px-5 py-3.5 rounded-2xl shadow-sm ${isOwn ? 'bg-primary text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                          {!isOwn && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{msg.senderName}</p>}
                          <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                          <p className={`text-[8px] font-black uppercase mt-1.5 ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <form onSubmit={handleSendMessage} className="p-5 bg-white border-t border-slate-100 flex space-x-4">
                  <input type="text" placeholder="Broadcast a message..." className="flex-1 bg-slate-50 border border-slate-200 px-6 py-3.5 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/10 transition-all shadow-inner" value={newMessage} onChange={e => setNewMessage(e.target.value)} />
                  <button type="submit" disabled={!newMessage.trim()} className="bg-primary text-white p-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-90"><Send size={20} /></button>
                </form>
              </>
            ) : activeView === 'posts' ? (
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-50/30">
                
                {/* Admin Broadcast Studio */}
                {isAdmin && (
                  <section className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm p-8 animate-in fade-in slide-in-from-bottom-2 border-l-4 border-l-indigo-600 mb-12">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center">
                        <Send size={18} className="mr-3 text-indigo-600" /> Broadcast Studio
                      </h2>
                      <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest">Leadership Access Active</span>
                    </div>
                    <div className="space-y-6">
                      <textarea 
                        rows={3} 
                        placeholder="Brief the organization on latest updates..." 
                        className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600 transition-all resize-none shadow-inner" 
                        value={postContent} 
                        onChange={e => setPostContent(e.target.value)} 
                      />
                      
                      {selectedFile && (
                        <div className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video max-h-64 shadow-inner">
                          {fileType === 'image' && <img src={filePreview!} className="w-full h-full object-contain" alt="Preview" />}
                          {fileType === 'video' && <video src={filePreview!} className="w-full h-full object-contain" controls />}
                          {fileType === 'file' && (
                            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-white">
                              <FileText size={48} className="text-indigo-600 mb-2" />
                              <p className="text-xs font-black text-slate-600 uppercase truncate max-w-full">{selectedFile.name}</p>
                            </div>
                          )}
                          <button 
                            onClick={() => {setSelectedFile(null); setFilePreview(null); setFileType(null);}} 
                            className="absolute top-4 right-4 p-2.5 bg-red-500 text-white rounded-xl shadow-xl hover:bg-red-600 transition-all active:scale-90"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}

                      {uploadProgress > 0 && (
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex space-x-2">
                          <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl border border-slate-200 transition-all" title="Add Image"><ImageIcon size={20} /></button>
                          <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl border border-slate-200 transition-all" title="Add Video"><Film size={20} /></button>
                          <button onClick={() => fileInputRef.current?.click()} className="p-4 bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl border border-slate-200 transition-all" title="Attach File"><Paperclip size={20} /></button>
                        </div>
                        <button 
                          onClick={handleCreatePost} 
                          disabled={isPosting || (!postContent.trim() && !selectedFile)} 
                          className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-700 active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-3"
                        >
                          {isPosting ? <Loader2 className="animate-spin" size={18} /> : <><Plus size={18} /><span>Deploy Broadcast</span></>}
                        </button>
                      </div>
                    </div>
                  </section>
                )}

                {posts.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center opacity-30 italic">
                    <Layout size={48} className="mb-4" />
                    <p className="text-sm font-black uppercase tracking-[0.2em]">No mission logs recorded</p>
                  </div>
                ) : posts.map(post => {
                  const isLiked = post.likes?.includes(user.uid);
                  return (
                    <article key={post.id} className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4 mb-6">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-primary font-black text-lg border border-indigo-100">{post.authorName.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{post.authorName}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(post.timestamp).toLocaleDateString()} • MISSION UPDATE</p>
                        </div>
                      </div>
                      <p className="text-slate-700 text-sm mb-6 leading-relaxed font-medium whitespace-pre-wrap">{post.content}</p>
                      
                      {post.mediaUrl && (
                        <div className="rounded-[1.5rem] overflow-hidden border border-slate-100 mb-6 bg-slate-50 shadow-inner">
                          {post.mediaType === 'image' && <img src={post.mediaUrl} className="w-full h-auto max-h-[500px] object-contain" alt="Update Media" />}
                          {post.mediaType === 'video' && <video src={post.mediaUrl} className="w-full" controls />}
                          {post.mediaType === 'file' && (
                            <div className="p-6 flex justify-between items-center bg-white">
                              <div className="flex items-center space-x-4 min-w-0 flex-1">
                                <div className="p-3 bg-slate-50 rounded-xl text-primary shadow-sm shrink-0 border border-slate-100"><FileText size={28} /></div>
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{post.fileName || "Resource Attachment"}</p>
                                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Protocol Documentation</p>
                                </div>
                              </div>
                              <a href={post.mediaUrl} download={post.fileName || "nexus-resource"} className="px-5 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 ml-4 shrink-0 flex items-center"><Download size={14} className="mr-2" /> Download</a>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center space-x-8 pt-6 border-t border-slate-100">
                        <button 
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center space-x-2 text-[11px] font-black uppercase tracking-widest transition-all ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}
                        >
                          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                          <span>{post.likes?.length || 0}</span>
                        </button>
                        <div className="flex items-center space-x-2 text-slate-400 text-[11px] font-black uppercase tracking-widest transition-colors hover:text-primary cursor-pointer">
                          <MessageSquare size={18} />
                          <span>{post.comments.length}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : activeView === 'members' ? (
              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/10">
                <div className="mb-8 flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-widest flex items-center">
                    <Users size={20} className="mr-3 text-primary" /> Club Operatives
                  </h3>
                  <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full border border-indigo-100 uppercase tracking-widest">
                    {clubMembers.length} Verified Members
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {clubMembers.map(member => (
                    <div key={member.uid} className="bg-white border border-slate-100 p-5 rounded-[1.5rem] flex items-center justify-between hover:bg-slate-50 transition-colors group relative overflow-hidden">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-primary font-black text-lg border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                          {member.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link to={`/profile/${member.uid}`} className="text-sm font-black text-slate-900 uppercase tracking-tight hover:text-primary transition-colors block">
                            {member.displayName}
                          </Link>
                          <div className="flex items-center mt-1">
                            {member.uid === club.adminUid ? (
                              <span className="bg-amber-50 text-amber-600 text-[8px] font-black px-2 py-0.5 rounded-md border border-amber-100 uppercase tracking-widest flex items-center shadow-sm">
                                <Star size={8} className="mr-1 fill-amber-600" /> Founder
                              </span>
                            ) : club.memberRoles?.[member.uid] ? (
                              <span className="bg-indigo-50 text-indigo-600 text-[8px] font-black px-2 py-0.5 rounded-md border border-indigo-100 uppercase tracking-widest">
                                {club.memberRoles[member.uid]}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Operative</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-xs font-black text-slate-900">{member.points}</p>
                          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">XP Rank</p>
                        </div>
                        
                        {/* ADREMIN POWER: Kick members button visible only to admins and system admins */}
                        {isAdmin && member.uid !== user.uid && member.uid !== club.adminUid && (
                          <div className="relative group/kick">
                            <button 
                              onClick={() => handleRemoveMember(member.uid)}
                              className="p-2.5 text-slate-200 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100"
                              title="Revoke Operative Access"
                            >
                              <UserMinus size={18} />
                            </button>
                            <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest rounded opacity-0 group-hover/kick:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                               Deauthorize Operative
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {isAdmin && (
                  <div className="mt-12 p-8 bg-indigo-50/50 border border-dashed border-indigo-200 rounded-[2.5rem] flex items-center space-x-6">
                     <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-600">
                        <Zap size={24} />
                     </div>
                     <div>
                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-1 italic">Authorized Leadership Protocols Active</p>
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed max-w-md uppercase tracking-tight">You are operating with administrative clearance. You have the tactical power to manage personnel, assign roles, and broadcast organization-wide updates.</p>
                     </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar animate-in fade-in duration-300">
                <div className="max-w-2xl mx-auto space-y-12">
                  <header>
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Identity Management</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Configure organization visual matrix and protocol metadata</p>
                  </header>

                  <section className="space-y-8">
                    <div className="flex flex-col items-center">
                      <input type="file" ref={logoInputRef} className="hidden" onChange={handleLogoChange} accept="image/*" />
                      <div 
                        onClick={() => logoInputRef.current?.click()}
                        className="w-32 h-32 rounded-[2.5rem] bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center cursor-pointer hover:border-primary group transition-all overflow-hidden relative shadow-inner"
                      >
                        <img src={logoPreview || club.logoUrl || `https://picsum.photos/seed/${club.id}/200`} className="w-full h-full object-cover" alt="Club Logo" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                          <Camera size={24} className="text-white mb-1" />
                          <span className="text-[8px] font-black text-white uppercase">Upload New</span>
                        </div>
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-4">Organization Emblem</p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Collective Designation</label>
                        <input 
                          type="text" 
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-inner"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Mission Statement</label>
                        <textarea 
                          rows={4}
                          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all shadow-inner resize-none"
                          value={editDesc}
                          onChange={e => setEditDesc(e.target.value)}
                        />
                      </div>

                      <div className="pt-4">
                        <button 
                          onClick={handleUpdateIdentity}
                          disabled={isUpdating || (editName === club.name && editDesc === club.description && !newLogoFile)}
                          className="w-full bg-primary text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center"
                        >
                          {isUpdating ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} className="mr-3" />Synchronize Protocol</>}
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="p-6 bg-slate-900 rounded-[2rem] text-white border border-white/5 relative overflow-hidden">
                     <div className="relative z-10">
                        <div className="flex items-center space-x-3 mb-4">
                           <Info size={18} className="text-indigo-400" />
                           <h4 className="text-[10px] font-black uppercase tracking-widest">Leadership Briefing</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-medium">Changes to organization identity are synchronized across the Nexus Grid immediately. Ensure all visual assets comply with campus conduct protocols.</p>
                     </div>
                     <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Shield size={100} />
                     </div>
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClubDetail;
