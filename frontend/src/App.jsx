import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";

import { TopNav } from "@/components/layout/TopNav";

// Auth
import Login from "@/pages/auth/Login";

// Specific Educator Pages
import EducatorDashboard from "@/pages/educator/Dashboard";
import CourseCreator from "@/pages/educator/CourseCreator";

// Specific Student Pages
import StudentDashboard from "@/pages/student/Dashboard";
import Quizzes from "@/pages/student/Quizzes";
import Diagnostic from "@/pages/student/Diagnostic";

// Shared Course Pages
import CourseView from "@/pages/shared/CourseView";

const AuthenticatedLayout = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen font-sans bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 overflow-hidden relative selection:bg-indigo-500/30">

      {/* Dynamic Background Elements for that Bento/Modern Feel */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[140px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

      {/* The Top Navigation Bar */}
      <div className="flex-none pt-4 pb-2 z-50">
        <TopNav />
      </div>

      {/* The dynamic content area, scrolls if needed internally */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative z-10">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />

            <Route path="/educator/*" element={
              <AuthenticatedLayout>
                <Routes>
                  <Route path="dashboard" element={<EducatorDashboard />} />
                  <Route path="builder" element={<CourseCreator />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </AuthenticatedLayout>
            } />

            <Route path="/student/*" element={
              <AuthenticatedLayout>
                <Routes>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="diagnostic/:courseId" element={<Diagnostic />} />
                  <Route path="quizzes" element={<Quizzes />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </AuthenticatedLayout>
            } />

            <Route path="/courses/*" element={
              <AuthenticatedLayout>
                <Routes>
                  <Route path=":courseId" element={<CourseView />} />
                </Routes>
              </AuthenticatedLayout>
            } />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}