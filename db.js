const mongoose = require('mongoose');
const { ServerApiVersion } = require("mongodb");

require('dotenv').config();

// generate connection url from mongodb atlas website
const url = process.env.DATABASE_URL 

async function connectToDatabase() {
    try {
        // Use mongoose to connect
        await mongoose.connect(url, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          serverApi: {
              version: ServerApiVersion.v1,
              strict: true,
              deprecationErrors: true
          }
      });
      
        console.log("You successfully connected to MongoDB using Mongoose!");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}

module.exports = connectToDatabase;

