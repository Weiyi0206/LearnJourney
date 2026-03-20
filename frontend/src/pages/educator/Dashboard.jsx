import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, GitGraph, Settings2, BarChart3, TrendingUp, Calendar, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

export default function EducatorDashboard() {
    const navigate = useNavigate();

    // Integrated Courses List Data
    const courses = [
        {
            id: "course_001",
            title: "Introduction to Python Programming",
            status: "Published",
            students: 142,
            nodes: 14,
            avgMastery: 68,
            lastUpdated: "2 Days Ago",
            colorClass: "from-blue-500/10 to-indigo-500/10",
            iconColor: "text-blue-500",
            bgIconColor: "bg-blue-100 dark:bg-blue-900/30",
        },
        {
            id: "course_002",
            title: "Advanced Data Structures & Algorithms",
            status: "Published",
            students: 84,
            nodes: 26,
            avgMastery: 42,
            lastUpdated: "1 Week Ago",
            colorClass: "from-emerald-500/10 to-teal-500/10",
            iconColor: "text-emerald-500",
            bgIconColor: "bg-emerald-100 dark:bg-emerald-900/30",
        },
        {
            id: "course_003",
            title: "Machine Learning Foundations",
            status: "Draft",
            students: 0,
            nodes: 31,
            avgMastery: 0,
            lastUpdated: "4 Hours Ago",
            colorClass: "from-amber-500/10 to-orange-500/10",
            iconColor: "text-amber-500",
            bgIconColor: "bg-amber-100 dark:bg-amber-900/30",
        }
    ];

    return (
        <div className="p-4 md:p-8 h-full overflow-auto max-w-7xl mx-auto space-y-8">

            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Educator Hub</h1>
                    <p className="text-zinc-500 mt-1 font-medium">Welcome back. Manage your active and drafted curricula.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input placeholder="Search courses..." className="pl-10 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 shadow-sm rounded-xl py-5" />
                </div>
            </div>

            {/* High-Level Overview Stats (Simplified) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all hover:shadow-md rounded-2xl flex items-center p-6 gap-6">
                    <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center">
                        <BookOpen size={28} />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Active Curricula</div>
                        <div className="text-4xl font-extrabold mt-1">3</div>
                    </div>
                </Card>

                <Card className="border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950 transition-all hover:shadow-md rounded-2xl flex items-center p-6 gap-6">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 flex items-center justify-center">
                        <Users size={28} />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-zinc-500 uppercase tracking-widest">Total Students</div>
                        <div className="text-4xl font-extrabold mt-1">226</div>
                    </div>
                </Card>

                {/* Hero Tile spanning side action */}
                <Card className="col-span-1 border-none bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl overflow-hidden relative shadow-lg hover:shadow-xl transition-all cursor-pointer group" onClick={() => navigate('/educator/builder')}>
                    <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
                        <GitGraph size={120} />
                    </div>
                    <CardContent className="p-6 relative z-10 h-full flex flex-col justify-center">
                        <h3 className="text-2xl font-black tracking-tight mb-2">Design New Curriculum</h3>
                        <p className="text-indigo-100 font-medium text-sm leading-relaxed max-w-[200px]">Use the AI Curriculum Architect to generate a new graph.</p>
                    </CardContent>
                </Card>
            </div>

            {/* Consolidated Courses Grid */}
            <div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <BarChart3 size={20} className="text-zinc-400" /> My Courses
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <Card key={course.id} className="flex flex-col border-zinc-200/60 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden relative group rounded-2xl">
                            <div className={`absolute inset-0 bg-gradient-to-br ${course.colorClass} opacity-50 pointer-events-none`} />

                            <CardHeader className="relative z-10 pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${course.bgIconColor} ${course.iconColor} shadow-inner`}>
                                        <BookOpen size={24} />
                                    </div>
                                    <Badge variant={course.status === "Published" ? "default" : "secondary"} className={
                                        course.status === "Published"
                                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 px-3 py-1 font-bold dark:bg-emerald-900/40 dark:text-emerald-400"
                                            : "px-3 py-1 font-bold border-zinc-300 dark:border-zinc-700"
                                    }>
                                        {course.status}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl font-extrabold leading-tight">{course.title}</CardTitle>
                                <CardDescription className="font-medium mt-1 flex items-center gap-1">
                                    <Calendar size={14} /> Edited {course.lastUpdated}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="relative z-10 grid grid-cols-2 gap-2 py-4 border-y border-zinc-100 dark:border-zinc-900/50 bg-white/50 dark:bg-black/20 mt-auto">
                                <div className="flex flex-col items-center justify-center text-center p-2 border-r border-zinc-100 dark:border-zinc-900/50">
                                    <Users size={18} className="text-zinc-400 mb-1" />
                                    <span className="font-bold text-lg leading-none">{course.students}</span>
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Students</span>
                                </div>
                                <div className="flex flex-col items-center justify-center text-center p-2">
                                    <GitGraph size={18} className="text-zinc-400 mb-1" />
                                    <span className="font-bold text-lg leading-none">{course.nodes}</span>
                                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Nodes</span>
                                </div>
                            </CardContent>

                            <CardFooter className="relative z-10 pt-4 pb-4 px-4 bg-zinc-50 dark:bg-zinc-950/80">
                                <Button
                                    className="w-full font-bold shadow-sm gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                                    onClick={() => navigate(`/courses/${course.id}`)}
                                >
                                    <Settings2 size={16} /> Manage Course
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>

        </div>
    );
}
