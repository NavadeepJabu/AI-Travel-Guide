import React, { useState } from 'react';
import { X, MapPin, Calendar, DollarSign, Loader2, Map, Sparkles, Compass, CloudSun } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentId: string;
}

const AGENT_META: Record<string, { title: string; subtitle: string; icon: any; gradient: string; placeholder: string }> = {
    itinerary_planner: {
        title: 'AI Itinerary Planner',
        subtitle: 'Get a detailed day-by-day travel schedule',
        icon: Map,
        gradient: 'from-orange-500 to-red-500',
        placeholder: 'Building your perfect daily schedule...',
    },
    budget_calculator: {
        title: 'AI Budget Planner',
        subtitle: 'Complete cost breakdown in Indian Rupees (₹)',
        icon: DollarSign,
        gradient: 'from-green-500 to-emerald-500',
        placeholder: 'Calculating costs and optimizing your budget...',
    },
    attractions_recommender: {
        title: 'AI Attractions Guide',
        subtitle: 'Must-visit places and hidden gems',
        icon: Sparkles,
        gradient: 'from-amber-500 to-orange-500',
        placeholder: 'Discovering the best attractions for you...',
    },
    travel_tips_advisor: {
        title: 'AI Local Tips Advisor',
        subtitle: 'Insider tips, customs, and safety advice',
        icon: Compass,
        gradient: 'from-purple-500 to-pink-500',
        placeholder: 'Gathering local expert advice...',
    },
    weather_safety_analyst: {
        title: 'AI Weather & Safety',
        subtitle: 'Weather conditions and travel risk assessment',
        icon: CloudSun,
        gradient: 'from-sky-500 to-blue-500',
        placeholder: 'Analyzing weather patterns and safety...',
    },
};

const AgentModal: React.FC<AgentModalProps> = ({ isOpen, onClose, agentId }) => {
    const [destination, setDestination] = useState('');
    const [days, setDays] = useState('');
    const [budget, setBudget] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState('');
    const [error, setError] = useState('');

    const meta = AGENT_META[agentId] || AGENT_META['itinerary_planner'];
    const IconComp = meta.icon;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!destination || !days || !budget) return;

        setIsLoading(true);
        setError('');
        setResult('');

        try {
            const resp = await fetch('https://ai-travel-backend-wyu8.onrender.com/api/ai-agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agent: agentId, destination, days, budget }),
            });
            const data = await resp.json();

            if (!data.success) throw new Error(data.error || 'Agent failed to generate output.');
            setResult(data.content || 'No content generated.');
        } catch (err: any) {
            setError(err.message || 'Something went wrong.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setResult('');
        setError('');
        setIsLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className={`flex items-center justify-between px-6 py-5 bg-gradient-to-r ${meta.gradient} text-white`}>
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <IconComp className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">{meta.title}</h2>
                            <p className="text-white/80 text-sm">{meta.subtitle}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Input Form (always visible unless result is shown) */}
                    {!result && !isLoading && (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Destination</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        value={destination}
                                        onChange={(e) => setDestination(e.target.value)}
                                        placeholder="e.g., Jaipur, India"
                                        className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (days)</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="number" min="1" max="30"
                                            value={days}
                                            onChange={(e) => setDays(e.target.value)}
                                            placeholder="e.g., 3"
                                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Budget (₹)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="number" min="100"
                                            value={budget}
                                            onChange={(e) => setBudget(e.target.value)}
                                            placeholder="e.g., 50000"
                                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
                            )}

                            <button
                                type="submit"
                                disabled={!destination || !days || !budget}
                                className={`w-full py-4 bg-gradient-to-r ${meta.gradient} text-white rounded-xl font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transform hover:scale-[1.01] transition-all`}
                            >
                                Generate with AI
                            </button>
                        </form>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-16 space-y-6">
                            <div className="relative">
                                <div className={`w-20 h-20 rounded-full bg-gradient-to-r ${meta.gradient} flex items-center justify-center shadow-lg`}>
                                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                                </div>
                            </div>
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-800 mb-2">{meta.title} is Working...</h3>
                                <p className="text-gray-500">{meta.placeholder}</p>
                                <p className="text-gray-400 text-sm mt-2">This may take 1-2 minutes</p>
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {result && (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Results</h3>
                                <button
                                    onClick={() => { setResult(''); setError(''); }}
                                    className={`text-sm font-semibold px-4 py-2 bg-gradient-to-r ${meta.gradient} text-white rounded-lg hover:shadow-md transition-all`}
                                >
                                    Try Again
                                </button>
                            </div>
                            <div className="prose prose-gray max-w-none prose-h1:text-2xl prose-h2:text-xl prose-h2:text-gray-800 prose-h3:text-lg prose-a:text-orange-500 prose-strong:text-gray-900 bg-gray-50 border border-gray-100 rounded-xl p-6">
                                <ReactMarkdown>{result}</ReactMarkdown>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AgentModal;
