const express = require("express");
const router = express.Router();
const { fetchUser } = require('../authentication/Views');
const { createNote, editNote, deleteNote, getNotes } = require('./Views');

//login required
router.delete("/delete", fetchUser, async (req, res) => {
    deleteNote(req, res);
});

//login required
router.get("/get", fetchUser, async (req, res) => {
    getNotes(req, res);
});

//login required
router.put("/edit", fetchUser, async (req, res) => {
    editNote(req, res);
});

//login required
router.post("/create", fetchUser, async (req, res) => {
    createNote(req, res);
});

module.exports = router;
