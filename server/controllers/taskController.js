import Task from "../models/Task.js";

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 };

const isValidDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || "");

export const getTasks = async (req, res) => {
  try {
    const { filter = "today" } = req.query;
    const today = isValidDate(req.query.today)
      ? req.query.today
      : new Date().toISOString().slice(0, 10);

    const query = { user: req.user };

    if (filter === "history") {
      query.deletedAt = { $ne: null };
    } else {
      query.deletedAt = null;

      if (filter === "completed") {
        query.isCompleted = true;
      } else if (filter === "today") {
        query.$or = [
          { isCompleted: false, dueDate: { $lte: today } },
          { isCompleted: true, dueDate: today },
        ];
      } else if (filter === "upcoming") {
        query.isCompleted = false;
        query.$or = [{ dueDate: { $gt: today } }, { dueDate: null }];
      }
    }

    const tasks = await Task.find(query).lean();

    if (filter === "history") {
      tasks.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
    } else if (filter === "completed") {
      tasks.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    } else {
      tasks.sort(
        (a, b) =>
          Number(a.isCompleted) - Number(b.isCompleted) ||
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          (a.dueDate || "9999").localeCompare(b.dueDate || "9999")
      );
    }

    res.json({ tasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, priority, dueDate } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = await Task.create({
      user: req.user,
      title,
      priority,
      dueDate: dueDate || null,
    });

    res.status(201).json({ task });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const updates = {};
    for (const key of ["title", "priority", "dueDate", "isCompleted"]) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    if (updates.dueDate === "") updates.dueDate = null;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user, deletedAt: null },
      updates,
      { new: true, runValidators: true }
    );

    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ task });
  } catch (err) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({ message: "Invalid data" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/tasks/:id                 -> move to History
// DELETE /api/tasks/:id?permanent=true  -> remove forever (only from History)
export const deleteTask = async (req, res) => {
  try {
    if (req.query.permanent === "true") {
      const task = await Task.findOneAndDelete({
        _id: req.params.id,
        user: req.user,
        deletedAt: { $ne: null },
      });
      if (!task) return res.status(404).json({ message: "Task not found" });
      return res.json({ message: "Task permanently deleted" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ message: "Task moved to history" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid id" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/tasks/:id/restore
export const restoreTask = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json({ task });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid id" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};