const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectToDatabase = require("../db");
const { redisConnection, redisClient } = require("../redis");
const path = require('path');

const port = 8080;
const app = express();

connectToDatabase();

redisConnection();

// Serve static files from the 'assets' folder
app.use(express.static(path.join(__dirname, 'assets')));

app.use(cors({
    origin: ['http://localhost:8080', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'] // added for authorization headers    
}));

const server = http.createServer(app);

// Initialize Sockets.IO with CORS settings
const io = new Server(server, {
    cors: {
        origin: '*', // Allow all origins for testing purposes
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'] // added for authorization headers
    }
});


require('./instant messaging/mainsocket.js')(io.of('/im')); // Namespace for instant messaging
require('./video call/Views')(io.of('/vc')); // Namespace for video callls

server.listen(port, () => {
    console.log(`Socket server running on port ${port}`);
});