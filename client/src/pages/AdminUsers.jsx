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

  // Modal deletion confirmation states
  const [userToDelete, setUserToDelete] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [confirmNameInput, setConfirmNameInput] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers();
      setUsersList(data);
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

  const handleRoleChange = async (targetUser, newRole) => {
    if (targetUser._id === user?.id) {
      toast.error("You cannot modify your own role while logged in.");
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
    if (targetUser._id === user?.id) {
      toast.error("You cannot disable your own admin account while logged in.");
      return;
    }

    if (newStatus === "Disabled" && targetUser.role === "Admin") {
      const adminUsers = usersList.filter(u => u.role === "Admin" && u.status === "Active");
      if (adminUsers.length <= 1) {
        toast.error("Cannot disable the last active Admin account.");
        return;
      }
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
    if (targetUser._id === user?.id) {
      toast.error("You cannot delete your own admin account.");
      return;
    }

    if (targetUser.role === "Admin") {
      const adminCount = usersList.filter(u => u.role === "Admin").length;
      if (adminCount <= 1) {
        toast.error("Cannot delete the last remaining Admin account.");
        return;
      }
    }

    setUserToDelete(targetUser);
    setShowConfirmDelete(true);
    setConfirmNameInput("");
  };

  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!userToDelete) return;

    if (confirmNameInput.trim().toLowerCase() !== "delete") {
      toast.error("Please type 'delete' to confirm deletion");
      return;
    }

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

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">Manage system user roles, access statuses, and permissions</p>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative min-h-[350px] flex flex-col justify-between">
        {loading && (
          <div className="absolute inset-0 bg-slate-955/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
            <Loader />
          </div>
        )}

        <div className="flex-1">
          {!loading && usersList.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-slate-400 text-sm">No registered users found.</p>
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
                  {usersList.map((targetUser) => {
                    const isSelf = targetUser._id === user?.id;
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
                            {!isSelf && (
                              <select
                                value={targetUser.role}
                                disabled={isSubmitting}
                                onChange={(e) => handleRoleChange(targetUser, e.target.value)}
                                className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer"
                                style={{ colorScheme: "dark" }}
                              >
                                <option value="Recruiter">Recruiter</option>
                                <option value="Interviewer">Interviewer</option>
                                <option value="Admin">Admin</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${getStatusBadge(targetUser.status || "Active")}`}>
                              {targetUser.status || "Active"}
                            </span>
                            {!isSelf && (
                              <select
                                value={targetUser.status || "Active"}
                                disabled={isSubmitting}
                                onChange={(e) => handleStatusChange(targetUser, e.target.value)}
                                className="px-2 py-1 rounded bg-slate-955 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer"
                                style={{ colorScheme: "dark" }}
                              >
                                <option value="Active">Active</option>
                                <option value="Disabled">Disabled</option>
                              </select>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs">
                          {formatDate(targetUser.createdAt)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!isSelf && (
                            <button
                              onClick={() => handleDeleteTrigger(targetUser)}
                              disabled={isSubmitting}
                              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-450 hover:text-red-500 hover:border-red-500/20 transition-all cursor-pointer"
                              title="Delete User"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
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

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && userToDelete && (
        <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden premium-card">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Delete User Account</h2>
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleDeleteSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete the user account for <strong className="text-white">{userToDelete.name}</strong> ({userToDelete.email})?
              </p>
              <div className="p-3 bg-red-950/15 border border-red-500/15 rounded-xl text-[10px] text-red-400 font-semibold uppercase tracking-wide leading-relaxed">
                Warning: This action is irreversible. All access and activity timeline associations for this user will be deleted.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Type <span className="text-red-400">"delete"</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmNameInput}
                  onChange={(e) => setConfirmNameInput(e.target.value)}
                  placeholder="Type delete"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-rose-650/15"
                >
                  {isSubmitting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
