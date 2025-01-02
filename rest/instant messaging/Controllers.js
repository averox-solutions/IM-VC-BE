const { Chat, ChatMessage } = require('../../models/instant messaging/Models');
const { User } = require('../../models/authentication/Models');
// const errorLogger = require('../../utils/errorLogger')

const getUserData = async (req, res) => {
    try {
        console.log(req)
        const user = await User.findById(req.user.id).select('username profilePic');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Force HTTPS for the profilePic URL
        const secureUrl = `https://${req.get('host')}/${user.profilePic}`;

        // Return the user data, profile pic must be a full secured URL
        const userData = {
            username: user.username,
            profilePic: secureUrl
        };

        res.status(200).json({ user: userData });

    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ message: "Error fetching data" });
    }
};


// Fetch messages for a specific chatroom with pagination
const getMessages = async (req, res) => {
    try {
        const { chatroomId } = req.params; // Extract chatroomId from the route parameter
        const { page = 1, limit = 20 } = req.query; // Pagination parameters (defaults: page=1, limit=20)

        // Fetch paginated messages, sorted by most recent first
        const messages = await ChatMessage.find({ chatId: chatroomId })
            .sort({ createdAt: -1 }) // Sort by newest first
            .skip((page - 1) * limit) // Skip messages based on the page
            .limit(parseInt(limit)) // Limit the number of messages fetched
            .select('text sender createdAt attachments') // Only fetch necessary fields
            .populate('sender', 'username profilePic'); // Populate sender details

        // Format the messages with the desired structure
        const formattedMessages = messages.map(message => ({
            id: message._id,
            text: message.text,
            sender: {
                id: message.sender._id,
                username: message.sender.username,
                profilePic: `${req.protocol}://${req.get('host')}/${message.sender.profilePic}`
            },
            createdAt: formatTimestamp(message.createdAt),
            attachments: message.attachments
        }));

        res.status(200).json({ messages: formattedMessages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ message: "Error fetching messages" });
    }
};

const createChat = async (req, res) => {
    try {
        const { participants } = req.body; 

        if (!participants || participants.length < 2) {
            return res.status(400).json({ message: "At least two participants are required." });
        }

        // Create a new chat
        const chat = new Chat({
            participants, // Assuming participants is an array of user IDs
            createdBy: req.user.id, // The user who created the chat
            createdAt: new Date(),
        });

        await chat.save();
        res.status(201).json({ message: "Chat created successfully", chat });
    } catch (error) {
        console.error(error);
        // errorLogger(error); 
        res.status(500).json({ message: "Error creating chat" });
    }
};

const getAllChats = async (req, res) => {
    try {
        const chats = await Chat.find({ users: req.user.id })
            .populate({
                path: 'users',
                match: { _id: { $ne: req.user.id } }, // Exclude the requesting user
                select: 'username profilePic' 
            })
            .populate({
                path: 'lastMessage',
                select: 'senderId receiverId text sentAt isDelivered isSeen attachments' 
            });

        // Format the response to include only necessary information
        const formattedChats = await Promise.all(chats.map(async chat => {
            // Get the other participant (not the requesting user)
            const otherParticipant = chat.users.find(user => user._id.toString() !== req.user.id.toString());

            // Check if the last message is from the other participant
            const isMessageFromOtherParticipant = chat.lastMessage?.senderId.toString() !== req.user.id.toString();
            
            // Count the unseen messages from the other participant (if the message is from them)
            let unseenCount = 0;
            if (isMessageFromOtherParticipant) {
                unseenCount = await ChatMessage.countDocuments({
                    conversationId: chat._id,
                    senderId: otherParticipant._id,
                    isSeen: false,
                });
            }

            // Secured profile url
            const profilePicUrl = `https://${req.get('host')}/${otherParticipant.profilePic}`;

            // Format the sentAt date like "HH:mm" or "MM/DD/YYYY"
            const sentAt = new Date(chat.lastMessage?.sentAt);
            const now = new Date();
            
            const hours = sentAt.getHours().toString().padStart(2, '0'); // Add leading zero if needed
            const minutes = sentAt.getMinutes().toString().padStart(2, '0'); // Add leading zero if needed
            const time = `${hours}:${minutes}`;

            // Check if the message is older than today
            const isOlderThanToday = sentAt.toDateString() !== now.toDateString();

            // Create a formatted date string, e.g., "07/15/2024"
            const dateString = `${(sentAt.getMonth() + 1).toString().padStart(2, '0')}/${sentAt.getDate().toString().padStart(2, '0')}/${sentAt.getFullYear()}`;

            return {
                chatId: chat._id,
                participant: {
                    user_id: otherParticipant._id,
                    name: otherParticipant.username,
                    profilePic: profilePicUrl,
                },
                lastMessage: chat.lastMessage ? {
                    messageId: chat.lastMessage._id,
                    message: chat.lastMessage.text,
                    sentAt: isOlderThanToday ? dateString : time, // Use date or time based on the message's age
                } : null,
                unseenCount: unseenCount,
            };
        }));

        res.status(200).json({ chats: formattedChats });
    } catch (error) {
        console.error(error);
        // errorLogger(error);
        res.status(500).json({ message: "Error fetching chats" });
    }
};


// Send a message in a chat (for authenticated users)
const sendChatMessage = async (req, res) => {
    try {
        const { chatId, messageText } = req.body;
        if (!chatId || !messageText) {
            return res.status(400).json({ message: "Chat ID and message text are required." });
        }

        // Create a new message
        const message = new ChatMessage({
            chatId,
            sender: req.user.id, // Assuming user ID is added to req.user by fetchUser middleware
            text: messageText,
            timestamp: new Date(),
        });

        await message.save();
        res.status(201).json({ message: "Message sent successfully", message });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error sending message" });
    }
};

// Get messages from a specific chat (for authenticated users)
const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const messages = await ChatMessage.find({ chatId })
            .populate("sender", "username") // Assuming ChatMessage model references User for sender
            .sort({ timestamp: 1 }); // Sort messages by timestamp (ascending order)

        res.status(200).json({ messages });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error fetching messages" });
    }
};

module.exports = {
    createChat,
    getAllChats,
    sendChatMessage,
    getChatMessages,
    getMessages,
    getUserData
};
