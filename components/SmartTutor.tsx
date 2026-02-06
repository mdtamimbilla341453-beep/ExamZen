import React, { useState, useRef, useEffect } from 'react';
import { askTutor } from '../services/geminiService';
import { ImageInput, ViewState } from '../types';
import { MessageSquare, Send, Bot, User, BookOpen } from 'lucide-react';

interface SmartTutorProps {
  images: ImageInput[];
  onNavigate: (view: ViewState) => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

export const SmartTutor: React.FC<SmartTutorProps> = ({ images, onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Hello! I've read the chapter you uploaded. Ask me anything about it!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const response = await askTutor(images, messages, userMsg);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (images.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
        <div className="p-4 bg-surfaceHighlight rounded-full">
           <MessageSquare size={48} className="text-textMuted" />
        </div>
        <h2 className="text-2xl font-light">Chat Unavailable</h2>
        <p className="text-textMuted">Please upload chapter pages in the Scanner first.</p>
        <button 
          onClick={() => onNavigate(ViewState.ANALYZER)}
          className="px-6 py-2 bg-primary text-background font-medium rounded-full hover:bg-primary/90 transition-colors"
        >
          Go to Scanner
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto animate-fade-in relative">
      <div className="mb-4 flex items-center gap-3">
         <h2 className="text-3xl font-light text-text">Chat with Book</h2>
         <span className="px-2 py-1 bg-green-500/10 text-green-400 text-[10px] uppercase tracking-wider rounded border border-green-500/20">Active</span>
      </div>

      <div className="flex-1 bg-surface rounded-2xl border border-surfaceHighlight shadow-xl overflow-hidden flex flex-col relative">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-custom" ref={scrollRef}>
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
               <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'model' ? 'bg-primary/20 text-primary' : 'bg-surfaceHighlight text-textMuted'}`}>
                  {msg.role === 'model' ? <Bot size={16} /> : <User size={16} />}
               </div>
               <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                 msg.role === 'user' 
                 ? 'bg-primary text-background rounded-tr-none' 
                 : 'bg-background/50 border border-surfaceHighlight rounded-tl-none text-text'
               }`}>
                 {msg.text}
               </div>
            </div>
          ))}
          {loading && (
             <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Bot size={16} />
                </div>
                <div className="bg-background/50 p-4 rounded-2xl rounded-tl-none flex gap-1 items-center">
                   <div className="w-2 h-2 bg-textMuted rounded-full animate-bounce"></div>
                   <div className="w-2 h-2 bg-textMuted rounded-full animate-bounce delay-100"></div>
                   <div className="w-2 h-2 bg-textMuted rounded-full animate-bounce delay-200"></div>
                </div>
             </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-surface/80 border-t border-surfaceHighlight backdrop-blur-sm">
           <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question about this chapter... (e.g., 'Explain the second page simply')"
                className="w-full bg-background border border-surfaceHighlight rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-primary/50 resize-none h-14 scrollbar-none"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="absolute right-2 top-2 p-2 bg-primary text-background rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
           </div>
           <p className="text-[10px] text-textMuted text-center mt-2">AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
};