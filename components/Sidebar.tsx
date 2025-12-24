
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { User, AppNotification } from '../types';
import { firebase } from '../services/firebase';
import { 
  Home,
  MessageSquare,
  Briefcase,
  Trophy,
  User as UserIcon,
  Settings,
  LogOut,
  Bell,
  ChevronRight,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  Calendar,
  Users,
  LayoutGrid,
  Bot
} from 'lucide-react';

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const location = useLocation();
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await firebase.getNotifications(user.uid);
        const unread = data.filter(n => !n.isRead);
        
        if (unread.length > notifications.filter(n => !n.isRead).length) {
          setHasNew(true);
          setTimeout(() => setHasNew(false), 2000);
        }
        
        setNotifications(data);
      } catch (e) {
        console.error("Notif fetch error", e);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user.uid, notifications.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    await firebase.markNotificationsAsRead(user.uid);
    const data = await firebase.getNotifications(user.uid);
    setNotifications(data);
  };

  const navItems = [
    { icon: <Home size={20} />, label: 'Home', path: '/' },
    { icon: <Bot size={20} className="text-indigo-500" />, label: 'Nexus AI', path: '/nexus-ai' },
    { icon: <LayoutGrid size={20} />, label: 'Clubs', path: '/clubs' },
    { icon: <Calendar size={20} />, label: 'Events', path: '/events' },
    { icon: <Users size={20} />, label: 'Mentorship', path: '/mentorship' },
    { icon: <Briefcase size={20} />, label: 'Projects', path: '/projects' },
    { icon: <MessageSquare size={20} />, label: 'Messages', path: '/messages' },
    { icon: <Trophy size={20} />, label: 'Leaderboard', path: '/leaderboard' },
    { icon: <UserIcon size={20} />, label: 'My Profile', path: `/profile/${user.uid}` },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'rejection': return <XCircle size={16} className="text-red-500" />;
      case 'request': return <AlertCircle size={16} className="text-primary" />;
      default: return <Bell size={16} className="text-slate-400" />;
    }
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 z-50 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <span className="font-bold">N</span>
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">MVGR NEXUS</span>
          </div>
          
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-xl transition-all relative ${showNotifications ? 'bg-indigo-50 text-primary' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              <Bell size={20} className={hasNew ? 'animate-bounce' : ''} />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute left-full ml-2 top-0 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in slide-in-from-left-2 duration-200">
                <div className="p-4 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">Notifications</h3>
                  <button onClick={handleMarkAllRead} className="text-[10px] font-black text-primary uppercase hover:underline">Clear All</button>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic text-xs">No alerts detected.</div>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-slate-50 flex space-x-3 hover:bg-slate-50 transition-colors ${!n.isRead ? 'bg-indigo-50/30' : ''}`}>
                        <div className="mt-1 shrink-0">{getNotificationIcon(n.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold text-slate-900 ${!n.isRead ? 'text-indigo-600' : ''}`}>{n.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                          <div className="flex items-center mt-1.5 text-[9px] text-slate-400 font-bold uppercase">
                            <Clock size={10} className="mr-1" />
                            {formatTime(n.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg transition-colors font-medium text-sm ${
                  isActive 
                    ? 'bg-indigo-50 text-primary' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}

          {(user.role === 'admin' || user.role === 'faculty') && (
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center px-4 py-3 rounded-lg transition-colors font-medium text-sm mt-4 border-t border-slate-50 pt-4 ${
                  isActive ? 'text-primary font-bold' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <Shield size={20} className="mr-3" />
              Nexus Management
            </NavLink>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center p-3 rounded-xl bg-slate-50 mb-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-primary flex items-center justify-center font-bold mr-3 border border-indigo-200">
              {user.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-900 truncate uppercase tracking-tight">{user.displayName}</p>
              <p className="text-xs text-indigo-600 font-bold">{user.points} XP</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center px-4 py-2 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition-colors uppercase tracking-widest"
          >
            <LogOut size={18} className="mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 md:hidden z-50 flex items-center justify-around px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.label}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center p-2 rounded-lg ${
                isActive ? 'text-primary' : 'text-slate-400'
              }`
            }
          >
            {item.icon}
          </NavLink>
        ))}
        <button 
          onClick={() => setShowNotifications(!showNotifications)}
          className={`flex flex-col items-center p-2 rounded-lg relative ${unreadCount > 0 ? 'text-primary' : 'text-slate-400'}`}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          )}
        </button>
      </nav>
    </>
  );
};

export default Sidebar;
