import React, { useState, useEffect } from "react";
import taskService from "../services/taskService";
import candidateService from "../services/candidateService";
import toast from "react-hot-toast";

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    linkedCandidateId: "",
    dueDate: "",
    priority: "Medium",
    status: "Pending",
    category: "Other",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tasksData, candidatesData] = await Promise.all([
        taskService.getTasks(filterStatus, filterPriority),
        candidateService.getCandidates("", "", "", "false", "nameAsc"),
      ]);

      // Apply client-side filter for category if specified
      let filteredTasks = tasksData;
      if (filterCategory) {
        filteredTasks = tasksData.filter((t) => t.category === filterCategory);
      }

      setTasks(filteredTasks);
      setCandidates(
        Array.isArray(candidatesData)
          ? candidatesData
          : candidatesData?.candidates || []
      );
    } catch (error) {
      console.error("Fetch Tasks Error:", error);
      toast.error("Failed to load tasks dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, filterPriority, filterCategory]);

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: "",
      description: "",
      linkedCandidateId: "",
      dueDate: "",
      priority: "Medium",
      status: "Pending",
      category: "Other",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    const dateStr = task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "";
    setFormData({
      title: task.title,
      description: task.description || "",
      linkedCandidateId: task.linkedCandidateId?._id || "",
      dueDate: dateStr,
      priority: task.priority || "Medium",
      status: task.status || "Pending",
      category: task.category || "Other",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    try {
      if (editingTask) {
        await taskService.updateTask(editingTask._id, formData);
        toast.success("Task updated successfully!");
      } else {
        await taskService.createTask(formData);
        toast.success("Task created successfully!");
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Form Submit Error:", error);
      toast.error("Failed to save task details");
    }
  };

  const handleStatusToggle = async (task) => {
    const nextStatus = task.status === "Completed" ? "Pending" : "Completed";
    try {
      await taskService.updateTask(task._id, { status: nextStatus });
      toast.success(`Task marked as ${nextStatus.toLowerCase()}`);
      fetchData();
    } catch (error) {
      console.error("Status Toggle Error:", error);
      toast.error("Failed to update task status");
    }
  };

  const handleDeleteTask = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await taskService.deleteTask(id);
      toast.success("Task deleted successfully");
      fetchData();
    } catch (error) {
      console.error("Delete Task Error:", error);
      toast.error("Failed to delete task");
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "Medium":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      case "Low":
      default:
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 line-through opacity-60";
      case "In Progress":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "Pending":
      default:
        return "bg-slate-800 text-slate-400 border border-slate-700";
    }
  };

  const isOverdue = (dueDate, status) => {
    if (!dueDate || status === "Completed") return false;
    return new Date(dueDate) < new Date().setHours(0, 0, 0, 0);
  };

  // Metrics calculators
  const getOverdueCount = () => {
    return tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
  };

  const getTodayCount = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    return tasks.filter((t) => {
      if (t.status === "Completed") return false;
      if (!t.dueDate) return false;
      const tDateStr = new Date(t.dueDate).toISOString().split("T")[0];
      return tDateStr === todayStr;
    }).length;
  };

  const getPendingCount = () => {
    return tasks.filter((t) => t.status !== "Completed").length;
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Recruiter Tasks</h1>
          <p className="text-slate-400 text-sm mt-1">Organize candidate reviews, follow-up emails, and hiring milestones</p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-600/15 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Task
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-955/40 border border-slate-800 border-l-4 border-l-amber-500 backdrop-blur-md shadow-sm">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">My Today Tasks</span>
          <h2 className="text-2xl font-extrabold text-white mt-1.5">{getTodayCount()}</h2>
        </div>
        <div className="p-5 rounded-xl bg-slate-955/40 border border-slate-800 border-l-4 border-l-rose-500 backdrop-blur-md shadow-sm">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Overdue Tasks</span>
          <h2 className="text-2xl font-extrabold text-rose-400 mt-1.5">{getOverdueCount()}</h2>
        </div>
        <div className="p-5 rounded-xl bg-slate-955/40 border border-slate-800 border-l-4 border-l-blue-500 backdrop-blur-md shadow-sm">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Pending Total</span>
          <h2 className="text-2xl font-extrabold text-white mt-1.5">{getPendingCount()}</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center bg-slate-900/60 border border-slate-800 p-4 rounded-xl backdrop-blur-sm shadow-sm">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filter Status</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filter Priority</span>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Filter Category</span>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option value="">All Categories</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Interview Prep">Interview Prep</option>
            <option value="Review Resume">Review Resume</option>
            <option value="Send Feedback">Send Feedback</option>
            <option value="Offer Discussion">Offer Discussion</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Large ATS tasks panel wrapping Loader, EmptyState, and task cards */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative min-h-[300px] flex flex-col justify-between">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading Tasks...</span>
            </div>
          </div>
        )}

        <div className="flex-1">
          {!loading && tasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-12 w-12 rounded-xl bg-slate-950 flex items-center justify-center mx-auto text-slate-500 mb-4 border border-slate-850">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Tasks Found</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Get started by logging candidate assessments, reviewer schedules, or feedback tasks.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div
                  key={task._id}
                  className={`p-5 rounded-2xl border bg-slate-950/20 backdrop-blur-md shadow-sm flex gap-4 transition-all duration-200 ${
                    task.status === "Completed" ? "opacity-60 border-slate-900" : "border-slate-850/80"
                  } ${isOverdue(task.dueDate, task.status) ? "border-rose-500/30 bg-rose-950/5" : ""}`}
                >
                  {/* Checkbox status toggle */}
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={task.status === "Completed"}
                      onChange={() => handleStatusToggle(task)}
                      className="h-5 w-5 rounded border-slate-850 bg-slate-900 text-blue-600 focus:ring-blue-600 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    />
                  </div>

                  {/* Task Details */}
                  <div className="flex-1 space-y-3 overflow-hidden">
                    <div>
                      <h3 className={`font-bold text-white text-base truncate ${task.status === "Completed" ? "line-through text-slate-505" : ""}`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-400 leading-relaxed mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2.5 items-center pt-2">
                      <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-350 border border-slate-850 text-[9px] font-bold uppercase tracking-wider">
                        {task.category || "Other"}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getPriorityStyle(task.priority)}`}>
                        {task.priority} Priority
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${getStatusStyle(task.status)}`}>
                        {task.status}
                      </span>

                      {task.dueDate && (
                        <span className={`text-[10px] font-semibold flex items-center gap-1.5 ${
                          isOverdue(task.dueDate, task.status) ? "text-rose-400 font-bold" : "text-slate-400"
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1-1v3M14 2a1 1 0 00-1-1v3M4 11h12M4 8a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2H4z" clipRule="evenodd" />
                          </svg>
                          {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          {isOverdue(task.dueDate, task.status) && " (Overdue)"}
                        </span>
                      )}
                    </div>

                    {task.linkedCandidateId && (
                      <div className="pt-2 border-t border-slate-900/60 flex items-center gap-2">
                        <span className="text-[10px] text-slate-500">Candidate:</span>
                        <span className="text-xs text-slate-300 font-medium truncate">
                          {task.linkedCandidateId.fullName} ({task.linkedCandidateId.roleApplied})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 shrink-0 justify-between items-end">
                    <button
                      onClick={() => handleOpenEditModal(task)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 text-slate-400 hover:text-amber-400 hover:border-amber-500/20 transition-all cursor-pointer"
                      title="Edit Task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 text-slate-400 hover:text-red-500 hover:border-red-500/20 transition-all cursor-pointer"
                      title="Delete Task"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-955/70 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">{editingTask ? "Edit Recruiter Task" : "Add Recruiter Task"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Task Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Call Clark Kent for screening"
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Task details or remarks..."
                  rows="2"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Category Type</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="Follow-up">Follow-up</option>
                    <option value="Interview Prep">Interview Prep</option>
                    <option value="Review Resume">Review Resume</option>
                    <option value="Send Feedback">Send Feedback</option>
                    <option value="Offer Discussion">Offer Discussion</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Linked Candidate (Optional)</label>
                  <select
                    value={formData.linkedCandidateId}
                    onChange={(e) => setFormData({ ...formData, linkedCandidateId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="">None</option>
                    {Array.isArray(candidates) && candidates.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.fullName} ({c.roleApplied})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  {editingTask ? "Save Task" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
