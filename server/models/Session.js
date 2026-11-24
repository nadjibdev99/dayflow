import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    clientId: { type: String, required: true, maxlength: 100 },
    label: { type: String, default: "", trim: true, lowercase: true, maxlength: 100 },
    duration: { type: Number, required: true, min: 1, max: 180 }, // minutes
    date: { type: String, required: true, match: /^\d{4}-\d{2}-\d{2}$/ }, // user's local day
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// the same session can never be saved twice for one user
sessionSchema.index({ user: 1, clientId: 1 }, { unique: true });
sessionSchema.index({ user: 1, date: 1 });

export default mongoose.model("Session", sessionSchema);