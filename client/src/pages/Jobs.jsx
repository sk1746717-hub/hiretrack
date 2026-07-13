import React, { useState, useEffect } from "react";
import jobService from "../services/jobService";
import authService from "../services/authService";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Jobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [recruiters, setRecruiters] = useState([]);
  const [interviewers, setInterviewers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & Pagination state
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Form Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    description: "",
    requiredSkills: "",
    experience: "",
    salary: "",
    deadline: "",
    status: "Active",
    assignedRecruiterId: "",
    assignedInterviewerId: "",
  });

  const isWriteAllowed = user?.role === "Admin" || user?.role === "HR";

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await jobService.getJobs(search, deptFilter, statusFilter, page, 8);
      setJobs(data.jobs);
      setTotalPages(data.pages || 1);
    } catch (error) {
      console.error("Fetch Jobs Error:", error);
      toast.error("Failed to load job openings");
    } finally {
      setLoading(false);
    }
  };

  const fetchRecruiters = async () => {
    if (!isWriteAllowed) return;
    try {
      const response = await authService.getUsers();
      const userList = Array.isArray(response)
        ? response
        : response.users || response.recruiters || [];
      // Only list active recruiters/HRs/Admins/Interviewers
      const activeUsers = userList.filter((u) => u.status === "Active" || !u.status);
      setRecruiters(activeUsers.filter((u) => u.role === "Recruiter"));
      setInterviewers(activeUsers.filter((u) => u.role === "Interviewer"));
    } catch (error) {
      console.error("Fetch Users Error:", error);
      setRecruiters([]);
      setInterviewers([]);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [search, deptFilter, statusFilter, page]);

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenCreateModal = () => {
    setEditingJob(null);
    setFormData({
      title: "",
      department: "",
      description: "",
      requiredSkills: "",
      experience: "",
      salary: "",
      deadline: "",
      status: "Active",
      assignedRecruiterId: "",
      assignedInterviewerId: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (job) => {
    setEditingJob(job);
    const deadlineStr = job.deadline ? new Date(job.deadline).toISOString().split("T")[0] : "";
    setFormData({
      title: job.title || "",
      department: job.department || "",
      description: job.description || "",
      requiredSkills: Array.isArray(job.requiredSkills) ? job.requiredSkills.join(", ") : job.requiredSkills || "",
      experience: job.experience || "",
      salary: job.salary || "",
      deadline: deadlineStr,
      status: job.status || "Active",
      assignedRecruiterId: job.assignedRecruiterId?._id || job.assignedRecruiterId || "",
      assignedInterviewerId: job.assignedInterviewerId?._id || job.assignedInterviewerId || "",
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.department) {
      toast.error("Please fill in title and department fields");
      return;
    }

    try {
      if (editingJob) {
        await jobService.updateJob(editingJob._id, formData);
        toast.success("Job updated successfully!");
      } else {
        await jobService.createJob(formData);
        toast.success("Job created successfully!");
      }
      setIsModalOpen(false);
      fetchJobs();
    } catch (error) {
      console.error("Submit Job Error:", error);
      toast.error("Failed to save job details");
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm("Are you sure you want to delete this job opening? This action cannot be undone.")) return;
    try {
      await jobService.deleteJob(id);
      toast.success("Job opening deleted");
      fetchJobs();
    } catch (error) {
      console.error("Delete Job Error:", error);
      toast.error("Failed to delete job");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Closed":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "Draft":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-slate-800 text-slate-400 border border-slate-700";
    }
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Job Openings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage corporate job postings, assign recruiters, and review applications</p>
        </div>

        {isWriteAllowed && (
          <button
            onClick={handleOpenCreateModal}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Post a Job
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-900/30 border border-slate-800 p-4 rounded-2xl backdrop-blur-sm">
        <input
          type="text"
          placeholder="Search jobs by title..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500/50"
        />

        <select
          value={deptFilter}
          onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-300 text-sm focus:outline-none focus:border-blue-500/50"
        >
          <option value="">All Departments</option>
          <option value="Engineering">Engineering</option>
          <option value="Product">Product</option>
          <option value="Design">Design</option>
          <option value="Marketing">Marketing</option>
          <option value="Sales">Sales</option>
          <option value="HR">HR</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-300 text-sm focus:outline-none focus:border-blue-500/50"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Closed">Closed</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 rounded-2xl border border-slate-800 bg-slate-900/10 animate-pulse"></div>
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/10 border border-slate-800 rounded-2xl">
          <p className="text-slate-500 text-sm">No job openings found matching your criteria.</p>
        </div>
      ) : (
        /* Jobs List Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <div
              key={job._id}
              className="p-6 rounded-2xl border border-slate-850 bg-slate-900/40 hover:bg-slate-900/70 transition-all flex flex-col justify-between shadow-lg relative group"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="text-lg font-bold text-white leading-snug group-hover:text-blue-400 transition-colors">
                    {job.title}
                  </h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusColor(job.status)}`}>
                    {job.status}
                  </span>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-400 font-medium mb-4">
                  <span className="flex items-center gap-1">
                    <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                    {job.department}
                  </span>
                  {job.experience && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      {job.experience}
                    </span>
                  )}
                  {job.salary && (
                    <span className="flex items-center gap-1">
                      <svg className="h-3.5 w-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1" /></svg>
                      {job.salary}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                  {job.description || "No description provided."}
                </p>

                {job.requiredSkills && job.requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-6">
                    {job.requiredSkills.map((skill, index) => (
                      <span
                        key={index}
                        className="text-[9px] px-2 py-0.5 rounded bg-slate-950/60 border border-slate-900 text-slate-400"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-800/60 mt-auto">
                <div className="text-[10px] text-slate-500 font-medium">
                  {job.deadline ? (
                    <span>Deadline: {new Date(job.deadline).toLocaleDateString()}</span>
                  ) : (
                    <span>No deadline set</span>
                  )}
                  {job.assignedRecruiterId?.name && (
                    <div className="mt-0.5 text-slate-400">Recruiter: {job.assignedRecruiterId.name}</div>
                  )}
                  {job.assignedInterviewerId?.name && (
                    <div className="mt-0.5 text-slate-400">Interviewer: {job.assignedInterviewerId.name}</div>
                  )}
                </div>

                {isWriteAllowed && (
                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEditModal(job)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteJob(job._id)}
                      className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="p-2.5 rounded-xl border border-slate-850 bg-slate-900/30 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs font-semibold text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="p-2.5 rounded-xl border border-slate-850 bg-slate-900/30 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:text-slate-400 transition-all cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Edit/Create Form Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-lg shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {editingJob ? "Edit Job Posting" : "Create Job Posting"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Job Title *</label>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-200 text-sm focus:outline-none focus:border-blue-500/50"
                    placeholder="e.g. Senior React Developer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Department *</label>
                  <select
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-300 text-sm focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="">Select Dept</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Sales">Sales</option>
                    <option value="HR">HR</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Description</label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-200 text-sm focus:outline-none focus:border-blue-500/50 resize-none"
                  placeholder="Job roles and core responsibilities..."
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Required Skills (Comma separated)</label>
                <input
                  type="text"
                  name="requiredSkills"
                  value={formData.requiredSkills}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-200 text-sm focus:outline-none focus:border-blue-500/50"
                  placeholder="React, Node.js, TypeScript, CSS"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Experience (e.g. 3+ years)</label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-200 text-sm focus:outline-none focus:border-blue-500/50"
                    placeholder="e.g. 2-5 years"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Salary (e.g. $80k - $100k)</label>
                  <input
                    type="text"
                    name="salary"
                    value={formData.salary}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-200 text-sm focus:outline-none focus:border-blue-500/50"
                    placeholder="Negotiable"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Application Deadline</label>
                  <input
                    type="date"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-300 text-sm focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-300 text-sm focus:outline-none focus:border-blue-500/50"
                  >
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Assign Recruiter</label>
                <select
                  name="assignedRecruiterId"
                  value={formData.assignedRecruiterId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-300 text-sm focus:outline-none focus:border-blue-500/50 cursor-pointer"
                >
                  {recruiters.length === 0 ? (
                    <option value="" disabled>No recruiters available</option>
                  ) : (
                    <>
                      <option value="">No recruiter assigned</option>
                      {recruiters.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Assign Interviewer</label>
                <select
                  name="assignedInterviewerId"
                  value={formData.assignedInterviewerId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-slate-300 text-sm focus:outline-none focus:border-blue-500/50 cursor-pointer"
                >
                  {interviewers.length === 0 ? (
                    <option value="" disabled>No interviewers available</option>
                  ) : (
                    <>
                      <option value="">No interviewer assigned</option>
                      {interviewers.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/40 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors cursor-pointer shadow-md"
                >
                  {editingJob ? "Save Changes" : "Post Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
