import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import candidateService from "../services/candidateService";
import DashboardCard from "../components/DashboardCard";
import Loader from "../components/Loader";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [allCandidates, setAllCandidates] = useState([]);
  const [recentCandidates, setRecentCandidates] = useState([]);
  const [upcomingInterviews, setUpcomingInterviews] = useState([]);
  const [archivedCount, setArchivedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const statsData = await candidateService.getCandidateStats();
        setStats(statsData);

        // Fetch active candidates
        const activeCandidates = await candidateService.getCandidates();
        setAllCandidates(activeCandidates);
        setRecentCandidates(activeCandidates.slice(0, 5));

        // Filter upcoming interviews
        const interviews = activeCandidates
          .filter((c) => c.interviewDate)
          .sort((a, b) => new Date(a.interviewDate) - new Date(b.interviewDate));
        setUpcomingInterviews(interviews);

        // Fetch archived candidates
        const archivedCandidates = await candidateService.getCandidates("", "", "", "true");
        setArchivedCount(archivedCandidates.length);
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
        toast.error("Failed to load dashboard metrics");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Loader fullPage={false} />;
  }

  const statCards = [
    { title: "Total Applicants", count: stats?.total || 0, type: "Total" },
    { title: "Reviewing Application", count: stats?.Applied || 0, type: "Applied" },
    { title: "Initial Screening", count: stats?.Screening || 0, type: "Screening" },
    { title: "Interviewing", count: stats?.Interview || 0, type: "Interview" },
    { title: "Offer Extended", count: stats?.Selected || 0, type: "Selected" },
    { title: "Disqualified", count: stats?.Rejected || 0, type: "Rejected" },
  ];

  // Calculate Source distribution
  const getSourceDistribution = () => {
    const sources = ["LinkedIn", "Referral", "Internshala", "Naukri", "Career Page", "Other"];
    const counts = {};
    sources.forEach((src) => (counts[src] = 0));

    let totalWithSource = 0;
    allCandidates.forEach((c) => {
      const src = c.source || "Other";
      counts[src] = (counts[src] || 0) + 1;
      totalWithSource++;
    });

    return sources.map((src) => ({
      name: src,
      count: counts[src] || 0,
      percentage: totalWithSource > 0 ? Math.round(((counts[src] || 0) / totalWithSource) * 100) : 0,
    }));
  };

  // Calculate Status distribution
  const getStatusDistribution = () => {
    const stages = ["Applied", "Screening", "Interview", "Selected", "Rejected"];
    const total = stats?.total || 0;
    return stages.map((stage) => {
      const count = stats?.[stage] || 0;
      return {
        name: stage,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });
  };

  // Recently updated candidates for activity snapshot
  const getRecentActivities = () => {
    return [...allCandidates]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 4);
  };

  const getInterviewAlerts = () => {
    if (!allCandidates) return [];
    
    const now = new Date();

    const parseDateTime = (dateVal, timeStr) => {
      if (!dateVal) return null;
      const d = new Date(dateVal);
      
      if (!timeStr) return d;
      
      const timeClean = timeStr.trim().toUpperCase();
      const match = timeClean.match(/^(\d+):(\d+)(?:\s*(AM|PM))?$/);
      
      if (match) {
        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const ampm = match[3];
        
        if (ampm === "PM" && hours < 12) {
          hours += 12;
        } else if (ampm === "AM" && hours === 12) {
          hours = 0;
        }
        
        d.setHours(hours, minutes, 0, 0);
      } else {
        const simpleMatch = timeClean.match(/^(\d+)\s*(AM|PM)?$/);
        if (simpleMatch) {
          let hours = parseInt(simpleMatch[1], 10);
          const ampm = simpleMatch[2];
          if (ampm === "PM" && hours < 12) {
            hours += 12;
          } else if (ampm === "AM" && hours === 12) {
            hours = 0;
          }
          d.setHours(hours, 0, 0, 0);
        }
      }
      return d;
    };

    return allCandidates
      .filter((c) => {
        if (!c.interviewDate) return false;
        
        const isExcluded = 
          c.interviewStatus === "Completed" || 
          c.interviewStatus === "Cancelled";
        if (isExcluded) return false;

        const interviewTime = parseDateTime(c.interviewDate, c.interviewTime);
        if (!interviewTime) return false;

        const diffMs = interviewTime - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        // Show reminders from now up to the next 24 hours, plus started within the last 2 hours
        return diffHours >= -2 && diffHours <= 24;
      })
      .map((c) => {
        const interviewTime = parseDateTime(c.interviewDate, c.interviewTime);
        const diffMs = interviewTime - now;
        const diffMins = Math.round(diffMs / (1000 * 60));
        const diffHours = Math.round(diffMs / (1000 * 60 * 60));

        let countdownLabel = "";
        if (diffMins < 0) {
          countdownLabel = `Started ${Math.abs(diffMins)} mins ago`;
        } else if (diffMins < 60) {
          countdownLabel = `Starts in ${diffMins} mins`;
        } else if (diffHours < 24) {
          const isTomorrow = new Date(c.interviewDate).getDate() !== now.getDate();
          countdownLabel = isTomorrow ? "Starts tomorrow" : `Starts in ${diffHours} hours`;
        } else {
          countdownLabel = "Starts tomorrow";
        }

        return {
          id: c._id,
          fullName: c.fullName,
          roleApplied: c.roleApplied,
          interviewDate: c.interviewDate,
          interviewTime: c.interviewTime,
          interviewRound: c.interviewRound,
          interviewMode: c.interviewMode,
          countdownLabel,
          parsedDateTime: interviewTime,
        };
      })
      .sort((a, b) => a.parsedDateTime - b.parsedDateTime);
  };

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back, <span className="font-semibold text-blue-400">{user?.name}</span>. Here is your hiring pipeline overview.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
          {/* Notification bell */}
          {getInterviewAlerts().length > 0 && (
            <div className="relative p-2 rounded-xl bg-slate-955/40 border border-blue-500/20 text-blue-400 flex items-center justify-center animate-pulse" title="Upcoming Reminders Alert">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute -top-1.5 -right-1.5 bg-cyan-500 text-slate-950 font-extrabold text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center border border-slate-900 shadow-md">
                {getInterviewAlerts().length}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-955/40 border border-indigo-500/20 rounded-xl shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Interviews Scheduled: <span className="text-blue-400 font-bold ml-1">{upcomingInterviews.length}</span></span>
          </div>
          <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-955/40 border border-slate-800/80 rounded-xl shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span>Archived Records: <span className="text-teal-400 font-bold ml-1">{archivedCount}</span></span>
          </div>
        </div>
      </div>

      {/* Dynamic Recruiter Interview Reminders Alert Panel */}
      {getInterviewAlerts().length > 0 && (
        <div className="bg-blue-600/10 border border-blue-500/30 rounded-2xl p-5 shadow-lg shadow-blue-500/5 relative overflow-hidden animate-fadeIn">
          <div className="absolute inset-0 bg-slate-955/20 backdrop-blur-md pointer-events-none z-0"></div>
          
          <div className="relative z-10 space-y-3.5">
            <div className="flex items-center justify-between border-b border-blue-500/15 pb-2">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
                </span>
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Upcoming Recruiter Alerts & Interview Reminders
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getInterviewAlerts().slice(0, 3).map((alert) => (
                <Link
                  key={alert.id}
                  to={`/candidates/${alert.id}`}
                  className="flex flex-col justify-between p-4 rounded-xl border border-slate-800/80 bg-slate-955/20 hover:bg-slate-955/35 transition-all cursor-pointer group hover:border-blue-500/40"
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors text-sm">{alert.fullName}</h4>
                      <span className="text-[10px] font-bold text-cyan-400 uppercase bg-cyan-955/50 px-2 py-0.5 rounded border border-cyan-500/20">
                        {alert.countdownLabel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{alert.roleApplied}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-3.5 pt-2 border-t border-slate-850/40">
                    <span>{alert.interviewRound || "General Round"}</span>
                    <span>{alert.interviewTime || "Time Set"}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main KPI Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <DashboardCard
            key={idx}
            title={card.title}
            count={card.count}
            type={card.type}
          />
        ))}
      </div>

      {/* Grid: Recent Candidates & Upcoming Interviews */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Recent Candidates</h2>
              <p className="text-xs text-slate-500 mt-0.5">The latest active applicants added to your pipeline</p>
            </div>
            <Link
              to="/candidates"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider flex items-center gap-1.5"
            >
              View All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {recentCandidates.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-850 rounded-xl bg-slate-950/20">
              <p className="text-sm text-slate-500">No active candidates added yet.</p>
              <Link
                to="/candidates"
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-650 hover:bg-indigo-600 text-white rounded-lg transition-colors cursor-pointer"
              >
                Add Candidate
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-bold tracking-wider text-slate-550 uppercase">
                    <th className="pb-3 pr-4">NAME</th>
                    <th className="pb-3 pr-4">ROLE</th>
                    <th className="pb-3 pr-4">STATUS</th>
                    <th className="pb-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-sm text-slate-350">
                  {recentCandidates.map((candidate) => (
                    <tr key={candidate._id} className="group hover:bg-slate-900/30 transition-colors">
                      <td className="py-3.5 pr-4 font-medium text-white group-hover:text-blue-400 transition-colors">
                        {candidate.fullName}
                      </td>
                      <td className="py-3.5 pr-4 text-slate-400">{candidate.roleApplied}</td>
                      <td className="py-3.5 pr-4">
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            candidate.status === "Applied"
                              ? "bg-sky-950/80 text-sky-400 border border-sky-500/30"
                              : candidate.status === "Screening"
                              ? "bg-amber-955/80 text-amber-400 border border-amber-500/30"
                              : candidate.status === "Interview"
                              ? "bg-purple-955/80 text-purple-400 border border-purple-500/30"
                              : candidate.status === "Selected"
                              ? "bg-emerald-955/80 text-emerald-400 border border-emerald-500/30"
                              : "bg-rose-955/80 text-rose-400 border border-rose-500/30"
                          }`}
                        >
                          {candidate.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          to={`/candidates/${candidate._id}`}
                          className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Upcoming Interviews</h2>
              <p className="text-xs text-slate-500 mt-0.5">Active candidates with scheduled interview dates</p>
            </div>
            <Link
              to="/interviews"
              className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors uppercase tracking-wider flex items-center gap-1.5"
            >
              View All
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-850 rounded-xl bg-slate-950/20">
              <p className="text-sm text-slate-500">No interviews scheduled yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-bold tracking-wider text-slate-550 uppercase">
                    <th className="pb-3 pr-4">CANDIDATE</th>
                    <th className="pb-3 pr-4">DATE / TIME</th>
                    <th className="pb-3 pr-4">MODE / ROUND</th>
                    <th className="pb-3 text-right">PROFILE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-sm text-slate-350">
                  {upcomingInterviews.slice(0, 5).map((candidate) => (
                    <tr key={candidate._id} className="hover:bg-slate-900/30 transition-colors">
                      <td className="py-3.5 pr-4">
                        <p className="font-semibold text-white">{candidate.fullName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{candidate.roleApplied}</p>
                      </td>
                      <td className="py-3.5 pr-4">
                        <p className="text-slate-200 font-bold">
                          {new Date(candidate.interviewDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{candidate.interviewTime || "No Time"}</p>
                      </td>
                      <td className="py-3.5 pr-4 text-xs text-slate-400">
                        <p className="font-medium text-slate-300">{candidate.interviewMode || "Mode"}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{candidate.interviewRound || "Round"}</p>
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          to={`/candidates/${candidate._id}`}
                          className="text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors font-bold"
                        >
                          Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* compact mini analytics section below existing grids */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Pipeline Analytics Summary</h2>
          <p className="text-xs text-slate-500 mt-0.5">Quick distribution of sourcing and recent recruitment updates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-2">
          {/* Sourcing Channels */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
              Applicant Sourcing Channels
            </h3>
            <div className="space-y-3.5">
              {getSourceDistribution().map((src) => (
                <div key={src.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{src.name}</span>
                    <span className="text-slate-500">
                      {src.count} <span className="text-[10px] font-normal">({src.percentage}%)</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                      style={{ width: `${src.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pipeline Stage distribution share */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
              Stage Performance Mix
            </h3>
            <div className="space-y-3.5">
              {getStatusDistribution().map((stg) => {
                const colors = {
                  Applied: "bg-blue-500",
                  Screening: "bg-amber-500",
                  Interview: "bg-purple-500",
                  Selected: "bg-emerald-500",
                  Rejected: "bg-rose-500",
                };
                return (
                  <div key={stg.name} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{stg.name}</span>
                      <span className="text-slate-500">
                        {stg.count} <span className="text-[10px] font-normal">({stg.percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${colors[stg.name] || "bg-indigo-500"}`}
                        style={{ width: `${stg.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Candidate Actions Feed */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">
              Recent Activity Snapshot
            </h3>
            {getRecentActivities().length === 0 ? (
              <p className="text-xs text-slate-500 italic py-4">No recent recruitment logs found.</p>
            ) : (
              <div className="space-y-3">
                {getRecentActivities().map((candidate) => (
                  <div key={candidate._id} className="p-3 bg-slate-950/20 border border-slate-850/60 rounded-xl space-y-1 flex justify-between items-start">
                    <div>
                      <Link to={`/candidates/${candidate._id}`} className="text-xs font-bold text-white hover:text-indigo-400 transition-colors">
                        {candidate.fullName}
                      </Link>
                      <p className="text-[10px] text-slate-500">{candidate.roleApplied}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/10 uppercase tracking-wider font-bold">
                        {candidate.status}
                      </span>
                      <p className="text-[9px] text-slate-600 mt-1">{new Date(candidate.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
