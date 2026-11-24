import express from "express";
import { createSession, getStats } from "../controllers/sessionController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.post("/", createSession);
router.get("/stats", getStats);

export default router;