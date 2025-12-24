
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { firebase } from './services/firebase';
import { User } from './types';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ClubDetail from './pages/ClubDetail';
import ClubsExplorer from './pages/ClubsExplorer';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import CollaborationHub from './pages/CollaborationHub';
import Sidebar from './components/Sidebar';
import Messages from './pages/Messages';
import MentorshipHub from './pages/MentorshipHub';
import EventsExplorer from './pages/EventsExplorer';
import ProjectDetail from './pages/ProjectDetail';
import NexusAI from './pages/NexusAI';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to real Firebase Auth changes
    const unsubscribe = firebase.onAuthStateChange((nexusUser) => {
      setUser(nexusUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await firebase.logout();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50">
        {user && <Sidebar user={user} onLogout={handleLogout} />}
        
        <main className={`flex-1 transition-all ${user ? 'md:ml-64 pb-24 md:pb-8' : ''} p-4 md:p-8`}>
          <Routes>
            <Route 
              path="/login" 
              element={!user ? <Login onLogin={setUser} /> : <Navigate to="/" />} 
            />
            
            <Route 
              path="/" 
              element={
                user ? (
                  user.role === 'admin' || user.role === 'faculty' ? <AdminDashboard user={user} /> : <StudentDashboard user={user} />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />

            <Route path="/club/:id" element={user ? <ClubDetail user={user} /> : <Navigate to="/login" />} />
            <Route path="/clubs" element={user ? <ClubsExplorer user={user} /> : <Navigate to="/login" />} />
            <Route path="/project/:id" element={user ? <ProjectDetail user={user} /> : <Navigate to="/login" />} />
            <Route path="/events" element={user ? <EventsExplorer user={user} /> : <Navigate to="/login" />} />
            <Route path="/mentorship" element={user ? <MentorshipHub user={user} /> : <Navigate to="/login" />} />
            <Route path="/profile/:uid" element={user ? <Profile currentUser={user} /> : <Navigate to="/login" />} />
            <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/login" />} />
            <Route path="/projects" element={user ? <CollaborationHub user={user} /> : <Navigate to="/login" />} />
            <Route path="/messages" element={user ? <Messages user={user} /> : <Navigate to="/login" />} />
            <Route path="/messages/:recipientUid" element={user ? <Messages user={user} /> : <Navigate to="/login" />} />
            <Route path="/nexus-ai" element={user ? <NexusAI user={user} /> : <Navigate to="/login" />} />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
