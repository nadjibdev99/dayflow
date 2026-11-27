import mongoose from "mongoose";
import Session from "../models/Session.js";

const isValidDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v || "");

// "2026-11-24" -> "2026-11-23" (UTC math on a plain date, so no timezone surprises)
const dayBefore = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10);
};

// consecutive days ending today (or yesterday, if today has no session yet)
const calcStreak = (dates, today) => {
  const set = new Set(dates);
  let day = set.has(today) ? today : dayBefore(today);
  let streak = 0;
  while (set.has(day)) {
    streak++;
    day = dayBefore(day);
  }
  return streak;
};

// POST /api/sessions
export const createSession = async (req, res) => {
  try {
    const { clientId, label = "", duration, date, completedAt } = req.body;

    if (!clientId || typeof clientId !== "string") {
      return res.status(400).json({ message: "clientId is required" });
    }
    if (!isValidDate(date)) {
      return res.status(400).json({ message: "Valid date is required" });
    }

    const session = await Session.create({
      user: req.user,
      clientId,
      label,
      duration,
      date,
      completedAt: completedAt ? new Date(completedAt) : new Date(),
    });

    res.status(201).json({ session });
  } catch (err) {
    // duplicate (user, clientId): the retry of a session already saved
    if (err.code === 11000) return res.json({ duplicate: true });
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: "Invalid data" });
    }
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/sessions/stats?today=&weekStart=&weekEnd=
export const getStats = async (req, res) => {
  try {
    const { today, weekStart, weekEnd } = req.query;
    if (![today, weekStart, weekEnd].every(isValidDate)) {
      return res.status(400).json({ message: "today, weekStart and weekEnd are required" });
    }

    // aggregate() does not cast strings to ObjectId like find() does
    const user = new mongoose.Types.ObjectId(req.user);

    const [todayAgg, byLabel, dates] = await Promise.all([
      Session.aggregate([
        { $match: { user, date: today } },
        { $group: { _id: null, minutes: { $sum: "$duration" } } },
      ]),
      Session.aggregate([
        { $match: { user, date: { $gte: weekStart, $lte: weekEnd } } },
        { $group: { _id: "$label", minutes: { $sum: "$duration" } } },
        { $sort: { minutes: -1 } },
      ]),
      Session.distinct("date", { user, date: { $lte: today } }),
    ]);

    res.json({
      today: todayAgg[0]?.minutes || 0,
      week: byLabel.reduce((sum, l) => sum + l.minutes, 0),
      byLabel: byLabel.map((l) => ({ label: l._id, minutes: l.minutes })),
      streak: calcStreak(dates, today),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/sessions/relabel
// body: { from, to, weekStart, weekEnd }
// Changes the label of every session in that week that has the label `from`.
export const relabelSessions = async (req, res) => {
  try {
    const { from = "", to = "", weekStart, weekEnd } = req.body;

    if (![weekStart, weekEnd].every(isValidDate)) {
      return res.status(400).json({ message: "weekStart and weekEnd are required" });
    }
    if (typeof from !== "string" || typeof to !== "string") {
      return res.status(400).json({ message: "Invalid label" });
    }

    const newLabel = to.trim().toLowerCase();
    if (newLabel.length > 100) {
      return res.status(400).json({ message: "Label is too long" });
    }

    const result = await Session.updateMany(
      {
        user: req.user,
        label: from.trim().toLowerCase(),
        date: { $gte: weekStart, $lte: weekEnd },
      },
      { $set: { label: newLabel } }
    );

    res.json({ updated: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};