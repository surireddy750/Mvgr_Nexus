
import React, { useState, useEffect, useRef } from 'react';
import { geminiService } from '../services/gemini';
import { User } from '../types';
import { 
  Send, 
  Bot, 
  Sparkles, 
  User as UserIcon, 
  Loader2, 
  Trash2, 
  Terminal, 
  MessageSquare, 
  Cpu, 
  BrainCircuit,
  Lightbulb,
  ChevronRight,
  Info
} from 'lucide-react';

interface NexusAIProps {
  user: User;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

const NexusAI: React.FC<NexusAIProps> = ({ user }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    // Initialize session
    chatSessionRef.current = geminiService.createChatSession();
    
    // Initial greeting
    setMessages([{
      role: 'model',
      text: `Welcome to the **Nexus Grid**, operative ${user.displayName.split(' ')[0]}. I am your **Nexus AI Assistant**. How can I assist your mission at MVGR today?`,
      timestamp: Date.now()
    }]);
  }, [user.uid]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSendMessage = async (e?: React.FormEvent, textOverride?: string) => {
    e?.preventDefault();
    const finalInput = textOverride || inputText;
    if (!finalInput.trim() || isThinking) return;

    const userMsg: ChatMessage = {
      role: 'user',
      text: finalInput,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsThinking(true);

    try {
      const result = await chatSessionRef.current.sendMessage({ message: finalInput });
      const modelText = result.text || "Connection to Nexus Grid unstable. Please retry transmission.";
      
      setMessages(prev => [...prev, {
        role: 'model',
        text: modelText,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error("AI Transmission Error:", error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "Error in Grid Uplink. Gemini model '3-pro' reported a processing fault.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsThinking(false);
    }
  };

  const clearChat = () => {
    chatSessionRef.current = geminiService.createChatSession();
    setMessages([{
      role: 'model',
      text: "Nexus history purged. Ready for new protocol requests.",
      timestamp: Date.now()
    }]);
  };

  const starterChips = [
    "Explain the Placement Process",
    "How to start a research project?",
    "Suggest some coding challenges",
    "Tell me about MVGR College history"
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-140px)] flex flex-col space-y-4 animate-in fade-in duration-500">
      <header className="flex items-center justify-between p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 border border-indigo-400/20">
            <BrainCircuit size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Nexus AI</h1>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1 flex items-center">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Gemini 3 Pro Online
            </p>
          </div>
        </div>
        <button 
          onClick={clearChat}
          className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
          title="Clear Protocol"
        >
          <Trash2 size={20} />
        </button>
      </header>

      <div className="flex-1 bg-white border border-slate-200 rounded-[2.5rem] shadow-xl shadow-slate-200/40 flex flex-col overflow-hidden relative">
        <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none" />
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-slate-50/20">
          {messages.map((msg, i) => (
            <div 
              key={i} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}
            >
              <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
                <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white border-slate-700' 
                    : 'bg-indigo-600 text-white border-indigo-400/30'
                }`}>
                  {msg.role === 'user' ? <UserIcon size={16} /> : <Cpu size={16} />}
                </div>
                
                <div className={`p-4 md:p-5 rounded-3xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-100' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none shadow-sm'
                }`}>
                  {msg.text.split('\n').map((line, idx) => (
                    <p key={idx} className={idx > 0 ? 'mt-2' : ''}>
                      {line.startsWith('* ') ? <span className="block pl-4 relative before:absolute before:left-0 before:content-['•'] before:text-indigo-400">{line.substring(2)}</span> : line}
                    </p>
                  ))}
                  <p className={`text-[8px] font-black uppercase mt-3 opacity-40 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {isThinking && (
            <div className="flex justify-start animate-in fade-in duration-300">
              <div className="flex max-w-[85%] items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm border border-indigo-400/30">
                  <Cpu size={16} className="animate-spin-slow" />
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-3xl rounded-tl-none shadow-sm flex items-center space-x-3">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Accessing Knowledge Grid...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {messages.length < 3 && !isThinking && (
          <div className="px-8 pb-4 flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-2 duration-700">
            {starterChips.map((chip, idx) => (
              <button 
                key={idx}
                onClick={() => handleSendMessage(undefined, chip)}
                className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center shadow-sm"
              >
                <Lightbulb size={12} className="mr-1.5 text-amber-500" />
                {chip}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSendMessage} className="p-6 bg-white border-t border-slate-100 flex items-center space-x-4">
          <div className="flex-1 relative group">
            <input 
              type="text" 
              placeholder="Query the Nexus Knowledge Grid..." 
              className="w-full bg-slate-50 border border-slate-200 px-6 py-4 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 transition-all shadow-inner"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isThinking}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2 text-slate-300">
               <Terminal size={16} />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={!inputText.trim() || isThinking}
            className="bg-indigo-600 text-white p-4 rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-90 transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center group"
          >
            {isThinking ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
          </button>
        </form>
      </div>

      <footer className="px-6 flex items-center justify-center space-x-4">
         <div className="flex items-center text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
            <Info size={12} className="mr-2" />
            AI may generate inaccurate information. Cross-verify mission-critical data.
         </div>
      </footer>
    </div>
  );
};

export default NexusAI;
