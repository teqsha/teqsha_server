// const express = require("express");
// const router = express.Router();
// const {
//   signInWithOauth,
//   refreshToken,
//   checkUsernameAvailability,
//   signUpWithOauth,
// } = require("../controllers/auth/auth");

// router.post("/check-username", checkUsernameAvailability);
// router.post("/login", signInWithOauth);
// router.post("/register", signUpWithOauth);
// router.post("/refresh-token", refreshToken);

// module.exports = router;

import express from "express";

const router = express.Router();

import {
    authWithOauth,
    checkUsernameAvailability,
    registerUser,
    loginUser,
    refreshToken,
    forgotPassword,
    resetPassword
} from "../controllers/auth/auth.js";

router.post("/signup", authWithOauth);
router.post("/check-username", checkUsernameAvailability);
router.post('/register', registerUser);
router.post('/login', loginUser)
router.post('/refresh-Token',refreshToken )
router.post('/forgot-password', forgotPassword)
router.post('/reset-password/:token', resetPassword);

export default router;
