import React from "react";

const EmptyState = ({ title, message, actionText, onActionClick }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/85 backdrop-blur-sm max-w-xl mx-auto my-8">
      <div className="h-16 w-16 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50 text-indigo-500 mb-6 shadow-inner">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title || "No data available"}</h3>
      <p className="text-slate-450 text-sm max-w-sm mx-auto mb-6 leading-relaxed">
        {message || "There are no records found. Try adding a candidate or adjusting your search filters."}
      </p>
      {actionText && onActionClick && (
        <button
          onClick={onActionClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all duration-200 shadow-md shadow-indigo-600/20 cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
