const {
    Room,
    RoomParticipant,
} = require("../../models/video call/Models");
const crypto = require('crypto');

let updateRoom = async (req, res) => {
    try {
        const { room_id, name } = req.body;

        // Validate input
        if (!room_id) {
            return res.status(400).json({ error: "Room ID is required" });
        }

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: "New room name is required" });
        }

        // Find the room
        const room = await Room.findById(room_id);

        // Check if room exists
        if (!room) {
            return res.status(404).json({ error: "Room not found" });
        }

        // Ensure only the room creator can update the room
        if (room.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ error: "You are not authorized to update this room" });
        }

        // Update the room name
        room.name = name.trim();
        await room.save();

        // Fetch updated list of user's rooms
        const userRooms = await Room.find({ createdBy: req.user.id })
            .sort({ createdAt: -1 })
            .populate('createdBy', 'username email');

        // Send success response
        res.json({
            message: "Room name updated successfully",
            updatedRoom: room,
            userRooms
        });

    } catch (error) {
        console.error("Error while updating room:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

let getAllRooms = async (req, res) => {
    try {
        // Fetch all rooms created by the current user
        const userRooms = await Room.find({ createdBy: req.user.id })
            .sort({ createdAt: -1 }) // Sort by most recently created first
            .populate('createdBy', 'username email'); // Optionally populate creator details

        // Check if user has no rooms
        if (userRooms.length === 0) {
            return res.json({
                message: "No rooms found",
                rooms: []
            });
        }

        // Return the rooms
        res.json({
            message: "Rooms retrieved successfully",
            rooms: userRooms
        });

    } catch (error) {
        console.error("Error while fetching rooms:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

let deleteRoom = async (req, res) => {
    try {
        const { room_id } = req.query; // Assuming roomId is passed in the URL

        // Check if roomId is provided
        if (!room_id) {
            return res.status(400).json({ error: "Room ID is required" });
        }

        // Find the room first to verify ownership
        const room = await Room.findById(room_id);

        // Check if room exists
        if (!room) {
            return res.status(404).json({ error: "Room not found" });
        }

        // Ensure only the room creator can delete the room
        if (room.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ error: "You are not authorized to delete this room" });
        }

        // Delete all room participants associated with this room
        await RoomParticipant.deleteMany({ room: room_id });

        // Delete the room itself
        await Room.findByIdAndDelete(room_id);

        // Fetch remaining rooms created by the user
        const remainingRooms = await Room.find({ createdBy: req.user.id });

        // Send success response with remaining rooms
        res.json({
            message: "Room deleted successfully",
            remainingRooms
        });

    } catch (error) {
        console.error("Error while deleting room:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

let createRoom = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: "Please include a room name" });
        }

        // Generate a unique connection string
        const connection_string = crypto.randomBytes(4).toString('hex');

        // Create a new room with the name, user ID, and connection string
        const room = new Room({
            name,
            createdBy: req.user.id,
            connection_string
        });

        // Save the room to the database
        await room.save();

        // Fetch all rooms created by the user
        const userRooms = await Room.find({ createdBy: req.user.id }).populate('createdBy', 'username email');

        // Return a success response with the new room and all user's rooms
        res.json({
            message: "Room created successfully!",
            newRoom: room,
            userRooms
        });


    } catch (error) {
        console.error("Error while creating room:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    createRoom,
    deleteRoom,
    getAllRooms,
    updateRoom
};
