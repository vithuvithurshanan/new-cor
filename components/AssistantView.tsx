import React, { useState, useRef, useEffect } from 'react';
import { chatWithLogisticsBot } from '../services/geminiService';
import { Send, Bot, User, MessageSquare } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export const AssistantView: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'bot', text: 'Hello! I am the CourierOS Virtual Assistant. How can I help you track a package or understand our services today?', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const responseText = await chatWithLogisticsBot([], userMsg.text);

    const botMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'bot',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  return (
    
    <div className="h-[calc(110vh-8rem)] flex flex-col max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-1 gap-8 pb-12 relative-7xl  animate-fade-in bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden">
  
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 flex items-center gap-3 text-white shadow-md">
        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
          <MessageSquare size={20} />
        </div>
        <div>
          <h3 className="font-bold">Support Assistant</h3>
          <p className="text-indigo-200 text-xs flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            Online • Powered by Gemini
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent custom-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`
              w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-white/40
              ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-violet-100 text-violet-600'}
            `}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            
            <div className={`
              max-w-[80%] p-3 rounded-2xl shadow-sm text-sm leading-relaxed backdrop-blur-md border border-white/20
              ${msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none shadow-indigo-200/50' 
                : 'bg-white/80 text-slate-700 rounded-tl-none shadow-sm'}
            `}>
              {msg.text}
              <div className={`text-[10px] mt-1 opacity-70 ${msg.role === 'user' ? 'text-indigo-100' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center">
              <Bot size={16} />
            </div>
            <div className="bg-white/60 border border-white/40 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></span>
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-4 bg-white/50 border-t border-white/50 backdrop-blur-md">
        <div className="flex items-center gap-2 bg-white/70 border border-white/50 rounded-2xl px-4 py-2 focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all shadow-sm">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question..."
            className="flex-1 bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || isTyping}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors disabled:opacity-50"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          AI can make mistakes. Please verify critical shipping details.
        </p>
      </form>
    </div>
    
  );
};