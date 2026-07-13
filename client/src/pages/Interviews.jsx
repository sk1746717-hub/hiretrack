import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import candidateService from "../services/candidateService";
import toast from "react-hot-toast";

const Interviews = () => {
  const { user } = useAuth();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterTime, setFilterTime] = useState(""); // time filter: '', upcoming, past, this_week
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackCandidate, setFeedbackCandidate] = useState(null);
  const navigate = useNavigate();

  // Form states for reschedule
  const [formData, setFormData] = useState({
    interviewDate: "",
    interviewTime: "",
    interviewMode: "",
    interviewerName: "",
    interviewRound: "",
    interviewStatus: "",
  });

  const [feedbackText, setFeedbackText] = useState("");

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const data = await candidateService.getCandidates("", "", "", "false", "newest");
      // Filter candidates with scheduled interviews
      const safeList = Array.isArray(data) ? data : data?.candidates || [];
      const interviewees = safeList.filter((c) => c.interviewDate);
      setCandidates(interviewees);
    } catch (error) {
      console.error("Fetch Interviews Error:", error);
      toast.error("Failed to load interviews list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleEditClick = (candidate) => {
    setEditingCandidate(candidate);
    const dateStr = candidate.interviewDate ? new Date(candidate.interviewDate).toISOString().split("T")[0] : "";
    setFormData({
      interviewDate: dateStr,
      interviewTime: candidate.interviewTime || "",
      interviewMode: candidate.interviewMode || "",
      interviewerName: candidate.interviewerName || "",
      interviewRound: candidate.interviewRound || "",
      interviewStatus: candidate.interviewStatus || "Scheduled",
    });
  };

  const handleFeedbackClick = (candidate) => {
    setFeedbackCandidate(candidate);
    setFeedbackText(candidate.interviewFeedback || "");
    setIsFeedbackModalOpen(true);
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingCandidate) return;

    try {
      const updatedData = {
        ...editingCandidate,
        ...formData,
      };
      await candidateService.updateCandidate(editingCandidate._id, updatedData);
      toast.success("Interview updated successfully!");
      setEditingCandidate(null);
      fetchCandidates();
    } catch (error) {
      console.error("Update Interview Error:", error);
      toast.error("Failed to update interview details");
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackCandidate) return;

    try {
      const updatedData = {
        ...feedbackCandidate,
        interviewFeedback: feedbackText,
      };
      await candidateService.updateCandidate(feedbackCandidate._id, updatedData);
      toast.success("Feedback saved successfully!");
      setIsFeedbackModalOpen(false);
      setFeedbackCandidate(null);
      fetchCandidates();
    } catch (error) {
      console.error("Save Feedback Error:", error);
      toast.error("Failed to save feedback");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Scheduled":
        return "bg-blue-500/10 text-blue-400 border border-blue-500/20";
      case "Completed":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Cancelled":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "Rescheduled":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      default:
        return "bg-slate-800 text-slate-400 border border-slate-700";
    }
  };

  // Aggregation counts
  const getUpcomingCount = () => {
    const today = new Date().setHours(0, 0, 0, 0);
    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    return safeCandidates.filter((c) => {
      if (!c.interviewDate) return false;
      const isCompletedOrCancelled = c.interviewStatus === "Completed" || c.interviewStatus === "Cancelled";
      return !isCompletedOrCancelled && new Date(c.interviewDate) >= today;
    }).length;
  };

  const getTodayCount = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    return safeCandidates.filter((c) => {
      if (!c.interviewDate) return false;
      const isCompletedOrCancelled = c.interviewStatus === "Completed" || c.interviewStatus === "Cancelled";
      if (isCompletedOrCancelled) return false;
      const cDateStr = new Date(c.interviewDate).toISOString().split("T")[0];
      return cDateStr === todayStr;
    }).length;
  };

  const getCompletedCount = () => {
    const safeCandidates = Array.isArray(candidates) ? candidates : [];
    return safeCandidates.filter((c) => c.interviewStatus === "Completed").length;
  };

  // Filter candidates by time & status
  const safeCandidatesList = Array.isArray(candidates) ? candidates : [];
  const filteredCandidates = safeCandidatesList.filter((c) => {
    if (filterStatus && c.interviewStatus !== filterStatus) return false;

    if (filterTime) {
      if (!c.interviewDate) return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const interviewDate = new Date(c.interviewDate);

      if (filterTime === "upcoming") {
        return interviewDate >= today;
      }
      if (filterTime === "past") {
        return interviewDate < today;
      }
      if (filterTime === "this_week") {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
        endOfWeek.setHours(23, 59, 59, 999);
        return interviewDate >= startOfWeek && interviewDate <= endOfWeek;
      }
    }

    return true;
  });

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Interviews Scheduler</h1>
          <p className="text-slate-400 text-sm mt-1">Manage scheduled candidate interview blocks and log reviews</p>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <select
            value={filterTime}
            onChange={(e) => setFilterTime(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 focus:outline-none cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option value="">All Dates</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="this_week">This Week</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-slate-300 focus:outline-none cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option value="">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Rescheduled">Rescheduled</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-slate-950/20 border border-slate-900 border-l-4 border-l-blue-500 backdrop-blur-md shadow-sm">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Upcoming Interviews</span>
          <h2 className="text-2xl font-extrabold text-white mt-1.5">{getUpcomingCount()}</h2>
        </div>
        <div className="p-5 rounded-xl bg-slate-950/20 border border-slate-900 border-l-4 border-l-purple-500 backdrop-blur-md shadow-sm">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Interviews Today</span>
          <h2 className="text-2xl font-extrabold text-white mt-1.5">{getTodayCount()}</h2>
        </div>
        <div className="p-5 rounded-xl bg-slate-950/20 border border-slate-900 border-l-4 border-l-emerald-500 backdrop-blur-md shadow-sm">
          <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Completed Interviews</span>
          <h2 className="text-2xl font-extrabold text-white mt-1.5">{getCompletedCount()}</h2>
        </div>
      </div>

      {/* Large ATS interviews panel wrapping Loader, EmptyState, and list */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative min-h-[300px] flex flex-col justify-between">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading Interviews...</span>
            </div>
          </div>
        )}

        <div className="flex-1">
          {!loading && filteredCandidates.length === 0 ? (
            <div className="text-center py-16">
              <div className="h-12 w-12 rounded-xl bg-slate-950 flex items-center justify-center mx-auto text-slate-500 mb-4 border border-slate-850">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">No Interviews Scheduled</h3>
              <p className="text-slate-400 text-sm max-w-sm mx-auto">
                Edit a candidate's details in the Candidates pipeline to schedule their interview date/time block.
              </p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto rounded-xl border border-slate-900 bg-slate-950/20 shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-xs font-bold tracking-wider text-slate-500 uppercase">
                    <th className="px-6 py-4.5">Candidate Details</th>
                    <th className="px-6 py-4.5">Time Slot</th>
                    <th className="px-6 py-4.5">Round / Interviewer</th>
                    <th className="px-6 py-4.5">Mode</th>
                    <th className="px-6 py-4.5">Status</th>
                    <th className="px-6 py-4.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 text-sm text-slate-350">
                  {filteredCandidates.map((candidate) => (
                    <tr
                      key={candidate._id}
                      onClick={() => navigate(`/candidates/${candidate._id}`)}
                      className="hover:bg-slate-900/30 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">{candidate.fullName}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{candidate.roleApplied}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-200">
                          {new Date(candidate.interviewDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">{candidate.interviewTime || "No time slot set"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-slate-300 font-semibold">{candidate.interviewRound || "General Round"}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{candidate.interviewerName ? `Interviewer: ${candidate.interviewerName}` : "Unassigned"}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-slate-900 text-slate-300 text-xs rounded border border-slate-800">
                          {candidate.interviewMode || "Online"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-[9px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${getStatusStyle(candidate.interviewStatus || "Scheduled")}`}>
                          {candidate.interviewStatus || "Scheduled"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFeedbackClick(candidate);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-blue-500/20 text-slate-400 hover:text-blue-400 text-xs font-semibold transition-all cursor-pointer"
                            title="Add Feedback / Notes"
                          >
                            Notes
                          </button>
                          {user?.role !== "Interviewer" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(candidate);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/20 text-slate-400 hover:text-amber-400 text-xs font-semibold transition-all cursor-pointer"
                              title="Edit Details"
                            >
                              Reschedule
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit / Reschedule Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Reschedule Interview</h3>
              <button onClick={() => setEditingCandidate(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Interview Date</label>
                  <input
                    type="date"
                    value={formData.interviewDate}
                    onChange={(e) => setFormData({ ...formData, interviewDate: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                    style={{ colorScheme: "dark" }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Interview Time</label>
                  <input
                    type="text"
                    value={formData.interviewTime}
                    onChange={(e) => setFormData({ ...formData, interviewTime: e.target.value })}
                    placeholder="e.g. 11:00 AM EST"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Interview Mode</label>
                  <select
                    value={formData.interviewMode}
                    onChange={(e) => setFormData({ ...formData, interviewMode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline</option>
                    <option value="Phone">Phone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                  <select
                    value={formData.interviewStatus}
                    onChange={(e) => setFormData({ ...formData, interviewStatus: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 cursor-pointer"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Rescheduled">Rescheduled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Interviewer Name</label>
                  <input
                    type="text"
                    value={formData.interviewerName}
                    onChange={(e) => setFormData({ ...formData, interviewerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Interview Round</label>
                  <input
                    type="text"
                    value={formData.interviewRound}
                    onChange={(e) => setFormData({ ...formData, interviewRound: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-905 border border-slate-800 text-sm text-slate-200"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCandidate(null)}
                  className="px-4 py-2.5 rounded-lg text-sm text-slate-450 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback / Notes Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Interview notes for {feedbackCandidate?.fullName}</h3>
              <button onClick={() => setIsFeedbackModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Feedback & Evaluation notes</label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Record summary remarks, candidate ratings, or coding evaluation details here..."
                  rows="5"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none resize-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg text-sm text-slate-405 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Save Feedback
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Interviews;
