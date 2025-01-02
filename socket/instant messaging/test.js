const io = require('socket.io-client');
const readline = require('readline');
const SERVER_URL = 'http://localhost:8000';
const tokenB = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NGRhMDhmZGNmYjE3OGQwOGIyOTlhMyIsImVtYWlsIjoidGVzdEBnbWFpbC5jb20iLCJ1c2VybmFtZSI6InRlc3QiLCJpYXQiOjE3MzM0MTMwNDQsImV4cCI6MTczMzQ5OTQ0NH0.yf_IWSr2cvubykjpKxULCBcZk3O3NA6hQFf7fqgP-gA';

const socketB = io(`${SERVER_URL}/im`, {
    query: { token: tokenB }
});

// Handle authentication error
socketB.on('authError', (errorMessage) => {
    console.error('Authentication Error:', errorMessage);
    socketB.disconnect();  
});

// Setup readline for terminal input
const rlB = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let activeConversationIdB = null;

socketB.on('connect', () => {
    console.log(`Test connected.`);
    const participantIdA = '675027da20b5eb9a7cfe4a92';
    
    socketB.emit('checkConversation', { participantId: participantIdA });

    socketB.on('conversationCheckResponse', (data) => {
        if (data.exists) {
            console.log(`Conversation exists with ID: ${data.conversationId}`);
            activeConversationIdB = data.conversationId;
            socketB.emit('joinRoom', activeConversationIdB);

            // Emit isDelivered and isSeen for each message
            data.messages.forEach(msg => {
                socketA.emit('isDelivered', {
                    messageId: msg.messageId,
                });

                socketA.emit('markAsSeen', {
                    messageId: msg.messageId,
                });
            });

            promptMessageB();
        } else {
            console.log('No existing conversation found. Creating a new conversation...');
            socketB.emit('createConversation', { participantId: participantIdA });
        }
    });

    socketB.on('chatRoomCreated', (conversationId) => {
        console.log(`Chat room created with ID: ${conversationId}`);
        activeConversationIdB = conversationId;
        promptMessageB();
    });

    socketB.on('receiveMessage', (msg) => {
        console.log(`\nUser B received: ${msg.message}`);
        socketB.emit('markAsSeen', { messageId: msg.messageId, conversationId: msg.conversationId });
        promptMessageB();
    });
});

function promptMessageB() {
    if (activeConversationIdB) {
        rlB.question('Test, type your message: ', (message) => {
            if (message.trim()) {
                sendMessageB(message, activeConversationIdB);
            }
            promptMessageB();
        });
    } else {
        console.log('Waiting for conversation ID...');
    }
}

function sendMessageB(content, conversationId) {
    socketB.emit('sendMessage', { conversationId, message: content });
}

socketB.on('disconnect', (reason) => {
    console.log(`User B disconnected. Reason: ${reason}`);
    rlB.close();
});

