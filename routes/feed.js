import express from "express";
import {
  
  getHomeFeed,
  
} from "../controllers/feed/feed.js";
const router = express.Router();

router.get("/home", getHomeFeed);

export default router;