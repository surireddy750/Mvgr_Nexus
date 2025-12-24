
import React, { useEffect, useState, useMemo } from 'react';
import { firebase } from '../services/firebase';
import { Club, User } from '../types';
import { 
  Search, 
  Users, 
  ChevronRight, 
  Loader2, 
  Plus, 
  ShieldCheck, 
  Clock, 
  LayoutGrid, 
  Sparkles,
  ArrowUpRight,
  Filter,
  X,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ClubsExplorerProps {
  user: User;
}

const ClubsExplorer: React.FC<ClubsExplorerProps> = ({ user }) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Technology', 'Social Service', 'Cultural', 'Sports', 'Entrepreneurship'];

  const fetchClubs = async () => {
    try {
      const data = await firebase.getClubs();
      setClubs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  const handleJoinRequest = async (clubId: string) => {
    try {
      await firebase.requestToJoinClub(clubId, user.uid);
      alert('Join request transmitted to organization leadership.');
      fetchClubs(); // Refresh to show pending status
    } catch (e) {
      alert('Failed to transmit request.');
    }
  };

  const filteredClubs = useMemo(() => {
    return clubs.filter(club => {
      const matchesSearch = club.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           club.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || club.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [clubs, searchQuery, selectedCategory]);

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
      <header className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <LayoutGrid size={240} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-5xl font-black mb-6 uppercase tracking-tighter italic leading-none">
            Organization <span className="text-indigo-400">Registry</span>
          </h1>
          <p className="text-indigo-100 text-lg font-medium opacity-80 leading-relaxed">
            The heart of the Nexus. Join specialized collectives to collaborate, compete, and grow your expertise within the MVGR ecosystem.
          </p>
        </div>
      </header>

      <div className="flex flex-col space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search registry by name or mission..." 
              className="w-full pl-14 pr-12 py-5 bg-white border border-slate-200 rounded-[2rem] text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all shadow-lg shadow-slate-200/20"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-1.5 text-slate-300 hover:text-red-500 transition-colors animate-in zoom-in duration-200"
              >
                <X size={20} />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-2 bg-slate-100 p-2 rounded-[1.5rem] shadow-inner overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button 
                key={cat} 
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  selectedCategory === cat ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Discovery Status */}
        <div className="flex items-center justify-between px-4">
           <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Target size={16} />
              </div>
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em]">
                {filteredClubs.length} Collectives Scanning...
              </span>
           </div>
           {searchQuery && (
             <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full border border-indigo-100 uppercase tracking-widest animate-pulse">
               Filtered Registry
             </span>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredClubs.length === 0 ? (
            <div className="col-span-full py-32 text-center border-2 border-dashed border-slate-200 rounded-[3rem] bg-white animate-in fade-in duration-500">
              <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <Search className="text-slate-200" size={40} />
              </div>
              <p className="text-xl font-black text-slate-900 uppercase tracking-tighter italic mb-2">No Match in Registry</p>
              <p className="text-slate-400 text-sm font-medium mb-8">Try adjusting your search query or switching categories.</p>
              <button 
                onClick={() => {setSearchQuery(''); setSelectedCategory('All');}} 
                className="px-8 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95"
              >
                Reset Discovery Logic
              </button>
            </div>
          ) : (
            filteredClubs.map(club => {
              const isMember = club.members.includes(user.uid);
              const isPending = club.pendingRequests?.includes(user.uid);
              const isAdmin = club.adminUid === user.uid;

              return (
                <div key={club.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-xl shadow-slate-200/40 hover:translate-y-[-6px] transition-all group flex flex-col h-full hover:border-indigo-200">
                  <div className="flex items-start justify-between mb-8">
                    <div className="relative">
                      <img 
                        src={club.logoUrl || `https://picsum.photos/seed/${club.id}/200`} 
                        className="w-16 h-16 rounded-2xl object-cover shadow-lg border border-slate-100 group-hover:scale-110 transition-transform" 
                      />
                      {isAdmin && (
                        <div className="absolute -top-2 -right-2 bg-indigo-600 text-white p-1.5 rounded-lg shadow-lg border-2 border-white">
                          <ShieldCheck size={12} />
                        </div>
                      )}
                    </div>
                    <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full border border-indigo-100 uppercase tracking-widest">
                      {club.category}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                    {club.name}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed font-medium line-clamp-3 mb-10">
                    {club.description}
                  </p>

                  <div className="mt-auto space-y-6">
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex items-center space-x-2">
                        <Users size={16} className="text-indigo-600" />
                        <span className="text-xs font-black text-slate-900 uppercase">
                          {club.members.length} <span className="text-slate-400">Operatives</span>
                        </span>
                      </div>
                      
                      <Link to={`/club/${club.id}`} className="p-2.5 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                        <ArrowUpRight size={20} />
                      </Link>
                    </div>

                    <div className="flex gap-3">
                      {isAdmin ? (
                        <Link to="/" className="flex-1 bg-slate-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center shadow-xl hover:bg-slate-800 transition-all">
                          Management Hub
                        </Link>
                      ) : isMember ? (
                        <Link to={`/club/${club.id}`} className="flex-1 bg-emerald-50 text-emerald-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-emerald-100 flex items-center justify-center">
                          <ShieldCheck size={14} className="mr-2" /> Verified Operative
                        </Link>
                      ) : isPending ? (
                        <div className="flex-1 bg-amber-50 text-amber-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-amber-100 flex items-center justify-center">
                          <Clock size={14} className="mr-2" /> Signal Pending
                        </div>
                      ) : (
                        <button 
                          onClick={() => handleJoinRequest(club.id)}
                          className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center"
                        >
                          <Plus size={16} className="mr-2" /> Request Entry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default ClubsExplorer;
