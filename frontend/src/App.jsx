import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";

import { TopNav } from "@/components/layout/TopNav";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

// Auth
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";

// Specific Educator Pages
import EducatorDashboard from "@/pages/educator/Dashboard";
import CourseCreator from "@/pages/educator/CourseCreator";

// Specific Student Pages
import StudentDashboard from "@/pages/student/Dashboard";
import Quizzes from "@/pages/student/Quizzes";
import Diagnostic from "@/pages/student/Diagnostic";

// Shared Course Pages
import CourseView from "@/pages/shared/CourseView";

const MainLayout = ({ children }) => {
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

// Simple index redirect component based on role
const IndexRedirect = () => {
  return (
    <ProtectedRoute>
      <RoleRedirect />
    </ProtectedRoute>
  );
};

const RoleRedirect = () => {
  const { user, profile } = useAuth();
  const role = profile?.role || user?.user_metadata?.role;

  if (role === 'educator') {
    return <Navigate to="/educator/dashboard" replace />;
  }
  return <Navigate to="/student/dashboard" replace />;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            <Route path="/" element={<IndexRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/educator/*" element={
              <ProtectedRoute allowedRole="educator">
                <MainLayout>
                  <Routes>
                    <Route path="dashboard" element={<EducatorDashboard />} />
                    <Route path="builder" element={<CourseCreator />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/student/*" element={
              <ProtectedRoute allowedRole="student">
                <MainLayout>
                  <Routes>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="diagnostic/:courseId" element={<Diagnostic />} />
                    <Route path="quizzes" element={<Quizzes />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            } />

            <Route path="/courses/*" element={
              <ProtectedRoute>
                <MainLayout>
                  <Routes>
                    <Route path=":courseId" element={<CourseView />} />
                  </Routes>
                </MainLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}