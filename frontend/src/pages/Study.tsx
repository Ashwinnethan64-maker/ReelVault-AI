import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, CheckCircle2, LayoutDashboard, Layers, HelpCircle, MessageCircle, TrendingUp, Flame, Award, Zap, BookOpen, Send, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '@/lib/api';

type Tab = 'dashboard' | 'flashcards' | 'quiz' | 'tutor';

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
      active 
        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-lg shadow-indigo-500/5' 
        : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
    }`}
  >
    {React.cloneElement(icon, { className: 'w-5 h-5' })}
    {label}
  </button>
);

const StudyDashboard = ({ onStartRevision }: { onStartRevision: () => void }) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    api.get('/study/dashboard').then(res => setData(res.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Learning Dashboard</h1>
        <p className="text-zinc-400">Track your progress and AI-generated insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-950/50 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-indigo-400 mb-4"><Award className="w-5 h-5" /> <span className="font-medium">Knowledge Score</span></div>
          <div className="text-4xl font-bold text-white">{data?.knowledgeScore ?? 0}<span className="text-lg text-zinc-500 font-normal">/1k</span></div>
        </div>
        <div className="bg-zinc-950/50 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-orange-400 mb-4"><Flame className="w-5 h-5" /> <span className="font-medium">Study Streak</span></div>
          <div className="text-4xl font-bold text-white">{data?.streak ?? 0}<span className="text-lg text-zinc-500 font-normal"> Days</span></div>
        </div>
        <div className="bg-zinc-950/50 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-emerald-400 mb-4"><Layers className="w-5 h-5" /> <span className="font-medium">Total Cards</span></div>
          <div className="text-4xl font-bold text-white">{data?.totalFlashcards ?? 0}</div>
        </div>
        <div className="bg-zinc-950/50 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="flex items-center gap-2 text-rose-400 mb-4"><Zap className="w-5 h-5" /> <span className="font-medium">Quizzes Taken</span></div>
          <div className="text-4xl font-bold text-white">{data?.quizzesTaken ?? 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full" />
          <h3 className="text-xl font-bold text-white mb-2">Daily Revision Ready</h3>
          <p className="text-zinc-400 text-sm mb-6 max-w-sm">
            You have <strong className="text-indigo-400">{data?.dueFlashcards || 0}</strong> flashcards due for review today based on your spaced repetition schedule.
          </p>
          <button 
            onClick={onStartRevision}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
          >
            <Play className="w-4 h-4 fill-current" /> Start Session
          </button>
        </div>

        <div className="bg-zinc-950/50 border border-white/5 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-400" /> Topic Analysis</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-emerald-400">Strong: AI Architecture</span><span className="text-zinc-500">92%</span></div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[92%]" /></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span className="text-orange-400">Weak: Data Structures</span><span className="text-zinc-500">45%</span></div>
              <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden"><div className="h-full bg-orange-500 w-[45%]" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FlashcardsView = () => {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [complete, setComplete] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [topicToGen, setTopicToGen] = useState('');

  useEffect(() => {
    fetchDue();
  }, []);

  const fetchDue = async () => {
    try {
      setLoading(true);
      const res = await api.get('/study/flashcards/due');
      setCards(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await api.post('/study/flashcards/generate', { topic: topicToGen });
      if (res.data.flashcards && res.data.flashcards.length > 0) {
        await api.post('/study/flashcards/save', { flashcards: res.data.flashcards });
        await fetchDue();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleReview = async (quality: number) => {
    const card = cards[currentIndex];
    setIsFlipped(false);
    try {
      await api.post('/study/flashcards/review', { id: card.id, quality });
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setComplete(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="h-full min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  if (cards.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-20">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 flex items-center justify-center mb-6">
          <CheckCircle2 className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">You're all caught up!</h2>
        <p className="text-zinc-400 mb-8">No flashcards due right now. Generate new ones from your recent reels to keep learning.</p>
        
        <div className="flex gap-2 w-full max-w-sm mb-4">
          <input 
            type="text" 
            placeholder="Topic (Optional)" 
            value={topicToGen} 
            onChange={e => setTopicToGen(e.target.value)} 
            className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-indigo-500"
          />
          <button onClick={handleGenerate} disabled={generating} className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 whitespace-nowrap">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
            Generate
          </button>
        </div>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-20">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 text-emerald-400"><Award className="w-10 h-10" /></div>
        <h2 className="text-2xl font-bold text-white mb-2">Session Complete!</h2>
        <p className="text-zinc-400 mb-8">You've reviewed {cards.length} cards today. Your spaced repetition schedule is updated.</p>
        <button onClick={() => { setComplete(false); setCurrentIndex(0); fetchDue(); }} className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all">Back to Start</button>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex justify-between items-center text-sm text-zinc-400 mb-6 px-2">
        <span className="bg-zinc-900 px-3 py-1 rounded-full text-indigo-400 font-medium">Card {currentIndex + 1} of {cards.length}</span>
        {currentCard.topic && <span className="bg-zinc-900 px-3 py-1 rounded-full text-emerald-400 font-medium">{currentCard.topic}</span>}
      </div>

      <div className="perspective-1000 w-full h-[400px] mb-8 cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div animate={{ rotateY: isFlipped ? 180 : 0 }} transition={{ duration: 0.5, type: 'spring' }} className="w-full h-full relative preserve-3d">
          <div className="absolute inset-0 backface-hidden rounded-3xl border border-white/5 bg-zinc-900/80 backdrop-blur p-8 flex flex-col items-center justify-center text-center shadow-2xl">
            <span className="text-xs font-bold tracking-widest text-indigo-400 uppercase absolute top-6">Front / Question</span>
            <h2 className="text-2xl text-white font-medium">{currentCard.front}</h2>
          </div>
          <div className="absolute inset-0 backface-hidden rounded-3xl border border-indigo-500/20 bg-indigo-950/40 p-8 flex flex-col items-center justify-center text-center shadow-2xl [transform:rotateY(180deg)] overflow-y-auto">
            <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase absolute top-6">Back / Answer</span>
            <p className="text-xl text-white font-bold mb-4 mt-6">{currentCard.back}</p>
            {currentCard.explanation && <p className="text-sm text-zinc-400 italic">"{currentCard.explanation}"</p>}
            {currentCard.sourceUrl && (
              <a href={currentCard.sourceUrl} target="_blank" rel="noopener noreferrer" className="absolute bottom-6 text-xs text-indigo-400 hover:underline">View Source Reel</a>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isFlipped && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
            <button onClick={(e) => { e.stopPropagation(); handleReview(0); }} className="flex-1 py-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400 font-bold hover:bg-red-500/20 transition-all">Again (0)</button>
            <button onClick={(e) => { e.stopPropagation(); handleReview(3); }} className="flex-1 py-4 rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400 font-bold hover:bg-orange-500/20 transition-all">Hard (3)</button>
            <button onClick={(e) => { e.stopPropagation(); handleReview(4); }} className="flex-1 py-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all">Good (4)</button>
            <button onClick={(e) => { e.stopPropagation(); handleReview(5); }} className="flex-1 py-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-400 font-bold hover:bg-blue-500/20 transition-all">Easy (5)</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const QuizView = () => {
  const [topic, setTopic] = useState('');
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [finished, setFinished] = useState(false);

  const generateQuiz = async () => {
    try {
      setLoading(true);
      const res = await api.post('/study/quiz/generate', { topic });
      setQuiz(res.data);
      setCurrentQ(0);
      setScore(0);
      setFinished(false);
      setSelectedOpt(null);
      setShowExplanation(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (showExplanation) return;
    setSelectedOpt(idx);
    setShowExplanation(true);
    if (idx === quiz.questions[currentQ].correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const handleNext = async () => {
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(q => q + 1);
      setSelectedOpt(null);
      setShowExplanation(false);
    } else {
      setFinished(true);
      await api.post('/study/quiz/submit', {
        topic: topic || 'General',
        score: score + (selectedOpt === quiz.questions[currentQ].correctAnswer ? 1 : 0),
        total: quiz.questions.length,
        questions: quiz.questions
      });
    }
  };

  if (!quiz && !loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-6 text-rose-400"><HelpCircle className="w-8 h-8" /></div>
        <h2 className="text-2xl font-bold text-white mb-2">AI Quizzes</h2>
        <p className="text-zinc-400 mb-8">Generate multiple choice quizzes from your saved topics to test your knowledge.</p>
        
        <div className="flex gap-2 w-full mb-4">
          <input 
            type="text" 
            placeholder="Topic (Optional)" 
            value={topic} 
            onChange={e => setTopic(e.target.value)} 
            className="flex-1 bg-zinc-950 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-rose-500"
          />
          <button onClick={generateQuiz} className="bg-white text-black px-5 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-all">
            Generate Quiz
          </button>
        </div>
      </div>
    );
  }

  if (loading) return <div className="h-full min-h-[400px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>;

  if (finished) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-20">
        <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center mb-6 text-indigo-400 text-3xl font-bold">
          {score}/{quiz.questions.length}
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
        <p className="text-zinc-400 mb-8">Great job testing your knowledge on {topic || 'your vault'}.</p>
        <button onClick={() => setQuiz(null)} className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-medium rounded-xl transition-all">Take Another</button>
      </div>
    );
  }

  const q = quiz.questions[currentQ];

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="flex justify-between items-center text-sm text-zinc-400 mb-6">
        <span className="font-medium bg-zinc-900 px-3 py-1 rounded-full">Question {currentQ + 1} of {quiz.questions.length}</span>
        <span className="text-rose-400 font-bold">Score: {score}</span>
      </div>

      <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 mb-6">
        <h3 className="text-xl font-medium text-white mb-8">{q.question}</h3>
        
        <div className="space-y-3">
          {q.options.map((opt: string, idx: number) => {
            let btnClass = "w-full text-left p-4 rounded-xl border transition-all ";
            if (!showExplanation) {
              btnClass += "border-white/10 bg-zinc-950/50 hover:border-indigo-500 hover:bg-indigo-500/10 text-zinc-300";
            } else {
              if (idx === q.correctAnswer) {
                btnClass += "border-emerald-500/50 bg-emerald-500/20 text-emerald-400 font-bold";
              } else if (idx === selectedOpt) {
                btnClass += "border-rose-500/50 bg-rose-500/20 text-rose-400";
              } else {
                btnClass += "border-white/5 bg-zinc-950/50 text-zinc-600 opacity-50";
              }
            }
            
            return (
              <button key={idx} onClick={() => handleAnswer(idx)} className={btnClass}>
                <span className="mr-3 text-sm opacity-50">{['A','B','C','D'][idx]}</span> {opt}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {showExplanation && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-6 mb-6">
            <h4 className="font-bold text-indigo-400 mb-2">Explanation</h4>
            <p className="text-sm text-zinc-300 leading-relaxed">{q.explanation}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {showExplanation && (
        <div className="flex justify-end">
          <button onClick={handleNext} className="bg-white text-black px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200">
            {currentQ < quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'} <Play className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const TutorView = () => {
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: "Hello! I am your AI Tutor. I'm here to help you learn and understand concepts deeply. What would you like to explore today?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
      
      const response = await fetch(`${api.defaults.baseURL}/study/tutor/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': api.defaults.headers.common['Authorization'] as string
        },
        body: JSON.stringify({ messages: allMessages })
      });

      if (!response.ok) throw new Error('Network response was not ok');

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
                const parsedData = JSON.parse(line.slice(6));
                if (parsedData.content) {
                  assistantContent += parsedData.content;
                  setMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1] = { role: 'assistant', content: assistantContent };
                    return next;
                  });
                }
              } catch (_) {}
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: '⚠️ Connection failed.' };
        return next;
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto min-h-[600px] border border-white/5 rounded-3xl overflow-hidden bg-zinc-950/20">
      <div className="p-4 bg-zinc-900/50 border-b border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-white">AI Tutor</h3>
          <p className="text-xs text-zinc-400">Socratic learning & deep dives</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-zinc-800/80 text-zinc-200 rounded-bl-sm border border-white/5'}`}>
              {msg.role === 'assistant' && msg.content === '' && isTyping ? (
                <div className="flex gap-1 py-2"><div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce"/><div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{animationDelay:'0.15s'}}/><div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{animationDelay:'0.3s'}}/></div>
              ) : msg.role === 'assistant' ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ className, children, ...props }) {
                      const isBlock = className?.includes('language-');
                      return isBlock ? (
                        <pre className="bg-zinc-950 rounded-lg p-3 my-3 overflow-x-auto text-xs font-mono border border-white/5"><code className={className}>{children}</code></pre>
                      ) : (
                        <code className="bg-zinc-900 px-1.5 py-0.5 rounded text-xs text-blue-300" {...props}>{children}</code>
                      );
                    },
                    p({ children }) { return <p className="mb-3 last:mb-0 leading-relaxed text-[15px]">{children}</p>; },
                    ul({ children }) { return <ul className="list-disc pl-5 mb-3 space-y-2">{children}</ul>; },
                    ol({ children }) { return <ol className="list-decimal pl-5 mb-3 space-y-2">{children}</ol>; },
                    h3({ children }) { return <h3 className="text-white font-bold mt-4 mb-2">{children}</h3>; },
                  }}
                >{msg.content}</ReactMarkdown>
              ) : msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-zinc-900/40">
        <div className="relative flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your tutor a question..."
            disabled={isTyping}
            className="flex-1 bg-zinc-950 border border-white/10 rounded-full pl-5 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50"
          />
          <button type="submit" disabled={!input.trim() || isTyping} className="h-11 w-11 rounded-full bg-blue-600 hover:bg-blue-500 flex items-center justify-center text-white disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20">
            {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-1" />}
          </button>
        </div>
      </form>
    </div>
  );
};

export const Study: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 flex flex-col md:flex-row gap-8 min-h-screen">
      {/* Sidebar Nav */}
      <div className="w-full md:w-64 shrink-0 space-y-2">
        <h2 className="text-2xl font-black text-white px-3 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          Study Mode
        </h2>
        <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<LayoutDashboard />} label="Dashboard" />
        <NavButton active={activeTab === 'flashcards'} onClick={() => setActiveTab('flashcards')} icon={<Layers />} label="Flashcards" />
        <NavButton active={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} icon={<HelpCircle />} label="Quizzes" />
        <NavButton active={activeTab === 'tutor'} onClick={() => setActiveTab('tutor')} icon={<MessageCircle />} label="AI Tutor" />
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-zinc-950/60 border border-white/5 rounded-3xl p-8 min-h-[70vh] shadow-2xl backdrop-blur-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'dashboard' && <StudyDashboard onStartRevision={() => setActiveTab('flashcards')} />}
            {activeTab === 'flashcards' && <FlashcardsView />}
            {activeTab === 'quiz' && <QuizView />}
            {activeTab === 'tutor' && <TutorView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
