const express = require("express");
const connectToDatabase = require("../db");
const cors = require('cors');
const { redisConnection } = require("../redis");
const path = require('path');

const port = 8000;
const app = express();

//middleware
app.use(cors());
app.use(express.json())

// Serve static files from the 'assets' folder
app.use(express.static(path.join(__dirname, 'assets')));

//database connection
connectToDatabase();

//redis connection
redisConnection();

// Available Routes
app.use('/auth', require('./authentication/Views'))
app.use('/vc', require('./video call/Views'))
app.use('/im',require('./instant messaging/Views'))

// Run Server on specified port
app.listen(port, () => {
  console.log(`Rest server is running at port ${port}`);
});