import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import type { ForceGraphMethods } from 'react-force-graph-2d';
import { Network, X, Brain, Hash, Layout, User, Code, FileCode2, Search, Sparkles, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '@/lib/api';

interface GraphData {
  nodes: any[];
  links: any[];
}

export const Graph: React.FC = () => {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightNodes, setHighlightNodes] = useState(new Set());
  
  // Chat States
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatActive, setChatActive] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods | undefined>(undefined);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await api.get('/graph');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load graph', err);
      } finally {
        setLoading(false);
      }
    };
    fetchGraph();
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    }
    const handleResize = () => {
      if (containerRef.current) setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [loading]);

  useEffect(() => {
    if (chatActive) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatActive]);

  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const q = searchQuery.toLowerCase();
      const matched = new Set();
      data.nodes.forEach(node => {
        if (node.name.toLowerCase().includes(q) || (node.summary && node.summary.toLowerCase().includes(q))) {
          matched.add(node.id);
          // highlight immediate neighbors
          data.links.forEach(l => {
            const srcId = typeof l.source === 'object' ? l.source.id : l.source;
            const tgtId = typeof l.target === 'object' ? l.target.id : l.target;
            if (srcId === node.id) matched.add(tgtId);
            if (tgtId === node.id) matched.add(srcId);
          });
        }
      });
      setHighlightNodes(matched);
    } else {
      setHighlightNodes(new Set());
    }
  }, [searchQuery, data]);

  const handleNodeClick = useCallback((node: any) => {
    setSelectedNode(node);
    setChatActive(false);
    setChatMessages([]);
    fgRef.current?.centerAt(node.x, node.y, 800);
    fgRef.current?.zoom(2.5, 800);
  }, []);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'reel': return '#6366f1';
      case 'creator': return '#ec4899';
      case 'collection': return '#f59e0b';
      case 'tag': return '#10b981';
      case 'topic': return '#8b5cf6';
      case 'technology': return '#3b82f6';
      case 'framework': return '#06b6d4';
      default: return '#a1a1aa';
    }
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'reel': return <Brain className="w-4 h-4" />;
      case 'creator': return <User className="w-4 h-4" />;
      case 'collection': return <Layout className="w-4 h-4" />;
      case 'tag': return <Hash className="w-4 h-4" />;
      case 'topic': return <Network className="w-4 h-4" />;
      case 'technology': return <Code className="w-4 h-4" />;
      case 'framework': return <FileCode2 className="w-4 h-4" />;
      default: return <Hash className="w-4 h-4" />;
    }
  };

  const getConnectedNodes = (nodeId: string) => {
    const connectedIds = data.links
      .filter(l => (l.source as any).id === nodeId || (l.target as any).id === nodeId)
      .map(l => (l.source as any).id === nodeId ? (l.target as any).id : (l.source as any).id);
    return data.nodes.filter(n => connectedIds.includes(n.id));
  };

  const syncGraph = async () => {
    setLoading(true);
    try {
      await api.post('/graph/sync');
      const res = await api.get('/graph');
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startChat = () => {
    setChatActive(true);
    if (chatMessages.length === 0) {
      setChatMessages([{ role: 'assistant', content: `Hello! I'm ready to teach you about **${selectedNode.name}**. What would you like to know?` }]);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping || !selectedNode) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    const allMessages = [...chatMessages, { role: 'user' as const, content: userMessage }];
    setChatMessages(allMessages);
    setIsTyping(true);

    try {
      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);
      
      const response = await fetch(`${api.defaults.baseURL}/graph/node/${selectedNode.id}/chat`, {
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
                  setChatMessages(prev => {
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
      setChatMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: '⚠️ Connection failed.' };
        return next;
      });
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#09090b] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl shrink-0 flex flex-col md:flex-row md:items-center justify-between z-10 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Network className="w-6 h-6 text-indigo-400" /> Knowledge Graph
          </h1>
          <p className="text-zinc-400 text-sm mt-0.5">Explore semantic connections across your knowledge base</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-full pl-9 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors w-64"
            />
          </div>
          <button onClick={syncGraph} className="px-4 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
            Sync Graph
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex">
        {/* Graph Canvas */}
        <div className="flex-1 relative" ref={containerRef}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
            </div>
          ) : (
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={data}
              nodeLabel="name"
              nodeVal={(node: any) => node.val || 1}
              nodeColor={(node: any) => {
                if (highlightNodes.size > 0 && !highlightNodes.has(node.id)) return '#3f3f46'; // dim unhighlighted
                return getNodeColor(node.type);
              }}
              nodeRelSize={4}
              linkColor={() => 'rgba(255, 255, 255, 0.08)'}
              linkWidth={1.5}
              onNodeClick={handleNodeClick}
              backgroundColor="#09090b"
              enableNodeDrag={true}
              enablePanInteraction={true}
              enableZoomInteraction={true}
              nodeCanvasObject={(node: any, ctx, globalScale) => {
                const label = node.name;
                const fontSize = 12 / globalScale;
                const isHighlighted = highlightNodes.has(node.id);
                const isDimmed = highlightNodes.size > 0 && !isHighlighted;
                
                ctx.font = `${fontSize}px Sans-Serif`;
                
                // Glow effect for important nodes
                if (!isDimmed && (node.val > 2 || isHighlighted)) {
                  ctx.beginPath();
                  ctx.arc(node.x, node.y, (node.val || 1) * 3 + 4, 0, 2 * Math.PI, false);
                  ctx.fillStyle = `${getNodeColor(node.type)}33`; // 20% opacity
                  ctx.fill();
                }

                // Draw Node Circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, (node.val || 1) * 3, 0, 2 * Math.PI, false);
                ctx.fillStyle = isDimmed ? '#3f3f46' : getNodeColor(node.type);
                ctx.fill();

                // Draw Label if zoomed in enough or highlighted
                if (globalScale > 1.2 || node.val > 2 || isHighlighted) {
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'middle';
                  ctx.fillStyle = isDimmed ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.9)';
                  ctx.fillText(label, node.x, node.y + ((node.val || 1) * 3) + fontSize + 2);
                }
              }}
            />
          )}
        </div>

        {/* Right Info Panel */}
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-80 md:w-96 bg-zinc-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col z-20"
            >
              <div className="p-5 border-b border-white/5 bg-zinc-900/95 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-zinc-800/50" style={{ color: getNodeColor(selectedNode.type) }}>
                    {getNodeIcon(selectedNode.type)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm uppercase tracking-wider">{selectedNode.type}</h3>
                  </div>
                </div>
                <button onClick={() => setSelectedNode(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!chatActive ? (
                <div className="p-5 flex-1 overflow-y-auto">
                  <h2 className="text-xl font-bold text-white mb-2 leading-tight">{selectedNode.name}</h2>
                  {selectedNode.summary && <p className="text-sm text-zinc-400 leading-relaxed mb-5">{selectedNode.summary}</p>}
                  
                  <div className="border-t border-white/5 pt-5">
                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Connections</h4>
                    <div className="flex flex-wrap gap-2">
                      {getConnectedNodes(selectedNode.id).map(n => (
                        <button
                          key={n.id}
                          onClick={() => handleNodeClick(n)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-white/10 bg-zinc-800/50 hover:bg-zinc-700/50 text-zinc-300 transition-colors flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getNodeColor(n.type) }} />
                          {n.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-5 border-t border-white/5">
                    <button 
                      onClick={startChat}
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20"
                    >
                      <Sparkles className="w-4 h-4" /> Ask AI to explain this
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col flex-1 h-full overflow-hidden">
                  <div className="p-3 bg-zinc-950/50 border-b border-white/5 flex items-center gap-2 text-xs text-zinc-400">
                    <button onClick={() => setChatActive(false)} className="hover:text-white transition-colors">&larr; Back to Node</button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-zinc-800/80 text-zinc-200 rounded-bl-sm border border-white/5'}`}>
                          {msg.role === 'assistant' && msg.content === '' && isTyping ? (
                            <div className="flex gap-1 py-1"><div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce"/><div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{animationDelay:'0.15s'}}/><div className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{animationDelay:'0.3s'}}/></div>
                          ) : msg.role === 'assistant' ? (
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                code({ className, children, ...props }) {
                                  const isBlock = className?.includes('language-');
                                  return isBlock ? (
                                    <pre className="bg-zinc-900 rounded-md p-2 my-2 overflow-x-auto text-xs font-mono"><code className={className}>{children}</code></pre>
                                  ) : (
                                    <code className="bg-zinc-900 px-1 py-0.5 rounded text-xs text-indigo-300" {...props}>{children}</code>
                                  );
                                },
                                p({ children }) { return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>; },
                                ul({ children }) { return <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>; },
                                h3({ children }) { return <h3 className="text-white font-bold mt-2 mb-1">{children}</h3>; },
                              }}
                            >{msg.content}</ReactMarkdown>
                          ) : msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  
                  <form onSubmit={handleChatSubmit} className="p-3 border-t border-white/5 bg-zinc-900/40 shrink-0">
                    <div className="relative flex items-center gap-2">
                      <input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={`Ask about ${selectedNode.name}...`}
                        disabled={isTyping}
                        className="flex-1 bg-zinc-950 border border-white/10 rounded-full pl-4 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                      />
                      <button type="submit" disabled={!chatInput.trim() || isTyping} className="h-9 w-9 rounded-full bg-indigo-500 flex items-center justify-center text-white disabled:opacity-50">
                        {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
