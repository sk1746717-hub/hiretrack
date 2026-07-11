import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("profile"); // Tab switcher: profile, preferences, security
  
  // Local preferences states (saved locally in storage)
  const [defaultSort, setDefaultSort] = useState(
    localStorage.getItem("pref_default_sort") || "newest"
  );
  const [defaultView, setDefaultView] = useState(
    localStorage.getItem("pref_default_view") || "false"
  );
  const [defaultSource, setDefaultSource] = useState(
    localStorage.getItem("pref_default_source") || ""
  );
  
  const [profileData, setProfileData] = useState({
    name: user?.name || "Recruiter Manager",
    email: user?.email || "recruiter@hiretrack.com",
    company: localStorage.getItem("pref_profile_company") || "HireTrack Recruitment",
    title: localStorage.getItem("pref_profile_title") || "Technical Recruiter",
  });

  const handlePreferencesSave = (e) => {
    e.preventDefault();
    localStorage.setItem("pref_default_sort", defaultSort);
    localStorage.setItem("pref_default_view", defaultView);
    localStorage.setItem("pref_default_source", defaultSource);
    toast.success("ATS System preferences saved successfully!");
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    localStorage.setItem("pref_profile_company", profileData.company);
    localStorage.setItem("pref_profile_title", profileData.title);
    toast.success("Recruiter profile credentials updated!");
  };

  const token = localStorage.getItem("token") || "";
  const maskedToken = token
    ? `${token.substring(0, 16)}...[masked]...${token.substring(token.length - 12)}`
    : "No Active Session Token";

  const handleCopyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    toast.success("JWT Authorization Token copied to clipboard!");
  };

  const handleFullLogout = () => {
    logout();
    window.location.href = "/login";
    toast.success("Logged out from all sessions successfully.");
  };

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">ATS Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Configure recruiter profiles, system preferences, and security permissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation tabs */}
        <div className="space-y-1.5 md:col-span-1">
          <div className="p-4.5 rounded-xl bg-slate-950/20 border border-slate-900 space-y-1">
            <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Settings Sections</span>
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-blue-600/15 text-blue-400 border-blue-500/20"
                  : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border-transparent"
              }`}
            >
              Recruiter Profile
            </button>
            <button
              onClick={() => setActiveTab("preferences")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                activeTab === "preferences"
                  ? "bg-blue-600/15 text-blue-400 border-blue-500/20"
                  : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border-transparent"
              }`}
            >
              ATS Preferences
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                activeTab === "security"
                  ? "bg-blue-600/15 text-blue-400 border-blue-500/20"
                  : "text-slate-400 hover:bg-slate-900/50 hover:text-slate-200 border-transparent"
              }`}
            >
              Security & Token
            </button>
          </div>
        </div>

        {/* Configurations Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Recruiter profile tab content */}
          {activeTab === "profile" && (
            <div className="bg-slate-950/20 border border-slate-900 p-6 rounded-2xl backdrop-blur-md shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-3">
                Section A: Recruiter Profile
              </h3>
              
              <form onSubmit={handleProfileSave} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Recruiter Name</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950/60 border border-slate-900 text-sm text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hiring Title</label>
                    <input
                      type="text"
                      value={profileData.title}
                      onChange={(e) => setProfileData({ ...profileData, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Organization / Company</label>
                    <input
                      type="text"
                      value={profileData.company}
                      onChange={(e) => setProfileData({ ...profileData, company: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4.5 py-2.2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  Save Profile
                </button>
              </form>
            </div>
          )}

          {/* Preferences tab content */}
          {activeTab === "preferences" && (
            <div className="bg-slate-950/20 border border-slate-900 p-6 rounded-2xl backdrop-blur-md shadow-lg space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-3">
                Section B: ATS System Preferences
              </h3>

              <form onSubmit={handlePreferencesSave} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Default Sorting</label>
                    <select
                      value={defaultSort}
                      onChange={(e) => setDefaultSort(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="nameAsc">Name A-Z</option>
                      <option value="nameDesc">Name Z-A</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Default Pipeline View</label>
                    <select
                      value={defaultView}
                      onChange={(e) => setDefaultView(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 cursor-pointer"
                      style={{ colorScheme: "dark" }}
                    >
                      <option value="false">Active Candidates</option>
                      <option value="true">Archived Candidates</option>
                      <option value="all">All Candidates</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Default Applicant Source</label>
                  <select
                    value={defaultSource}
                    onChange={(e) => setDefaultSource(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-300 cursor-pointer max-w-sm"
                    style={{ colorScheme: "dark" }}
                  >
                    <option value="">All Sources</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Internshala">Internshala</option>
                    <option value="Referral">Referral</option>
                    <option value="Naukri">Naukri</option>
                    <option value="Career Page">Career Page</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-4.5 py-2.2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs uppercase tracking-wider transition-colors shadow-md shadow-blue-600/10 cursor-pointer"
                >
                  Save Preferences
                </button>
              </form>
            </div>
          )}

          {/* Security tab content */}
          {activeTab === "security" && (
            <div className="space-y-6">
              <div className="bg-slate-950/20 border border-slate-900 p-6 rounded-2xl backdrop-blur-md shadow-lg space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-3">
                  Section C: Account Security & Token
                </h3>
                
                <div className="space-y-3.5 pt-2 text-xs">
                  <div className="flex justify-between items-center py-2 border-b border-slate-900/60">
                    <span className="text-slate-400">Account ID</span>
                    <span className="font-mono text-slate-300 truncate max-w-[220px]">{user?.id || "64afeb39121a5bc9b00c9ef4"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-900/60">
                    <span className="text-slate-400">Active Role</span>
                    <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded font-bold uppercase tracking-wider text-[10px]">
                      Recruiter Administrator
                    </span>
                  </div>
                  <div className="flex flex-col gap-2 py-2">
                    <span className="text-slate-400 font-medium">Authorization Token (JWT)</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400 truncate flex-1 bg-slate-950/80 p-2.5 rounded-lg border border-slate-900">{maskedToken}</span>
                      <button
                        onClick={handleCopyToken}
                        className="px-3.5 py-2.5 bg-slate-900 border border-slate-850 hover:border-slate-700 text-slate-350 hover:text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-900/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Terminate all recruiter page sessions:</span>
                  <button
                    onClick={handleFullLogout}
                    className="px-4.5 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/40 text-rose-400 border border-rose-500/30 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Logout from All Pages
                  </button>
                </div>
              </div>

              {/* Password Change placeholder */}
              <div className="bg-slate-950/20 border border-slate-900 p-6 rounded-2xl backdrop-blur-md shadow-lg space-y-3.5">
                <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Change Account Password</h4>
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[8.5px] uppercase tracking-widest">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Recruiter password update capabilities with complexity checks will be added in a future integration step.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
