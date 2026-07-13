import User from "../models/User.js";
import AuditLog from "../models/AuditLog.js";
import bcrypt from "bcryptjs";

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

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private/Admin
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Please fill in all required fields" });
    }

    if (!["Admin", "HR", "Recruiter", "Interviewer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      status: status || "Active",
    });

    const detailMsg = `Admin ${req.user.name} created user ${newUser.name} (${newUser.email}) with role ${newUser.role}.`;
    await AuditLog.create({
      action: "USER_CREATION",
      performedBy: req.user._id,
      details: detailMsg,
    });
    console.log(`Activity Log: ${detailMsg}`);

    // Return the user without password
    const userResponse = await User.findById(newUser._id).select("-password");
    res.status(201).json({ message: "User created successfully", user: userResponse });
  } catch (error) {
    console.error("Create User Error:", error.message);
    res.status(500).json({ message: "Server error while creating user" });
  }
};

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !["Admin", "HR", "Recruiter", "Interviewer"].includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    if (id === req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot modify your own administrator account." });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Protect last active administrator from role change
    if (targetUser.role === "Admin" && (targetUser.status === "Active" || !targetUser.status)) {
      const activeAdminCount = await User.countDocuments({ role: "Admin", status: { $ne: "Disabled" } });
      if (activeAdminCount <= 1) {
        return res.status(403).json({ message: "At least one active administrator must exist." });
      }
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

    if (id === req.user._id.toString()) {
      return res.status(403).json({ message: "You cannot modify your own administrator account." });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Protect last active administrator from status change (deactivation)
    if (status === "Disabled" && targetUser.role === "Admin") {
      const activeAdminCount = await User.countDocuments({ role: "Admin", status: { $ne: "Disabled" } });
      if (activeAdminCount <= 1) {
        return res.status(403).json({ message: "At least one active administrator must exist." });
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
      return res.status(403).json({ message: "You cannot modify your own administrator account." });
    }

    const targetUser = await User.findById(id);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Protect last active administrator from deletion
    if (targetUser.role === "Admin") {
      const activeAdminCount = await User.countDocuments({ role: "Admin", status: { $ne: "Disabled" } });
      if (activeAdminCount <= 1) {
        return res.status(403).json({ message: "At least one active administrator must exist." });
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

export { getUsers, createUser, updateUserRole, updateUserStatus, deleteUser };
