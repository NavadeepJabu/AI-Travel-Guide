import React from 'react';
import { Map, DollarSign, Sparkles, Compass, CloudSun } from 'lucide-react';

interface AIFeaturesSectionProps {
    onSelectAgent: (agentId: string) => void;
}

const features = [
    {
        id: 'itinerary_planner',
        icon: Map,
        title: 'AI Itinerary Planner',
        description: 'Get a day-by-day travel schedule crafted by an expert AI planner — mornings, afternoons, and evenings perfectly organized.',
        gradient: 'from-orange-500 to-red-500',
        bgAccent: 'bg-orange-50',
        iconColor: 'text-orange-500',
    },
    {
        id: 'budget_calculator',
        icon: DollarSign,
        title: 'AI Budget Planner',
        description: 'Get a complete cost breakdown in Indian Rupees (₹) — accommodation, food, transport, and activities — and see if you\'re within budget.',
        gradient: 'from-green-500 to-emerald-500',
        bgAccent: 'bg-green-50',
        iconColor: 'text-green-600',
    },
    {
        id: 'attractions_recommender',
        icon: Sparkles,
        title: 'AI Attractions Guide',
        description: 'Discover must-visit historical sites, hidden gems, local food spots, and unique cultural experiences curated by AI.',
        gradient: 'from-amber-500 to-orange-500',
        bgAccent: 'bg-amber-50',
        iconColor: 'text-amber-500',
    },
    {
        id: 'travel_tips_advisor',
        icon: Compass,
        title: 'AI Local Tips Advisor',
        description: 'Essential customs, transport hacks, safety guidelines, and insider tips that only locals know — powered by AI expertise.',
        gradient: 'from-purple-500 to-pink-500',
        bgAccent: 'bg-purple-50',
        iconColor: 'text-purple-500',
    },
    {
        id: 'weather_safety_analyst',
        icon: CloudSun,
        title: 'AI Weather & Safety',
        description: 'Real-time weather analysis, travel risk assessment, and safety recommendations so you can travel with confidence.',
        gradient: 'from-sky-500 to-blue-500',
        bgAccent: 'bg-sky-50',
        iconColor: 'text-sky-500',
    },
];

const AIFeaturesSection: React.FC<AIFeaturesSectionProps> = ({ onSelectAgent }) => {
    return (
        <section id="ai-features" className="py-20 bg-white">
            <div className="container mx-auto px-4">
                {/* Section Header */}
                <div className="text-center mb-14">
                    <span className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold mb-4 tracking-wide uppercase">
                        Powered by CrewAI
                    </span>
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                        AI Travel Assistants
                    </h2>
                    <p className="text-gray-500 text-lg max-w-2xl mx-auto">
                        5 specialized AI agents, each an expert in their domain. Use them individually or together to plan the perfect trip.
                    </p>
                </div>

                {/* Feature Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature) => {
                        const IconComp = feature.icon;
                        return (
                            <div
                                key={feature.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group cursor-pointer"
                                onClick={() => onSelectAgent(feature.id)}
                            >
                                <div className="p-6">
                                    {/* Icon */}
                                    <div className={`w-14 h-14 ${feature.bgAccent} rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                                        <IconComp className={`w-7 h-7 ${feature.iconColor}`} />
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>

                                    {/* Description */}
                                    <p className="text-gray-500 text-sm leading-relaxed mb-5">{feature.description}</p>

                                    {/* CTA */}
                                    <button
                                        className={`w-full py-3 bg-gradient-to-r ${feature.gradient} text-white rounded-xl font-semibold text-sm hover:shadow-lg transform hover:scale-[1.02] transition-all`}
                                    >
                                        Use This Agent →
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default AIFeaturesSection;
