import React, { useState, useEffect, useCallback } from 'react';
import { ThumbsUp, ThumbsDown, Users, Copy, Check, ArrowLeft, Send, MapPin, Calendar } from 'lucide-react';

interface Vote { name: string; vote: 'up' | 'down'; }
interface Attraction { _id: string; name: string; description: string; votes: Vote[]; }
interface Note { _id?: string; day: number; text: string; author: string; createdAt: string; }
interface Collaborator { name: string; joinedAt: string; }
interface CollabTripData {
    shareCode: string; destination: string; days: number; budget: string;
    ownerName: string; attractions: Attraction[]; notes: Note[]; collaborators: Collaborator[];
}

interface CollabTripProps {
    shareCode: string;
    onBack: () => void;
}

const BACKEND = 'https://ai-travel-backend-wyu8.onrender.com';

const CollabTrip: React.FC<CollabTripProps> = ({ shareCode, onBack }) => {
    const [trip, setTrip] = useState<CollabTripData | null>(null);
    const [myName, setMyName] = useState('');
    const [joined, setJoined] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [noteText, setNoteText] = useState('');
    const [noteDay, setNoteDay] = useState(1);
    const [copied, setCopied] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTrip = useCallback(async () => {
        try {
            const res = await fetch(`${BACKEND}/api/collab/${shareCode}`);
            if (!res.ok) throw new Error('Trip not found');
            const data = await res.json();
            setTrip(data.trip);
            setError('');
        } catch (e: any) {
            setError(e.message || 'Failed to load trip');
        } finally {
            setLoading(false);
        }
    }, [shareCode]);

    // Initial load + polling every 5s
    useEffect(() => {
        fetchTrip();
        const interval = setInterval(fetchTrip, 5000);
        return () => clearInterval(interval);
    }, [fetchTrip]);

    // Check if already joined (localStorage)
    useEffect(() => {
        const saved = localStorage.getItem(`collab_name_${shareCode}`);
        if (saved) { setMyName(saved); setJoined(true); }
    }, [shareCode]);

    const handleJoin = async () => {
        if (!nameInput.trim()) return;
        try {
            await fetch(`${BACKEND}/api/collab/${shareCode}/join`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: nameInput.trim() }),
            });
            setMyName(nameInput.trim());
            setJoined(true);
            localStorage.setItem(`collab_name_${shareCode}`, nameInput.trim());
            fetchTrip();
        } catch { }
    };

    const handleVote = async (attractionId: string, vote: 'up' | 'down') => {
        if (!joined) return;
        try {
            const res = await fetch(`${BACKEND}/api/collab/${shareCode}/vote`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ attractionId, name: myName, vote }),
            });
            const data = await res.json();
            if (data.trip) setTrip(data.trip);
        } catch { }
    };

    const handleAddNote = async () => {
        if (!noteText.trim() || !joined) return;
        try {
            const res = await fetch(`${BACKEND}/api/collab/${shareCode}/note`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ day: noteDay, text: noteText.trim(), author: myName }),
            });
            const data = await res.json();
            if (data.trip) setTrip(data.trip);
            setNoteText('');
        } catch { }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/?collab=${shareCode}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // --- JOIN SCREEN ---
    if (!joined) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-orange-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900">Join Trip Planning</h1>
                        {trip && (
                            <p className="text-gray-500 mt-2">
                                <span className="font-semibold text-gray-700">{trip.ownerName}</span> invited you to plan a trip to{' '}
                                <span className="font-semibold text-orange-500">{trip.destination}</span>
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Your Display Name</label>
                        <input
                            type="text" value={nameInput}
                            onChange={e => setNameInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleJoin()}
                            placeholder="e.g., Rahul"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                        />
                        <button onClick={handleJoin} disabled={!nameInput.trim()}
                            className="w-full mt-4 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold disabled:opacity-50 hover:shadow-lg transition-all"
                        >
                            Join Trip
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-500">Loading trip...</p></div>;
    if (error || !trip) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-red-500">{error || 'Trip not found'}</p></div>;

    // --- MAIN COLLAB VIEW ---
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <button onClick={onBack} className="flex items-center gap-2 text-white/80 hover:text-white transition-colors">
                            <ArrowLeft className="w-5 h-5" /> Back
                        </button>
                        <button onClick={copyLink}
                            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Share Link'}
                        </button>
                    </div>
                    <div className="mt-4">
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <MapPin className="w-7 h-7" /> {trip.destination}
                        </h1>
                        <div className="flex items-center gap-4 mt-2 text-white/80">
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {trip.days} days</span>
                            {trip.budget && <span>₹{trip.budget} budget</span>}
                            <span className="flex items-center gap-1"><Users className="w-4 h-4" /> {trip.collaborators.length} people</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT: Attractions Voting */}
                    <div className="lg:col-span-2 space-y-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                🗳️ Vote on Attractions
                            </h2>
                            {trip.attractions.length === 0 && (
                                <p className="text-gray-400 text-sm">No attractions added yet.</p>
                            )}
                            <div className="space-y-3">
                                {trip.attractions.map(a => {
                                    const ups = a.votes.filter(v => v.vote === 'up').length;
                                    const downs = a.votes.filter(v => v.vote === 'down').length;
                                    const myVote = a.votes.find(v => v.name.toLowerCase() === myName.toLowerCase())?.vote;

                                    return (
                                        <div key={a._id} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-800">{a.name}</h3>
                                                    {a.description && <p className="text-gray-500 text-sm mt-1">{a.description}</p>}
                                                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                                                        {a.votes.map((v, i) => (
                                                            <span key={i} className={`px-1.5 py-0.5 rounded ${v.vote === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
                                                                {v.name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <button onClick={() => handleVote(a._id, 'up')}
                                                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${myVote === 'up' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600 hover:bg-green-100'
                                                            }`}
                                                    >
                                                        <ThumbsUp className="w-4 h-4" /> {ups}
                                                    </button>
                                                    <button onClick={() => handleVote(a._id, 'down')}
                                                        className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${myVote === 'down' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-500 hover:bg-red-100'
                                                            }`}
                                                    >
                                                        <ThumbsDown className="w-4 h-4" /> {downs}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Day Notes */}
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                📝 Day Notes
                            </h2>
                            {/* Note input */}
                            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm mb-4">
                                <div className="flex items-center gap-3 mb-3">
                                    <select value={noteDay} onChange={e => setNoteDay(Number(e.target.value))}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                    >
                                        {Array.from({ length: trip.days }, (_, i) => (
                                            <option key={i + 1} value={i + 1}>Day {i + 1}</option>
                                        ))}
                                    </select>
                                    <input type="text" value={noteText} onChange={e => setNoteText(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                                        placeholder="Add a note for this day..."
                                        className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                                    />
                                    <button onClick={handleAddNote} disabled={!noteText.trim()}
                                        className="p-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg disabled:opacity-50 hover:shadow-md transition-all"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Notes grouped by day */}
                            {Array.from({ length: trip.days }, (_, i) => i + 1).map(day => {
                                const dayNotes = trip.notes.filter(n => n.day === day);
                                if (dayNotes.length === 0) return null;
                                return (
                                    <div key={day} className="mb-4">
                                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Day {day}</h3>
                                        <div className="space-y-2">
                                            {dayNotes.map((n, idx) => (
                                                <div key={idx} className="bg-white rounded-lg border border-gray-100 px-4 py-3 shadow-sm">
                                                    <p className="text-gray-800 text-sm">{n.text}</p>
                                                    <p className="text-gray-400 text-xs mt-1">— {n.author}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* RIGHT: Collaborators sidebar */}
                    <div>
                        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm sticky top-8">
                            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                <Users className="w-5 h-5 text-orange-500" /> Collaborators ({trip.collaborators.length})
                            </h3>
                            <div className="space-y-2">
                                {trip.collaborators.map((c, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${i === 0 ? 'bg-gradient-to-r from-orange-500 to-red-500' : 'bg-gray-400'
                                            }`}>
                                            {c.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">
                                                {c.name} {c.name.toLowerCase() === myName.toLowerCase() && <span className="text-orange-500">(you)</span>}
                                            </p>
                                            {i === 0 && <p className="text-xs text-gray-400">Owner</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Quick share */}
                            <div className="mt-6 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-500 mb-2">Share this link with friends:</p>
                                <div className="flex items-center gap-2">
                                    <input readOnly value={`${window.location.origin}/?collab=${shareCode}`}
                                        className="flex-1 text-xs px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                                    />
                                    <button onClick={copyLink} className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CollabTrip;
