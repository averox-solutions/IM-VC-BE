const { Chat, ChatMessage } = require('../../models/instant messaging/Models');
const {User} = require('../../models/authentication/Models');
const { verifyTokenForRTC } = require('../../rest/authentication/Controllers');
const { handleJoinRoom, handleMessage, handleTyping, handleMarkAsSeen, handleCreateOrJoinRoom, handleDisconnection, getChatId } = require('./handler'); 

// Socket connection and event handling logic
module.exports = (io) => {
    
    // Middleware for authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.query.token;  // Extract token from query parameters
            if (!token) {
                return next(new Error('Authentication error: Token missing.'));
            }
            const decoded = await verifyTokenForRTC(token);  // Verify the token
            socket.user = decoded;  // Attach user to the socket for later use
            next();
        } catch (error) {
            return next(new Error('Authentication error: Invalid token.'));
        }
    });

    // Socket connection event
    io.on("connection", (socket) => {
        console.log(`User connected: ${socket.user.username} (${socket.id})`);

        // Event to join a room/chat which already exists
        socket.on("joinRoom", (chatId) => handleJoinRoom(io, socket, chatId));

        // Event to send a message
        socket.on("sendMessage", (data, callback) => handleMessage(io, socket, data, callback));

        // Event to notify typing
        socket.on("typing", (chatId) => handleTyping(io, socket, chatId));

        // Event to mark message as seen
        socket.on("markAsSeen", (messageId, chatId) => handleMarkAsSeen(io, socket, messageId, chatId));

        // Event to create or join a room
        socket.on("createOrJoinRoom", (participantId) => handleCreateOrJoinRoom(io, socket, participantId));

        // Handle user disconnection
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${reason} ${socket.user.username} (${socket.id})`);
            handleDisconnection(io, socket);
        });
    });
};
