import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import { Navbar } from "@/components/layout/Navbar";
import { AppSidebar } from "@/components/layout/AppSidebar";

// Auth
import Login from "@/pages/auth/Login";

// Educator
import EducatorDashboard from "@/pages/educator/Dashboard";
import CourseManager from "@/pages/educator/CourseManager";
import NodeManager from "@/pages/educator/NodeManager";
import CourseBuilder from "@/pages/educator/CourseBuilder";
import GraphEditor from "@/pages/educator/GraphEditor";

// Student
import StudentDashboard from "@/pages/student/Dashboard";
import LearningPath from "@/pages/student/LearningPath";
import CourseMaterial from "@/pages/student/CourseMaterial";
import Quizzes from "@/pages/student/Quizzes";

const AuthenticatedLayout = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden w-full font-sans bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black rounded-l-2xl shadow-2xl border-l border-t border-b border-zinc-200 dark:border-zinc-800 my-2 mr-2 overflow-hidden transition-all duration-300 relative group">
          <header className="h-16 flex items-center shrink-0 border-b px-4 border-zinc-100 dark:border-zinc-900 bg-white/50 dark:bg-black/50 backdrop-blur-md sticky top-0 z-10 transition-colors">
            <SidebarTrigger className="hover:bg-zinc-100 dark:hover:bg-zinc-800 p-2 rounded-lg transition-colors border shadow-sm border-zinc-200 dark:border-zinc-800" />
            <div className="ml-auto">
              <Navbar />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-zinc-50/30 dark:bg-zinc-950/30 w-full relative">
            <div className="absolute inset-0 max-w-[1400px] mx-auto w-full pb-12">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
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
                  <Route path="courses/:courseId" element={<CourseManager />} />
                  <Route path="courses/:courseId/nodes/:nodeId" element={<NodeManager />} />
                  <Route path="builder" element={<CourseBuilder />} />
                  <Route path="graph" element={<GraphEditor />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </AuthenticatedLayout>
            } />

            <Route path="/student/*" element={
              <AuthenticatedLayout>
                <Routes>
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="path" element={<LearningPath />} />
                  <Route path="material" element={<CourseMaterial />} />
                  <Route path="quizzes" element={<Quizzes />} />
                  <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
              </AuthenticatedLayout>
            } />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}