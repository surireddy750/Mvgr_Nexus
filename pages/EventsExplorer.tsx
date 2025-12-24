
import React, { useEffect, useState, useRef } from 'react';
import { firebase } from '../services/firebase';
import { geminiService } from '../services/gemini';
import { CollegeEvent, Club, User } from '../types';
import { 
  Calendar, 
  Search, 
  MapPin, 
  Clock, 
  ArrowRight, 
  Loader2,
  Filter,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Users,
  Terminal,
  ChevronRight,
  Plus,
  X,
  Rocket,
  Video,
  Trash2,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface EventsExplorerProps {
  user?: User;
}

const EventsExplorer: React.FC<EventsExplorerProps> = ({ user }) => {
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  
  // AI Summarization states
  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({});
  const [summarizingIds, setSummarizingIds] = useState<Set<string>>(new Set());
  
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [proposalData, setProposalData] = useState({
    clubId: '',
    title: '',
    description: '',
    date: '',
    location: '',
    type: 'Workshop'
  });

  const fetchAll = async () => {
    try {
      const [e, c] = await Promise.all([firebase.getEvents(), firebase.getClubs()]);
      setEvents(e);
      setClubs(c);
      
      // Trigger auto-summarization for events without summaries
      generateMissingSummaries(e);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateMissingSummaries = async (eventList: CollegeEvent[]) => {
    const missing = eventList.filter(ev => !ev.summary);
    
    for (const ev of missing) {
      if (summarizingIds.has(ev.id) || aiSummaries[ev.id]) continue;
      
      setSummarizingIds(prev => new Set(prev).add(ev.id));
      try {
        const highlight = await geminiService.summarizeEvent(ev);
        setAiSummaries(prev => ({ ...prev, [ev.id]: highlight }));
      } catch (err) {
        console.error(`Failed to summarize event ${ev.id}`, err);
      } finally {
        setSummarizingIds(prev => {
          const next = new Set(prev);
          next.delete(ev.id);
          return next;
        });
      }
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setVideoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleProposeEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    setUploadProgress(10);
    try {
      let videoUrl = '';
      if (videoFile) {
        setUploadProgress(40);
        videoUrl = await firebase.uploadMedia(videoFile);
        setUploadProgress(80);
      }

      await firebase.proposeEvent({
        ...proposalData,
        proposedByUid: user.uid,
        proposerName: user.displayName,
        type: proposalData.type as any,
        videoUrl: videoUrl || undefined
      });
      
      setUploadProgress(100);
      alert('Event proposal submitted! Wait for admin approval.');
      setShowProposeModal(false);
      setProposalData({ clubId: '', title: '', description: '', date: '', location: '', type: 'Workshop' });
      setVideoFile(null);
      setVideoPreview(null);
    } catch (err) {
      alert('Failed to submit proposal.');
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const filters = ['All', 'Workshop', 'Competition', 'Seminar', 'Hackathon'];

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         e.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === 'All' || e.type === activeFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-12 animate-in fade-in duration-500">
      {showProposeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 flex items-center mb-8"><Rocket className="mr-3 text-indigo-600" /> Propose Mission</h3>
            <form onSubmit={handleProposeEvent} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Organization</label>
                <select required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={proposalData.clubId} onChange={e => setProposalData({...proposalData, clubId: e.target.value})}>
                  <option value="">Select a Club</option>
                  {clubs.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
                </select>
              </div>
              <input required type="text" placeholder="Title" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={proposalData.title} onChange={e => setProposalData({...proposalData, title: e.target.value})} />
              <textarea required rows={4} placeholder="Description" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none resize-none" value={proposalData.description} onChange={e => setProposalData({...proposalData, description: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="date" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={proposalData.date} onChange={e => setProposalData({...proposalData, date: e.target.value})} />
                <input required type="text" placeholder="Location" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none" value={proposalData.location} onChange={e => setProposalData({...proposalData, location: e.target.value})} />
              </div>
              
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tactical Asset (Video)</label>
                <input type="file" ref={videoInputRef} className="hidden" onChange={handleVideoChange} accept="video/*" />
                <button type="button" onClick={() => videoInputRef.current?.click()} className="w-full p-4 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center space-x-3 text-slate-400 hover:border-indigo-600 hover:text-indigo-600 transition-all">
                  <Video size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest">{videoFile ? videoFile.name : 'Attach Briefing Video'}</span>
                </button>
                {videoPreview && (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-black">
                    <video src={videoPreview} className="w-full h-full object-contain" controls />
                    <button type="button" onClick={() => {setVideoFile(null); setVideoPreview(null);}} className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg shadow-lg"><Trash2 size={16} /></button>
                  </div>
                )}
                {uploadProgress > 0 && (
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                <button type="button" onClick={() => setShowProposeModal(false)} className="flex-1 py-4 text-slate-500 text-xs font-black uppercase tracking-widest hover:bg-slate-50 rounded-2xl">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100">
                  {isSubmitting ? <Loader2 className="animate-spin mx-auto" /> : 'Propose Protocol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-slate-200">
        <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">Nexus <span className="text-indigo-600">Events</span></h1>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl shadow-inner overflow-x-auto scrollbar-hide">
             {filters.map(f => (
               <button key={f} onClick={() => setActiveFilter(f)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === f ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{f}</button>
             ))}
          </div>
          <button onClick={() => setShowProposeModal(true)} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center"><Plus size={18} className="mr-2" />Propose Event</button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
        {filteredEvents.map(event => {
          const club = clubs.find(c => c.id === event.clubId);
          const summaryText = event.summary || aiSummaries[event.id];
          const isSummarizing = summarizingIds.has(event.id);
          
          return (
            <div key={event.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 shadow-xl shadow-slate-200/40 group hover:translate-y-[-4px] transition-all flex flex-col h-full">
              {event.videoUrl && (
                <div className="aspect-video bg-black overflow-hidden">
                  <video src={event.videoUrl} className="w-full h-full object-cover" controls />
                </div>
              )}
              <div className="p-8 flex-1">
                <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                {club && <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center"><Users size={12} className="mr-2" />{club.name}</p>}
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed font-medium mb-4">{event.description}</p>
                
                <div className={`p-5 rounded-2xl border transition-all duration-500 ${
                  isSummarizing ? 'bg-indigo-50/50 border-indigo-100 animate-pulse' : 'bg-slate-50 border-slate-100'
                }`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles size={14} className={isSummarizing ? 'text-indigo-400 animate-spin' : 'text-indigo-600'} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600">Tactical Highlight</span>
                  </div>
                  
                  {isSummarizing ? (
                    <div className="space-y-2">
                      <div className="h-2 w-full bg-indigo-100 rounded"></div>
                      <div className="h-2 w-2/3 bg-indigo-100 rounded"></div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-700 font-bold italic leading-relaxed">
                      {summaryText || "Registration phase active."}
                    </p>
                  )}
                </div>
              </div>
              <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest"><MapPin size={14} className="mr-1.5 text-slate-400" />{event.location}</div>
                <Link to={`/club/${event.clubId}`} className="px-6 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-100">Details</Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventsExplorer;
