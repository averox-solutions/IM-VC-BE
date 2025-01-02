const express = require("express");
const router = express.Router();

const { signupUser, loginUser, fetchUser, refresh, verify } = require('./Controllers');

//payload must have username, email, confirm password and password
router.post("/register", async (req, res) => {
    signupUser(req, res);
});

//payload must have email and password
router.post("/login", async (req, res) => {
    loginUser(req, res)
});

//payload must have acesstoken
router.post("/verify", async (req, res) => {
    verify(req, res)
});

//payload must have refreshToken
router.post("/refresh", async (req, res) => {
    refresh(req, res)
});

router.post("/test", fetchUser, async (req, res) => {
    let user = req.user
    console.log(user.email)
    res.send("inside auth api")
});

module.exports = router;
