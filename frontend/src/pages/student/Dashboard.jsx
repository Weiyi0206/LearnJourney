import React, { useState, useEffect } from "react";
import { StudentService } from "@/lib/apiClient";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Compass, CheckCircle2, ChevronRight, Target, Zap, Rocket, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();

    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAll = async () => {
        if (!user?.id) return;
        try {
            setIsLoading(true);
            const enrolledData = await StudentService.getEnrolledCourses(user.id);

            const colors = [
                {
                    gradient: "from-blue-600 to-indigo-600",
                    shadow: "shadow-blue-500/20",
                    lightBg: "bg-blue-50",
                    darkBg: "dark:bg-blue-950/30",
                    textIcon: "text-blue-500"
                },
                {
                    gradient: "from-emerald-600 to-teal-500",
                    shadow: "shadow-emerald-500/20",
                    lightBg: "bg-emerald-50",
                    darkBg: "dark:bg-emerald-950/30",
                    textIcon: "text-emerald-500"
                },
                {
                    gradient: "from-amber-600 to-orange-500",
                    shadow: "shadow-amber-500/20",
                    lightBg: "bg-amber-50",
                    darkBg: "dark:bg-amber-950/30",
                    textIcon: "text-amber-500"
                },
                {
                    gradient: "from-purple-600 to-pink-500",
                    shadow: "shadow-purple-500/20",
                    lightBg: "bg-purple-50",
                    darkBg: "dark:bg-purple-950/30",
                    textIcon: "text-purple-500"
                }
            ];

            const mappedCourses = enrolledData.map((c, idx) => ({
                ...c,
                educator: c.educator_name || c.educator || "Community Educator",
                theme: colors[idx % colors.length]
            }));

            setEnrolledCourses(mappedCourses);
        } catch (err) {
            console.error("Failed to load enrolled courses:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [user?.id]);

    const handleResume = (courseId) => {
        navigate(`/courses/${courseId}`);
    };

    // Aggregate Stats
    const totalMastered = enrolledCourses.reduce((acc, c) => acc + (c.progress?.mastered || 0), 0);
    const overallProgress = enrolledCourses.length > 0
        ? Math.round(enrolledCourses.reduce((acc, c) => acc + (c.progress?.percent || 0), 0) / enrolledCourses.length)
        : 0;

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse duration-1000">
                    <Rocket size={48} className="text-indigo-400 opacity-50" />
                    <p className="font-bold tracking-widest uppercase text-xs text-zinc-400">Loading Journey</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 md:pt-12 h-full overflow-auto max-w-7xl mx-auto space-y-12 pb-32">

            {/* High-Impact Hero Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
                <div className="space-y-2">
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 leading-tight">
                        Welcome back,<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                            {((profile?.full_name || user?.user_metadata?.full_name || "Student").split(' ')[0])}.
                        </span>
                    </h1>
                    <p className="text-zinc-500 font-medium text-lg md:text-xl max-w-xl leading-relaxed mix-blend-multiply dark:mix-blend-screen">
                        Pick up right where you left off. Dive into your active curricula and keep building your mastery.
                    </p>
                </div>

                <div className="flex gap-4 shrink-0">
                    <div className="flex flex-col items-start bg-white dark:bg-zinc-900/80 backdrop-blur-md p-5 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none min-w-[140px]">
                        <div className="flex items-center gap-2 text-indigo-500 mb-1">
                            <Target size={18} /> <span className="text-xs font-black uppercase tracking-widest">Mastered</span>
                        </div>
                        <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{totalMastered} Nodes</span>
                    </div>
                    <div className="flex flex-col items-start bg-white dark:bg-zinc-900/80 backdrop-blur-md p-5 rounded-3xl border border-zinc-200/50 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none min-w-[140px]">
                        <div className="flex items-center gap-2 text-emerald-500 mb-1">
                            <Zap size={18} /> <span className="text-xs font-black uppercase tracking-widest">Avg Growth</span>
                        </div>
                        <span className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">{overallProgress}%</span>
                    </div>
                </div>
            </div>

            {/* Empty State vs Grid */}
            <div className="relative z-10 w-full">
                {enrolledCourses.length === 0 ? (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 rounded-[3rem] p-12 md:p-20 text-center border border-indigo-100/50 dark:border-indigo-900/30 flex flex-col items-center justify-center min-h-[40vh] shadow-2xl shadow-indigo-500/5">
                        <Compass size={64} className="text-indigo-400 mb-6 drop-shadow-md" />
                        <h3 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight mb-3">Your Journey Awaits</h3>
                        <p className="text-zinc-500 text-lg font-medium max-w-md mx-auto mb-8">
                            You haven't started any curricula yet. Head over to the Course Hub to discover your first learning path.
                        </p>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-14 px-8 rounded-2xl shadow-xl shadow-indigo-500/20 text-lg transition-transform active:scale-95"
                            onClick={() => navigate('/student/hub')}
                        >
                            Explore Course Hub <ChevronRight size={20} className="ml-2" />
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <span className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md">
                                    {enrolledCourses.length}
                                </span>
                                Active Curricula
                            </h2>
                            <Button variant="ghost" className="text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl" onClick={() => navigate('/student/hub')}>
                                Discover More <ArrowRight size={16} className="ml-2" />
                            </Button>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                            {enrolledCourses.map((course, idx) => {
                                const prog = course.progress || { percent: 0, currentFocus: "Getting Started", text: "0 / 0 Nodes" };
                                const isFinished = prog.percent === 100;

                                return (
                                    <div
                                        key={course.id}
                                        onClick={() => handleResume(course.id)}
                                        className={`group relative flex flex-col rounded-[2.5rem] overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800 shadow-xl shadow-zinc-200/40 dark:shadow-none hover:-translate-y-2 hover:shadow-2xl transition-all duration-500 cursor-pointer ${idx === 0 ? 'md:col-span-2 lg:col-span-2' : 'col-span-1'}`}
                                    >
                                        {/* Background Dynamic Gradients */}
                                        <div className={`absolute inset-0 bg-gradient-to-br ${course.theme.gradient} opacity-[0.03] dark:opacity-[0.05] group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none`} />

                                        {/* Decorative Blur Orb */}
                                        <div className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${course.theme.gradient} blur-3xl opacity-20 pointer-events-none group-hover:scale-150 transition-transform duration-700 ease-out`} />

                                        <div className="p-8 md:p-10 flex-grow relative z-10 flex flex-col justify-between h-full">

                                            {/* Top Metadata */}
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="space-y-1">
                                                        <h3 className={`font-black tracking-tight leading-none ${idx === 0 ? 'text-3xl md:text-4xl lg:text-5xl' : 'text-2xl md:text-3xl'}`}>
                                                            {course.title}
                                                        </h3>
                                                        <p className="font-bold text-zinc-400 dark:text-zinc-500 tracking-wide uppercase text-xs">
                                                            Led by {course.educator}
                                                        </p>
                                                    </div>

                                                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center shadow-lg ${course.theme.lightBg} ${course.theme.darkBg} ${course.theme.textIcon} border border-white dark:border-zinc-800`}>
                                                        {isFinished ? <CheckCircle2 size={28} /> : <Compass size={28} />}
                                                    </div>
                                                </div>

                                                <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed line-clamp-2 md:line-clamp-3">
                                                    {course.description || "Continue your mastery journey through this curriculum."}
                                                </p>
                                            </div>

                                            {/* Progress / CTA Area */}
                                            <div className="mt-12 pt-6 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col gap-4">
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block mb-1">Current Focus</span>
                                                        <span className="font-bold text-zinc-900 dark:text-zinc-100 line-clamp-1">{prog.currentFocus}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className={`text-2xl font-black ${course.theme.textIcon}`}>{prog.percent}%</span>
                                                    </div>
                                                </div>
                                                <div className="relative h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`absolute top-0 left-0 h-full bg-gradient-to-r ${course.theme.gradient} rounded-full`}
                                                        style={{ width: `${prog.percent}%` }}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-xs font-bold text-zinc-500">{prog.text}</span>
                                                    <div className={`p-2 rounded-full bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 group-hover:translate-x-1 group-hover:scale-110 transition-all duration-300 shadow-md`}>
                                                        <Play size={14} fill="currentColor" className="ml-0.5" />
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
