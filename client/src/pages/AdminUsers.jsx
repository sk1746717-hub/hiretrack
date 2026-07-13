import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import adminService from "../services/adminService";
import Loader from "../components/Loader";

const AdminUsers = () => {
  const { user } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search, Filters & Sort state
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name-asc");

  // Add User modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "Recruiter",
    status: "Active",
  });

  // Modal deletion confirmation states
  const [userToDelete, setUserToDelete] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsersList(data || []);
    } catch (error) {
      console.error("Fetch Users Error:", error);
      toast.error("Failed to load users list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addFormData.name || !addFormData.email || !addFormData.password || !addFormData.role) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (addFormData.password !== addFormData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (addFormData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      setIsSubmitting(true);
      await adminService.createUser({
        name: addFormData.name,
        email: addFormData.email,
        password: addFormData.password,
        role: addFormData.role,
        status: addFormData.status,
      });
      toast.success("User created successfully!");
      setShowAddModal(false);
      setAddFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "Recruiter",
        status: "Active",
      });
      fetchUsers();
    } catch (error) {
      console.error("Create User Error:", error);
      const msg = error.response?.data?.message || "Failed to create user";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = async (targetUser, newRole) => {
    const isSelf = targetUser._id === (user?.id || user?._id);
    if (isSelf) {
      toast.error("You cannot modify your own administrator account.");
      return;
    }

    try {
      setIsSubmitting(true);
      await adminService.updateUserRole(targetUser._id, newRole);
      toast.success(`Updated ${targetUser.name} to ${newRole}`);
      fetchUsers();
    } catch (error) {
      console.error("Role Update Error:", error);
      const msg = error.response?.data?.message || "Failed to update role";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (targetUser, newStatus) => {
    const isSelf = targetUser._id === (user?.id || user?._id);
    if (isSelf) {
      toast.error("You cannot modify your own administrator account.");
      return;
    }

    try {
      setIsSubmitting(true);
      await adminService.updateUserStatus(targetUser._id, newStatus);
      toast.success(`User status updated to ${newStatus}`);
      fetchUsers();
    } catch (error) {
      console.error("Status Update Error:", error);
      const msg = error.response?.data?.message || "Failed to update status";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTrigger = (targetUser) => {
    const isSelf = targetUser._id === (user?.id || user?._id);
    if (isSelf) {
      toast.error("You cannot modify your own administrator account.");
      return;
    }

    setUserToDelete(targetUser);
    setShowConfirmDelete(true);
  };

  const handleDeleteSubmitDirect = async () => {
    if (!userToDelete) return;
    try {
      setIsSubmitting(true);
      await adminService.deleteUser(userToDelete._id);
      toast.success(`User ${userToDelete.name} deleted successfully`);
      setShowConfirmDelete(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error) {
      console.error("Delete User Error:", error);
      const msg = error.response?.data?.message || "Failed to delete user";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "Admin":
        return "bg-purple-550/15 text-purple-400 border border-purple-500/20";
      case "HR":
        return "bg-teal-550/15 text-teal-400 border border-teal-500/20";
      case "Recruiter":
        return "bg-blue-550/15 text-blue-400 border border-blue-500/20";
      case "Interviewer":
        return "bg-amber-550/15 text-amber-400 border border-amber-500/20";
      default:
        return "bg-slate-800 text-slate-400 border border-slate-700";
    }
  };

  const getStatusBadge = (status) => {
    return status === "Active"
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]"
      : "bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Filter & Sort lists
  const filteredUsersList = usersList
    .filter((u) => {
      const matchSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchRole = roleFilter ? u.role === roleFilter : true;
      const matchStatus = statusFilter ? (u.status || "Active") === statusFilter : true;
      return matchSearch && matchRole && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      } else if (sortBy === "name-desc") {
        return b.name.localeCompare(a.name);
      }
      return 0;
    });

  // KPI Metrics counts
  const totalUsers = usersList.length;
  const adminCount = usersList.filter((u) => u.role === "Admin").length;
  const hrCount = usersList.filter((u) => u.role === "HR").length;
  const recruiterCount = usersList.filter((u) => u.role === "Recruiter").length;
  const interviewerCount = usersList.filter((u) => u.role === "Interviewer").length;
  const activeCount = usersList.filter((u) => (u.status || "Active") === "Active").length;
  const inactiveCount = usersList.filter((u) => u.status === "Disabled").length;

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-10">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage system user roles, access statuses, and credentials</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-blue-600/20 cursor-pointer self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* KPI summaries */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Users</span>
          <span className="text-2xl font-extrabold text-white mt-1">{totalUsers}</span>
        </div>
        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Admins</span>
          <span className="text-2xl font-extrabold text-purple-400 mt-1">{adminCount}</span>
        </div>
        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">HR Manager</span>
          <span className="text-2xl font-extrabold text-teal-400 mt-1">{hrCount}</span>
        </div>
        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Recruiters</span>
          <span className="text-2xl font-extrabold text-blue-400 mt-1">{recruiterCount}</span>
        </div>
        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Interviewers</span>
          <span className="text-2xl font-extrabold text-amber-400 mt-1">{interviewerCount}</span>
        </div>
        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1">{activeCount}</span>
        </div>
        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Inactive</span>
          <span className="text-2xl font-extrabold text-rose-400 mt-1">{inactiveCount}</span>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/20 border border-slate-850 p-4 rounded-2xl">
        <div className="flex-1 max-w-md relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-350 text-xs focus:outline-none focus:border-blue-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-slate-400 text-xs focus:outline-none cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="HR">HR</option>
            <option value="Recruiter">Recruiter</option>
            <option value="Interviewer">Interviewer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-slate-400 text-xs focus:outline-none cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Disabled">Inactive</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-slate-400 text-xs focus:outline-none cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative min-h-[350px] flex flex-col justify-between">
        {loading && (
          <div className="absolute inset-0 bg-slate-955/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
            <Loader />
          </div>
        )}

        <div className="flex-1">
          {!loading && filteredUsersList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              No users found
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20 shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-xs font-bold tracking-wider text-slate-500 uppercase">
                    <th className="px-6 py-4.5">User</th>
                    <th className="px-6 py-4.5">Email</th>
                    <th className="px-6 py-4.5">Role</th>
                    <th className="px-6 py-4.5">Status</th>
                    <th className="px-6 py-4.5">Registration Date</th>
                    <th className="px-6 py-4.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-sm text-slate-350">
                  {filteredUsersList.map((targetUser) => {
                    const isSelf = targetUser._id === (user?.id || user?._id);
                    
                    // Protect last active administrator
                    const activeAdmins = usersList.filter(u => u.role === "Admin" && (u.status === "Active" || !u.status));
                    const isLastActiveAdmin = targetUser.role === "Admin" && (targetUser.status === "Active" || !targetUser.status) && activeAdmins.length <= 1;

                    const isRoleDisabled = isSelf || isLastActiveAdmin || isSubmitting;
                    const isStatusDisabled = isSelf || isLastActiveAdmin || isSubmitting;
                    const isDeleteDisabled = isSelf || isLastActiveAdmin || isSubmitting;

                    const getDisabledTitle = () => {
                      if (isSelf) return "You cannot modify your own administrator account.";
                      if (isLastActiveAdmin) return "At least one active administrator must exist.";
                      return undefined;
                    };

                    return (
                      <tr key={targetUser._id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/30 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-xs">
                              {targetUser.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                {targetUser.name}
                                {isSelf && (
                                  <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold uppercase tracking-wider">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-400">{targetUser.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${getRoleBadge(targetUser.role)}`}>
                              {targetUser.role}
                            </span>
                            <select
                              value={targetUser.role}
                              disabled={isRoleDisabled}
                              onChange={(e) => handleRoleChange(targetUser, e.target.value)}
                              className={`px-2 py-1 rounded bg-slate-955 border border-slate-800 text-xs text-slate-300 focus:outline-none ${
                                isRoleDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                              }`}
                              style={{ colorScheme: "dark" }}
                              title={getDisabledTitle()}
                            >
                              <option value="Admin">Admin</option>
                              <option value="HR">HR</option>
                              <option value="Recruiter">Recruiter</option>
                              <option value="Interviewer">Interviewer</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${getStatusBadge(targetUser.status || "Active")}`}>
                              {targetUser.status || "Active"}
                            </span>
                            <select
                              value={targetUser.status || "Active"}
                              disabled={isStatusDisabled}
                              onChange={(e) => handleStatusChange(targetUser, e.target.value)}
                              className={`px-2 py-1 rounded bg-slate-955 border border-slate-800 text-xs text-slate-300 focus:outline-none ${
                                isStatusDisabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                              }`}
                              style={{ colorScheme: "dark" }}
                              title={getDisabledTitle()}
                            >
                              <option value="Active">Active</option>
                              <option value="Disabled">Disabled</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {formatDate(targetUser.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => !isDeleteDisabled && handleDeleteTrigger(targetUser)}
                            disabled={isDeleteDisabled}
                            className={`p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-450 transition-all ${
                              isDeleteDisabled 
                                ? "opacity-30 cursor-not-allowed" 
                                : "hover:text-red-500 hover:border-red-500/20 cursor-pointer"
                            }`}
                            title={getDisabledTitle() || "Delete User"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden premium-card">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/20">
              <h2 className="text-lg font-bold text-white">Create New User</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter full name"
                  value={addFormData.name}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={addFormData.email}
                  onChange={(e) => setAddFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 chars"
                    value={addFormData.password}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Confirm Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Retype password"
                    value={addFormData.confirmPassword}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-200 focus:outline-none focus:border-blue-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Role</label>
                  <select
                    value={addFormData.role}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-350 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="Admin">Admin</option>
                    <option value="HR">HR</option>
                    <option value="Recruiter">Recruiter</option>
                    <option value="Interviewer">Interviewer</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Status</label>
                  <select
                    value={addFormData.status}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-850 text-xs text-slate-355 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="Active">Active</option>
                    <option value="Disabled">Inactive</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-indigo-600/10"
                >
                  {isSubmitting ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && userToDelete && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden premium-card">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Delete User?</h2>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                This action cannot be undone. Are you sure you want to delete <strong className="text-white">{userToDelete.name}</strong>?
              </p>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubmitDirect}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isSubmitting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
