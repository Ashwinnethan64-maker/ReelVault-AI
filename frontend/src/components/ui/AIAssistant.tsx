import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, RotateCcw, MessageSquare, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { supabase } from '@/lib/supabase';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m your **Vault AI**. Ask me anything about your saved reels.\n\nTry:\n- *"Summarize my React reels"*\n- *"What did I save about Docker?"*\n- *"Find all AI-related reels"*' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const resetChat = () => {
    setSessionId(null);
    setMessages([
      { role: 'assistant', content: 'Chat cleared! Start a new conversation.' }
    ]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    const allMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(allMessages);
    setIsTyping(true);

    try {
      setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: allMessages.filter(m => m.content !== ''),
          sessionId
        })
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let assistantContent = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.sessionId && !sessionId) {
                  setSessionId(data.sessionId);
                }
                if (data.content) {
                  assistantContent += data.content;
                  setMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1] = { role: 'assistant', content: assistantContent };
                    return next;
                  });
                }
              } catch (_) { /* ignore parse errors */ }
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: '⚠️ Failed to connect to the AI. Please check that the backend server is running.' };
        return next;
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 flex items-center justify-center text-white pointer-events-auto hover:shadow-indigo-500/50 hover:scale-105 transition-shadow"
        title="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 right-4 z-50 w-[min(390px,calc(100vw-2rem))] h-[min(620px,calc(100vh-5rem))] rounded-2xl border border-white/10 bg-zinc-950/95 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-zinc-900/40 shrink-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Vault AI</h3>
                  <p className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    RAG-Powered
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetChat}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                  title="New chat"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="h-6 w-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-zinc-800/80 text-zinc-200 rounded-bl-sm border border-white/5'}`}>
                    {msg.role === 'assistant' && msg.content === '' && isTyping ? (
                      <span className="flex items-center gap-1 h-5">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0.15s' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0.3s' }} />
                      </span>
                    ) : msg.role === 'assistant' ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code({ className, children, ...props }) {
                            const isBlock = className?.includes('language-');
                            return isBlock ? (
                              <pre className="bg-zinc-900 rounded-lg p-3 my-2 overflow-x-auto text-xs font-mono border border-white/5">
                                <code className={className}>{children}</code>
                              </pre>
                            ) : (
                              <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-xs font-mono text-indigo-300" {...props}>{children}</code>
                            );
                          },
                          p({ children }) { return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>; },
                          ul({ children }) { return <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>; },
                          ol({ children }) { return <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>; },
                          li({ children }) { return <li className="text-zinc-300">{children}</li>; },
                          strong({ children }) { return <strong className="text-white font-semibold">{children}</strong>; },
                          em({ children }) { return <em className="text-zinc-300 italic">{children}</em>; },
                          h3({ children }) { return <h3 className="text-white font-bold mt-2 mb-1">{children}</h3>; },
                          a({ href, children }) { return <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{children}</a>; },
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      <span>{msg.content}</span>
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 mt-1">
                      <MessageSquare className="w-3 h-3 text-zinc-300" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-3 border-t border-white/5 bg-zinc-900/40 shrink-0">
              <div className="relative flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your reels..."
                  disabled={isTyping}
                  className="flex-1 bg-zinc-950 border border-white/10 rounded-full pl-4 pr-3 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center text-white hover:bg-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                >
                  {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5 ml-0.5" />}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
