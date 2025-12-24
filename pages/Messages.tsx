
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { firebase } from '../services/firebase';
import { User, ChatMessage } from '../types';
import { 
  Send, 
  Search, 
  ChevronLeft, 
  MoreVertical, 
  MessageSquare,
  User as UserIcon,
  ShieldCheck,
  Clock,
  ArrowRight
} from 'lucide-react';

interface MessagesProps {
  user: User;
}

const Messages: React.FC<MessagesProps> = ({ user }) => {
  const { recipientUid } = useParams<{ recipientUid: string }>();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<User[]>([]);
  const [activeRecipient, setActiveRecipient] = useState<User | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await firebase.getConversations(user.uid);
        setConversations(data.filter((u): u is User => !!u));
        
        if (recipientUid) {
          const recipient = await firebase.getUserById(recipientUid);
          if (recipient) {
            setActiveRecipient(recipient);
            if (!data.some(c => c?.uid === recipientUid)) {
              setConversations(prev => [...prev, recipient]);
            }
          }
        } else if (data.length > 0 && data[0]) {
          setActiveRecipient(data[0]);
          navigate(`/messages/${data[0].uid}`, { replace: true });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [user.uid, recipientUid]);

  useEffect(() => {
    if (!activeRecipient) return;
    const channelId = firebase.getDMChannelId(user.uid, activeRecipient.uid);
    const unsubscribe = firebase.onDirectMessages(channelId, (msgs) => {
      setMessages(msgs);
    });
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user.uid, activeRecipient]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeRecipient) return;
    
    await firebase.sendDirectMessage(user, activeRecipient.uid, newMessage);
    setNewMessage('');
  };

  const filteredConversations = conversations.filter(c => 
    c.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="h-64 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl animate-in fade-in duration-500">
      <div className={`w-full md:w-80 flex flex-col border-r border-slate-100 bg-slate-50/30 ${recipientUid ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6">
          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-6">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Search chats..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-3 space-y-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-10 opacity-40">
              <MessageSquare className="mx-auto mb-3" size={32} />
              <p className="text-[10px] font-black uppercase tracking-widest">No signals detected</p>
            </div>
          ) : (
            filteredConversations.map(conv => (
              <button key={conv.uid} onClick={() => navigate(`/messages/${conv.uid}`)} className={`w-full flex items-center p-3 rounded-2xl transition-all ${activeRecipient?.uid === conv.uid ? 'bg-white shadow-md border border-slate-100' : 'hover:bg-white/50'}`}>
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg">{conv.displayName.charAt(0).toUpperCase()}</div>
                  {conv.role === 'admin' && <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm"><ShieldCheck size={14} className="text-indigo-600" /></div>}
                </div>
                <div className="ml-3 text-left min-w-0 flex-1">
                  <p className={`text-sm font-black truncate ${activeRecipient?.uid === conv.uid ? 'text-indigo-600' : 'text-slate-900'}`}>{conv.displayName}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{conv.role}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className={`flex-1 flex flex-col bg-white ${!recipientUid ? 'hidden md:flex' : 'flex'}`}>
        {activeRecipient ? (
          <>
            <div className="p-4 md:p-6 border-b border-slate-50 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={() => navigate('/messages')} className="md:hidden p-2 bg-slate-50 rounded-xl"><ChevronLeft size={20} /></button>
                <Link to={`/profile/${activeRecipient.uid}`} className="flex items-center space-x-3 group">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">{activeRecipient.displayName.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 uppercase tracking-widest text-sm group-hover:text-indigo-600 transition-colors">{activeRecipient.displayName}</h3>
                    <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                       {activeRecipient.role === 'admin' && <ShieldCheck size={10} className="mr-1 text-indigo-400" />}
                       <span>{activeRecipient.role}</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-6 bg-slate-50/20 custom-scrollbar">
              {messages.map(msg => {
                  const isOwn = msg.senderUid === user.uid;
                  return (
                    <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[85%] md:max-w-[70%] px-4 md:px-6 py-3 md:py-4 rounded-3xl shadow-sm ${isOwn ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                        <p className="text-sm md:text-base leading-relaxed font-medium">{msg.text}</p>
                        <div className={`flex items-center mt-2 space-x-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <Clock size={10} className={isOwn ? 'text-indigo-200' : 'text-slate-300'} />
                          <span className={`text-[8px] font-black uppercase ${isOwn ? 'text-indigo-200' : 'text-slate-400'}`}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
            <form onSubmit={handleSendMessage} className="p-4 md:p-6 border-t border-slate-50 flex items-center space-x-4">
              <input type="text" placeholder="Secure message..." className="flex-1 bg-slate-50 border border-slate-100 px-6 py-4 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-inner" value={newMessage} onChange={e => setNewMessage(e.target.value)} />
              <button type="submit" disabled={!newMessage.trim()} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 active:scale-90 transition-all disabled:opacity-50"><Send size={20} /></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-6 p-10 text-center opacity-50">
            <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-200"><MessageSquare size={48} /></div>
            <h3 className="text-xl font-black text-slate-900 uppercase italic tracking-widest mb-2">Encrypted Comms</h3>
            <p className="text-xs font-bold uppercase tracking-wider max-w-xs">Select a contact to start a secure conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Messages;
