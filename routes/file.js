import express from "express";
import uploadMedia from "../controllers/file/upload.js";
import upload from "../config/multer.js";

const router = express.Router();
router.post("/upload", upload.single("file"), uploadMedia);

export default router;