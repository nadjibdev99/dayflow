import Note from "../models/Note.js";

// "c++" or "(" typed in search must not be treated as regex syntax
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/notes?search=&subject=&pinned=true
export const getNotes = async (req, res) => {
  try {
    const { search = "", subject = "" } = req.query;

    const query = { user: req.user };

    if (search.trim()) {
      query.title = { $regex: escapeRegex(search.trim()), $options: "i" };
    }
    if (subject.trim()) {
      query.subject = subject.trim().toLowerCase();
    }
    if (req.query.pinned === "true") {
      query.isPinned = true;
    }

    const [notes, subjects] = await Promise.all([
      Note.find(query).sort({ isPinned: -1, updatedAt: -1 }).lean(),
      Note.distinct("subject", { user: req.user, subject: { $ne: "" } }),
    ]);

    res.json({ notes, subjects: subjects.sort() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/notes
export const createNote = async (req, res) => {
  try {
    const { title, content, subject } = req.body;
    const note = await Note.create({ user: req.user, title, content, subject });
    res.status(201).json({ note });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid data" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/notes/:id  (auto-save and pin)
export const updateNote = async (req, res) => {
  try {
    const updates = {};
    for (const key of ["title", "content", "subject", "isPinned"]) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.user },
      updates,
      { new: true, runValidators: true }
    );

    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ note });
  } catch (err) {
    if (err.name === "ValidationError" || err.name === "CastError") {
      return res.status(400).json({ message: "Invalid data" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/notes/:id  (permanent)
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({
      _id: req.params.id,
      user: req.user,
    });

    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note deleted" });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({ message: "Invalid id" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};