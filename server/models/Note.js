import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, default: "", trim: true, maxlength: 200 },
    content: { type: String, default: "", maxlength: 100000 },
    subject: { type: String, default: "", trim: true, lowercase: true, maxlength: 50 },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

noteSchema.index({ user: 1, updatedAt: -1 });

export default mongoose.model("Note", noteSchema);