
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Loader2, User, Bot } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Olá! Sou seu assistente EventArchitect Pro. Como posso ajudar com seu projeto hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && !chat) {
      geminiService.startChat().then(setChat);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !chat || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await chat.sendMessage({ message: userMessage });
      setMessages(prev => [...prev, { role: 'model', text: response.text }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: 'Desculpe, tive um problema ao processar sua mensagem.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      {isOpen ? (
        <div className="bg-white w-96 h-[500px] rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <MessageSquare size={20} className="text-indigo-400" />
              <span className="font-bold">Consultor IA</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:text-indigo-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                    {m.role === 'user' ? <User size={16} className="text-white" /> : <Bot size={16} />}
                  </div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none'}`}>
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">IA Analisando...</span>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-white">
            <div className="relative flex items-center bg-slate-50 rounded-2xl px-4 py-2 border border-transparent focus-within:border-indigo-200 transition-all">
              <input 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Pergunte qualquer coisa..."
                className="flex-1 bg-transparent border-none outline-none py-2 text-sm text-slate-700 placeholder:text-slate-300"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="p-2 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 disabled:opacity-20 transition-all"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-slate-900 text-white p-5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all group relative"
        >
          <div className="absolute -top-2 -right-2 bg-indigo-600 w-6 h-6 rounded-full border-4 border-slate-50 animate-pulse"></div>
          <MessageSquare size={28} />
        </button>
      )}
    </div>
  );
};

export default ChatBot;
