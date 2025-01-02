const express = require("express");
const router = express.Router();
const { fetchUser } = require('../authentication/Controllers'); // User authentication middleware
const { getUserData,createChatroom, getAllChats, sendMessage, getMessages } = require('./Controllers');

// Global middleware for authenticated requests only applies to all routes in this router
router.use(fetchUser);

router.post("/create-chatroom", async (req, res) => {
    createChatroom(req, res);
});

router.get("/chatrooms", async (req, res) => {
    getAllChats(req, res);
});

router.post("/send-message", async (req, res) => {
    sendMessage(req, res);
});

// Route for fetching chat messages with pagination
router.get("/get-messages/:chatroomId", async (req, res) => {
    getMessages(req, res);
});

router.get("/user-data", async (req,res) => {
    getUserData(req, res);
})

module.exports = router;
