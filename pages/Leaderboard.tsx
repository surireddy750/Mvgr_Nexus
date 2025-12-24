
import React, { useEffect, useState } from 'react';
import { firebase } from '../services/firebase';
import { User, Badge } from '../types';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star, 
  Zap, 
  Terminal, 
  Calendar, 
  MessageSquare, 
  Eye,
  TrendingUp,
  Award,
  Users,
  Flame,
  Clock,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';

const BadgeIconMap: Record<string, React.ReactNode> = {
  Zap: <Zap size={20} />,
  Terminal: <Terminal size={20} />,
  Calendar: <Calendar size={20} />,
  MessageSquare: <MessageSquare size={20} />,
  Eye: <Eye size={20} />
};

const Leaderboard: React.FC = () => {
  const [topUsers, setTopUsers] = useState<User[]>([]);
  const [badgeDefinitions, setBadgeDefinitions] = useState<Badge[]>([]);
  const [recentAchievements, setRecentAchievements] = useState<{userName: string, achievement: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecognition = async () => {
      try {
        const [users, badges, achievements] = await Promise.all([
          firebase.getLeaderboard(),
          firebase.getBadgeDefinitions(),
          firebase.getRecentAchievements()
        ]);
        setTopUsers(users);
        setBadgeDefinitions(badges);
        setRecentAchievements(achievements);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadRecognition();
    const interval = setInterval(loadRecognition, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  const topThree = topUsers.slice(0, 3);
  const others = topUsers.slice(3);

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hall of Fame Hero */}
      <section className="bg-gradient-to-br from-indigo-950 via-indigo-900 to-indigo-800 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Trophy size={240} />
        </div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-[100px]"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-xl text-center md:text-left">
            <span className="inline-block px-4 py-1.5 bg-indigo-500/30 text-indigo-200 text-[10px] font-black rounded-full border border-white/10 uppercase tracking-[0.2em] mb-6">Hall of Fame</span>
            <h2 className="text-5xl font-black mb-6 uppercase tracking-tighter italic leading-tight">Elite <br/><span className="text-indigo-400">Growth League</span></h2>
            <p className="text-indigo-100 text-lg opacity-80 leading-relaxed mb-8">Honoring the students pushing the boundaries of technology, leadership, and community service at MVGR.</p>
            <div className="flex items-center justify-center md:justify-start space-x-6">
               <div className="text-center">
                  <p className="text-3xl font-black text-white">{topUsers.length}</p>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Active Players</p>
               </div>
               <div className="h-8 w-px bg-white/10"></div>
               <div className="text-center">
                  <p className="text-3xl font-black text-white">{topUsers.reduce((acc, u) => acc + (u.badges?.length || 0), 0)}</p>
                  <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Badges Awarded</p>
               </div>
            </div>
          </div>

          <div className="flex items-end space-x-4 md:space-x-8">
            {/* Podium */}
            {topThree[1] && (
              <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-100">
                <div className="w-16 h-16 rounded-2xl bg-slate-300 flex items-center justify-center text-slate-700 font-black mb-4 shadow-lg border-2 border-white/20">
                  {topThree[1].displayName.charAt(0).toUpperCase()}
                </div>
                <div className="w-20 md:w-24 bg-slate-400/30 backdrop-blur-md h-24 rounded-t-2xl flex flex-col items-center p-4 border border-white/10">
                   <span className="text-2xl font-black text-slate-200">#2</span>
                </div>
              </div>
            )}
            {topThree[0] && (
              <div className="flex flex-col items-center animate-in slide-in-from-bottom-12 duration-700">
                <div className="relative mb-4">
                  <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 text-yellow-400 drop-shadow-lg" size={32} />
                  <div className="w-20 h-20 rounded-2xl bg-yellow-400 flex items-center justify-center text-indigo-900 font-black text-xl shadow-2xl border-4 border-white/20 rotate-3">
                    {topThree[0].displayName.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="w-24 md:w-32 bg-yellow-400/20 backdrop-blur-md h-40 rounded-t-2xl flex flex-col items-center p-6 border border-white/20 shadow-2xl">
                   <span className="text-4xl font-black text-yellow-400">#1</span>
                </div>
              </div>
            )}
            {topThree[2] && (
              <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-200">
                <div className="w-16 h-16 rounded-2xl bg-amber-600 flex items-center justify-center text-amber-100 font-black mb-4 shadow-lg border-2 border-white/20">
                  {topThree[2].displayName.charAt(0).toUpperCase()}
                </div>
                <div className="w-20 md:w-24 bg-amber-600/30 backdrop-blur-md h-16 rounded-t-2xl flex flex-col items-center p-4 border border-white/10">
                   <span className="text-xl font-black text-amber-200">#3</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                   <Flame size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest italic">Global Ranking</h3>
              </div>
              <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100 uppercase tracking-widest flex items-center">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                Sync Live
              </span>
            </div>
            
            <div className="divide-y divide-slate-50">
              {topThree.map((user, idx) => (
                <div key={user.uid} className="p-6 flex items-center transition-all hover:bg-indigo-50/30 group">
                   <div className="w-12 flex justify-center mr-4">
                      {idx === 0 ? <Crown className="text-yellow-400" size={28} /> :
                       idx === 1 ? <Medal className="text-slate-300" size={28} /> :
                       <Medal className="text-amber-600" size={28} />}
                   </div>

                   <Link to={`/profile/${user.uid}`} className="flex-1 flex items-center space-x-5 min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl group-hover:scale-110 transition-transform shadow-sm">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 uppercase tracking-wide truncate group-hover:text-indigo-600 transition-colors">{user.displayName}</p>
                        <div className="flex items-center space-x-2 mt-0.5">
                           <span className="text-[10px] text-slate-400 font-bold uppercase">{user.role}</span>
                           <span className="text-slate-200">|</span>
                           <div className="flex items-center space-x-1">
                              {(user.badges || []).slice(0, 3).map(bId => (
                                <Award key={bId} size={12} className="text-indigo-400" />
                              ))}
                              {(user.badges?.length || 0) > 3 && <span className="text-[8px] text-indigo-400 font-black">+{user.badges.length - 3}</span>}
                           </div>
                        </div>
                      </div>
                   </Link>

                   <div className="flex items-center space-x-3 px-6 py-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-100">
                      <TrendingUp size={16} />
                      <span className="text-lg font-black">{user.points} <span className="text-[10px] uppercase opacity-70">PTS</span></span>
                   </div>
                </div>
              ))}

              {others.map((user, idx) => (
                <div key={user.uid} className={`p-5 flex items-center transition-all hover:bg-slate-50/50 group`}>
                   <div className="w-12 flex justify-center mr-4">
                      <span className="text-lg font-black text-slate-300 italic">#{idx + 4}</span>
                   </div>

                   <Link to={`/profile/${user.uid}`} className="flex-1 flex items-center space-x-4 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        {user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-900 uppercase tracking-wide truncate group-hover:text-indigo-600 transition-colors text-sm">{user.displayName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{user.role}</p>
                      </div>
                   </Link>

                   <div className="flex items-center space-x-2 px-4 py-2 bg-slate-50 rounded-2xl border border-slate-100 group-hover:border-indigo-200 transition-colors">
                      <TrendingUp size={14} className="text-indigo-600" />
                      <span className="text-sm font-black text-slate-800">{user.points} <span className="text-[8px] uppercase text-slate-400">PTS</span></span>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
              <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-widest flex items-center">
                <Clock className="mr-3 text-indigo-600" /> Recognition
              </h3>
              
              <div className="space-y-6 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                {recentAchievements.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-8">Waiting for excellence...</p>
                ) : (
                  recentAchievements.map((item, idx) => (
                    <div key={idx} className="flex space-x-4 group animate-in fade-in slide-in-from-right-4 duration-300" style={{animationDelay: `${idx * 100}ms`}}>
                       <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 group-hover:scale-110 transition-transform">
                          <CheckCircle2 size={20} />
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-slate-900 uppercase truncate tracking-tight">{item.userName}</p>
                          <p className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-2">{item.achievement}</p>
                       </div>
                    </div>
                  ))
                )}
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 p-8">
              <h3 className="text-xl font-black text-slate-900 mb-8 uppercase tracking-widest flex items-center">
                <Award className="mr-3 text-indigo-600" /> Badge Guide
              </h3>
              
              <div className="space-y-6">
                {badgeDefinitions.map(badge => (
                  <div key={badge.id} className="flex space-x-4 group">
                     <div className={`w-12 h-12 rounded-2xl bg-${badge.color}-50 text-${badge.color}-600 flex items-center justify-center border border-${badge.color}-100 shrink-0 group-hover:rotate-12 transition-transform shadow-sm`}>
                        {BadgeIconMap[badge.icon] || <Zap size={20} />}
                     </div>
                     <div>
                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{badge.name}</h4>
                        <p className="text-[10px] text-slate-500 leading-relaxed mt-1 font-medium">{badge.description}</p>
                     </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-10 p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 relative overflow-hidden">
                 <Sparkles className="absolute top-2 right-2 text-indigo-200 opacity-50" size={40} />
                 <p className="text-[10px] font-black text-indigo-700 uppercase tracking-[0.2em] mb-3">Ascend the Ranks</p>
                 <p className="text-xs text-indigo-600 leading-relaxed font-medium relative z-10">Contributions to events and validating skills with club admins earn you top tier badges and recognition.</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
