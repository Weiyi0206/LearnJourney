import React, { useState, useEffect } from "react";
import { CourseService, StudentService } from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
    Globe, BookOpen, Search, Loader2, Sparkles, Network,
    ChevronRight, Eye, GraduationCap, Filter, X
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const ACCENT_PALETTE = [
    { border: "border-l-violet-500", dot: "bg-violet-500", text: "text-violet-500", glow: "shadow-violet-500/10", light: "bg-violet-50 dark:bg-violet-950/20", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" },
    { border: "border-l-cyan-500",   dot: "bg-cyan-500",   text: "text-cyan-500",   glow: "shadow-cyan-500/10",   light: "bg-cyan-50 dark:bg-cyan-950/20",   badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300"   },
    { border: "border-l-rose-500",   dot: "bg-rose-500",   text: "text-rose-500",   glow: "shadow-rose-500/10",   light: "bg-rose-50 dark:bg-rose-950/20",   badge: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"   },
    { border: "border-l-amber-500",  dot: "bg-amber-500",  text: "text-amber-500",  glow: "shadow-amber-500/10",  light: "bg-amber-50 dark:bg-amber-950/20",  badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"  },
    { border: "border-l-emerald-500",dot: "bg-emerald-500",text: "text-emerald-500",glow: "shadow-emerald-500/10",light: "bg-emerald-50 dark:bg-emerald-950/20",badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"},
];

function SpotlightCard({ course, onNavigate, isEducator }) {
    const accent = course.accent;
    return (
        <div
            onClick={() => onNavigate(course.id)}
            className="group relative w-full overflow-hidden rounded-[2.5rem] bg-zinc-900 dark:bg-zinc-950 border border-zinc-800 cursor-pointer shadow-2xl hover:shadow-3xl transition-all duration-700 hover:-translate-y-1"
        >
            {/* Animated noise gradient bg */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-zinc-800/80 via-zinc-900 to-black opacity-90 z-0" />
            <div className={`absolute top-0 left-0 w-72 h-72 rounded-full blur-[100px] opacity-20 ${accent.dot} z-0 pointer-events-none group-hover:opacity-30 transition-opacity duration-700`} style={{background: 'currentColor'}} />
            <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-10 bg-white z-0 pointer-events-none" />

            <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row gap-8 md:gap-12 items-start md:items-end">
                <div className="flex-1 space-y-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                            <Sparkles size={10} className="text-yellow-400" /> Spotlight
                        </span>
                        <span className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full ${accent.badge}`}>
                            <Globe size={9} /> Public
                        </span>
                    </div>
                    <div>
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-none mb-3">
                            {course.title}
                        </h2>
                        <p className={`text-sm font-bold uppercase tracking-widest ${accent.text} mb-4`}>
                            by {course.educator}
                        </p>
                        <p className="text-zinc-400 font-medium leading-relaxed max-w-xl text-base line-clamp-2">
                            {course.description || "Explore this curriculum and master new skills at your own pace."}
                        </p>
                    </div>
                </div>

                <div className="shrink-0 flex flex-col gap-4 items-start md:items-end">
                    <Button
                        className={`h-14 px-8 rounded-2xl font-extrabold text-base shadow-xl gap-2 bg-white text-zinc-900 hover:bg-zinc-100 hover:scale-105 active:scale-95 transition-all duration-300`}
                    >
                        {isEducator ? "Preview Course" : "Start Learning"}
                        <ChevronRight size={18} />
                    </Button>
                </div>
            </div>

            {/* Bottom accent line */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 ${accent.dot}`} />
        </div>
    );
}

function CourseRow({ course, onNavigate, isEducator }) {
    const accent = course.accent;
    return (
        <div
            onClick={() => onNavigate(course.id)}
            className={`group relative flex items-start gap-5 p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 border-l-4 ${accent.border} shadow-sm hover:shadow-lg ${accent.glow} cursor-pointer transition-all duration-300`}
        >
            {/* Accent dot */}
            <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${accent.light}`}>
                <BookOpen size={18} className={accent.text} />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-50 truncate">
                        {course.title}
                    </h3>
                </div>
                <p className={`text-xs font-bold uppercase tracking-widest ${accent.text} mb-2`}>
                    {course.educator}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium line-clamp-1">
                    {course.description || "No description provided."}
                </p>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-2 ml-2">
                <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${accent.badge}`}>Public</span>
                <span className={`flex items-center gap-1 font-black text-xs ${accent.text} group-hover:translate-x-0.5 transition-transform duration-300`}>
                    {isEducator ? <Eye size={12} /> : <Network size={12} />}
                    {isEducator ? "View" : "Enroll"}
                </span>
            </div>
        </div>
    );
}

export default function CourseHub() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [allCourses, setAllCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const userRole = profile?.role || user?.user_metadata?.role || "student";
    const isEducator = userRole === "educator";

    useEffect(() => {
        if (!user?.id) return;
        (async () => {
            setIsLoading(true);
            try {
                const available = await CourseService.getAllCourses();

                let enrolledSet = new Set();
                if (!isEducator) {
                    try {
                        const enrolled = await StudentService.getEnrolledCourses(user.id);
                        enrolledSet = new Set(enrolled.map(c => c.id));
                    } catch (_) {}
                }

                // Filter out:
                // 1. Educator's own courses if they are an educator
                // 2. Enrolled courses if they are a student
                const filtered = available.filter(c => {
                    if (isEducator) return c.educator_id !== user.id;
                    return !enrolledSet.has(c.id);
                });
                const mapped = filtered.map((c, i) => ({
                    ...c,
                    educator: c.educator_name || c.educator || "Community Educator",
                    accent: ACCENT_PALETTE[i % ACCENT_PALETTE.length],
                }));
                setAllCourses(mapped);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        })();
    }, [user?.id]);

    const handleNavigate = (id) => navigate(`/courses/${id}`);

    const displayed = allCourses.filter(c =>
        !searchQuery ||
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.educator?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const spotlight = displayed[0] || null;
    const rest = displayed.slice(1);

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 size={40} className="text-violet-400 animate-spin" />
                    <p className="font-black tracking-widest uppercase text-xs text-zinc-400">Loading the Hub…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto">
            <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 pb-32 space-y-4">

                {/* Masthead */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-400">
                                {isEducator ? "Educator View — Browse Only" : "Open Enrollment"}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
                            Course Hub
                        </h1>
                        <p className="text-zinc-500 font-medium mt-1 text-base">
                            {allCourses.length} public {allCourses.length === 1 ? "course" : "courses"} available
                        </p>
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-72">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search courses..."
                            className="w-full pl-9 pr-9 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 shadow-sm transition-all"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-zinc-200 dark:via-zinc-800 to-transparent" />

                {/* Empty State */}
                {displayed.length === 0 && (
                    <div className="py-24 flex flex-col items-center text-center gap-5">
                        <div className="w-20 h-20 rounded-3xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                            <GraduationCap size={36} className="text-zinc-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-zinc-800 dark:text-zinc-200 mb-1">
                                {searchQuery ? `No results for "${searchQuery}"` : "Nothing here yet"}
                            </h3>
                            <p className="text-zinc-500 font-medium">
                                {searchQuery ? "Try adjusting your search." : "No public courses are available right now."}
                            </p>
                        </div>
                        {searchQuery && (
                            <Button variant="outline" className="rounded-xl font-bold" onClick={() => setSearchQuery("")}>
                                Clear Search
                            </Button>
                        )}
                    </div>
                )}

                {/* Spotlight Card */}
                {spotlight && (
                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Sparkles size={14} className="text-yellow-500" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Editor's Pick</span>
                        </div>
                        <SpotlightCard course={spotlight} onNavigate={handleNavigate} isEducator={isEducator} />
                    </section>
                )}

                {/* Rest of the courses — editorial list */}
                {rest.length > 0 && (
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Filter size={14} className="text-zinc-400" />
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">
                                    All Courses · {rest.length} more
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            {rest.map(course => (
                                <CourseRow key={course.id} course={course} onNavigate={handleNavigate} isEducator={isEducator} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    );
}
