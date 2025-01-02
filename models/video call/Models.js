const mongoose = require('mongoose');

// Chat Schema
const roomSchema = new mongoose.Schema({
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    connection_string: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    lastSession: {
        type: Date,
        default: null
    }
});

// Chat Message Schema
const roomParticipantSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    name: {
        type: String,
        default: ''
    },
    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        required: true
    },
    dateJoined: {
        type: Date,
        default: Date.now
    },
});

// Exporting the models
const Room = mongoose.model('Room', roomSchema);
const RoomParticipant = mongoose.model('RoomParticipant', roomParticipantSchema);

module.exports = { Room, RoomParticipant };
