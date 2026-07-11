import React, { useState, useEffect } from "react";
import candidateService from "../services/candidateService";
import toast from "react-hot-toast";

const Reports = () => {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await candidateService.getCandidateReports();
      setReportsData(data);
    } catch (error) {
      console.error("Fetch Reports Error:", error);
      toast.error("Failed to load recruitment reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getSourcePercentage = (count) => {
    if (!reportsData || reportsData.activeCount === 0) return 0;
    return Math.round((count / reportsData.activeCount) * 100);
  };

  const getStagePercentage = (count) => {
    if (!reportsData || reportsData.activeCount === 0) return 0;
    return Math.round((count / reportsData.activeCount) * 100);
  };

  const exportCSV = () => {
    if (!reportsData) return;

    const csvRows = [
      ["Metric Category", "Label", "Value / Count"],
      ["Summary", "Total Active Candidates", reportsData.activeCount],
      ["Summary", "Total Archived Candidates", reportsData.archivedCount],
      ["Summary", "Interviews Scheduled", reportsData.interviewsCount],
      ["Summary", "Recent Additions (7 Days)", reportsData.recentAdditionsCount],
    ];

    reportsData.stageStats.forEach((s) => {
      csvRows.push(["Pipeline Stage", s._id || "Unspecified", s.count]);
    });

    reportsData.sourceStats.forEach((src) => {
      csvRows.push(["Applicant Source", src._id || "Unspecified", src.count]);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HireTrack_ATS_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Report downloaded successfully!");
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Recruitment Analytics</h1>
          <p className="text-slate-400 text-sm mt-1">Measure source efficiency, recruitment stage metrics, and pipeline conversion</p>
        </div>

        <button
          onClick={exportCSV}
          disabled={loading || !reportsData}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Report CSV
        </button>
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm relative min-h-[300px] flex flex-col justify-between">
        {loading && (
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm flex items-center justify-center rounded-2xl z-10">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-blue-500"></div>
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Loading Analytics...</span>
            </div>
          </div>
        )}

        <div className="flex-1">
          {!loading && !reportsData ? (
            <div className="text-center py-16">
              <p className="text-slate-400 text-sm">No report statistics loaded.</p>
            </div>
          ) : reportsData && (
            <div className="space-y-6">
              {/* Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                <div className="p-5 rounded-xl bg-slate-955/20 border border-slate-900 border-l-4 border-l-blue-500 backdrop-blur-md shadow-sm">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Active Pipeline</span>
                  <h2 className="text-2xl font-extrabold text-white mt-2">{reportsData.activeCount}</h2>
                </div>
                <div className="p-5 rounded-xl bg-slate-955/20 border border-slate-900 border-l-4 border-l-blue-500 backdrop-blur-md shadow-sm">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Interviews Booked</span>
                  <h2 className="text-2xl font-extrabold text-white mt-2">{reportsData.interviewsCount}</h2>
                </div>
                <div className="p-5 rounded-xl bg-slate-955/20 border border-slate-900 border-l-4 border-l-emerald-500 backdrop-blur-md shadow-sm">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Archived Folders</span>
                  <h2 className="text-2xl font-extrabold text-white mt-2">{reportsData.archivedCount}</h2>
                </div>
                <div className="p-5 rounded-xl bg-slate-955/20 border border-slate-900 border-l-4 border-l-purple-500 backdrop-blur-md shadow-sm">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Total Logged</span>
                  <h2 className="text-2xl font-extrabold text-white mt-2">
                    {reportsData.activeCount + reportsData.archivedCount}
                  </h2>
                </div>
                <div className="p-5 rounded-xl bg-slate-955/20 border border-slate-900 border-l-4 border-l-amber-500 backdrop-blur-md shadow-sm">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">New Additions (7d)</span>
                  <h2 className="text-2xl font-extrabold text-white mt-2">{reportsData.recentAdditionsCount || 0}</h2>
                </div>
                <div className="p-5 rounded-xl bg-slate-955/20 border border-slate-900 border-l-4 border-l-cyan-500 backdrop-blur-md shadow-sm">
                  <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Avg Time-to-Hire</span>
                  <h2 className={`font-extrabold text-white mt-2 ${reportsData.avgTimeToHire ? "text-2xl" : "text-xs text-slate-400"}`}>
                    {reportsData.avgTimeToHire ? `${reportsData.avgTimeToHire} days` : "No completed hires yet"}
                  </h2>
                </div>
              </div>

              {/* Funnel chart preview */}
              <div className="bg-slate-950/20 border border-slate-900 p-6 rounded-2xl backdrop-blur-md shadow-lg space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-3">
                  Funnel Conversion Cohort Visualizer
                </h3>
                <div className="flex flex-col sm:flex-row justify-between items-stretch gap-4 pt-3.5">
                  {["Applied", "Screening", "Interview", "Selected"].map((stage, idx) => {
                    const item = reportsData.stageStats.find((s) => s._id === stage);
                    const count = item ? item.count : 0;
                    const nextStage = ["Screening", "Interview", "Selected", "Selected"][idx];
                    const nextItem = reportsData.stageStats.find((s) => s._id === nextStage);
                    const nextCount = nextItem ? nextItem.count : 0;
                    const dropRate = count > 0 && idx < 3 ? Math.round(((count - nextCount) / count) * 100) : 0;

                    return (
                      <React.Fragment key={stage}>
                        <div className="flex-1 p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-2 relative">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stage}</p>
                          <h4 className="text-2xl font-extrabold text-white">{count}</h4>
                          <p className="text-[9px] text-slate-450">Cohort Depth</p>
                        </div>
                        {idx < 3 && (
                          <div className="flex items-center justify-center text-slate-600 text-xs font-semibold px-2 shrink-0">
                            <div className="text-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500/60 mx-auto transform rotate-90 sm:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                              </svg>
                              <span className="text-[9px] text-rose-400 font-bold block mt-1">-{dropRate}% Loss</span>
                            </div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Breakdown panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Stage Distribution */}
                <div className="bg-slate-950/20 border border-slate-900 p-6 rounded-2xl backdrop-blur-md shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-3">
                    Pipeline Stage Conversion
                  </h3>

                  <div className="space-y-4.5 pt-2">
                    {["Applied", "Screening", "Interview", "Selected", "Rejected"].map((stage) => {
                      const item = reportsData.stageStats.find((s) => s._id === stage);
                      const count = item ? item.count : 0;
                      const pct = getStagePercentage(count);
                      
                      // Stage colors
                      const barColors = {
                        Applied: "bg-blue-500",
                        Screening: "bg-amber-500",
                        Interview: "bg-purple-500",
                        Selected: "bg-emerald-500",
                        Rejected: "bg-rose-500",
                      };

                      return (
                        <div key={stage} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-slate-300">{stage}</span>
                            <span className="text-slate-400">
                              {count} {count === 1 ? "candidate" : "candidates"} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColors[stage] || "bg-slate-700"}`}
                              style={{ width: `${pct || 1}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Source Distribution */}
                <div className="bg-slate-950/20 border border-slate-900 p-6 rounded-2xl backdrop-blur-md shadow-lg space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-900 pb-3">
                    Hiring Sources Breakdown
                  </h3>

                  <div className="space-y-4.5 pt-2">
                    {["LinkedIn", "Internshala", "Referral", "Naukri", "Career Page", "Other"].map((src) => {
                      const item = reportsData.sourceStats.find((s) => s._id === src);
                      const count = item ? item.count : 0;
                      const pct = getSourcePercentage(count);

                      return (
                        <div key={src} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-semibold">
                            <span className="text-slate-300">{src}</span>
                            <span className="text-slate-400">
                              {count} ({pct}%)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${pct || 1}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
