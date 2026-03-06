import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, MapPin, Calendar, DollarSign, X, Bot, Map, Compass, Navigation, CheckCircle, Loader2, Zap, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AITravelPlannerProps {
    isOpen: boolean;
    onClose: () => void;
}

interface AgentInfo {
    id: string;
    name: string;
    emoji: string;
}

interface AgentState {
    status: 'waiting' | 'active' | 'complete';
    thoughts: string[];
    latestThought: string;
}

const AGENT_ICONS: Record<string, any> = {
    itinerary_planner: Map,
    budget_calculator: DollarSign,
    attractions_recommender: Sparkles,
    travel_tips_advisor: Compass,
    weather_safety_analyst: Navigation,
};

const AGENT_COLORS: Record<string, string> = {
    itinerary_planner: 'from-blue-500 to-cyan-400',
    budget_calculator: 'from-emerald-500 to-green-400',
    attractions_recommender: 'from-amber-500 to-yellow-400',
    travel_tips_advisor: 'from-purple-500 to-pink-400',
    weather_safety_analyst: 'from-teal-500 to-sky-400',
};

const AGENT_GLOW: Record<string, string> = {
    itinerary_planner: 'shadow-blue-500/40',
    budget_calculator: 'shadow-emerald-500/40',
    attractions_recommender: 'shadow-amber-500/40',
    travel_tips_advisor: 'shadow-purple-500/40',
    weather_safety_analyst: 'shadow-teal-500/40',
};

const DEFAULT_AGENTS: AgentInfo[] = [
    { id: 'itinerary_planner', name: 'Itinerary Planner', emoji: '🗺️' },
    { id: 'budget_calculator', name: 'Budget Analyst', emoji: '💰' },
    { id: 'attractions_recommender', name: 'Attractions Expert', emoji: '🎯' },
    { id: 'travel_tips_advisor', name: 'Local Tips Advisor', emoji: '💡' },
    { id: 'weather_safety_analyst', name: 'Weather Safety', emoji: '🌤️' },
];

