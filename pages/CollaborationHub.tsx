
import React, { useEffect, useState, useMemo } from 'react';
import { firebase } from '../services/firebase';
import { geminiService } from '../services/gemini';
import { User, Project } from '../types';
import { 
  Rocket, 
  Plus, 
  Search, 
  Users, 
  CheckCircle2, 
  Clock, 
  X, 
  Briefcase,
  Loader2,
  MessageSquare,
  ChevronRight,
  Zap,
  Filter,
  ShieldCheck,
  Sparkles,
  Trophy,
  Mail,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface CollaborationHubProps {
  user: User;
}

type StatusFilter = 'all' | 'recruiting' | 'in-progress' | 'completed' | 'my-projects';

interface AISuggestion {
  uid: string;
  score: number;
  insight: string;
  userData?: User;
}

const CollaborationHub: React.FC<CollaborationHubProps> = ({ user }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  
  // AI Suggestion State
  const [projectAiInsights, setProjectAiInsights] = useState<Record<string, AISuggestion[]>>({});
  const [loadingInsights, setLoadingInsights] = useState<Set<string>>(new Set());
  const [expandedInsights, setExpandedInsights] = useState<Set<string>>(new Set());

  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    tags: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    try {
      const data = await firebase.getProjects();
      setProjects(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  // Compute all unique skills available across all projects for the filter UI
  const allAvailableSkills = useMemo(() => {
    const skills = new Set<string>();
    projects.forEach(p => {
      p.requiredSkills.forEach(s => skills.add(s));
    });
    return Array.from(skills).sort();
  }, [projects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await firebase.createProject({
        title: newProject.title,
        description: newProject.description,
        ownerUid: user.uid,
        ownerName: user.displayName,
        requiredSkills: newProject.requiredSkills.split(',').map(s => s.trim()).filter(s => s !== ''),
        tags: newProject.tags.split(',').map(t => t.trim()).filter(t => t !== '')
      });
      await firebase.awardPoints(user.uid, 50, 'Started a new collaboration project');
      setShowCreateModal(false);
      setNewProject({ title: '', description: '', requiredSkills: '', tags: '' });
      fetchProjects();
    } catch (error) {
      console.error(error);
      alert('Failed to create project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApply = async (projectId: string) => {
    await firebase.applyToProject(projectId, user.uid);
    alert('Application sent to project owner!');
    fetchProjects();
  };

  const handleGetRecruitmentInsights = async (project: Project) => {
    if (loadingInsights.has(project.id)) return;

    setLoadingInsights(prev => new Set(prev).add(project.id));
    try {
      const allUsers = await firebase.getUsers(30);
      const candidates = allUsers.filter(u => 
        !project.members.includes(u.uid) && 
        !(project.pendingApplicants || []).includes(u.uid) &&
        u.uid !== user.uid
      );

      if (candidates.length === 0) {
        alert("No potential candidates found in the Nexus yet.");
        return;
      }

      const suggestions = await geminiService.getCollaboratorSuggestions(project, candidates);
      
      // Attach user data to suggestions
      const richSuggestions = await Promise.all(suggestions.map(async s => ({
        ...s,
        userData: await firebase.getUserById(s.uid)
      })));

      setProjectAiInsights(prev => ({ ...prev, [project.id]: richSuggestions }));
      setExpandedInsights(prev => new Set(prev).add(project.id));
    } catch (err) {
      console.error("AI Recruitment failed", err);
    } finally {
      setLoadingInsights(prev => {
        const next = new Set(prev);
        next.delete(project.id);
        return next;
      });
    }
  };

  const toggleInsightExpansion = (projectId: string) => {
    setExpandedInsights(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const toggleSkillFilter = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query)) ||
        p.requiredSkills.some(s => s.toLowerCase().includes(query));

      let matchesStatus = true;
      if (statusFilter === 'my-projects') {
        matchesStatus = p.ownerUid === user.uid || (p.members && p.members.includes(user.uid));
      } else if (statusFilter !== 'all') {
        matchesStatus = p.status === statusFilter;
      }

      const matchesSkills = selectedSkills.length === 0 || 
        p.requiredSkills.some(skill => selectedSkills.includes(skill));

      return matchesSearch && matchesStatus && matchesSkills;
    });
  }, [projects, searchQuery, statusFilter, selectedSkills, user.uid]);

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-xl w-full shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 flex items-center">
                <Rocket className="mr-3 text-indigo-600" /> Propose New Project
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-6">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Project Title</label>
                <input required type="text" placeholder="e.g. Campus Navigation App" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Vision & Goals</label>
                <textarea required rows={4} placeholder="What problem does this project solve? What is the end goal?" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all resize-none" value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Required Skills</label>
                  <input required type="text" placeholder="React, UI Design" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value={newProject.requiredSkills} onChange={e => setNewProject({...newProject, requiredSkills: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Discovery Tags</label>
                  <input required type="text" placeholder="App, Innovation" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value={newProject.tags} onChange={e => setNewProject({...newProject, tags: e.target.value})} />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <><Rocket size={20} /><span>Launch Collaboration</span></>}
              </button>
            </form>
          </div>
        </div>
      )}

      <section className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Briefcase size={200} />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-5xl font-black mb-6 uppercase tracking-tighter italic">Collaboration <span className="text-indigo-300">Hub</span></h2>
          <p className="text-indigo-100 text-xl font-medium leading-relaxed mb-10 opacity-90">Find projects, build your portfolio, and work with the best minds in MVGR. Your journey from idea to impact starts here.</p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => setShowCreateModal(true)} className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center space-x-3 shadow-2xl hover:scale-105 transition-transform active:scale-95">
              <Plus size={20} />
              <span>Start a Project</span>
            </button>
            <div className="flex items-center space-x-2 px-6 py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
               <Users size={18} className="text-indigo-200" />
               <span className="text-sm font-bold uppercase tracking-widest">{projects.length} Active Missions</span>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative flex-1 max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Search by mission title, description, tags, or required skills..." className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex items-center space-x-4 bg-slate-100 p-1.5 rounded-2xl shadow-inner">
             <button onClick={() => setStatusFilter('all')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Global Feed</button>
             <button onClick={() => setStatusFilter('my-projects')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${statusFilter === 'my-projects' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>My Missions</button>
          </div>
        </div>

        {/* Skill-based Filtering UI */}
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Tag size={14} className="text-indigo-500" />
            <span>Filter by Expertise</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {allAvailableSkills.length > 0 ? allAvailableSkills.map(skill => (
              <button 
                key={skill} 
                onClick={() => toggleSkillFilter(skill)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                  selectedSkills.includes(skill) 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                {skill}
              </button>
            )) : (
              <p className="text-[10px] text-slate-400 italic">No expertise metadata detected in the grid.</p>
            )}
            {selectedSkills.length > 0 && (
              <button 
                onClick={() => setSelectedSkills([])}
                className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all flex items-center"
              >
                <X size={14} className="mr-1" /> Clear Skills
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.length === 0 ? (
          <div className="col-span-full py-24 text-center space-y-6 bg-white border border-dashed border-slate-200 rounded-[3rem]">
             <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100"><Search size={48} className="text-slate-200" /></div>
             <p className="text-lg font-black text-slate-400 uppercase tracking-[0.3em]">No matching protocols</p>
             <button onClick={() => {setSearchQuery(''); setStatusFilter('all'); setSelectedSkills([]);}} className="text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:underline">Reset Discovery Logic</button>
          </div>
        ) : (
          filteredProjects.map(project => {
            const isMember = project.members && project.members.includes(user.uid);
            const isPending = project.pendingApplicants && project.pendingApplicants.includes(user.uid);
            const isOwner = project.ownerUid === user.uid;
            const hasInsights = !!projectAiInsights[project.id];
            const isExpanded = expandedInsights.has(project.id);
            const isLoading = loadingInsights.has(project.id);

            return (
              <div key={project.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 hover:translate-y-[-4px] transition-all group relative overflow-hidden flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 border ${
                    project.status === 'recruiting' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    project.status === 'in-progress' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                    'bg-slate-50 text-slate-500 border-slate-100'
                  }`}>
                    {project.status === 'recruiting' ? <Users size={12} /> : 
                     project.status === 'in-progress' ? <Clock size={12} /> : <CheckCircle2 size={12} />}
                    <span>{project.status.replace('-', ' ')}</span>
                  </div>
                  {isOwner && (
                    <span className="flex items-center text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-widest"><ShieldCheck size={10} className="mr-1" /> My Mission</span>
                  )}
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-4 uppercase tracking-tight group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 mb-6 font-medium">{project.description}</p>

                <div className="space-y-6 mt-auto">
                   <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Required Expertise</p>
                      <div className="flex flex-wrap gap-2">
                        {(project.requiredSkills || []).map(skill => (
                          <span key={skill} className={`px-3 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wide ${
                            selectedSkills.includes(skill) 
                              ? 'bg-indigo-600 text-white border-indigo-600' 
                              : 'bg-slate-50 text-slate-600 border-slate-100'
                          }`}>{skill}</span>
                        ))}
                      </div>
                   </div>

                   {/* Recruitment Insights Section for Owners */}
                   {isOwner && project.status === 'recruiting' && (
                     <div className="pt-6 border-t border-slate-100">
                        <button 
                          onClick={() => hasInsights ? toggleInsightExpansion(project.id) : handleGetRecruitmentInsights(project)}
                          disabled={isLoading}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-indigo-600 hover:bg-indigo-50 transition-all group/insight"
                        >
                           <div className="flex items-center space-x-2">
                              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-amber-500" />}
                              <span className="text-[10px] font-black uppercase tracking-widest">Recruitment Insights</span>
                           </div>
                           {hasInsights ? (isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <ChevronRight size={14} className="group-hover/insight:translate-x-1 transition-transform" />}
                        </button>

                        {hasInsights && isExpanded && (
                          <div className="mt-4 space-y-3 animate-in slide-in-from-top-2 duration-300">
                             {projectAiInsights[project.id].map((suggestion, idx) => (
                               <div key={suggestion.uid} className="p-4 bg-white border border-indigo-100 rounded-2xl shadow-sm space-y-3">
                                  <div className="flex items-center justify-between">
                                     <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                                          {suggestion.userData?.displayName.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                           <p className="text-[10px] font-black text-slate-900 uppercase truncate max-w-[100px]">{suggestion.userData?.displayName}</p>
                                           <p className="text-[8px] font-bold text-indigo-400 uppercase">{suggestion.userData?.points} XP</p>
                                        </div>
                                     </div>
                                     <div className="text-right">
                                        <span className="text-xs font-black text-indigo-600 italic">{suggestion.score}%</span>
                                     </div>
                                  </div>
                                  <p className="text-[10px] text-slate-500 leading-relaxed italic font-medium">"{suggestion.insight}"</p>
                                  <button 
                                    onClick={() => navigate(`/messages/${suggestion.uid}`)}
                                    className="w-full py-2 bg-slate-50 text-indigo-600 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center space-x-1.5"
                                  >
                                    <Mail size={10} />
                                    <span>Initiate Signal</span>
                                  </button>
                               </div>
                             ))}
                          </div>
                        )}
                     </div>
                   )}

                   <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex -space-x-2">
                         {(project.members || []).slice(0, 3).map((m, i) => (
                           <div key={i} className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm">{m.charAt(0).toUpperCase()}</div>
                         ))}
                      </div>

                      <div className="flex items-center space-x-2">
                        {isMember ? (
                          <Link to={`/project/${project.id}`} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center">
                            Enter Space
                            <ChevronRight size={14} className="ml-1" />
                          </Link>
                        ) : isPending ? (
                          <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest flex items-center ml-2"><Clock size={14} className="mr-1.5" />Pending</span>
                        ) : (
                          <button onClick={() => handleApply(project.id)} disabled={project.status !== 'recruiting'} className="bg-white border border-indigo-600 text-indigo-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all active:scale-90 disabled:opacity-50">Join Mission</button>
                        )}
                      </div>
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CollaborationHub;
