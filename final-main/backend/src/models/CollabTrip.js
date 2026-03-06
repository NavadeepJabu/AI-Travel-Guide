const mongoose = require('mongoose');
const crypto = require('crypto');

const voteSchema = new mongoose.Schema({
    name: { type: String, required: true },       // voter display name
    vote: { type: String, enum: ['up', 'down'], required: true },
}, { _id: false });

const attractionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, default: '' },
    votes: [voteSchema],
});

const noteSchema = new mongoose.Schema({
    day: { type: Number, required: true },
    text: { type: String, required: true },
    author: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const collaboratorSchema = new mongoose.Schema({
    name: { type: String, required: true },
    joinedAt: { type: Date, default: Date.now },
}, { _id: false });

const collabTripSchema = new mongoose.Schema({
    shareCode: {
        type: String,
        unique: true,
        default: () => crypto.randomBytes(4).toString('hex'), // 8-char hex
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    ownerName: { type: String, default: 'Trip Owner' },
    destination: { type: String, required: true },
    days: { type: Number, required: true },
    budget: { type: String, default: '' },
    attractions: [attractionSchema],
    notes: [noteSchema],
    collaborators: [collaboratorSchema],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CollabTrip', collabTripSchema);
