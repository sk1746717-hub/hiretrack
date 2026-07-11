import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Candidates from "./pages/Candidates";
import CandidateDetails from "./pages/CandidateDetails";
import Pipeline from "./pages/Pipeline";
import Interviews from "./pages/Interviews";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AdminUsers from "./pages/AdminUsers";
import NotFound from "./pages/NotFound";

const ProtectedLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen text-slate-200 relative premium-bg-glow overflow-hidden">
      {/* Decorative Grid, Dots and Glow Layers */}
      <div className="absolute inset-0 premium-grid-pattern pointer-events-none z-0 opacity-40"></div>
      <div className="absolute inset-0 premium-dot-pattern pointer-events-none z-0 opacity-80"></div>
      
      {/* High-end Glowing Shapes */}
      <div className="absolute top-[-20%] left-[-15%] w-[60%] h-[60%] bg-indigo-650/20 blur-[160px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-20%] right-[-15%] w-[60%] h-[60%] bg-teal-500/15 blur-[160px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute top-[25%] left-[35%] w-[35%] h-[35%] bg-sky-500/8 blur-[140px] rounded-full pointer-events-none z-0"></div>

      {/* SVG Tech Circuit Lines for Left and Right Aesthetics */}
      <svg className="absolute top-[10%] left-0 w-[350px] h-[550px] text-blue-500/15 pointer-events-none z-0" viewBox="0 0 100 150" preserveAspectRatio="none">
        <path d="M0,20 L30,20 L40,30 L40,60 L60,80 L90,80" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <path d="M0,50 L20,50 L35,65 L35,90 L50,105 L80,105" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <path d="M0,100 L25,100 L35,110 L55,110 L65,120 L95,120" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <circle cx="30" cy="20" r="1" fill="#22d3ee" className="animate-pulse" />
        <circle cx="90" cy="80" r="1.2" fill="#22d3ee" />
        <circle cx="60" cy="80" r="0.8" fill="currentColor" />
        <circle cx="50" cy="105" r="1" fill="#3b82f6" />
        <circle cx="80" cy="105" r="1.2" fill="#22d3ee" />
        <circle cx="95" cy="120" r="1.2" fill="#3b82f6" />
      </svg>
      
      <svg className="absolute top-[20%] right-0 w-[350px] h-[650px] text-cyan-500/15 pointer-events-none z-0" viewBox="0 0 100 150" preserveAspectRatio="none">
        <path d="M100,25 L75,25 L65,35 L65,65 L45,85 L15,85" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <path d="M100,60 L80,60 L65,75 L65,100 L50,115 L20,115" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <path d="M100,110 L75,110 L65,120 L45,120 L35,130 L5,130" fill="none" stroke="currentColor" strokeWidth="0.4" />
        <circle cx="75" cy="25" r="1" fill="#3b82f6" className="animate-pulse" />
        <circle cx="15" cy="85" r="1.2" fill="#22d3ee" />
        <circle cx="45" cy="85" r="0.8" fill="currentColor" />
        <circle cx="50" cy="115" r="1" fill="#22d3ee" />
        <circle cx="20" cy="115" r="1.2" fill="#3b82f6" />
        <circle cx="5" cy="130" r="1.2" fill="#22d3ee" />
      </svg>

      {/* Soft blurred floating light orbs */}
      <div className="absolute top-[20%] left-[10%] w-[120px] h-[120px] bg-blue-500/10 blur-[80px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[25%] right-[15%] w-[150px] h-[150px] bg-cyan-500/10 blur-[90px] rounded-full pointer-events-none z-0"></div>

      {/* Floating Micro-Particles / Glowing Circular Blue-Cyan Glow Particles */}
      <div className="absolute top-[8%] left-[12%] w-2 h-2 bg-cyan-400 rounded-full blur-[0.5px] animate-pulse pointer-events-none z-0 shadow-[0_0_10px_#38bdf8]"></div>
      <div className="absolute top-[15%] left-[28%] w-1.5 h-1.5 bg-blue-400 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_6px_#3b82f6]"></div>
      <div className="absolute top-[22%] left-[45%] w-2.5 h-2.5 bg-cyan-300 rounded-full blur-[1px] animate-pulse pointer-events-none z-0 shadow-[0_0_12px_#22d3ee]" style={{ animationDelay: '1.5s', animationDuration: '3s' }}></div>
      <div className="absolute top-[12%] left-[68%] w-1.5 h-1.5 bg-blue-400 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_6px_#3b82f6]"></div>
      <div className="absolute top-[25%] left-[85%] w-2 h-2 bg-cyan-400 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_8px_#38bdf8]"></div>
      <div className="absolute top-[6%] left-[93%] w-2.5 h-2.5 bg-blue-500 rounded-full blur-[1px] animate-pulse pointer-events-none z-0 shadow-[0_0_10px_#3b82f6]" style={{ animationDelay: '3s', animationDuration: '4s' }}></div>

      <div className="absolute top-[45%] left-[8%] w-2 h-2 bg-blue-400 rounded-full blur-[0.5px] animate-pulse pointer-events-none z-0 shadow-[0_0_8px_#60a5fa]" style={{ animationDelay: '2.5s', animationDuration: '3.5s' }}></div>
      <div className="absolute top-[35%] left-[22%] w-2 h-2 bg-cyan-400 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_8px_#22d3ee]"></div>
      <div className="absolute top-[52%] left-[38%] w-1.5 h-1.5 bg-blue-500 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_6px_#3b82f6]"></div>
      <div className="absolute top-[40%] left-[55%] w-2 h-2 bg-cyan-300 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_8px_#38bdf8]"></div>
      <div className="absolute top-[48%] left-[72%] w-2.5 h-2.5 bg-cyan-400 rounded-full blur-[1px] animate-pulse pointer-events-none z-0 shadow-[0_0_12px_#38bdf8]" style={{ animationDelay: '1s', animationDuration: '2.5s' }}></div>
      <div className="absolute top-[38%] left-[89%] w-1.5 h-1.5 bg-blue-400 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_6px_#3b82f6]"></div>

      <div className="absolute top-[75%] left-[15%] w-2 h-2 bg-cyan-400 rounded-full blur-[0.5px] animate-pulse pointer-events-none z-0 shadow-[0_0_10px_#22d3ee]" style={{ animationDelay: '0.5s', animationDuration: '2s' }}></div>
      <div className="absolute top-[65%] left-[32%] w-1.5 h-1.5 bg-blue-400 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_6px_#3b82f6]"></div>
      <div className="absolute top-[78%] left-[48%] w-2 h-2 bg-cyan-400 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_8px_#38bdf8]"></div>
      <div className="absolute top-[72%] left-[64%] w-2.5 h-2.5 bg-blue-500 rounded-full blur-[1px] animate-pulse pointer-events-none z-0 shadow-[0_0_12px_#3b82f6]" style={{ animationDelay: '2s', animationDuration: '4.5s' }}></div>
      <div className="absolute top-[62%] left-[78%] w-1.5 h-1.5 bg-cyan-300 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_6px_#22d3ee]"></div>
      <div className="absolute top-[78%] left-[92%] w-2 h-2 bg-blue-400 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_8px_#3b82f6]"></div>

      {/* Tiny white twinkle stars */}
      <div className="absolute top-[28%] left-[18%] w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-0 animate-pulse shadow-[0_0_6px_#ffffff]" style={{ animationDelay: '0.8s', animationDuration: '2s' }}></div>
      <div className="absolute top-[85%] left-[50%] w-1.5 h-1.5 bg-white rounded-full pointer-events-none z-0 animate-pulse shadow-[0_0_6px_#ffffff]" style={{ animationDelay: '2.2s', animationDuration: '2.5s' }}></div>
      <div className="absolute top-[48%] left-[30%] w-1 h-1 bg-white rounded-full pointer-events-none z-0 animate-pulse shadow-[0_0_4px_#ffffff]" style={{ animationDelay: '1.5s', animationDuration: '3s' }}></div>

      {/* Soft circular blue/cyan glow particles */}
      <div className="absolute top-[18%] left-[82%] w-2.5 h-2.5 bg-cyan-400 rounded-full blur-[0.5px] pointer-events-none z-0 animate-pulse shadow-[0_0_10px_#22d3ee]" style={{ animationDelay: '1.8s', animationDuration: '3.6s' }}></div>
      <div className="absolute top-[82%] left-[25%] w-2.5 h-2.5 bg-blue-400 rounded-full blur-[0.5px] pointer-events-none z-0 animate-pulse shadow-[0_0_10px_#3b82f6]" style={{ animationDelay: '1.2s' }}></div>
      <div className="absolute top-[80%] left-[75%] w-2.5 h-2.5 bg-cyan-400 rounded-full blur-[0.5px] pointer-events-none z-0 animate-pulse shadow-[0_0_10px_#22d3ee]" style={{ animationDelay: '0.3s', animationDuration: '3s' }}></div>

      <div className="absolute top-[30%] left-[3%] w-1.5 h-1.5 bg-blue-400 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_6px_#3b82f6]"></div>
      <div className="absolute top-[58%] left-[96%] w-2 h-2 bg-cyan-400 rounded-full blur-[0.5px] pointer-events-none z-0 animate-pulse shadow-[0_0_8px_#38bdf8]" style={{ animationDelay: '1.7s' }}></div>
      <div className="absolute top-[70%] left-[45%] w-2.5 h-2.5 bg-blue-300 rounded-full blur-[1px] pointer-events-none z-0 animate-pulse shadow-[0_0_10px_#60a5fa]" style={{ animationDelay: '2.7s' }}></div>
      <div className="absolute top-[42%] left-[84%] w-2 h-2 bg-cyan-400 rounded-full blur-[0.5px] pointer-events-none z-0 animate-pulse shadow-[0_0_6px_#38bdf8]" style={{ animationDelay: '0.6s', animationDuration: '2.5s' }}></div>
      <div className="absolute top-[52%] left-[18%] w-2 h-2 bg-blue-400 rounded-full blur-[0.5px] pointer-events-none z-0 animate-pulse shadow-[0_0_8px_#3b82f6]" style={{ animationDelay: '1.4s', animationDuration: '3.1s' }}></div>

      {/* Left-middle area sparkles */}
      <div className="absolute top-[58%] left-[5%] w-2 h-2 bg-cyan-400 rounded-full blur-[0.5px] animate-pulse pointer-events-none z-0 shadow-[0_0_8px_#38bdf8]" style={{ animationDelay: '0.9s' }}></div>
      <div className="absolute top-[64%] left-[2%] w-1.5 h-1.5 bg-blue-400 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_6px_#3b82f6]"></div>

      {/* Around center sparkles */}
      <div className="absolute top-[50%] left-[48%] w-2 h-2 bg-cyan-300 rounded-full blur-[0.5px] animate-pulse pointer-events-none z-0 shadow-[0_0_8px_#22d3ee]" style={{ animationDelay: '1.2s' }}></div>
      <div className="absolute top-[45%] left-[52%] w-1.5 h-1.5 bg-blue-400 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_6px_#3b82f6]"></div>

      {/* Near the right-side network lines */}
      <div className="absolute top-[28%] left-[90%] w-2 h-2 bg-cyan-400 rounded-full blur-[0.5px] animate-pulse pointer-events-none z-0 shadow-[0_0_8px_#38bdf8]" style={{ animationDelay: '2.1s' }}></div>
      <div className="absolute top-[32%] left-[94%] w-1.5 h-1.5 bg-blue-400 rounded-full blur-[0.5px] pointer-events-none z-0 shadow-[0_0_6px_#3b82f6]"></div>

      {/* Layered Lower Center Blue Glow Bloom and Cyan Bloom */}
      <div className="absolute bottom-[-5%] left-[25%] w-[450px] h-[250px] bg-blue-600/18 blur-[100px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[220px] bg-cyan-500/15 blur-[100px] rounded-full pointer-events-none z-0"></div>

      {/* SVG Bottom Constellation Mesh Wave */}
      <svg className="absolute bottom-0 right-0 w-full h-[320px] pointer-events-none z-0" viewBox="0 0 1000 200" preserveAspectRatio="none">
        {/* Connection Line Network (Cyan & Blue blend with peak filter glow) */}
        <path d="M 0,160 Q 150,90 300,150 T 600,110 T 900,140 T 1000,110" fill="none" stroke="#22d3ee" strokeWidth="1.4" opacity="0.85" filter="url(#cyan-peak-glow)" />
        <path d="M 0,130 Q 200,190 400,110 T 800,160 T 1000,120" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.85" filter="url(#cyan-peak-glow)" />
        <path d="M 0,140 Q 250,170 500,120 T 1000,130" fill="none" stroke="#3b82f6" strokeWidth="0.8" opacity="0.5" />
        <path d="M 0,150 Q 300,80 600,160 T 1000,140" fill="none" stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="4,4" opacity="0.6" />
        <path d="M 0,180 Q 200,130 400,170 T 800,130 T 1000,150" fill="none" stroke="#2563eb" strokeWidth="0.8" strokeDasharray="3,3" opacity="0.65" />

        {/* Intersecting network link paths */}
        <line x1="150" y1="125" x2="200" y2="150" stroke="#38bdf8" strokeWidth="0.5" opacity="0.7" />
        <line x1="200" y1="150" x2="300" y2="150" stroke="#3b82f6" strokeWidth="0.5" opacity="0.7" />
        <line x1="300" y1="150" x2="450" y2="135" stroke="#2563eb" strokeWidth="0.5" opacity="0.7" />
        <line x1="450" y1="135" x2="600" y2="110" stroke="#38bdf8" strokeWidth="0.5" opacity="0.7" />
        <line x1="600" y1="110" x2="700" y2="145" stroke="#3b82f6" strokeWidth="0.5" opacity="0.7" />
        <line x1="700" y1="145" x2="800" y2="130" stroke="#2563eb" strokeWidth="0.5" opacity="0.7" />
        <line x1="800" y1="130" x2="900" y2="140" stroke="#38bdf8" strokeWidth="0.5" opacity="0.7" />

        {/* Glowing Neon Vertices Nodes */}
        <circle cx="150" cy="125" r="3" fill="#38bdf8" className="animate-pulse" />
        <circle cx="200" cy="150" r="2" fill="#3b82f6" />
        <circle cx="300" cy="150" r="3.5" fill="#38bdf8" className="animate-pulse" />
        <circle cx="450" cy="135" r="2" fill="#2563eb" />
        <circle cx="600" cy="110" r="4.5" fill="#38bdf8" className="animate-pulse" />
        <circle cx="700" cy="145" r="2" fill="#3b82f6" />
        <circle cx="800" cy="130" r="3.5" fill="#2563eb" className="animate-pulse" />
        <circle cx="900" cy="140" r="2" fill="#38bdf8" />
        
        {/* Additional wave nodes */}
        <circle cx="500" cy="120" r="3" fill="#22d3ee" className="animate-pulse" />
        <circle cx="750" cy="130" r="2.5" fill="#3b82f6" />
        <circle cx="350" cy="135" r="3" fill="#22d3ee" className="animate-pulse" />
        <circle cx="850" cy="125" r="2.5" fill="#3b82f6" />

        {/* Filled Wavy mesh base gradients */}
        <path d="M 0,160 Q 150,90 300,150 T 600,110 T 900,140 T 1000,110 L 1000,200 L 0,200 Z" fill="url(#wave-mesh-gradient-cyan)" opacity="0.3" />
        <path d="M 0,140 Q 250,170 500,120 T 1000,130 L 1000,200 L 0,200 Z" fill="url(#wave-mesh-gradient-blue)" opacity="0.15" />
        
        <defs>
          <filter id="cyan-peak-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="wave-mesh-gradient-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wave-mesh-gradient-blue" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto max-h-screen relative z-10">
        {/* Soft blue content area atmospheric bloom overlays */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-transparent to-cyan-500/5 pointer-events-none z-0"></div>
        <div className="absolute top-[20%] left-[25%] w-[450px] h-[450px] bg-blue-500/8 blur-[130px] rounded-full pointer-events-none z-0"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[380px] h-[380px] bg-cyan-400/6 blur-[120px] rounded-full pointer-events-none z-0"></div>

        <div className="max-w-6xl mx-auto w-full relative z-10">
          {children}
        </div>
      </main>
    </div>
  );
};

function App() {
  const { token } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidates"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Candidates />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidates/:id"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <CandidateDetails />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pipeline"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Pipeline />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviews"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Interviews />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Tasks />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Reports />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Settings />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={["Admin"]}>
              <ProtectedLayout>
                <AdminUsers />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            token ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;