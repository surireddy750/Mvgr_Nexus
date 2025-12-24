
import React, { useState } from 'react';
import { firebase } from '../services/firebase';
import { User } from '../types';
import { Mail, Shield, GraduationCap, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email.trim().endsWith('@mvgrce.edu.in')) {
      setError('Access restricted to verified campus email domains.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await firebase.login(email, role);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-2xl shadow-indigo-100 rotate-3">
            <span className="text-4xl font-black italic">N</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">MVGR <span className="text-indigo-600">Nexus</span></h1>
          <p className="text-slate-500 mt-2 font-medium">Verified Campus Hub Authentication</p>
        </div>

        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`flex items-center justify-center p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  role === 'student' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                    : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                }`}
              >
                <GraduationCap size={18} className="mr-2" />
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole('admin')}
                className={`flex items-center justify-center p-4 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                  role === 'admin' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                    : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                }`}
              >
                <Shield size={18} className="mr-2" />
                Faculty
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campus Email Protocol</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mvgrce.edu.in"
                  className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all text-slate-900 font-bold"
                />
                <Mail className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              </div>
            </div>

            {error && (
              <div className="flex items-center p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 animate-in fade-in zoom-in-95">
                <AlertCircle size={18} className="mr-3 shrink-0" />
                <p className="text-xs font-bold leading-tight">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  Enter Nexus Grid
                  <ChevronRight size={18} className="ml-2" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest italic opacity-50">
          Shielded by Firebase Secure Identity Services
        </p>
      </div>
    </div>
  );
};

export default Login;
