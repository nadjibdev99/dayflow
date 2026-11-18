import express from "express";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  restoreTask,
} from "../controllers/taskController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.use(auth);

router.route("/").get(getTasks).post(createTask);
router.route("/:id").put(updateTask).delete(deleteTask);
router.put("/:id/restore", restoreTask);

export default router;