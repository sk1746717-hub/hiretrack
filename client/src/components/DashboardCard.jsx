import React from "react";

const DashboardCard = ({ title, count, type }) => {
  const getColors = () => {
    switch (type) {
      case "Total":
        return {
          bg: "bg-slate-950/40 border border-slate-900 border-l-4 border-l-blue-500",
          text: "text-blue-400",
          badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        };
      case "Applied":
        return {
          bg: "bg-slate-950/40 border border-slate-900 border-l-4 border-l-blue-500",
          text: "text-blue-400",
          badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
        };
      case "Screening":
        return {
          bg: "bg-slate-950/40 border border-slate-900 border-l-4 border-l-amber-500",
          text: "text-amber-400",
          badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
        };
      case "Interview":
        return {
          bg: "bg-slate-950/40 border border-slate-900 border-l-4 border-l-purple-500",
          text: "text-purple-400",
          badge: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
        };
      case "Selected":
        return {
          bg: "bg-slate-950/40 border border-slate-900 border-l-4 border-l-emerald-500",
          text: "text-emerald-400",
          badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
        };
      case "Rejected":
        return {
          bg: "bg-slate-950/40 border border-slate-900 border-l-4 border-l-rose-500",
          text: "text-rose-400",
          badge: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
        };
      default:
        return {
          bg: "bg-slate-900/40 border border-slate-800 border-l-4 border-l-slate-700",
          text: "text-slate-300",
          badge: "bg-slate-700/10 text-slate-400 border border-slate-700/20",
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case "Total":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-11 w-11 text-blue-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
          </svg>
        );
      case "Applied":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-11 w-11 text-blue-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case "Screening":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-11 w-11 text-amber-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 7a3 3 0 100 6 3 3 0 000-6z" />
          </svg>
        );
      case "Interview":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-11 w-11 text-purple-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case "Selected":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-11 w-11 text-emerald-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case "Rejected":
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-11 w-11 text-rose-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  const colors = getColors();

  return (
    <div className={`p-6 rounded-xl backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg flex items-center justify-between ${colors.bg}`}>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">{title}</span>
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${colors.badge} md:hidden lg:inline-block`}>
            {type}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-4xl font-extrabold tracking-tight ${colors.text}`}>
            {count}
          </span>
        </div>
      </div>
      <div className="ml-4 shrink-0">
        {getIcon()}
      </div>
    </div>
  );
};

export default DashboardCard;
