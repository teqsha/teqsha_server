import express from "express";
import {
  getProfile,
  
}from "../controllers/auth/user.js";

const router = express.Router();

router.route("/profile").get(getProfile);

export default router;