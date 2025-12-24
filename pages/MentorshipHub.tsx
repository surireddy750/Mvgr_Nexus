
import React, { useEffect, useState } from 'react';
import { firebase } from '../services/firebase';
import { User, MentorshipSession } from '../types';
import { 
  Users, 
  Search, 
  BookOpen, 
  Target, 
  Rocket, 
  GraduationCap, 
  MessageSquare, 
  CheckCircle2, 
  ChevronRight, 
  Loader2,
  Filter,
  Star,
  Zap,
  Award
} from 'lucide-react';

interface MentorshipHubProps { user: User; }

const MentorshipHub: React.FC<MentorshipHubProps> = ({ user }) => {
  const [mentors, setMentors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState<User | null>(null);
  
  // Request Form State
  const [requestData, setRequestData] = useState({ topic: 'Placement', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadMentors = async () => {
      try {
        const data = await firebase.getMentors();
        setMentors(data.filter(m => m.uid !== user.uid));
      } catch (e) {
        console.error("Mentor load error", e);
      } finally {
        setLoading(false);
      }
    };
    loadMentors();
  }, [user.uid]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRequestModal) return;
    setIsSubmitting(true);
    try {
      await firebase.requestMentorship({
        mentorUid: showRequestModal.uid,
        menteeUid: user.uid,
        topic: requestData.topic as any,
        message: requestData.message
      });
      alert(`Mentorship request dispatched to ${showRequestModal.displayName}. Check your notifications for their response.`);
      setShowRequestModal(null);
      setRequestData({ topic: 'Placement', message: '' });
    } catch (err) {
      alert('Failed to send request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMentors = mentors.filter(m => {
    const matchesSearch = m.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         (m.skills || []).some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const domains = [
    { id: 'Placement', icon: <Target size={18} />, color: 'emerald' },
    { id: 'Research', icon: <BookOpen size={18} />, color: 'indigo' },
    { id: 'Startup', icon: <Rocket size={18} />, color: 'amber' },
    { id: 'Academic', icon: <GraduationCap size={18} />, color: 'blue' }
  ];

  if (loading) return <div className="flex h-64 items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-12 animate-in fade-in duration-500">
      
      {/* Mentorship Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl">
                {showRequestModal.displayName.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Consult with {showRequestModal.displayName}</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Growth Protocol Initiation</p>
              </div>
            </div>

            <form onSubmit={handleRequest} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Target Domain</label>
                <div className="grid grid-cols-2 gap-2">
                  {domains.map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setRequestData({...requestData, topic: d.id})}
                      className={`p-3 rounded-xl border text-xs font-black uppercase transition-all flex items-center space-x-2 ${
                        requestData.topic === d.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-500 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {d.icon}
                      <span>{d.id}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Context / Inquiry</label>
                <textarea 
                  required
                  rows={4}
                  placeholder="Share your specific goals or questions for this session..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all resize-none"
                  value={requestData.message}
                  onChange={e => setRequestData({...requestData, message: e.target.value})}
                />
              </div>

              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowRequestModal(null)}
                  className="flex-1 py-4 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Zap size={18} /><span>Request Session</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none rotate-12">
          <Users size={200} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block px-4 py-1.5 bg-indigo-600 text-white text-[10px] font-black rounded-full uppercase tracking-[0.2em] mb-6">Expert Network</span>
          <h2 className="text-5xl font-black mb-6 uppercase tracking-tighter italic">Mentorship <span className="text-indigo-400">Nexus</span></h2>
          <p className="text-slate-300 text-lg font-medium leading-relaxed mb-10">Accelerate your journey by connecting with faculty experts and elite peers. Seek guidance, validate skills, and unlock the next stage of your career.</p>
          <div className="flex flex-wrap gap-8">
             <div className="flex flex-col">
                <span className="text-3xl font-black">{mentors.length}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Active Mentors</span>
             </div>
             <div className="h-10 w-px bg-white/10 hidden sm:block"></div>
             <div className="flex flex-col">
                <span className="text-3xl font-black">4</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Domains of Expertise</span>
             </div>
          </div>
        </div>
      </section>

      {/* Discovery Feed */}
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Find experts by name or skill..." 
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
             {domains.map(d => (
               <button 
                 key={d.id} 
                 onClick={() => setSelectedTopic(selectedTopic === d.id ? null : d.id)}
                 className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap flex items-center space-x-2 ${
                   selectedTopic === d.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                 }`}
               >
                 {d.icon}
                 <span>{d.id}</span>
               </button>
             ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredMentors.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-30">
               <Users className="mx-auto mb-4" size={48} />
               <p className="text-lg font-black uppercase tracking-[0.2em]">No mentors matching your criteria</p>
            </div>
          ) : (
            filteredMentors.map(mentor => (
              <div key={mentor.uid} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/30 group hover:translate-y-[-4px] transition-all flex flex-col h-full">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                      {mentor.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight truncate max-w-[140px]">{mentor.displayName}</h3>
                      <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                         {mentor.role === 'admin' ? <Star size={10} className="mr-1 text-amber-500" /> : <Zap size={10} className="mr-1 text-indigo-400" />}
                         <span>{mentor.role === 'admin' ? 'Faculty Expert' : 'Elite Peer'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-indigo-600 leading-none">{mentor.points}</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Growth XP</p>
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Core Expertise</p>
                    <div className="flex flex-wrap gap-2">
                      {(mentor.interests || []).slice(0, 4).map(skill => (
                        <span key={skill} className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-100 uppercase tracking-wide">#{skill}</span>
                      ))}
                    </div>
                  </div>
                  
                  {mentor.achievements && mentor.achievements.length > 0 && (
                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                       <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center">
                         <Award size={10} className="mr-1" /> Latest Commendation
                       </p>
                       <p className="text-[11px] font-bold text-slate-800 line-clamp-1">{mentor.achievements[0].title}</p>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => setShowRequestModal(mentor)}
                  className="mt-8 w-full py-4 bg-white border border-indigo-600 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 hover:text-white transition-all shadow-lg shadow-indigo-100/20 active:scale-95 flex items-center justify-center group/btn"
                >
                  Initiate Counsel
                  <ChevronRight size={14} className="ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorshipHub;
