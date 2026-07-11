import React from "react";

const Loader = ({ fullPage = true }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center ${
        fullPage ? "min-h-screen bg-slate-950" : "w-full py-12"
      }`}
    >
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 rounded-full border-4 border-slate-850"></div>
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-4 text-slate-400 font-medium text-sm animate-pulse">Loading...</p>
    </div>
  );
};

export default Loader;
