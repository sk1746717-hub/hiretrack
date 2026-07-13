import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["Application", "Interview", "Deadline", "Alert"],
      default: "Alert",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add index on userId and isRead for quick query retrieval
notificationSchema.index({ userId: 1, isRead: 1 });

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
