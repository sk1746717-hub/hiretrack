import Notification from "../models/Notification.js";

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ isRead: 1, createdAt: -1 })
      .limit(50); // limit to last 50 alerts to keep it optimized

    res.json(notifications);
  } catch (error) {
    console.error("Get Notifications Error:", error.message);
    res.status(500).json({ message: "Server error while fetching notifications" });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error("Mark Read Notification Error:", error.message);
    res.status(500).json({ message: "Server error while updating notification status" });
  }
};

// @desc    Mark all user's notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ message: "All notifications marked as read successfully" });
  } catch (error) {
    console.error("Mark All Read Notifications Error:", error.message);
    res.status(500).json({ message: "Server error while updating notifications status" });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  } catch (error) {
    console.error("Delete Notification Error:", error.message);
    res.status(500).json({ message: "Server error while deleting notification" });
  }
};
