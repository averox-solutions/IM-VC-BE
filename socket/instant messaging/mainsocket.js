const { Chat, ChatMessage } = require('../../models/instant messaging/Models');
const {User} = require('../../models/authentication/Models');
const { verifyTokenForRTC } = require('../../rest/authentication/Controllers');

module.exports = (io) => {

// Middleware for authentication
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.query.token;  // Extract token from query parameters
        if (!token) {
            socket.emit('authError', 'Token missing. Please provide a valid token.');
            return next(new Error('Authentication error: Token missing.'));
        }
        console.log('Token received:', token)
        const decoded = await verifyTokenForRTC(token);  // Verify the token
        socket.user = decoded.user;  // Attach user to the socket for later use
        next();
    } catch (error) {
        return next(new Error('Authentication error: Invalid token.'));
    }
});

// Socket event handling: (socket) is the middleware being called, defined above, emit is handled internally and signaled to the client listener
io.on('connection', (socket) => {
    console.log(`${socket.user.username} connected 😂`);
    
    // Check for an exisitng conversation`
    socket.on('checkConversation', async ({ participantId }) => {
        const participants = [socket.user._id, participantId].sort(); // Sort for consistency

        const conversation = await Chat.findOne({
            users: { $all: participants }  // Match any order of the two participants
        });

        console.log("checking conversation...");

        if (conversation) {
            // Fetch all the messages in this conversation
            const messages = await ChatMessage.find({ chatId: conversation._id })
            .select('_id text sentAt senderId') // Include senderId to return it in the response
            .sort({ sentAt: 1 });

            // Map the messages to a new format with HH:MM for sentAt
            const formattedMessages = messages.map(msg => {
                const sentAt = new Date(msg.sentAt);
                const hours = sentAt.getHours().toString().padStart(2, '0'); // Add leading zero if needed
                const minutes = sentAt.getMinutes().toString().padStart(2, '0'); // Add leading zero if needed
                const time = `${hours}:${minutes}`;

                 // Create a formatted date string, e.g., "July 15"
                const dateOptions = { month: 'long', day: 'numeric' };
                const date = sentAt.toLocaleDateString('en-US', dateOptions);

                return {
                    messageId: msg._id,
                    message: msg.text,
                    sentAt: time, // Send formatted HH:MM
                    date: date, // Include a formatted date key
                    senderId: msg.senderId
                };
            });

            socket.emit('conversationCheckResponse', {
                exists: true,
                conversationId: conversation._id.toString(),
                messages: formattedMessages,
            });
        } else {
            socket.emit('conversationCheckResponse', { exists: false });
        }
    });


    // Create a new conversation|room
    socket.on('createConversation', async ({ participantId }) => {

        let participant = await User.findOne({ _id: participantId });

        if (!participant) {
            return socket.emit('error', { message: 'Participant not found' });
        }

        // don't need to convert object_id, as mongo db can handle object ids directly

        const newConversation = await Chat.create({
            users: [socket.user._id, participantId],
        });
        const roomName = newConversation._id;

        // Join the room and notify both users about the new chat room
        socket.join(roomName);
        console.log(`${socket.user.username} joined new room: ${roomName}`);

        // Sends an event to all sockets in a chatroom
        io.to(roomName).emit('chatRoomCreated', roomName.toString());
    });

    // Join an existing conversation|room
    socket.on('joinRoom', (conversationId) => {
        socket.join(conversationId);
        console.log(`User joined existing room: ${conversationId}`);
    });

    // Send message event listener
    socket.on('sendMessage', async ({ conversationId, message }) => {
        console.log(`${message}`);
        const senderId = socket.user._id;
        const conversation = await Chat.findById(conversationId);

        // Determine the receiver ID (the other participant in the conversation)
        const receiverId = conversation.users.find(id => id.toString() !== senderId.toString());

        // Create and save message
        const newMessage = await ChatMessage.create({
            chatId: conversationId,
            senderId,
            receiverId,
            text: message,
        });

        // Update the conversation's last message info
        await Chat.findByIdAndUpdate(conversationId, {
            lastMessage: newMessage._id,
        });

        const formattedMessage = {
            messageId: newMessage._id.toString(), // Convert ObjectId to string
            conversationId: newMessage.chatId.toString(), // Convert ObjectId to string
            senderId: newMessage.senderId,
            receiverId: newMessage.receiverId,
            message: newMessage.text,
            seen: newMessage.isSeen,
            delivered: newMessage.isDelivered,
            sentAt: new Date(newMessage.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            attachments: newMessage.attachments? newMessage.attachments:null,
        };
        console.log("Formatted message:", formattedMessage);
        socket.to(conversationId).emit('receiveMessage', formattedMessage);
    });

    // Listen for isDelivered event from client
    socket.on('isDelivered', async (messageId) => {
        await ChatMessage.findByIdAndUpdate(messageId, { isDelivered: true });
        console.log(`Message delivered to ${socket.user.username}`);

    });

    // Handle message seen event
    socket.on('markAsSeen', async ({messageId,conversationId}) => {
        await ChatMessage.findByIdAndUpdate(messageId, { isSeen: true });
        console.log(`Message seen by ${socket.user.username}`);
    });

    // Listen for typing events
    socket.on('typing', async (conversationId) => {
        socket.broadcast.to(conversationId).emit('Typing', conversationId.toString());
    });


    // Handle message delete event
    socket.on('deleteMessage', async (messageId) => {
        await Message.findByIdAndDelete(messageId);
        socket.emit('messageDeleted', messageId);
    });

    // Handle conversation delete event (delete chat)
    socket.on('deleteChat', async (conversationId) => {
        await Conversation.findByIdAndDelete(conversationId);
        socket.emit('chatDeleted', conversationId);
    });

    // Handle disconnect event automatically envoked, without need of expilict emitter
    socket.on('disconnect', (reason) => {
        console.log(`${socket.user.username} disconnected. Reason: ${reason}`);
    });
});
}