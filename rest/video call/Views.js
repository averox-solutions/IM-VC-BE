const express = require("express");
const router = express.Router();
const { fetchUser } = require('../authentication/Controllers');
const { createRoom, deleteRoom, getAllRooms, updateRoom } = require('./Controllers');

//login required
router.post("/create-room", fetchUser, async (req, res) => {
    createRoom(req, res);
});

router.delete("/delete-room", fetchUser, async (req, res) => {
    deleteRoom(req, res);
});

router.put("/update-room", fetchUser, async (req, res) => {
    updateRoom(req, res);
});

//login required
router.get("/get-all-rooms", fetchUser, async (req, res) => {
    getAllRooms(req, res);
});

module.exports = router;
