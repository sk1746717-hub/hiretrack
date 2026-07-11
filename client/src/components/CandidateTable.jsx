import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const CandidateTable = ({ candidates, onEdit, onDelete, onArchive, onRestore }) => {
  const { user } = useAuth();
  const getStatusBadge = (status) => {
    switch (status) {
      case "Applied":
        return "bg-blue-500/10 text-blue-405 border border-blue-500/20";
      case "Screening":
        return "bg-amber-500/10 text-amber-455 border border-amber-500/20";
      case "Interview":
        return "bg-purple-500/10 text-purple-405 border border-purple-500/20";
      case "Selected":
        return "bg-emerald-500/10 text-emerald-405 border border-emerald-500/20";
      case "Rejected":
        return "bg-rose-500/10 text-rose-405 border border-rose-500/20";
      default:
        return "bg-slate-800 text-slate-400";
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-900 bg-slate-950/20 backdrop-blur-md shadow-lg">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-900 bg-slate-950/40 text-xs font-bold tracking-wider text-slate-550 uppercase">
            <th className="px-6 py-4.5">Candidate Details</th>
            <th className="px-6 py-4.5">Role Applied</th>
            <th className="px-6 py-4.5">Status</th>
            <th className="px-6 py-4.5">Experience</th>
            <th className="px-6 py-4.5">Applied Date</th>
            <th className="px-6 py-4.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-900 text-sm text-slate-350">
          {candidates.map((candidate) => (
            <tr
              key={candidate._id}
              className={`transition-colors duration-150 ${
                candidate.isArchived
                  ? "opacity-55 bg-slate-950/20 hover:bg-slate-900/10"
                  : "hover:bg-slate-900/30"
              }`}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/30 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold text-sm shadow-sm shrink-0">
                    {getInitials(candidate.fullName)}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2 font-semibold text-white truncate">
                      {candidate.fullName}
                      {candidate.isArchived && (
                        <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-bold uppercase tracking-wider shrink-0">
                          Archived
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-455 truncate mt-0.5">{candidate.email}</div>
                    <div className="text-[10px] text-slate-500 truncate">{candidate.phone}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-slate-300 font-semibold">
                {candidate.roleApplied}
              </td>
              <td className="px-6 py-4">
                <span className={`text-[9.5px] px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm ${getStatusBadge(candidate.status)}`}>
                  {candidate.status}
                </span>
              </td>
              <td className="px-6 py-4 text-slate-400">
                {candidate.experience || "Not specified"}
              </td>
              <td className="px-6 py-4 text-slate-500 text-xs">
                {formatDate(candidate.createdAt)}
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-3.5">
                  <Link
                    to={`/candidates/${candidate._id}`}
                    className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-850/60 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/20 transition-all shadow-sm"
                    title="View Details"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </Link>

                  {user?.role !== "Interviewer" && (
                    <>
                      {!candidate.isArchived ? (
                        <>
                          <button
                            onClick={() => onEdit(candidate)}
                            className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-850/60 text-slate-400 hover:text-amber-400 hover:border-amber-500/20 transition-all shadow-sm cursor-pointer"
                            title="Edit Candidate"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => onArchive(candidate._id)}
                            className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-850/60 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/20 transition-all shadow-sm cursor-pointer"
                            title="Archive Candidate"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onRestore(candidate._id)}
                            className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-850/60 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/20 transition-all shadow-sm cursor-pointer"
                            title="Restore Candidate"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 12H19" />
                            </svg>
                          </button>

                          <button
                            onClick={() => onDelete(candidate._id)}
                            className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-850/60 text-slate-450 hover:text-red-500 hover:border-red-500/20 transition-all shadow-sm cursor-pointer"
                            title="Permanently Delete"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CandidateTable;
