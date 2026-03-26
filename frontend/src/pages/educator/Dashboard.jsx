import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, GitGraph, Settings2, BarChart3, TrendingUp, Calendar, Search, Sparkles, Plus, ArrowUpRight, Clock, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CourseService } from "@/lib/apiClient";

const THEMES = [
    { 
        id: 'blue',
        gradient: "from-blue-600 to-indigo-600", 
        glow: "shadow-blue-500/10",
        lightBg: "bg-blue-50/50 dark:bg-blue-900/10", 
        iconColor: "text-blue-500",
        border: "border-blue-100 dark:border-blue-900/30",
        ball: "bg-blue-500"
    },
    { 
        id: 'emerald',
        gradient: "from-emerald-600 to-teal-500", 
        glow: "shadow-emerald-500/10",
        lightBg: "bg-emerald-50/50 dark:bg-emerald-900/10", 
        iconColor: "text-emerald-500",
        border: "border-emerald-100 dark:border-emerald-900/30",
        ball: "bg-emerald-500"
    },
    { 
        id: 'violet',
        gradient: "from-violet-600 to-purple-500", 
        glow: "shadow-violet-500/10",
        lightBg: "bg-violet-50/50 dark:bg-violet-900/10", 
        iconColor: "text-violet-500",
        border: "border-violet-100 dark:border-violet-900/30",
        ball: "bg-violet-500"
    },
    { 
        id: 'amber',
        gradient: "from-amber-600 to-orange-500", 
        glow: "shadow-amber-500/10",
        lightBg: "bg-amber-50/50 dark:bg-amber-900/10", 
        iconColor: "text-amber-500",
        border: "border-amber-100 dark:border-amber-900/30",
        ball: "bg-amber-500"
    },
];

