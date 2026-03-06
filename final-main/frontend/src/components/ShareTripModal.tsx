import React, { useState } from 'react';
import { X, Plus, Copy, Check, Share2, MapPin, Calendar, Trash2 } from 'lucide-react';

interface ShareTripModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (shareCode: string) => void;
    token: string;
}

const BACKEND = 'https://ai-travel-backend-wyu8.onrender.com';

const ShareTripModal: React.FC<ShareTripModalProps> = ({ isOpen, onClose, onCreated, token }) => {
    const [destination, setDestination] = useState('');
    const [days, setDays] = useState('');
    const [budget, setBudget] = useState('');
    const [attractions, setAttractions] = useState<string[]>([]);
    const [newAttraction, setNewAttraction] = useState('');
    const [loading, setLoading] = useState(false);
    const [shareCode, setShareCode] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');

    const addAttraction = () => {
        if (newAttraction.trim() && !attractions.includes(newAttraction.trim())) {
            setAttractions([...attractions, newAttraction.trim()]);
            setNewAttraction('');
        }
    };

    const removeAttraction = (idx: number) => {
        setAttractions(attractions.filter((_, i) => i !== idx));
    };

    const handleCreate = async () => {
        if (!destination || !days) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${BACKEND}/api/collab`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ destination, days: Number(days), budget, attractions }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to create');
            setShareCode(data.shareCode);
        } catch (e: any) {
            setError(e.message || 'Failed to create collaborative trip');
        } finally {
            setLoading(false);
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/?collab=${shareCode}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleOpenTrip = () => {
        onCreated(shareCode);
        onClose();
    };

    const handleClose = () => {
        setShareCode('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <div className="flex items-center gap-2">
                        <Share2 className="w-5 h-5" />
                        <h2 className="text-lg font-bold">Create Collaborative Trip</h2>
                    </div>
                    <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-full"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {!shareCode ? (
                        <div className="space-y-4">
                            {/* Destination */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Destination</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
                                        placeholder="e.g., Goa" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Days</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                        <input type="number" min="1" value={days} onChange={e => setDays(e.target.value)}
                                            placeholder="3" className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Budget (₹)</label>
                                    <input type="text" value={budget} onChange={e => setBudget(e.target.value)}
                                        placeholder="50000" className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                                    />
                                </div>
                            </div>

                            {/* Attractions */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Attractions to Vote On</label>
                                <div className="flex gap-2 mb-2">
                                    <input type="text" value={newAttraction} onChange={e => setNewAttraction(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addAttraction()}
                                        placeholder="e.g., Baga Beach" className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                    />
                                    <button onClick={addAttraction} className="p-2 bg-orange-50 text-orange-500 rounded-lg hover:bg-orange-100 transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                                {attractions.length > 0 && (
                                    <div className="space-y-1.5">
                                        {attractions.map((a, i) => (
                                            <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                                                <span className="text-sm text-gray-700">{a}</span>
                                                <button onClick={() => removeAttraction(i)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {error && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                            <button onClick={handleCreate} disabled={!destination || !days || loading}
                                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold disabled:opacity-50 hover:shadow-lg transition-all"
                            >
                                {loading ? 'Creating...' : 'Create & Get Share Link'}
                            </button>
                        </div>
                    ) : (
                        /* Success — show share link */
                        <div className="text-center space-y-5">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                                <Check className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Trip Created!</h3>
                            <p className="text-gray-500 text-sm">Share this link with friends so they can vote and add notes:</p>
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                                <input readOnly value={`${window.location.origin}/?collab=${shareCode}`}
                                    className="flex-1 text-sm text-gray-700 bg-transparent outline-none"
                                />
                                <button onClick={copyLink} className="flex items-center gap-1 text-orange-500 text-sm font-medium hover:text-orange-600">
                                    {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
                                </button>
                            </div>
                            <button onClick={handleOpenTrip}
                                className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                            >
                                Open Trip
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareTripModal;
