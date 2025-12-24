
import React, { useEffect, useState, useRef } from 'react';
import { useParams, Navigate, Link, useNavigate } from 'react-router-dom';
import { firebase } from '../services/firebase';
import { geminiService } from '../services/gemini';
import { User, Project, ChatMessage, ChatChannel } from '../types';
import { 
  Send, 
  MessageSquare, 
  ChevronLeft,
  Users,
  Hash,
  Clock,
  CheckCircle2,
  Loader2,
  Flag,
  Target,
  Zap,
  ArrowRight,
  Settings,
  ShieldAlert,
  Edit,
  Star,
  Plus,
  MessageCircle,
  X,
  UserCheck,
  UserMinus,
  Sparkles,
  Trophy,
  Mail,
  RefreshCw,
  Search,
  Cpu,
  BrainCircuit,
  UserPlus,
  Check
} from 'lucide-react';

interface ProjectDetailProps { user: User; }

type ProjectView = 'comms' | 'team' | 'brief';

interface AISuggestion {
  uid: string;
  score: number;
  insight: string;
  matchedSkills: string[];
  userData?: User;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ user }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [pendingApplicants, setPendingApplicants] = useState<User[]>([]);
  const [activeView, setActiveView] = useState<ProjectView>('comms');
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  
  // AI Suggestions State
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  const isOwner = project?.ownerUid === user.uid;
  const isMember = project?.members.includes(user.uid);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = firebase.onProject(id, async (p) => {
      if (p) {
        setProject(p);
        const [membersData, applicantsData] = await Promise.all([
          Promise.all(p.members.map(uid => firebase.getUserById(uid))),
          Promise.all((p.pendingApplicants || []).map(uid => firebase.getUserById(uid)))
        ]);
        setMembers(membersData.filter((u): u is User => !!u));
        setPendingApplicants(applicantsData.filter((u): u is User => !!u));
      } else {
        setProject(null);
      }
      setLoading(false);
    });

    const unsubscribeChannels = firebase.onChannels(id, (updated) => {
      setChannels(updated);
      if (updated.length > 0 && !activeChannelId) {
        setActiveChannelId(updated[0].id);
      }
    });

    return () => { 
      unsubscribe(); 
      unsubscribeChannels();
    };
  }, [id, activeChannelId]);

  useEffect(() => {
    if (!id || !activeChannelId || !isMember) return;
    const unsubscribe = firebase.onMessages(id, activeChannelId, (msgs) => setMessages(msgs));
    return () => { unsubscribe(); };
  }, [id, activeChannelId, isMember]);

  useEffect(() => {
    if (scrollRef.current && activeView === 'comms') {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeView]);

  // AI Strategic Recruitment Engine
  const fetchAISuggestions = async () => {
    if (!project) return;
    setIsAnalyzing(true);
    try {
      // Access the Nexus user registry (limit to 50 for efficiency)
      const allUsers = await firebase.getUsers(50);
      const candidates = allUsers.filter(u => 
        !project.members.includes(u.uid) && 
        !(project.pendingApplicants || []).includes(u.uid) &&
        u.uid !== user.uid
      );
      
      if (candidates.length > 0) {
        const rawResults = await geminiService.getCollaboratorSuggestions(project, candidates);
        
        // Populate full user profiles for the strategic UI
        const enriched = await Promise.all(rawResults.map(async r => {
          const u = await firebase.getUserById(r.uid);
          return { ...r, userData: u };
        }));
        
        setAiSuggestions(enriched.filter(e => !!e.userData) as AISuggestion[]);
      }
    } catch (e) {
      console.error("AI Strategic Analysis failed", e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    if (activeView === 'team' && aiSuggestions.length === 0) {
      fetchAISuggestions();
    }
  }, [activeView]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !id || !activeChannelId) return;
    await firebase.sendMessage({ 
      clubId: id, 
      channelId: activeChannelId, 
      senderUid: user.uid, 
      senderName: user.displayName, 
      text: newMessage 
    });
    setNewMessage('');
  };

  const handleCreateChannel = async () => {
    if (!id || !isOwner) return;
    const name = prompt('Enter protocol channel name:');
    if (name) {
      await firebase.createChannel(id, name.toLowerCase().replace(/\s+/g, '-'));
    }
  };

  const handleApprove = async (applicantUid: string) => {
    if (!id) return;
    await firebase.approveProjectApplicant(id, applicantUid);
  };

  const handleReject = async (applicantUid: string) => {
    if (!id) return;
    await firebase.rejectProjectApplicant(id, applicantUid);
  };

  const handleRemoveMember = async (memberUid: string) => {
    if (!id || !project) return;
    if (memberUid === project.ownerUid) return;
    
    if (window.confirm("Protocol: Deauthorize this operative from the mission team?")) {
      try {
        await firebase.removeProjectMember(id, memberUid);
      } catch (err) {
        alert("Action failed.");
      }
    }
  };

  const handleDirectMessage = (memberUid: string) => {
    if (memberUid === user.uid) return;
    navigate(`/messages/${memberUid}`);
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-primary" /></div>;
  if (!project) return <Navigate to="/" />;

  const activeChannel = channels.find(c => c.id === activeChannelId);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 h-[calc(100vh-120px)] flex flex-col space-y-6">
      {/* Tactical Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center space-x-4">
          <Link to="/projects" className="p-2.5 bg-white border border-slate-100 shadow-sm hover:bg-slate-50 rounded-xl transition-all"><ChevronLeft size={20} /></Link>
          <div className="w-14 h-14 bg-slate-900 text-indigo-400 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-indigo-100/20 border border-slate-800">
            <Zap size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{project.title}</h1>
            <div className="flex items-center space-x-3 mt-2">
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-lg border flex items-center gap-1.5 ${
                project.status === 'recruiting' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                project.status === 'in-progress' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                'bg-slate-50 text-slate-400 border-slate-200'
              }`}>
                {project.status === 'recruiting' ? <Users size={12} /> : 
                 project.status === 'in-progress' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                {project.status.replace('-', ' ')}
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Mission Lead: {project.ownerName}</span>
            </div>
          </div>
        </div>

        <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] border border-slate-200 shadow-inner">
          {(['comms', 'team', 'brief'] as ProjectView[]).map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeView === view 
                  ? 'bg-white text-indigo-600 shadow-md border border-slate-100' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {view === 'comms' ? 'Mission Comms' : view === 'team' ? 'Operative Base' : 'Strategic Brief'}
            </button>
          ))}
        </div>
      </header>

      {!isMember ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-white border border-slate-200 rounded-[3rem] p-12 text-center shadow-2xl shadow-slate-200/40 animate-in fade-in zoom-in-95 duration-500">
           <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-200 mb-8 border border-slate-100">
              <ShieldAlert size={64} />
           </div>
           <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter mb-4">Security Protocol Active</h2>
           <p className="text-slate-500 max-w-md mb-12 font-medium leading-relaxed">This coordination space is reserved for verified mission operatives. Request security clearance to participate in mission communications.</p>
           <button 
             onClick={() => firebase.applyToProject(project.id, user.uid).then(() => alert('Security clearance request dispatched.'))}
             disabled={project.status !== 'recruiting'}
             className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
           >
             Request Operative Access
           </button>
        </div>
      ) : (
        <div className="flex-1 flex gap-8 overflow-hidden">
          {activeView === 'comms' && (
            <div className="w-64 hidden lg:flex flex-col space-y-4">
              <div className="bg-slate-900 rounded-[2rem] p-6 flex-1 shadow-2xl overflow-hidden flex flex-col border border-white/5">
                <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Protocol Channels</h3>
                  {isOwner && (
                    <button onClick={handleCreateChannel} className="p-1.5 hover:bg-white/10 text-indigo-300 rounded-lg transition-colors">
                      <Plus size={16} />
                    </button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5">
                  {channels.map(ch => (
                    <button
                      key={ch.id}
                      onClick={() => setActiveChannelId(ch.id)}
                      className={`w-full flex items-center px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                        activeChannelId === ch.id 
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/40' 
                          : 'text-slate-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <Hash size={16} className={`mr-2.5 ${activeChannelId === ch.id ? 'text-indigo-200' : 'text-slate-600'}`} />
                      {ch.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 bg-white border border-slate-200 rounded-[3rem] shadow-2xl shadow-slate-200/20 flex flex-col overflow-hidden relative">
            {activeView === 'comms' && (
              <div className="flex-1 flex flex-col animate-in fade-in duration-300">
                <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                   <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                        <Hash size={18} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-900">
                        Signal: #{activeChannel ? activeChannel.name : 'Initializing Feed...'}
                      </span>
                   </div>
                </div>

                <div ref={scrollRef} className="flex-1 p-8 overflow-y-auto space-y-6 custom-scrollbar bg-slate-50/10">
                   {messages.map((msg, i) => {
                     const isOwn = msg.senderUid === user.uid;
                     return (
                       <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                          <div className={`max-w-[75%] px-5 py-3.5 rounded-3xl shadow-sm ${
                            isOwn ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'
                          }`}>
                            {!isOwn && (
                              <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1.5 flex items-center">
                                {msg.senderName}
                                <span className="ml-2 text-[8px] opacity-40">({project.memberRoles?.[msg.senderUid] || 'Operative'})</span>
                              </p>
                            )}
                            <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
                          </div>
                       </div>
                     );
                   })}
                </div>

                <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100 flex space-x-4">
                   <input 
                     type="text" 
                     placeholder={project.status === 'completed' ? "Mission logs archived." : `Transmit in #${activeChannel?.name}...`}
                     disabled={project.status === 'completed'}
                     className="flex-1 bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all shadow-inner disabled:opacity-50"
                     value={newMessage}
                     onChange={e => setNewMessage(e.target.value)}
                   />
                   <button type="submit" disabled={!newMessage.trim()} className="bg-indigo-600 text-white p-4 rounded-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-90 disabled:opacity-50"><Send size={24} /></button>
                </form>
              </div>
            )}

            {activeView === 'team' && (
              <div className="flex-1 p-10 overflow-y-auto custom-scrollbar animate-in slide-in-from-right-4 duration-500">
                
                {/* AI Strategic Recruitment Section */}
                <section className="mb-12">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                      <div className="flex items-center space-x-4">
                         <div className="w-14 h-14 rounded-[1.25rem] bg-indigo-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-100 border border-indigo-400/20">
                            <BrainCircuit size={32} />
                         </div>
                         <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] flex items-center">
                               Strategic Recruitment
                               <Sparkles size={16} className="ml-2 text-amber-500 animate-pulse" />
                            </h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">Gemini Tactical Intelligence v3.5</p>
                         </div>
                      </div>
                      <button 
                        onClick={fetchAISuggestions} 
                        disabled={isAnalyzing}
                        className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center hover:bg-indigo-50 transition-all bg-white px-6 py-3.5 rounded-2xl border border-indigo-100 shadow-sm active:scale-95 disabled:opacity-50"
                      >
                        {isAnalyzing ? <Loader2 size={14} className="animate-spin mr-2.5" /> : <RefreshCw size={14} className="mr-2.5" />}
                        Scan Registry
                      </button>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
                      {isAnalyzing && (
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[4px] z-10 flex flex-col items-center justify-center space-y-6 rounded-[3rem] border border-indigo-50">
                           <div className="relative">
                              <Loader2 size={64} className="text-indigo-600 animate-spin" />
                              <Cpu size={28} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400" />
                           </div>
                           <div className="text-center">
                              <p className="text-[12px] font-black text-indigo-600 uppercase tracking-[0.4em] animate-pulse">Analyzing Global Grid...</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Matching Semantic Skill-sets</p>
                           </div>
                        </div>
                      )}

                      {aiSuggestions.length === 0 && !isAnalyzing ? (
                        <div className="col-span-full py-20 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[3rem]">
                           <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                              <Search size={32} className="text-slate-300" />
                           </div>
                           <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Registry scan complete. Select 'Scan' to generate AI suggestions.</p>
                        </div>
                      ) : (
                        aiSuggestions.map((suggestion, idx) => (
                          <div key={suggestion.uid} className="bg-white border border-slate-200 p-8 rounded-[3rem] relative overflow-hidden group shadow-xl shadow-slate-200/30 transition-all hover:translate-y-[-4px] hover:border-indigo-300 hover:shadow-indigo-100/40 animate-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                             {/* Compatibility Score */}
                             <div className="absolute top-0 right-0 pt-8 pr-8">
                                <div className="bg-indigo-50 border border-indigo-100 px-5 py-2.5 rounded-[1.25rem] flex flex-col items-end">
                                   <span className="text-2xl font-black text-indigo-600 italic leading-none">{suggestion.score}%</span>
                                   <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mt-1">Strategic Match</span>
                                </div>
                             </div>
                             
                             <div className="flex items-start mb-8">
                                <div className="flex items-center space-x-5">
                                   <div className="w-16 h-16 rounded-[1.25rem] bg-slate-900 text-white flex items-center justify-center font-black text-2xl shadow-xl shadow-slate-200 border border-slate-700 group-hover:bg-indigo-600 transition-colors">
                                      {suggestion.userData?.displayName.charAt(0).toUpperCase()}
                                   </div>
                                   <div>
                                      <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{suggestion.userData?.displayName}</h4>
                                      <div className="flex items-center space-x-3 mt-1.5">
                                         <Trophy size={12} className="text-amber-500" />
                                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{suggestion.userData?.points} XP Rank</span>
                                      </div>
                                   </div>
                                </div>
                             </div>

                             <div className="space-y-6">
                                <div className="bg-indigo-50/40 p-6 rounded-[1.5rem] border border-indigo-100/50">
                                   <p className="text-[12px] text-slate-600 leading-relaxed font-medium italic">
                                      "{suggestion.insight}"
                                   </p>
                                </div>

                                <div>
                                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center">
                                      <Check size={12} className="mr-2.5 text-emerald-500" /> Skill Set Alignment
                                   </p>
                                   <div className="flex flex-wrap gap-2">
                                      {suggestion.matchedSkills.map(skill => (
                                        <span key={skill} className="px-3.5 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-xl border border-emerald-100 uppercase tracking-widest">
                                           {skill}
                                        </span>
                                      ))}
                                      {suggestion.userData?.skills.filter(s => !suggestion.matchedSkills.includes(s)).slice(0, 1).map(skill => (
                                        <span key={skill} className="px-3.5 py-1.5 bg-slate-50 text-slate-400 text-[10px] font-black rounded-xl border border-slate-100 uppercase tracking-widest">
                                           {skill}
                                        </span>
                                      ))}
                                   </div>
                                </div>

                                <div className="flex items-center gap-4 pt-2">
                                   <button 
                                     onClick={() => handleDirectMessage(suggestion.uid)}
                                     className="flex-1 bg-indigo-600 text-white py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center active:scale-95"
                                   >
                                      <Mail size={16} className="mr-3" /> Signal Invite
                                   </button>
                                   <Link 
                                     to={`/profile/${suggestion.uid}`}
                                     className="p-4.5 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200 hover:text-indigo-600 hover:bg-white hover:border-indigo-200 transition-all"
                                   >
                                      <ArrowRight size={20} />
                                   </Link>
                                </div>
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </section>

                <div className="mb-10 flex items-center justify-between border-t border-slate-50 pt-12">
                   <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-widest flex items-center">
                      <Users size={24} className="mr-3.5 text-indigo-600" /> Authorized Operatives
                   </h3>
                   <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-full border border-slate-200 uppercase tracking-widest">
                      Mission Capacity: {members.length}
                   </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   {members.map(member => (
                     <div key={member.uid} className="bg-white border border-slate-100 p-6 rounded-[2.5rem] flex flex-col space-y-4 hover:shadow-xl transition-all group hover:border-indigo-100">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center space-x-4">
                              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 font-black text-xl border border-slate-100 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                {member.displayName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                 <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{member.displayName}</p>
                                 <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1 rounded-xl border border-indigo-100 uppercase tracking-widest flex items-center">
                                    {project.ownerUid === member.uid && <Star size={12} className="mr-1.5 fill-indigo-600" />}
                                    {project.memberRoles?.[member.uid] || 'Operative'}
                                 </span>
                              </div>
                           </div>
                           <div className="flex items-center space-x-4">
                              <div className="text-right">
                                 <p className="text-xl font-black text-slate-900 leading-none">{member.points}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">XP Rank</p>
                              </div>
                              {isOwner && member.uid !== user.uid && (
                                <button 
                                  onClick={() => handleRemoveMember(member.uid)}
                                  className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-2"
                                  title="Deauthorize Operative"
                                >
                                  <UserMinus size={20} />
                                </button>
                              )}
                           </div>
                        </div>
                     </div>
                   ))}
                </div>

                {isOwner && pendingApplicants.length > 0 && (
                  <div className="mt-16">
                    <h3 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.4em] mb-8 flex items-center">
                      <ShieldAlert size={18} className="mr-3" /> Security Clearances Pending
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pendingApplicants.map(applicant => (
                        <div key={applicant.uid} className="bg-amber-50/50 border border-amber-100 p-6 rounded-[2.5rem] flex items-center justify-between shadow-sm">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black text-lg">
                              {applicant.displayName.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-black uppercase text-slate-900 tracking-tight">{applicant.displayName}</p>
                              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Awaiting Authorization</p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button onClick={() => handleApprove(applicant.uid)} className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-xl shadow-emerald-100 transition-all active:scale-90"><UserCheck size={20} /></button>
                            <button onClick={() => handleReject(applicant.uid)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all active:scale-90"><X size={20} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeView === 'brief' && (
              <div className="flex-1 p-14 overflow-y-auto custom-scrollbar animate-in slide-in-from-left-4 duration-500">
                <div className="max-w-3xl space-y-14">
                   <section>
                      <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-6 flex items-center">
                         <Hash size={16} className="mr-3" /> Operational Mission Brief
                      </h3>
                      <p className="text-3xl font-black text-slate-900 leading-[1.3] italic tracking-tight">
                        "{project.description}"
                      </p>
                   </section>

                   <section>
                      <h3 className="text-[11px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-6">Tactical Objectives & Required Intel</h3>
                      <div className="flex flex-wrap gap-4">
                         {project.requiredSkills.map(skill => (
                           <div key={skill} className="px-8 py-4 bg-slate-900 text-indigo-400 text-[11px] font-black uppercase tracking-[0.25em] rounded-[1.5rem] border border-white/10 italic shadow-2xl">
                             {skill}
                           </div>
                         ))}
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

export default ProjectDetail;