export default function EducatorDashboard() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();

    const [courses, setCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    const userName = (profile?.full_name || user?.user_metadata?.full_name || "Educator").split(' ')[0];

    useEffect(() => {
        const fetchCourses = async () => {
            if (!user?.id) return;
            try {
                const data = await CourseService.getEducatorCourses(user.id);
                const mappedCourses = data.map((c, index) => {
                    const theme = THEMES[index % THEMES.length];
                    return {
                        id: c.id,
                        title: c.title,
                        description: c.description || "No description provided.",
                        status: c.is_published ? "Published" : "Draft",
                        students: c.students_count || 0,
                        nodes: c.nodes_count || 0,
                        avgMastery: c.avg_mastery || 0,
                        lastUpdated: new Date(c.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
                        theme
                    };
                });
                setCourses(mappedCourses);
            } catch (err) {
                console.error("Failed to load courses", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchCourses();
    }, [user]);

    const filteredCourses = courses.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalStudents = courses.reduce((sum, c) => sum + (c.students || 0), 0);
    const avgGlobalMastery = courses.length > 0 
        ? Math.round(courses.reduce((sum, c) => sum + (c.avgMastery || 0), 0) / courses.length) 
        : 0;

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 flex items-center justify-center">
                        <GitGraph size={32} className="text-indigo-500" />
                    </div>
                    <p className="font-black tracking-[0.2em] uppercase text-[10px] text-zinc-400">Initializing Workspace</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full overflow-auto bg-zinc-50 dark:bg-zinc-950 selection:bg-indigo-500/30">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-12 pb-32 relative">
                
                {/* Visual Flair Orbs */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/5 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                {/* HEADER SECTION */}
                <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em]">
                            <Sparkles size={12} /> Educator Dashboard
                        </div>
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-zinc-900 dark:text-white leading-[0.9]">
                            Hello, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">{userName}.</span>
                        </h1>
                        <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg max-w-xl">
                            Ready to architect your next knowledge journey?
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                         <div className="relative w-full md:w-80 group">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
                            <Input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Filter your paths..." 
                                className="pl-11 h-12 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm focus-visible:ring-indigo-500/50 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* STATS & QUICK ACTIONS BENTO */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6">
                    {/* Main Stats Card */}
                    <div className="md:col-span-2 relative group items-center bg-white dark:bg-zinc-900 overflow-hidden border border-zinc-200/60 dark:border-zinc-800 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl shadow-indigo-500/5 min-h-[220px]">
                        {/* Mesh background effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-20 -mt-20 group-hover:bg-indigo-500/10 transition-colors duration-700" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] -ml-20 -mb-20" />
                        
                        <div className="relative z-10 flex w-full justify-between items-start">
                            <span className="text-[10px] font-black tracking-[0.2em] text-zinc-400 uppercase">Impact Overview</span>
                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-500">
                                <BarChart3 size={20} />
                            </div>
                        </div>
                        <div className="relative z-10 flex w-full items-end gap-12">
                            <div>
                                <div className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">{totalStudents}</div>
                                <div className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                                    <Users size={12} /> Total Students
                                </div>
                            </div>
                            <div>
                                <div className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">{avgGlobalMastery}%</div>
                                <div className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                                    <TrendingUp size={12} /> Avg. Mastery
                                </div>
                            </div>
                            <div>
                                <div className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white">{courses.length}</div>
                                <div className="text-xs font-bold text-zinc-500 flex items-center gap-1">
                                    <BookOpen size={12} /> Curricula
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Create New Card (Action) - Vibrant Vibrant Gradient */}
                    <div 
                        onClick={() => navigate('/educator/builder')}
                        className="md:col-span-2 group bg-gradient-to-br from-indigo-600 via-purple-600 to-rose-500 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl shadow-indigo-500/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98] cursor-pointer relative overflow-hidden"
                    >
                        {/* Decorative dynamic background elements */}
                        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 blur-[60px] rounded-full translate-x-12 -translate-y-12 transition-transform group-hover:scale-150 duration-700" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-black/10 blur-[40px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                        
                        <div className="relative z-10 flex justify-between items-start">
                            <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-md text-white border border-white/20">
                                <Plus size={24} strokeWidth={3} />
                            </div>
                            <div className="p-2 rounded-full border border-white/30 text-white group-hover:bg-white group-hover:text-indigo-600 transition-all duration-500">
                                <ArrowUpRight size={16} />
                            </div>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-4xl font-black tracking-tight text-white mb-1 drop-shadow-sm">Architect New</h3>
                            <p className="text-indigo-50/90 font-bold text-base">Deploy AI to frame a new curriculum graph.</p>
                        </div>
                    </div>
                </div>

                {/* PROJECTS GRID */}
                <div className="relative z-10 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <span className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md italic">
                                {filteredCourses.length}
                            </span>
                            Active Projects
                        </h2>
                    </div>

                    {filteredCourses.length === 0 ? (
                        <div className="py-20 text-center bg-white/50 dark:bg-zinc-900/30 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800">
                             <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                                <Settings2 size={24} className="text-zinc-400" />
                             </div>
                             <h3 className="text-xl font-bold text-zinc-900 dark:text-white">No projects found.</h3>
                             <p className="text-zinc-500 text-sm">Try adjusting your search or create a new curriculum.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredCourses.map((course) => (
                                <div 
                                    key={course.id}
                                    onClick={() => navigate(`/courses/${course.id}`)}
                                    className="group relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 rounded-[2rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                                >
                                    {/* Subtle background color wash per theme */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${course.theme.gradient} opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500`} />
                                    
                                    {/* Floating theme orb */}
                                    <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-[40px] ${course.theme.ball} opacity-0 group-hover:opacity-10 transition-all duration-500 pointer-events-none`} />
                                    
                                    <div className="p-8 flex flex-col h-full flex-grow space-y-6 relative z-10">
                                        <div className="flex justify-between items-start">
                                            <div className={`w-14 h-14 rounded-2xl ${course.theme.lightBg} ${course.theme.iconColor} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform`}>
                                                <BookOpen size={26} />
                                            </div>
                                            <Badge className={`rounded-lg px-3 py-1.5 font-black text-xs uppercase tracking-widest border-0 ${
                                                course.status === "Published" 
                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" 
                                                : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800/80 dark:text-zinc-400"
                                            }`}>
                                                {course.status}
                                            </Badge>
                                        </div>

                                        <div className="flex-grow space-y-2">
                                            <h3 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {course.title}
                                            </h3>
                                            <p className="text-zinc-500 dark:text-zinc-400 text-base md:text-lg font-medium line-clamp-2 leading-relaxed">
                                                {course.description}
                                            </p>
                                        </div>

                                        <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 grid grid-cols-2 gap-6">
                                            <div className="space-y-1">
                                                <div className="text-sm md:text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                                    <Users size={16} className="text-zinc-400" /> {course.students} 
                                                </div>
                                                <span className="text-[11px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest">Learners</span>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-sm md:text-base font-black text-zinc-900 dark:text-white flex items-center gap-2">
                                                    <GitGraph size={16} className="text-zinc-400" /> {course.nodes}
                                                </div>
                                                <span className="text-[11px] md:text-xs font-bold text-zinc-400 uppercase tracking-widest">Nodes</span>
                                            </div>
                                        </div>

                                        <div className="pt-6 flex items-center justify-between text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                                            <div className="flex items-center gap-2 text-xs md:text-sm font-bold">
                                                <Clock size={14} /> {course.lastUpdated}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs md:text-sm font-black uppercase tracking-[0.15em] text-indigo-500 group-hover:gap-2.5 transition-all">
                                                Configure <ChevronRight size={16} />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Bottom colored bar */}
                                    <div className={`h-1.5 w-full bg-gradient-to-r ${course.theme.gradient} opacity-30 group-hover:opacity-100 transition-opacity`} />
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
