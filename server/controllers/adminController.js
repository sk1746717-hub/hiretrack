import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Get Users Admin Error:", error.message);
    res.status(500).json({ message: "Server error while fetching users" });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["Admin", "Recruiter", "Interviewer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot modify your own role while logged in." });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    const detailMsg = `Admin ${req.user.name} changed ${targetUser.name} from ${oldRole} to ${role}.`;
    await AuditLog.create({
      action: "ROLE_CHANGE",
      performedBy: req.user._id,
      details: detailMsg,
    });
    console.log(`Activity Log: ${detailMsg}`);

    res.json({ message: "User role updated successfully", user: targetUser });
  } catch (error) {
    console.error("Update User Role Error:", error.message);
    res.status(500).json({ message: "Server error while updating user role" });
  }
};

// @desc    Update user status
// @route   PUT /api/admin/users/:id/status
// @access  Private/Admin
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["Active", "Disabled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status specified" });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (status === "Disabled") {
      if (id === req.user._id.toString()) {
        return res.status(400).json({ message: "You cannot disable your own admin account while logged in." });
      }

      if (targetUser.role === "Admin") {
        const activeAdminCount = await User.countDocuments({ role: "Admin", status: "Active" });
        if (activeAdminCount <= 1) {
          return res.status(400).json({ message: "Cannot disable the last active Admin account." });
        }
      }
    }

    const oldStatus = targetUser.status;
    targetUser.status = status;
    await targetUser.save();

    const detailMsg = `Admin ${req.user.name} changed ${targetUser.name} status from ${oldStatus} to ${status}.`;
    await AuditLog.create({
      action: "STATUS_CHANGE",
      performedBy: req.user._id,
      details: detailMsg,
    });
    console.log(`Activity Log: ${detailMsg}`);

    res.json({ message: "User status updated successfully", user: targetUser });
  } catch (error) {
    console.error("Update User Status Error:", error.message);
    res.status(500).json({ message: "Server error while updating user status" });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own admin account." });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (targetUser.role === "Admin") {
      const adminCount = await User.countDocuments({ role: "Admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot delete the last remaining Admin account." });
      }
    }

    await targetUser.deleteOne();

    const detailMsg = `Admin ${req.user.name} deleted user ${targetUser.name} (${targetUser.email}).`;
    await AuditLog.create({
      action: "USER_DELETION",
      performedBy: req.user._id,
      details: detailMsg,
    });
    console.log(`Activity Log: ${detailMsg}`);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete User Error:", error.message);
    res.status(500).json({ message: "Server error while deleting user" });
  }
};

export { getUsers, updateUserRole, updateUserStatus, deleteUser };
