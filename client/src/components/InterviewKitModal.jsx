import React, { useState } from "react";
import toast from "react-hot-toast";

const InterviewKitModal = ({
  isOpen,
  onClose,
  candidate,
  interviewKit,
  onRefreshKit,
  isGenerating,
  onSaveNote,
}) => {
  const [expandedProbeIndex, setExpandedProbeIndex] = useState(null);
  const [scratchpadNote, setScratchpadNote] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);

  if (!isOpen) return null;

  const technicalProbes = interviewKit?.technicalProbes || [];
  const experienceProbes = interviewKit?.experienceProbes || [];

  const toggleExpand = (index) => {
    setExpandedProbeIndex(expandedProbeIndex === index ? null : index);
  };

  const handleCopyScratchpad = () => {
    if (!scratchpadNote.trim()) {
      toast.error("Scratchpad is empty");
      return;
    }
    navigator.clipboard.writeText(scratchpadNote);
    toast.success("Notes copied to clipboard!");
  };

  const handleSaveScratchpadToCandidateNotes = async () => {
    if (!scratchpadNote.trim()) {
      toast.error("Please enter some notes first");
      return;
    }
    try {
      setIsSavingNote(true);
      await onSaveNote(scratchpadNote);
      toast.success("Saved to candidate activity notes!");
      setScratchpadNote("");
    } catch (err) {
      toast.error("Failed to save note");
    } finally {
      setIsSavingNote(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-850 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {interviewKit?.title || "Dynamic Interview Kit & Rubric"}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Tailored for {candidate?.fullName || "Candidate"} &bull; {candidate?.jobId?.title || candidate?.roleApplied || "Applied Role"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshKit}
              disabled={isGenerating}
              className="px-3.5 py-2 rounded-xl bg-blue-600/15 hover:bg-blue-600/25 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Regenerate Kit
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* Technical Probes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                Technical & Core Skill Probes
              </h3>
              <span className="text-xs text-slate-500 font-semibold">{technicalProbes.length} Questions</span>
            </div>

            {technicalProbes.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 text-slate-400 text-sm text-center">
                No technical probes generated yet. Click "Regenerate Kit" to generate tailored probes.
              </div>
            ) : (
              technicalProbes.map((probe, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 hover:border-slate-800 transition-all space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Topic: {probe.topic || "Core Technology"}
                    </span>
                    {probe.context && (
                      <span className="text-[11px] text-slate-400 italic">
                        Context: {probe.context}
                      </span>
                    )}
                  </div>

                  <p className="text-sm font-semibold text-white leading-relaxed">
                    {probe.question}
                  </p>

                  {/* Expandable Expected Answer Points */}
                  {Array.isArray(probe.expectedAnswerPoints) && probe.expectedAnswerPoints.length > 0 && (
                    <div className="pt-2">
                      <button
                        onClick={() => toggleExpand(idx)}
                        className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 cursor-pointer"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-3.5 w-3.5 transform transition-transform ${expandedProbeIndex === idx ? "rotate-90" : ""}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                        {expandedProbeIndex === idx ? "Hide Evaluation Criteria" : "View Expected Answer Points"}
                      </button>

                      {expandedProbeIndex === idx && (
                        <ul className="mt-2.5 pl-4 space-y-1.5 text-xs text-slate-300 list-disc list-outside border-l-2 border-teal-500/30 ml-1">
                          {probe.expectedAnswerPoints.map((pt, pIdx) => (
                            <li key={pIdx} className="pl-1 leading-relaxed">
                              {pt}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Experience Probes Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-purple-500"></span>
                Experience & Behavioral Rubrics
              </h3>
              <span className="text-xs text-slate-500 font-semibold">{experienceProbes.length} Rubrics</span>
            </div>

            {experienceProbes.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 text-slate-400 text-sm text-center">
                No experience probes generated yet.
              </div>
            ) : (
              experienceProbes.map((probe, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-950/40 border border-slate-850 hover:border-slate-800 transition-all space-y-2.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      Area: {probe.area || "System Design"}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-white leading-relaxed">
                    {probe.question}
                  </p>

                  {probe.evaluationCriteria && (
                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-850 text-xs text-slate-300 leading-relaxed">
                      <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block mb-1">
                        Evaluation Rubric:
                      </span>
                      {probe.evaluationCriteria}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Interviewer Live Scratchpad */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-850 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Interviewer Scratchpad & Live Notes
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyScratchpad}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Copy Notes
                </button>
                {onSaveNote && (
                  <button
                    type="button"
                    onClick={handleSaveScratchpadToCandidateNotes}
                    disabled={isSavingNote}
                    className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingNote ? "Saving..." : "Save to Timeline"}
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={4}
              value={scratchpadNote}
              onChange={(e) => setScratchpadNote(e.target.value)}
              placeholder="Jot down candidate responses, key points, rating observations during the interview..."
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-y"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-850 bg-slate-950/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Close Interview Kit
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewKitModal;
