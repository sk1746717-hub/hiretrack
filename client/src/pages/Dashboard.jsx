import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import candidateService from "../services/candidateService";
import Loader from "../components/Loader";
import { useAuth } from "../context/AuthContext";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area
} from "recharts";

const Dashboard = () => {
  const [reportsData, setReportsData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const showReports = user?.role === "Admin" || user?.role === "HR";
      if (showReports) {
        const rep = await candidateService.getCandidateReports();
        setReportsData(rep);
      }

      const st = await candidateService.getCandidateStats();
      setStats(st);
    } catch (error) {
      console.error("Dashboard Fetch Error:", error);
      toast.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  if (loading) {
    return <Loader />;
  }

  // Curated color palette
  const COLORS = ["#3b82f6", "#22d3ee", "#a855f7", "#10b981", "#f59e0b", "#f43f5e"];

  // 1. Map Monthly Trend
  const formatMonthlyTrendData = () => {
    if (!reportsData?.monthlyTrend) return [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return reportsData.monthlyTrend.map((m) => ({
      name: `${monthNames[m._id.month - 1]} ${String(m._id.year).slice(-2)}`,
      Applications: m.count,
    }));
  };

  // 2. Map Pipeline Funnel (Stage stats)
  const formatFunnelData = () => {
    const defaultStages = ["Applied", "Screening", "Shortlisted", "Interview", "Selected", "Rejected"];
    const counts = {};
    defaultStages.forEach(s => (counts[s] = 0));
    
    if (reportsData?.stageStats) {
      reportsData.stageStats.forEach(item => {
        if (item._id && defaultStages.includes(item._id)) {
          counts[item._id] = item.count;
        }
      });
    }

    return defaultStages.map(stage => ({
      name: stage,
      Candidates: counts[stage]
    }));
  };

  // 3. Map Skills Bar Chart
  const formatSkillsData = () => {
    if (!reportsData?.topSkills) return [];
    return reportsData.topSkills.map((s) => ({
      name: s.name,
      Frequency: s.count,
    }));
  };

  // 4. Map Job Wise distribution
  const formatJobDistributionData = () => {
    if (!reportsData?.jobWiseCandidates) return [];
    return reportsData.jobWiseCandidates.map((j) => ({
      name: j.jobTitle.length > 15 ? `${j.jobTitle.slice(0, 15)}...` : j.jobTitle,
      Applicants: j.count,
    }));
  };

  // 5. Status distribution pie chart
  const formatStatusPieData = () => {
    const stages = ["Applied", "Screening", "Shortlisted", "Interview", "Selected", "Rejected"];
    const data = [];
    stages.forEach(st => {
      const count = stats?.[st] || 0;
      if (count > 0) {
        data.push({ name: st, value: count });
      }
    });
    return data;
  };

  const showReports = user?.role === "Admin" || user?.role === "HR";

  const statCards = showReports
    ? [
        {
          title: "Total Applicants",
          count: reportsData?.activeCount || 0,
          badge: "Active",
          color: "border-l-blue-500 shadow-blue-500/10",
          desc: "All pipeline applicants"
        },
        {
          title: "Average AI Match",
          count: `${reportsData?.averageMatchScore || 0}%`,
          badge: "Groq",
          color: "border-l-indigo-500 shadow-indigo-500/10",
          desc: "Average resume match score"
        },
        {
          title: "Hiring Success",
          count: `${reportsData?.hiringSuccessRate || 0}%`,
          badge: "Hired",
          color: "border-l-emerald-500 shadow-emerald-500/10",
          desc: "Offer acceptance conversion"
        },
        {
          title: "Interviews",
          count: stats?.Interview || 0,
          badge: "Active",
          color: "border-l-purple-500 shadow-purple-500/10",
          desc: "Currently in interview phase"
        },
        {
          title: "Active Jobs",
          count: reportsData?.jobsCount?.active || 0,
          badge: "Postings",
          color: "border-l-cyan-500 shadow-cyan-500/10",
          desc: "Open recruitment campaigns"
        },
        {
          title: "Archived Profiles",
          count: reportsData?.archivedCount || 0,
          badge: "Archived",
          color: "border-l-rose-500 shadow-rose-500/10",
          desc: "Inactive candidate records"
        }
      ]
    : [
        {
          title: "Total Candidates",
          count: stats?.total || 0,
          badge: "Total",
          color: "border-l-blue-500 shadow-blue-500/10",
          desc: "Your assigned/managed candidates"
        },
        {
          title: "Active Interviews",
          count: stats?.Interview || 0,
          badge: "Interview",
          color: "border-l-indigo-500 shadow-indigo-500/10",
          desc: "Candidates currently in interview status"
        },
        {
          title: "Shortlisted",
          count: stats?.Shortlisted || 0,
          badge: "Shortlist",
          color: "border-l-cyan-500 shadow-cyan-500/10",
          desc: "Candidates shortlisted for review"
        },
        {
          title: "Successful Hires",
          count: stats?.Selected || 0,
          badge: "Selected",
          color: "border-l-emerald-500 shadow-emerald-500/10",
          desc: "Hired candidates list"
        },
        {
          title: "Screening Phase",
          count: stats?.Screening || 0,
          badge: "Screening",
          color: "border-l-amber-500 shadow-amber-500/10",
          desc: "Candidates currently being screened"
        }
      ];

  return (
    <div className="space-y-8 w-full max-w-6xl mx-auto pb-10 select-none">
      
      {/* Header Dashboard Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Recruitment Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time metrics, AI screening analysis, and recruiter scheduling audits</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/candidates"
            className="px-4.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-md shadow-blue-600/20"
          >
            Review Candidates
          </Link>
        </div>
      </div>

      {/* KPI stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className={`p-6 rounded-2xl border border-slate-850 bg-slate-900/40 border-l-4 ${card.color} flex flex-col justify-between h-36 backdrop-blur-sm hover:bg-slate-900/60 transition-colors shadow-xl`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{card.title}</span>
              <span className="text-[8px] font-bold text-blue-400 uppercase bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                {card.badge}
              </span>
            </div>
            <div className="space-y-1">
              <h2 className="text-3xl font-extrabold text-white tracking-tight">{card.count}</h2>
              <p className="text-[10px] text-slate-500 font-medium">{card.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recharts Data Visualization Panels */}
      {showReports && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Applications Trend Line Chart */}
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-sm shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">Monthly Applications Trend</h3>
              <div className="h-64 w-full text-xs">
                {formatMonthlyTrendData().length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 italic">No application data logged yet.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={formatMonthlyTrendData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: "#09142a", borderColor: "#1e293b", color: "#f8fafc" }} />
                      <Line type="monotone" dataKey="Applications" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Recruitment Pipeline Funnel Chart */}
            <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-sm shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">Recruitment Pipeline Funnel</h3>
              <div className="h-64 w-full text-xs">
                {formatFunnelData().every(d => d.Candidates === 0) ? (
                  <div className="h-full flex items-center justify-center text-slate-500 italic">No candidates in pipeline.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formatFunnelData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorFunnel" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: "#09142a", borderColor: "#1e293b", color: "#f8fafc" }} />
                      <Area type="monotone" dataKey="Candidates" stroke="#a855f7" fillOpacity={1} fill="url(#colorFunnel)" strokeWidth={2.5} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Stage Status distribution pie */}
            <div className="lg:col-span-1 bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-sm shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">Status distribution</h3>
              <div className="h-56 w-full text-xs flex flex-col justify-center items-center">
                {formatStatusPieData().length === 0 ? (
                  <div className="text-slate-500 italic">No active candidates.</div>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height="80%">
                      <PieChart>
                        <Pie data={formatStatusPieData()} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                          {formatStatusPieData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#09142a", borderColor: "#1e293b", color: "#f8fafc" }} />
                      </PieChart>
                    </ResponsiveContainer>
                    
                    {/* Custom Legends */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-[10px] pt-2">
                      {formatStatusPieData().map((entry, index) => (
                        <span key={index} className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span className="text-slate-400 font-semibold">{entry.name} ({entry.value})</span>
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Top Candidate Skills horizontal bar */}
            <div className="lg:col-span-1 bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-sm shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">Top Candidate Skills</h3>
              <div className="h-56 w-full text-xs">
                {formatSkillsData().length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 italic">No skills catalogued.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatSkillsData()} layout="vertical" margin={{ top: 0, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.01)" />
                      <XAxis type="number" stroke="#64748b" />
                      <YAxis type="category" dataKey="name" stroke="#64748b" width={60} />
                      <Tooltip contentStyle={{ backgroundColor: "#09142a", borderColor: "#1e293b", color: "#f8fafc" }} />
                      <Bar dataKey="Frequency" fill="#22d3ee" radius={[0, 4, 4, 0]} barSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Job wise candidate distribution */}
            <div className="lg:col-span-1 bg-slate-900/40 border border-slate-850 p-6 rounded-2xl backdrop-blur-sm shadow-xl space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-850 pb-2">Job Distribution</h3>
              <div className="h-56 w-full text-xs">
                {formatJobDistributionData().length === 0 ? (
                  <div className="h-full flex items-center justify-center text-slate-500 italic">No applications allocated to jobs.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formatJobDistributionData()} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.01)" />
                      <XAxis dataKey="name" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip contentStyle={{ backgroundColor: "#09142a", borderColor: "#1e293b", color: "#f8fafc" }} />
                      <Bar dataKey="Applicants" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={15} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Recruiter Activity Performance board */}
          {reportsData?.recruiterPerformance?.length > 0 && (
            <div className="p-6 rounded-2xl border border-slate-850 bg-slate-900/40 backdrop-blur-sm space-y-4">
              <div className="border-b border-slate-850 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recruiter Performance Metrics</h3>
              </div>
              
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-900 text-slate-500 font-bold uppercase pb-3">
                      <th className="pb-3">Recruiter Name</th>
                      <th className="pb-3">Email Address</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3 text-center">Applicants Managed</th>
                      <th className="pb-3 text-right">Successful Hires</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/60 text-slate-300">
                    {reportsData.recruiterPerformance.map((rec, i) => (
                      <tr key={i} className="hover:bg-slate-950/15">
                        <td className="py-3 font-semibold text-white">{rec.name}</td>
                        <td className="py-3 text-slate-400">{rec.email}</td>
                        <td className="py-3 text-slate-500">{rec.role}</td>
                        <td className="py-3 text-center font-semibold">{rec.processed}</td>
                        <td className="py-3 text-right font-extrabold text-emerald-400">{rec.hired}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
