import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="h-20 w-20 rounded-3xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 mb-6 shadow-lg shadow-red-950/10">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">404</h1>
      <h2 className="text-xl font-bold text-slate-300 mb-4">Page Not Found</h2>
      <p className="text-slate-500 text-sm max-w-sm mx-auto mb-8 leading-relaxed">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white font-semibold text-sm transition-all duration-200 shadow-md shadow-indigo-600/10 cursor-pointer"
      >
        Go to Dashboard
      </Link>
    </div>
  );
};

export default NotFound;
