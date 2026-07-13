import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import candidateService from "../services/candidateService";
import jobService from "../services/jobService";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // day of week index (0 = Sun)

  const fetchCalendarEvents = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const combinedEvents = [];

      // 1. Fetch active candidates (with scheduled interviews)
      const candData = await candidateService.getCandidates("", "", "", "false", "newest", "", "200");
      const candList = candData && candData.candidates ? candData.candidates : (Array.isArray(candData) ? candData : []);
      
      candList.forEach((cand) => {
        if (cand.interviewDate) {
          if (user.role === "Interviewer") {
            const isAssigned = 
              String(cand.assignedInterviewerId?._id || cand.assignedInterviewerId || "") === String(user._id) || 
              (cand.interviewerName && cand.interviewerName.toLowerCase() === user.name.toLowerCase());
            if (!isAssigned) return;
          }
          const date = new Date(cand.interviewDate);
          combinedEvents.push({
            id: `interview-${cand._id}`,
            title: `Interview: ${cand.fullName}`,
            type: "interview",
            date: date,
            time: cand.interviewTime || "Time Set",
            description: `${cand.roleApplied} - ${cand.interviewRound || "General Round"}`,
            link: `/candidates/${cand._id}`
          });
        }
      });

      // 2. Fetch jobs (with deadlines)
      if (user.role !== "Interviewer") {
        try {
          const jobData = await jobService.getJobs("", "", "Active", "", "100");
          if (jobData && jobData.jobs) {
            jobData.jobs.forEach((job) => {
              if (job.deadline) {
                const date = new Date(job.deadline);
                combinedEvents.push({
                  id: `job-${job._id}`,
                  title: `Deadline: ${job.title}`,
                  type: "deadline",
                  date: date,
                  time: "11:59 PM",
                  description: `${job.department} Dept`,
                  link: "/jobs"
                });
              }
            });
          }
        } catch (jobErr) {
          console.error("Failed to load jobs for calendar:", jobErr);
        }
      }

      setEvents(combinedEvents);
    } catch (error) {
      console.error("Fetch Calendar Events Error:", error);
      toast.error("Failed to load recruitment calendar schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCalendarEvents();
    }
  }, [currentDate, user]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Filter events matching a specific day
  const getDayEvents = (day) => {
    return events.filter((e) => {
      const eDate = e.date;
      return (
        eDate.getDate() === day &&
        eDate.getMonth() === month &&
        eDate.getFullYear() === year
      );
    });
  };

  // Render Calendar Grid Cells
  const renderCells = () => {
    const cells = [];
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;

    // Fill preceding empty days (padding offset)
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(
        <div
          key={`empty-${i}`}
          className="min-h-[100px] border border-slate-900/40 bg-slate-950/5 text-slate-800 p-2"
        ></div>
      );
    }

    // Fill days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = getDayEvents(day);
      const isToday = isCurrentMonth && today.getDate() === day;

      cells.push(
        <div
          key={`day-${day}`}
          className={`min-h-[100px] border border-slate-900/60 p-2 flex flex-col justify-between transition-colors ${
            isToday 
              ? "bg-blue-600/5 border-blue-500/30" 
              : "bg-slate-900/10 hover:bg-slate-900/20"
          }`}
        >
          {/* Day number */}
          <div className="flex justify-between items-center mb-1">
            <span className={`text-xs font-bold ${
              isToday 
                ? "bg-blue-600 text-white h-5 w-5 rounded-full flex items-center justify-center shadow-md shadow-blue-600/25" 
                : "text-slate-400"
            }`}>
              {day}
            </span>
            {dayEvents.length > 0 && (
              <span className="text-[9px] font-bold text-slate-500">
                {dayEvents.length} Event{dayEvents.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Events list */}
          <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[80px] custom-scrollbar">
            {dayEvents.map((evt) => (
              <Link
                key={evt.id}
                to={evt.link}
                className={`block p-1 rounded text-[9px] font-semibold leading-tight border transition-all ${
                  evt.type === "interview"
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                }`}
                title={`${evt.title} (${evt.time}) - ${evt.description}`}
              >
                <div className="truncate">{evt.title}</div>
                <div className="text-[7px] opacity-75">{evt.time}</div>
              </Link>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Calendar</h1>
          <p className="text-slate-400 text-sm mt-1">Track candidate interview schedules and job application deadlines</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleToday}
            className="px-4 py-2 text-xs font-bold border border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-white rounded-xl transition-colors cursor-pointer"
          >
            Today
          </button>
          <div className="flex items-center border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
            <button
              onClick={handlePrevMonth}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Month Header */}
      <div className="p-6 rounded-2xl border border-slate-850 bg-slate-900/40 backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold text-white">
            {monthNames[month]} <span className="text-blue-400 font-medium">{year}</span>
          </h2>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-purple-500"></span>
              <span className="text-slate-400">Interviews</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500"></span>
              <span className="text-slate-400">Job Deadlines</span>
            </span>
          </div>
        </div>

        {/* Days of Week labels */}
        <div className="grid grid-cols-7 gap-px text-center mb-2 border-b border-slate-900 pb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {day}
            </div>
          ))}
        </div>

        {/* Grid days */}
        {loading ? (
          <div className="h-[400px] flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Syncing calendar...</span>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1 bg-slate-950/20 rounded-xl overflow-hidden">
            {renderCells()}
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarView;