export default function AITravelPlanner({ isOpen, onClose }: AITravelPlannerProps) {
    const [destination, setDestination] = useState('');
    const [days, setDays] = useState('');
    const [budget, setBudget] = useState('');
    const [phase, setPhase] = useState<'input' | 'streaming' | 'results'>('input');
    const [agents, setAgents] = useState<AgentInfo[]>(DEFAULT_AGENTS);
    const [agentStates, setAgentStates] = useState<Record<string, AgentState>>({});
    const [systemMessages, setSystemMessages] = useState<string[]>([]);
    const [results, setResults] = useState<any>(null);
    const [activeTab, setActiveTab] = useState('itinerary');
    const [error, setError] = useState('');
    const [completedCount, setCompletedCount] = useState(0);
    const eventSourceRef = useRef<EventSource | null>(null);
    const thoughtsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll thoughts
    useEffect(() => {
        if (thoughtsEndRef.current) {
            thoughtsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [systemMessages, agentStates]);

    // Initialize agent states
    const initAgentStates = () => {
        const states: Record<string, AgentState> = {};
        DEFAULT_AGENTS.forEach(a => {
            states[a.id] = { status: 'waiting', thoughts: [], latestThought: '' };
        });
        return states;
    };

    const handleGenerate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!destination || !days || !budget) return;

        setPhase('streaming');
        setError('');
        setResults(null);
        setCompletedCount(0);
        setSystemMessages([]);
        setAgentStates(initAgentStates());

        const url = `http://localhost:5000/api/ai-planner/stream?destination=${encodeURIComponent(destination)}&days=${encodeURIComponent(days)}&budget=${encodeURIComponent(budget)}`;

        const es = new EventSource(url);
        eventSourceRef.current = es;

        es.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                switch (data.event) {
                    case 'connected':
                    case 'system':
                        setSystemMessages(prev => [...prev, data.message]);
                        break;

                    case 'agents_init':
                        if (data.agents) setAgents(data.agents);
                        break;

                    case 'agent_start':
                        setAgentStates(prev => ({
                            ...prev,
                            [data.agent]: { ...prev[data.agent], status: 'active', latestThought: `${data.emoji} ${data.name} is working...` }
                        }));
                        setSystemMessages(prev => [...prev, `${data.emoji} ${data.name} has started working...`]);
                        break;

                    case 'agent_thought':
                        if (data.agent && data.agent !== 'system') {
                            setAgentStates(prev => {
                                const current = prev[data.agent];
                                if (!current) return prev;
                                const newThoughts = [...current.thoughts, data.thought].slice(-5);
                                return {
                                    ...prev,
                                    [data.agent]: { ...current, thoughts: newThoughts, latestThought: data.thought }
                                };
                            });
                        }
                        break;

                    case 'agent_complete':
                        setAgentStates(prev => ({
                            ...prev,
                            [data.agent]: { ...prev[data.agent], status: 'complete', latestThought: '✅ Done!' }
                        }));
                        setCompletedCount(prev => prev + 1);
                        setSystemMessages(prev => [...prev, `✅ ${data.name} has completed their analysis!`]);
                        break;

                    case 'complete':
                        if (data.success && data.data) {
                            setResults(data.data);
                            setPhase('results');
                        } else {
                            setError('Generation completed but no data was returned.');
                        }
                        es.close();
                        break;

                    case 'error':
                        setError(data.error || 'An error occurred.');
                        es.close();
                        break;

                    case 'stream_end':
                        es.close();
                        if (!results) {
                            // Sometimes complete event comes with stream_end
                        }
                        break;
                }
            } catch (err) {
                // Ignore parse errors on stray messages
            }
        };

        es.onerror = () => {
            // SSE will auto-reconnect, but if the stream ended, close it
            if (es.readyState === EventSource.CLOSED) {
                if (phase === 'streaming' && !results) {
                    setError('Connection to AI agents lost. The agents may still be processing.');
                }
            }
        };
    };

    const handleClose = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }
        onClose();
    };

    const handleReset = () => {
        setPhase('input');
        setResults(null);
        setError('');
        setSystemMessages([]);
        setAgentStates({});
        setCompletedCount(0);
    };

    const currentContent = results ? results[activeTab] || "Content not available." : '';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                        onClick={handleClose}
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-6xl bg-[#0a0f1a] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_120px_rgba(16,185,129,0.1)] flex flex-col max-h-[95vh]"
                    >
                        {/* ── HEADER ── */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-gradient-to-r from-[#0d1b2a] to-[#1b2838]">
                            <div className="flex items-center space-x-4">
                                <div className="relative">
                                    <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/30">
                                        <Bot className="w-7 h-7 text-white" />
                                    </div>
                                    {phase === 'streaming' && (
                                        <motion.div
                                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                                            transition={{ duration: 1.5, repeat: Infinity }}
                                            className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full"
                                        />
                                    )}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">Multi-Agent AI Planner</h2>
                                    <p className="text-emerald-400/70 text-xs font-mono tracking-widest uppercase">CrewAI • 5 Agents • Real-time</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                {phase === 'results' && (
                                    <button onClick={handleReset} className="px-4 py-2 text-sm font-semibold text-emerald-400 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/10 transition-colors">
                                        New Plan
                                    </button>
                                )}
                                <button onClick={handleClose} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {/* ── PHASE 1: INPUT FORM ── */}
                            {phase === 'input' && (
                                <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">
                                    <div className="text-center space-y-4">
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                                            <h3 className="text-4xl md:text-5xl font-extrabold text-white leading-tight">
                                                Watch 5 AI Agents<br />
                                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
                                                    Build Your Trip Live
                                                </span>
                                            </h3>
                                        </motion.div>
                                        <p className="text-white/50 text-lg max-w-lg mx-auto">
                                            See each specialist agent think, collaborate, and deliver — all in real-time.
                                        </p>
                                    </div>

                                    <form onSubmit={handleGenerate} className="space-y-5">
                                        <div className="relative group">
                                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5 group-focus-within:text-emerald-400 transition-colors" />
                                            <input
                                                type="text"
                                                value={destination}
                                                onChange={(e) => setDestination(e.target.value)}
                                                placeholder="Where do you want to go? (e.g., Kyoto, Japan)"
                                                className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all text-lg font-medium"
                                            />
                                        </div>

                                        <div className="flex space-x-4">
                                            <div className="relative flex-1 group">
                                                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5 group-focus-within:text-emerald-400 transition-colors" />
                                                <input
                                                    type="number" min="1" max="30"
                                                    value={days}
                                                    onChange={(e) => setDays(e.target.value)}
                                                    placeholder="Days"
                                                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all text-lg font-medium"
                                                />
                                            </div>
                                            <div className="relative flex-1 group">
                                                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5 group-focus-within:text-emerald-400 transition-colors" />
                                                <input
                                                    type="number" min="100"
                                                    value={budget}
                                                    onChange={(e) => setBudget(e.target.value)}
                                                    placeholder="Budget ($)"
                                                    className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-white/25 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.07] transition-all text-lg font-medium"
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">{error}</motion.div>
                                        )}

                                        <motion.button
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            disabled={!destination || !days || !budget}
                                            className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-3 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
                                        >
                                            <Zap className="w-6 h-6" />
                                            <span>Launch AI Agents</span>
                                        </motion.button>
                                    </form>
                                </div>
                            )}

                            {/* ── PHASE 2: LIVE AGENT DASHBOARD ── */}
                            {phase === 'streaming' && (
                                <div className="p-6 space-y-6">
                                    {/* Progress bar */}
                                    <div className="flex items-center space-x-4">
                                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                                initial={{ width: '0%' }}
                                                animate={{ width: `${Math.max(5, (completedCount / 5) * 100)}%` }}
                                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                            />
                                        </div>
                                        <span className="text-emerald-400 font-mono text-sm font-bold">{completedCount}/5</span>
                                    </div>

                                    {/* Agent Cards Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                        {agents.map((agent, idx) => {
                                            const state = agentStates[agent.id] || { status: 'waiting', thoughts: [], latestThought: '' };
                                            const IconComp = AGENT_ICONS[agent.id] || Bot;
                                            const gradientClass = AGENT_COLORS[agent.id] || 'from-gray-500 to-gray-400';
                                            const glowClass = AGENT_GLOW[agent.id] || '';
                                            const isActive = state.status === 'active';
                                            const isDone = state.status === 'complete';

                                            return (
                                                <motion.div
                                                    key={agent.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className={`relative rounded-2xl border p-4 flex flex-col items-center text-center transition-all duration-500 ${isDone
                                                            ? 'bg-emerald-500/10 border-emerald-500/30'
                                                            : isActive
                                                                ? `bg-white/[0.06] border-white/20 shadow-lg ${glowClass}`
                                                                : 'bg-white/[0.02] border-white/5'
                                                        }`}
                                                >
                                                    {/* Pulse ring for active */}
                                                    {isActive && (
                                                        <motion.div
                                                            animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                                                            transition={{ duration: 1.5, repeat: Infinity }}
                                                            className={`absolute inset-0 rounded-2xl border-2 border-current`}
                                                            style={{ color: 'rgba(16,185,129,0.3)' }}
                                                        />
                                                    )}

                                                    {/* Icon */}
                                                    <div className={`p-3 rounded-xl mb-3 ${isDone
                                                            ? 'bg-emerald-500/20'
                                                            : isActive
                                                                ? `bg-gradient-to-br ${gradientClass} shadow-md`
                                                                : 'bg-white/5'
                                                        }`}>
                                                        {isDone ? (
                                                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                                                        ) : isActive ? (
                                                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                                                                <IconComp className="w-6 h-6 text-white" />
                                                            </motion.div>
                                                        ) : (
                                                            <IconComp className="w-6 h-6 text-white/20" />
                                                        )}
                                                    </div>

                                                    {/* Name */}
                                                    <h4 className={`text-sm font-bold mb-1 ${isDone ? 'text-emerald-400' : isActive ? 'text-white' : 'text-white/30'}`}>
                                                        {agent.name}
                                                    </h4>

                                                    {/* Status */}
                                                    <div className={`text-xs font-mono ${isDone ? 'text-emerald-400/70' : isActive ? 'text-white/60' : 'text-white/15'}`}>
                                                        {isDone ? '✅ Complete' : isActive ? (
                                                            <span className="flex items-center space-x-1">
                                                                <Loader2 className="w-3 h-3 animate-spin" />
                                                                <span>Working</span>
                                                            </span>
                                                        ) : 'Standby'}
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>

                                    {/* Live Thought Feed */}
                                    <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden">
                                        <div className="flex items-center space-x-2 px-5 py-3 border-b border-white/10 bg-white/[0.02]">
                                            <Activity className="w-4 h-4 text-emerald-400" />
                                            <span className="text-white/70 text-sm font-bold tracking-wider uppercase">Live Agent Feed</span>
                                            <motion.div
                                                animate={{ opacity: [1, 0.3, 1] }}
                                                transition={{ duration: 1.2, repeat: Infinity }}
                                                className="w-2 h-2 bg-red-500 rounded-full ml-auto"
                                            />
                                            <span className="text-red-400/70 text-xs font-mono">LIVE</span>
                                        </div>
                                        <div className="max-h-60 overflow-y-auto p-4 space-y-2 font-mono text-xs custom-scrollbar">
                                            {systemMessages.map((msg, i) => (
                                                <motion.div
                                                    key={i}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className="flex items-start space-x-3"
                                                >
                                                    <span className="text-white/20 select-none flex-shrink-0 w-8 text-right">{String(i + 1).padStart(3, '0')}</span>
                                                    <span className="text-white/70">{msg}</span>
                                                </motion.div>
                                            ))}

                                            {/* Show latest thought per active agent */}
                                            {Object.entries(agentStates)
                                                .filter(([_, s]) => s.status === 'active' && s.thoughts.length > 0)
                                                .map(([agentId, s]) => (
                                                    <motion.div
                                                        key={`thought-${agentId}`}
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        className="flex items-start space-x-3 text-cyan-300/60"
                                                    >
                                                        <span className="text-white/20 select-none flex-shrink-0 w-8 text-right">{'>>>'}</span>
                                                        <span className="truncate">[{agents.find(a => a.id === agentId)?.name}] {s.latestThought}</span>
                                                    </motion.div>
                                                ))
                                            }
                                            <div ref={thoughtsEndRef} />
                                        </div>
                                    </div>

                                    {error && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-sm">{error}</motion.div>
                                    )}
                                </div>
                            )}

                            {/* ── PHASE 3: RESULTS ── */}
                            {phase === 'results' && results && (
                                <div className="flex flex-col lg:flex-row h-[70vh]">
                                    {/* Sidebar Tabs */}
                                    <div className="lg:w-64 flex lg:flex-col overflow-x-auto lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-white/10 bg-white/[0.02]">
                                        {[
                                            { id: 'itinerary', icon: Map, label: 'Itinerary', emoji: '🗺️' },
                                            { id: 'budget', icon: DollarSign, label: 'Budget', emoji: '💰' },
                                            { id: 'attractions', icon: Sparkles, label: 'Attractions', emoji: '🎯' },
                                            { id: 'travel_tips', icon: Compass, label: 'Local Tips', emoji: '💡' },
                                            { id: 'weather_safety', icon: Navigation, label: 'Weather', emoji: '🌤️' },
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className={`flex items-center flex-shrink-0 px-5 py-4 transition-all text-left ${activeTab === tab.id
                                                        ? 'bg-emerald-500/10 border-l-2 border-emerald-400 text-white'
                                                        : 'text-white/40 hover:text-white/70 hover:bg-white/5 border-l-2 border-transparent'
                                                    }`}
                                            >
                                                <span className="text-lg mr-3">{tab.emoji}</span>
                                                <span className="font-semibold text-sm">{tab.label}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                                        <div className="prose prose-invert prose-emerald max-w-none prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-h2:text-emerald-300 prose-h3:text-xl prose-a:text-teal-400 prose-li:text-white/80 prose-p:text-white/75 prose-strong:text-white">
                                            <ReactMarkdown>{currentContent}</ReactMarkdown>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
