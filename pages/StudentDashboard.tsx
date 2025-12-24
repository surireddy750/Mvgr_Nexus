
import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { firebase } from '../services/firebase';
import { geminiService } from '../services/gemini';
import { User, Club, Post, CollegeEvent } from '../types';
import { 
  Calendar, 
  Search, 
  Sparkles, 
  MessageCircle,
  Heart,
  MapPin,
  Loader2,
  TrendingUp,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
  FileText,
  Download
} from 'lucide-react';

interface StudentDashboardProps { user: User; }

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [events, setEvents] = useState<CollegeEvent[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isRefreshingRecs, setIsRefreshingRecs] = useState(false);
  const [isModerating, setIsModerating] = useState<string | null>(null);
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({});

  const fetchAIRecommendations = async (allClubs: Club[]) => {
    if (allClubs.length === 0) return;
    setIsRefreshingRecs(true);
    try {
      const recIds = await geminiService.getRecommendations(
        user.interests || ['technology'],
        user.joinedClubs || [],
        user.achievements || [],
        allClubs
      );
      setRecommendations(recIds);
    } catch (error) {
      console.error("AI Recommendation failed", error);
    } finally {
      setIsRefreshingRecs(false);
    }
  };

  const loadData = async () => {
    try {
      const [allClubs, allEvents, allPosts] = await Promise.all([
        firebase.getClubs(),
        firebase.getEvents(),
        firebase.getPosts()
      ]);
      setClubs(allClubs);
      setEvents(allEvents);
      setPosts(allPosts);
      fetchAIRecommendations(allClubs);
    } catch (e) {
      console.error("Data load failed", e);
    }
  };

  useEffect(() => { loadData(); }, [user.uid]);

  const handleAddComment = async (postId: string) => {
    const text = commentTexts[postId];
    if (!text?.trim()) return;

    setIsModerating(postId);
    try {
      // 1. Gemini Moderation
      const moderation = await geminiService.moderateComment(text);
      if (moderation.isFlagged) {
        alert(`Content Blocked: ${moderation.reason || 'Your comment violates community guidelines.'}`);
        return;
      }

      // 2. Post to Firebase
      await firebase.addComment(postId, {
        userUid: user.uid,
        userName: user.displayName,
        text
      });
      
      setCommentTexts(prev => ({ ...prev, [postId]: '' }));
      const updatedPosts = await firebase.getPosts();
      setPosts(updatedPosts);
    } catch (error) {
      console.error(error);
    } finally {
      setIsModerating(null);
    }
  };

  const handleToggleLike = async (postId: string) => {
    await firebase.toggleLikePost(postId, user.uid);
    const updated = await firebase.getPosts();
    setPosts(updated);
  };

  const recommendedClubs = useMemo(() => {
    return clubs.filter(c => recommendations.includes(c.id));
  }, [clubs, recommendations]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <header className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">NEXUS FEED</h1>
            <p className="text-slate-500 font-medium uppercase text-[10px] tracking-[0.2em]">Live updates from verified organizations</p>
          </header>

          <div className="space-y-6">
            {posts.length === 0 ? (
              <div className="p-20 text-center bg-white border border-slate-100 rounded-[2rem]">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No transmissions found in the grid</p>
              </div>
            ) : posts.map(post => (
              <article key={post.id} className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-all">
                <div className="p-6 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">
                      {post.clubName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{post.clubName}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{new Date(post.timestamp).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-6">
                  <p className="text-slate-700 text-sm leading-relaxed mb-6">{post.content}</p>
                  
                  {post.mediaUrl && (
                    <div className="rounded-[1.5rem] overflow-hidden border border-slate-100 mb-6 bg-slate-50 shadow-inner">
                      {post.mediaType === 'image' && <img src={post.mediaUrl} className="w-full h-auto max-h-[500px] object-contain" alt="Broadcast Media" />}
                      {post.mediaType === 'video' && <video src={post.mediaUrl} className="w-full" controls />}
                      {post.mediaType === 'file' && (
                        <div className="p-6 flex justify-between items-center bg-white">
                          <div className="flex items-center space-x-4 min-w-0 flex-1">
                            <div className="p-3 bg-slate-50 rounded-xl text-primary shadow-sm shrink-0 border border-slate-100"><FileText size={28} /></div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{post.fileName || "Nexus Resource"}</p>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Protocol Documentation</p>
                            </div>
                          </div>
                          <a href={post.mediaUrl} download={post.fileName || "nexus-resource"} className="px-5 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 ml-4 shrink-0 flex items-center">
                            <Download size={14} className="mr-2" /> Download
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-6 pt-4 border-t border-slate-50">
                    <button 
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center space-x-2 text-xs font-black uppercase tracking-widest ${post.likes?.includes(user.uid) ? 'text-red-500' : 'text-slate-400'}`}
                    >
                      <Heart size={18} fill={post.likes?.includes(user.uid) ? "currentColor" : "none"} />
                      <span>{post.likes?.length || 0}</span>
                    </button>
                    <div className="flex items-center space-x-2 text-slate-400 text-xs font-black uppercase tracking-widest">
                      <MessageCircle size={18} />
                      <span>{post.comments?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 p-6 space-y-4">
                  <div className="space-y-3">
                    {post.comments?.slice(-2).map((c, idx) => (
                      <div key={idx} className="flex space-x-2">
                        <span className="text-[10px] font-black text-slate-900 uppercase shrink-0">{c.userName}:</span>
                        <p className="text-[10px] text-slate-600 font-medium">{c.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder={isModerating === post.id ? "Gemini analyzing..." : "Broadcast comment..."}
                      disabled={isModerating === post.id}
                      className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-[10px] font-bold outline-none focus:ring-2 focus:ring-indigo-600/10 disabled:opacity-50"
                      value={commentTexts[post.id] || ''}
                      onChange={e => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                      onKeyDown={e => e.key === 'Enter' && handleAddComment(post.id)}
                    />
                    {isModerating === post.id && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 size={14} className="animate-spin text-indigo-600" />
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6 pt-16">
          <section className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xs font-black text-slate-900 flex items-center uppercase tracking-widest">
                <Sparkles size={16} className="mr-2 text-amber-500" /> Suggested for You
              </h2>
              <button onClick={() => fetchAIRecommendations(clubs)} disabled={isRefreshingRecs}>
                <RefreshCw size={14} className={`text-slate-400 ${isRefreshingRecs ? 'animate-spin' : ''}`} />
              </button>
            </div>
            
            <div className="space-y-4">
              {recommendedClubs.length > 0 ? recommendedClubs.map(club => (
                <Link to={`/club/${club.id}`} key={club.id} className="flex items-center p-3 hover:bg-slate-50 rounded-2xl transition-all group">
                  <img src={club.logoUrl || `https://picsum.photos/seed/${club.id}/200`} className="w-10 h-10 rounded-xl object-cover mr-4 shadow-sm" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-black text-slate-900 uppercase truncate group-hover:text-indigo-600">{club.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">{club.category}</p>
                  </div>
                </Link>
              )) : (
                <div className="py-4 text-center">
                  <p className="text-[9px] text-slate-400 italic">Analyzing interests for custom suggestions...</p>
                </div>
              )}
            </div>
          </section>

          <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-xl">
             <div className="flex items-center space-x-3 mb-6">
                <TrendingUp className="text-indigo-400" size={20} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Nexus Standing</p>
             </div>
             <p className="text-4xl font-black italic mb-2">{user.points}</p>
             <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Growth XP Earned</p>
             <Link to="/leaderboard" className="mt-8 flex items-center justify-center w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                View Global Rank
                <ChevronRight size={14} className="ml-1" />
             </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
