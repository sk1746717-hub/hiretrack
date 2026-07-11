import React from "react";

const SearchFilterBar = ({
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  sourceValue,
  onSourceChange,
  archivedValue,
  onArchivedChange,
  sortValue,
  onSortChange,
}) => {
  return (
    <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-xl backdrop-blur-sm shadow-sm space-y-4 mb-6 w-full">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by candidate name or role..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 placeholder-slate-550 focus:outline-none focus:border-blue-500 transition-all duration-200"
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider hidden md:block">
            Sort Order:
          </span>
          <select
            value={sortValue}
            onChange={(e) => onSortChange(e.target.value)}
            className="w-full md:w-44 px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-350 focus:outline-none focus:border-blue-500 cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option value="newest" className="bg-slate-900 text-slate-200">Newest First</option>
            <option value="oldest" className="bg-slate-900 text-slate-200">Oldest First</option>
            <option value="nameAsc" className="bg-slate-900 text-slate-200">Name A-Z</option>
            <option value="nameDesc" className="bg-slate-900 text-slate-200">Name Z-A</option>
          </select>
        </div>
      </div>

      {/* Grid of Advanced Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
        {/* Status Dropdown */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Pipeline Stage
          </span>
          <select
            value={statusValue}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option value="" className="bg-slate-900 text-slate-200">All Statuses</option>
            <option value="Applied" className="bg-slate-900 text-slate-200">Applied</option>
            <option value="Screening" className="bg-slate-900 text-slate-200">Screening</option>
            <option value="Interview" className="bg-slate-900 text-slate-200">Interview</option>
            <option value="Selected" className="bg-slate-900 text-slate-200">Selected</option>
            <option value="Rejected" className="bg-slate-900 text-slate-200">Rejected</option>
          </select>
        </div>

        {/* Source Dropdown */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Applicant Source
          </span>
          <select
            value={sourceValue}
            onChange={(e) => onSourceChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option value="" className="bg-slate-900 text-slate-200">All Sources</option>
            <option value="LinkedIn" className="bg-slate-900 text-slate-200">LinkedIn</option>
            <option value="Internshala" className="bg-slate-900 text-slate-200">Internshala</option>
            <option value="Referral" className="bg-slate-900 text-slate-200">Referral</option>
            <option value="Naukri" className="bg-slate-900 text-slate-200">Naukri</option>
            <option value="Career Page" className="bg-slate-900 text-slate-200">Career Page</option>
            <option value="Other" className="bg-slate-900 text-slate-200">Other</option>
          </select>
        </div>

        {/* Archive View Toggle */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Pipeline View
          </span>
          <select
            value={archivedValue}
            onChange={(e) => onArchivedChange(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
            style={{ colorScheme: "dark" }}
          >
            <option value="false" className="bg-slate-900 text-slate-200">Active Candidates</option>
            <option value="true" className="bg-slate-900 text-slate-200">Archived Candidates</option>
            <option value="all" className="bg-slate-900 text-slate-200">All Candidates (Active + Archived)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SearchFilterBar;
