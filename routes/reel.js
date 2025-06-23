import express from "express";
import {
  createReel,

} from "../controllers/feed/reel.js";
const router = express.Router();

router.post("/reel", createReel);

export default  router;