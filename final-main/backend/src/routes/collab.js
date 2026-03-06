const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const CollabTrip = require('../models/CollabTrip');

// POST /api/collab — Create a new collaborative trip (requires login)
router.post('/', auth, async (req, res) => {
    try {
        const { destination, days, budget, attractions } = req.body;
        if (!destination || !days) {
            return res.status(400).json({ message: 'destination and days are required' });
        }

        const trip = await CollabTrip.create({
            owner: req.user.id,
            ownerName: req.user.name || 'Trip Owner',
            destination,
            days: Number(days),
            budget: budget || '',
            attractions: (attractions || []).map(a => ({
                name: typeof a === 'string' ? a : a.name,
                description: typeof a === 'string' ? '' : (a.description || ''),
                votes: [],
            })),
            collaborators: [{ name: req.user.name || 'Trip Owner' }],
        });

        res.status(201).json({
            shareCode: trip.shareCode,
            shareUrl: `${req.protocol}://${req.get('host')}/?collab=${trip.shareCode}`,
            trip,
        });
    } catch (e) {
        console.error('[Collab] Create error:', e);
        res.status(500).json({ message: 'Server error' });
    }
});

// GET /api/collab/:code — Get trip by share code (public, no auth)
router.get('/:code', async (req, res) => {
    try {
        const trip = await CollabTrip.findOne({ shareCode: req.params.code });
        if (!trip) return res.status(404).json({ message: 'Trip not found' });
        res.json({ trip });
    } catch (e) {
        console.error('[Collab] Get error:', e);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/collab/:code/join — Join as collaborator (public)
router.post('/:code/join', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'name is required' });

        const trip = await CollabTrip.findOne({ shareCode: req.params.code });
        if (!trip) return res.status(404).json({ message: 'Trip not found' });

        // Don't add duplicates
        const exists = trip.collaborators.some(c => c.name.toLowerCase() === name.toLowerCase());
        if (!exists) {
            trip.collaborators.push({ name });
            await trip.save();
        }

        res.json({ trip });
    } catch (e) {
        console.error('[Collab] Join error:', e);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/collab/:code/vote — Vote on an attraction (public)
router.post('/:code/vote', async (req, res) => {
    try {
        const { attractionId, name, vote } = req.body;
        if (!attractionId || !name || !['up', 'down'].includes(vote)) {
            return res.status(400).json({ message: 'attractionId, name, and vote (up/down) are required' });
        }

        const trip = await CollabTrip.findOne({ shareCode: req.params.code });
        if (!trip) return res.status(404).json({ message: 'Trip not found' });

        const attraction = trip.attractions.id(attractionId);
        if (!attraction) return res.status(404).json({ message: 'Attraction not found' });

        // Remove previous vote by this name, then add new
        attraction.votes = attraction.votes.filter(v => v.name.toLowerCase() !== name.toLowerCase());
        attraction.votes.push({ name, vote });
        await trip.save();

        res.json({ trip });
    } catch (e) {
        console.error('[Collab] Vote error:', e);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST /api/collab/:code/note — Add a note to a day (public)
router.post('/:code/note', async (req, res) => {
    try {
        const { day, text, author } = req.body;
        if (!day || !text || !author) {
            return res.status(400).json({ message: 'day, text, and author are required' });
        }

        const trip = await CollabTrip.findOne({ shareCode: req.params.code });
        if (!trip) return res.status(404).json({ message: 'Trip not found' });

        trip.notes.push({ day: Number(day), text, author });
        await trip.save();

        res.json({ trip });
    } catch (e) {
        console.error('[Collab] Note error:', e);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
