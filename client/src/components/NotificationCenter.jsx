import React, { useState, useEffect, useRef } from "react";
import notificationService from "../services/notificationService";
import { useAuth } from "../context/AuthContext";

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { token } = useAuth();

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
      // Poll notifications every 45 seconds for active alerts
      const interval = setInterval(fetchNotifications, 45000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications(prev => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Application":
        return (
          <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </span>
        );
      case "Interview":
        return (
          <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </span>
        );
      case "Deadline":
        return (
          <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        );
      default:
        return (
          <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        );
    }
  };

  const getFormatTime = (timeString) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Action Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-xl border border-slate-800/80 bg-slate-900/30 text-slate-400 hover:text-white hover:bg-slate-900/60 transition-all cursor-pointer flex items-center justify-center shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-md shadow-red-500/35">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Drawer */}
      {isOpen && (
        <div className="absolute left-[-180px] mt-3 w-80 rounded-2xl border border-slate-800/80 bg-slate-950/95 shadow-[0_20px_50px_rgba(0,0,0,0.65),0_0_20px_rgba(59,130,246,0.18)] backdrop-blur-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-900/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No recent notifications
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => !notif.isRead && handleMarkAsRead(notif._id)}
                  className={`p-4 flex items-start gap-3 transition-colors cursor-pointer group hover:bg-slate-900/30 ${
                    !notif.isRead ? "bg-blue-600/5" : ""
                  }`}
                >
                  {getTypeIcon(notif.type)}
                  
                  <div className="flex-1 space-y-1 overflow-hidden">
                    <div className="flex justify-between items-start gap-2">
                      <p className={`text-xs font-semibold text-white leading-tight truncate ${!notif.isRead ? "text-blue-400" : ""}`}>
                        {notif.title}
                      </p>
                      <span className="text-[9px] text-slate-500 font-medium shrink-0 whitespace-nowrap">
                        {getFormatTime(notif.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-normal break-words">
                      {notif.message}
                    </p>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, notif._id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-0.5 rounded transition-all cursor-pointer self-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
