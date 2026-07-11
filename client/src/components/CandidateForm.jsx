import React, { useState, useEffect } from "react";

const CandidateForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [resumeFile, setResumeFile] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    roleApplied: "",
    status: "Applied",
    experience: "",
    skills: "",
    notes: "",
    // Section B
    currentCompany: "",
    currentLocation: "",
    noticePeriod: "",
    source: "",
    linkedinUrl: "",
    resumeUrl: "",
    expectedSalary: "",
    lastContactedDate: "",
    // Section C
    interviewDate: "",
    interviewTime: "",
    interviewMode: "",
    interviewerName: "",
    interviewRound: "",
  });

  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      return d.toISOString().split("T")[0];
    } catch (e) {
      return "";
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || "",
        email: initialData.email || "",
        phone: initialData.phone || "",
        roleApplied: initialData.roleApplied || "",
        status: initialData.status || "Applied",
        experience: initialData.experience || "",
        skills: Array.isArray(initialData.skills) ? initialData.skills.join(", ") : initialData.skills || "",
        notes: initialData.notes || "",
        // Section B
        currentCompany: initialData.currentCompany || "",
        currentLocation: initialData.currentLocation || "",
        noticePeriod: initialData.noticePeriod || "",
        source: initialData.source || "",
        linkedinUrl: initialData.linkedinUrl || "",
        resumeUrl: initialData.resumeUrl || "",
        expectedSalary: initialData.expectedSalary || "",
        lastContactedDate: formatDateForInput(initialData.lastContactedDate),
        // Section C
        interviewDate: formatDateForInput(initialData.interviewDate),
        interviewTime: initialData.interviewTime || "",
        interviewMode: initialData.interviewMode || "",
        interviewerName: initialData.interviewerName || "",
        interviewRound: initialData.interviewRound || "",
      });
      setResumeFile(null);
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone || !formData.roleApplied) {
      return;
    }

    const skillsArray = formData.skills
      ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    onSubmit({
      ...formData,
      skills: skillsArray,
      lastContactedDate: formData.lastContactedDate || null,
      interviewDate: formData.interviewDate || null,
    }, resumeFile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Section A: Basic Info */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-2">
          Section A: Basic Candidate Info
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="john.doe@example.com"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-955 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+1 234 567 890"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Role Applied For <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="roleApplied"
              value={formData.roleApplied}
              onChange={handleChange}
              placeholder="React Developer"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Hiring Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-955 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              style={{ colorScheme: "dark" }}
            >
              <option value="Applied" className="bg-slate-900 text-slate-200">Applied</option>
              <option value="Screening" className="bg-slate-900 text-slate-200">Screening</option>
              <option value="Interview" className="bg-slate-900 text-slate-200">Interview</option>
              <option value="Selected" className="bg-slate-900 text-slate-200">Selected</option>
              <option value="Rejected" className="bg-slate-900 text-slate-200">Rejected</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Experience Description (e.g. 3 years)
            </label>
            <input
              type="text"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              placeholder="3+ years, freelance projects"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Skills (Comma-separated)
          </label>
          <input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleChange}
            placeholder="React, CSS, JavaScript"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-205 focus:outline-none focus:border-indigo-500 transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            Candidate Summary Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Overall remarks or summary comments..."
            rows="2"
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200 resize-none"
          ></textarea>
        </div>
      </div>

      {/* Section B: Professional Info */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-2">
          Section B: Professional / Recruitment Info
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Current Company
            </label>
            <input
              type="text"
              name="currentCompany"
              value={formData.currentCompany}
              onChange={handleChange}
              placeholder="Google, freelance, etc."
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Current Location
            </label>
            <input
              type="text"
              name="currentLocation"
              value={formData.currentLocation}
              onChange={handleChange}
              placeholder="San Francisco, CA"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Notice Period
            </label>
            <input
              type="text"
              name="noticePeriod"
              value={formData.noticePeriod}
              onChange={handleChange}
              placeholder="e.g. Immediate, 30 Days"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Expected Salary
            </label>
            <input
              type="text"
              name="expectedSalary"
              value={formData.expectedSalary}
              onChange={handleChange}
              placeholder="e.g. $80,000 / Year"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Recruitment Source
            </label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              style={{ colorScheme: "dark" }}
            >
              <option value="" className="bg-slate-900 text-slate-200">Select Source</option>
              <option value="LinkedIn" className="bg-slate-900 text-slate-200">LinkedIn</option>
              <option value="Internshala" className="bg-slate-900 text-slate-200">Internshala</option>
              <option value="Referral" className="bg-slate-900 text-slate-200">Referral</option>
              <option value="Naukri" className="bg-slate-900 text-slate-200">Naukri</option>
              <option value="Career Page" className="bg-slate-900 text-slate-200">Career Page</option>
              <option value="Other" className="bg-slate-900 text-slate-200">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              LinkedIn Profile URL
            </label>
            <input
              type="url"
              name="linkedinUrl"
              value={formData.linkedinUrl}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/username"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Resume Link (URL)
            </label>
            <input
              type="url"
              name="resumeUrl"
              value={formData.resumeUrl}
              onChange={handleChange}
              placeholder="https://drive.google.com/resume.pdf"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Upload Resume File (.pdf, .doc, .docx)
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResumeFile(e.target.files[0])}
              className="w-full text-xs text-slate-450 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-950 file:text-slate-300 hover:file:bg-slate-900 file:cursor-pointer bg-slate-900 border border-slate-800 rounded-lg p-1"
            />
            {initialData?.resumeFileName && (
              <span className="text-[10px] text-emerald-400 mt-1 block">
                Current: {initialData.resumeFileName}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Last Contacted Date
            </label>
            <input
              type="date"
              name="lastContactedDate"
              value={formData.lastContactedDate}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              style={{ colorScheme: "dark" }}
            />
          </div>
        </div>
      </div>

      {/* Section C: Interview Scheduling */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider border-b border-slate-800 pb-2">
          Section C: Interview Scheduling
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Interview Date
            </label>
            <input
              type="date"
              name="interviewDate"
              value={formData.interviewDate}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              style={{ colorScheme: "dark" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Interview Time
            </label>
            <input
              type="text"
              name="interviewTime"
              value={formData.interviewTime}
              onChange={handleChange}
              placeholder="e.g. 3:00 PM EST"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Interview Mode
            </label>
            <select
              name="interviewMode"
              value={formData.interviewMode}
              onChange={handleChange}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
              style={{ colorScheme: "dark" }}
            >
              <option value="" className="bg-slate-900 text-slate-200">Not Scheduled</option>
              <option value="Online" className="bg-slate-900 text-slate-200">Online</option>
              <option value="Offline" className="bg-slate-900 text-slate-200">Offline</option>
              <option value="Phone" className="bg-slate-900 text-slate-200">Phone</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Interviewer Name
            </label>
            <input
              type="text"
              name="interviewerName"
              value={formData.interviewerName}
              onChange={handleChange}
              placeholder="Interviewer Full Name"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Interview Round Title
            </label>
            <input
              type="text"
              name="interviewRound"
              value={formData.interviewRound}
              onChange={handleChange}
              placeholder="e.g. Technical Round 1"
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800/80">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4.5 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-white transition-all cursor-pointer"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/15 flex items-center gap-2 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : initialData ? (
            "Save Upgrade"
          ) : (
            "Add Candidate"
          )}
        </button>
      </div>
    </form>
  );
};

export default CandidateForm;
