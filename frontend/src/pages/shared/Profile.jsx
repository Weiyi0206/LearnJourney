import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { CourseService, StudentService } from "@/lib/apiClient";
import {
    Mail, Shield, Calendar, BookOpen, Users, GitGraph,
    TrendingUp, ChevronRight, Loader2, GraduationCap
} from "lucide-react";

const THEMES = [
    { gradient: "from-blue-600 to-indigo-600", lightBg: "bg-blue-50 dark:bg-blue-950/30", iconColor: "text-blue-500", bar: "bg-blue-500" },
    { gradient: "from-emerald-600 to-teal-500", lightBg: "bg-emerald-50 dark:bg-emerald-950/30", iconColor: "text-emerald-500", bar: "bg-emerald-500" },
    { gradient: "from-violet-600 to-purple-500", lightBg: "bg-violet-50 dark:bg-violet-950/30", iconColor: "text-violet-500", bar: "bg-violet-500" },
    { gradient: "from-amber-600 to-orange-500", lightBg: "bg-amber-50 dark:bg-amber-950/30", iconColor: "text-amber-500", bar: "bg-amber-500" },
];

export default function Profile() {
    const { user, profile } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const userName = profile?.full_name || user?.user_metadata?.full_name || "User";
    const role = profile?.role || user?.user_metadata?.role || "user";
    const email = user?.email;
    const joinedDate = new Date(user?.created_at).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
    });

    useEffect(() => {
        const fetchCourses = async () => {
            if (!user?.id) return;
            try {
                if (role === "educator") {
                    const data = await CourseService.getEducatorCourses(user.id);
                    setCourses(data);
                } else {
                    const data = await StudentService.getEnrolledCourses(user.id);
                    setCourses(data);
                }
            } catch (err) {
                console.error("Failed to load courses for profile", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCourses();
    }, [user?.id, role]);

    if (!user) return <Navigate to="/login" replace />;

    // ─── Stats ───
    const totalCourses = courses.length;
    let stat1Label, stat1Value, stat2Label, stat2Value;

    if (role === "educator") {
        const totalStudents = courses.reduce((s, c) => s + (c.students_count || 0), 0);
        const totalNodes = courses.reduce((s, c) => s + (c.nodes_count || 0), 0);
        stat1Label = "Total Students";
        stat1Value = totalStudents;
        stat2Label = "Total Nodes";
        stat2Value = totalNodes;
    } else {
        const totalMastered = courses.reduce((s, c) => s + (c.progress?.mastered || 0), 0);
        const avgProg = totalCourses > 0
            ? Math.round(courses.reduce((s, c) => s + (c.progress?.percent || 0), 0) / totalCourses)
            : 0;
        stat1Label = "Nodes Mastered";
        stat1Value = totalMastered;
        stat2Label = "Avg Progress";
        stat2Value = `${avgProg}%`;
    }

    return (
        <div className="h-full overflow-auto">
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8 pb-32 relative">

                {/* ── Profile Header Card ── */}
                <div className="relative bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-[2.5rem] overflow-hidden shadow-xl">
                    {/* Gradient banner */}
                    <div className="h-28 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 relative">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
                    </div>

                    <div className="px-8 md:px-10 pb-8 -mt-14 relative z-10">
                        {/* Avatar */}
                        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 border-4 border-white dark:border-zinc-900 flex items-center justify-center shadow-xl mb-4">
                            <span className="text-3xl font-black text-white uppercase">
                                {userName.charAt(0)}
                            </span>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">
                                    {userName}
                                </h1>
                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/40">
                                        <Shield size={12} />
                                        {role}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 font-medium">
                                        <Mail size={14} /> {email}
                                    </span>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 dark:text-zinc-500">
                                <Calendar size={14} /> Joined {joinedDate}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Stats Bento Row ── */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-3xl p-6 shadow-md flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">
                            {role === "educator" ? "Courses Created" : "Enrolled Courses"}
                        </span>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">{totalCourses}</span>
                            <BookOpen size={20} className="text-indigo-500 mb-1.5" />
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-3xl p-6 shadow-md flex flex-col justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">{stat1Label}</span>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">{stat1Value}</span>
                            {role === "educator"
                                ? <Users size={20} className="text-emerald-500 mb-1.5" />
                                : <GraduationCap size={20} className="text-emerald-500 mb-1.5" />}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-3xl p-6 shadow-md flex flex-col justify-between col-span-2 md:col-span-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-2">{stat2Label}</span>
                        <div className="flex items-end gap-2">
                            <span className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">{stat2Value}</span>
                            {role === "educator"
                                ? <GitGraph size={20} className="text-violet-500 mb-1.5" />
                                : <TrendingUp size={20} className="text-violet-500 mb-1.5" />}
                        </div>
                    </div>
                </div>

                {/* ── Courses Section ── */}
                <div className="space-y-5">
                    <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-3">
                        <span className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-md">
                            {totalCourses}
                        </span>
                        {role === "educator" ? "Your Courses" : "Enrolled Courses"}
                    </h2>

                    {isLoading ? (
                        <div className="flex items-center justify-center py-16 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/60 dark:border-zinc-800">
                            <Loader2 size={28} className="animate-spin text-indigo-500" />
                        </div>
                    ) : totalCourses === 0 ? (
                        <div className="text-center py-16 bg-white/50 dark:bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-200 dark:border-zinc-800">
                            <BookOpen size={40} className="mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
                            <p className="text-zinc-500 font-medium">
                                {role === "educator" ? "You haven't created any courses yet." : "You haven't enrolled in any courses yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {courses.map((course, idx) => {
                                const theme = THEMES[idx % THEMES.length];

                                if (role === "educator") {
                                    return (
                                        <div
                                            key={course.id}
                                            onClick={() => navigate(`/courses/${course.id}`)}
                                            className="group bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative"
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-300`} />
                                            <div className="p-5 relative z-10">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className={`w-10 h-10 rounded-xl ${theme.lightBg} ${theme.iconColor} flex items-center justify-center shrink-0`}>
                                                        <BookOpen size={20} />
                                                    </div>
                                                    <span className={`text-xs font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg ${course.is_published
                                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                                        : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                                                        }`}>
                                                        {course.is_published ? "Published" : "Draft"}
                                                    </span>
                                                </div>
                                                <h3 className="font-bold text-lg text-zinc-900 dark:text-white line-clamp-1 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {course.title}
                                                </h3>
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-4">
                                                    {course.description || "No description"}
                                                </p>
                                                <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                                                    <div className="flex gap-4">
                                                        <span className="flex items-center gap-1"><Users size={13} /> {course.students_count || 0}</span>
                                                        <span className="flex items-center gap-1"><GitGraph size={13} /> {course.nodes_count || 0} nodes</span>
                                                    </div>
                                                    <ChevronRight size={16} className="text-zinc-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                            <div className={`h-1 w-full bg-gradient-to-r ${theme.gradient} opacity-30 group-hover:opacity-100 transition-opacity`} />
                                        </div>
                                    );
                                } else {
                                    // Student course card
                                    const prog = course.progress || { percent: 0, mastered: 0, total: 0, text: "0 / 0" };
                                    return (
                                        <div
                                            key={course.id}
                                            onClick={() => navigate(`/courses/${course.id}`)}
                                            className="group bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative"
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-300`} />
                                            <div className="p-5 relative z-10">
                                                <div className="flex items-start justify-between gap-3 mb-3">
                                                    <div className={`w-10 h-10 rounded-xl ${theme.lightBg} ${theme.iconColor} flex items-center justify-center shrink-0`}>
                                                        <BookOpen size={20} />
                                                    </div>
                                                    <span className={`text-xl font-black ${theme.iconColor}`}>{prog.percent}%</span>
                                                </div>
                                                <h3 className="font-bold text-lg text-zinc-900 dark:text-white line-clamp-1 mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                    {course.title}
                                                </h3>
                                                <p className="text-xs text-zinc-400 dark:text-zinc-500 font-medium mb-4">
                                                    by {course.educator || course.educator_name || "Community Educator"}
                                                </p>
                                                {/* Progress bar */}
                                                <div className="relative h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-2">
                                                    <div
                                                        className={`absolute top-0 left-0 h-full bg-gradient-to-r ${theme.gradient} rounded-full transition-all duration-700`}
                                                        style={{ width: `${prog.percent}%` }}
                                                    />
                                                </div>
                                                <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                                                    <span>{prog.text || `${prog.mastered} / ${prog.total} Nodes`}</span>
                                                    <ChevronRight size={16} className="text-zinc-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                                                </div>
                                            </div>
                                            <div className={`h-1 w-full bg-gradient-to-r ${theme.gradient} opacity-30 group-hover:opacity-100 transition-opacity`} />
                                        </div>
                                    );
                                }
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
