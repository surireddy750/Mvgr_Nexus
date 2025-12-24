
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { firebase } from '../services/firebase';
import { User, Achievement, Badge } from '../types';
import { 
  Trophy, 
  Award, 
  Terminal, 
  Calendar, 
  MessageSquare, 
  Eye, 
  Star,
  ShieldCheck,
  Rocket,
  ArrowRight,
  Clock,
  Loader2,
  Mail,
  Zap
} from 'lucide-react';

interface ProfileProps {
  currentUser: User;
}

const Profile: React.FC<ProfileProps> = ({ currentUser }) => {
  const { uid } = useParams<{ uid: string }>();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (uid) {
        const [u, b] = await Promise.all([
          firebase.getUserById(uid),
          firebase.getBadgeDefinitions()
        ]);
        setProfileUser(u || null);
        setBadges(b);
      }
      setLoading(false);
    };
    fetch();
  }, [uid]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!profileUser) return <div className="p-20 text-center text-slate-500">User not found</div>;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 space-y-12 animate-in fade-in duration-500">
      <div className="bg-white border border-slate-200 rounded-[2.5rem] p-10 flex flex-col md:flex-row items-center gap-10 shadow-xl shadow-slate-200/40">
        <div className="w-32 h-32 rounded-[2.5rem] bg-indigo-600 flex items-center justify-center text-white text-5xl font-black shadow-2xl shadow-indigo-100 italic border-4 border-white">
          {profileUser.displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-3">
            <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">{profileUser.displayName}</h1>
            <span className="px-5 py-1.5 bg-indigo-50 text-primary text-[10px] font-black rounded-full uppercase tracking-[0.2em] border border-indigo-100">{profileUser.role}</span>
          </div>
          <p className="text-slate-400 flex items-center justify-center md:justify-start mb-8 font-black uppercase tracking-widest text-[10px]">
            <Mail size={16} className="mr-3 text-indigo-400" />
            {profileUser.email}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-6">
            <div className="bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100 flex items-center space-x-4 shadow-inner">
              <Trophy size={20} className="text-indigo-600" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global XP</p>
                <p className="text-2xl font-black text-slate-900 italic leading-none mt-1">{profileUser.points}</p>
              </div>
            </div>
            <div className="bg-slate-50 px-8 py-4 rounded-2xl border border-slate-100 flex items-center space-x-4 shadow-inner">
              <Award size={20} className="text-indigo-600" />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Badges</p>
                <p className="text-2xl font-black text-slate-900 italic leading-none mt-1">{profileUser.badges?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-widest flex items-center">
            <ShieldCheck size={24} className="mr-3 text-emerald-500" /> Validated Skills
          </h2>
          <div className="flex flex-wrap gap-3">
            {profileUser.interests?.map(skill => (
              <span key={skill} className="px-5 py-2.5 bg-slate-50 text-slate-700 text-[10px] font-black rounded-xl border border-slate-100 uppercase tracking-widest group hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all cursor-default shadow-sm">#{skill}</span>
            ))}
            {(!profileUser.interests || profileUser.interests.length === 0) && <p className="text-sm text-slate-400 italic">No skills validated in the Nexus.</p>}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 mb-8 uppercase tracking-widest flex items-center">
            <Award size={24} className="mr-3 text-amber-500" /> Earned Badges
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {profileUser.badges?.map(bId => {
              const b = badges.find(x => x.id === bId);
              if (!b) return null;
              return (
                <div key={bId} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center space-x-4 hover:bg-white hover:shadow-md transition-all group">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform"><Zap size={20} /></div>
                  <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest leading-tight">{b.name}</span>
                </div>
              );
            })}
            {(!profileUser.badges || profileUser.badges.length === 0) && <p className="col-span-full text-sm text-slate-400 italic py-4">No badges discovered yet.</p>}
          </div>
        </section>
      </div>

      <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
        <h2 className="text-xl font-black text-slate-900 mb-10 uppercase tracking-widest flex items-center italic">
          <Clock size={24} className="mr-3 text-indigo-600" /> Mission Archive
        </h2>
        <div className="space-y-10 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
          {(profileUser.achievements || []).sort((a,b) => b.date - a.date).map(ach => (
            <div key={ach.id} className="relative pl-12 group">
              <div className="absolute left-0 top-2 w-8 h-8 rounded-xl bg-white border-2 border-indigo-600 shadow-xl shadow-indigo-100 group-hover:scale-110 transition-transform z-10 flex items-center justify-center">
                 <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 group-hover:bg-white group-hover:shadow-xl group-hover:shadow-slate-200/50 transition-all border-l-4 border-l-indigo-600">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight italic">{ach.title}</h4>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(ach.date).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">{ach.description}</p>
              </div>
            </div>
          ))}
          {(!profileUser.achievements || profileUser.achievements.length === 0) && (
            <div className="text-center py-20 opacity-30">
               <Eye className="mx-auto mb-4" size={48} />
               <p className="text-sm font-black uppercase tracking-widest">No achievements detected</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Profile;
