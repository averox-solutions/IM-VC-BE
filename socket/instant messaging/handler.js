// handlers.js
const { Chat, ChatMessage } = require('../../models/instant messaging/Models');
const User = require('../../models/authentication/Models');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mongoose = require('mongoose');


// Configure multer for file storage with a relative path
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use relative path to the project directory to store attachments in 'chat_media' folder
        cb(null, path.join(__dirname, '../../assests/chat_media'));
    },
    filename: function (req, file, cb) {
        // Create a unique file name using timestamp and the original file extension
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage }).array('attachments'); // Supports multiple attachments

// Handle joining a room
const handleJoinRoom = async (io, socket, chatId) => {
    try {
        const chat = await Chat.findById(chatId);
        if (!chat) {
            socket.emit("error", { message: "Chat not found" });
            return;
        }
        
        socket.join(chatId);
        console.log(`${socket.user.username} joined chatroom ${chatId}`);
    } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: "Error joining the chatroom." });
    }
};

// Handle sending messages
const handleMessage = async (io, socket, { chatId, message, attachments  }, callback) => {
    try {
        const chat = await Chat.findById(chatId);

        // Determine the receiver ID (the other participant in the conversation)
        const senderId = socket.user.id;
        const receiverId = chat.users.find(id => id.toString() !== senderId.toString());

        let savedAttachments = [];
        if (attachments && attachments.length > 0) {
            // Process attachments if there are any
            for (const file of attachments) {
                const filePath = path.join(__dirname, '../../assests/chat_media', file.filename);
                savedAttachments.push(filePath); // Save the file paths for database entry
            }
        }

        // Create a new message record
        const newMessage = await ChatMessage.create({
            chatId,
            senderId: senderId,
            receiverId: receiverId,
            text: message,
            attachments: savedAttachments, 
        });

         // Dynamically get the base URL (either ngrok or localhost)
         const baseUrl = `${socket.handshake.headers.origin || 'http://localhost:8080'}`;


        const formattedMessage = {
            messageId: newMessage._id.toString(), // Convert ObjectId to string
            conversationId: newMessage.conversationId.toString(), // Convert ObjectId to string
            senderId: newMessage.senderId,
            receiverId: newMessage.receiverId,
            message: newMessage.text,
            task: newMessage.task,
            seen: newMessage.seen,
            sentAt: new Date(newMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            attachments: newMessage.attachments ? newMessage.attachments.map(file => `${baseUrl}/assests/chat_media/${file}`) : null, // Convert to full URL
        };

        console.log(formattedMessage);

        // Broadcast the message to the other participant in the room
        socket.to(chatId).emit('receivemessage', formattedMessage);

        if (callback) {
            callback({ status: 'received', messageId: newMessage._id });
        }
    } catch (error) {
        console.error('Error handling message:', error);
        if (callback) {
            callback({ status: 'error', message: 'Failed to send message' });
        }
    }
};

// Handle typing event
const handleTyping = (io, socket, chatId) => {
    socket.to(chatId).emit('typing', {
        senderId: socket.user.id,
        username: socket.user.username,
    });
};

// Handle mark as seen event
const handleMarkAsSeen = (io, socket, messageId, chatId) => {
    io.to(chatId).emit('message_seen', {
        messageId,
        seenBy: socket.user.id,
    });
};

// Handle creating or joining a chat room
const handleCreateOrJoinRoom = async (io, socket, participantId) => {
    console.log("Handling creating or joining a room...")
    const chatId = await getChatId(socket.user.id, participantId);
    socket.join(chatId);
    io.to(chatId).emit('user_joined', {
        userId: socket.user.id,
        username: socket.user.username,
    });
    console.log("post handling the room...")
};

// Get chatId between two participants
const getChatId = async (userId1, userId2) => {
    const participants = [userId1, userId2].sort();
    const chat = await Chat.findOne({
        users: { $all: participants },
        $expr: { $eq: [{ $size: "$users" }, 2] },
    });

    if (chat) {
        return chat._id.toString();
    } else {
        const chat = new Chat({
            users: [userId1, userId2],
            
        });
        await chat.save();
        return chat._id.toString();
    }
};

// Handle disconnection
const handleDisconnection = (io, socket) => {
    socket.rooms.forEach((room) => {
        socket.leave(room);
        console.log(`${socket.user.username} left room: ${room}`);
    });
    console.log('User disconnected:', socket.user.username);
};

module.exports = {
    handleJoinRoom,
    handleMessage,
    handleTyping,
    handleMarkAsSeen,
    handleCreateOrJoinRoom,
    handleDisconnection,
    getChatId,
};
