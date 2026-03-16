import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, GitGraph, Search, BookOpen, Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

export default function CourseList() {
    const navigate = useNavigate();

    // Mock data for educator's courses
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
        <div className="p-4 md:p-8 h-full overflow-auto max-w-7xl mx-auto">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-zinc-100 text-zinc-900 rounded-xl dark:bg-zinc-900 dark:text-zinc-100">
                            <BookOpen size={24} />
                        </div>
                        My Courses
                    </h1>
                    <p className="text-zinc-500 mt-2 font-medium">Manage your active and drafted curricula.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <Input placeholder="Search courses..." className="pl-10 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 shadow-sm rounded-xl py-5" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <Card key={course.id} className="flex flex-col border-zinc-200/60 dark:border-zinc-800 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 overflow-hidden relative group">
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
                            <CardDescription className="font-medium mt-1">Last edited {course.lastUpdated}</CardDescription>
                        </CardHeader>

                        <CardContent className="relative z-10 grid grid-cols-3 gap-2 py-4 border-y border-zinc-100 dark:border-zinc-900/50 bg-white/50 dark:bg-black/20 mt-auto">
                            <div className="flex flex-col items-center justify-center text-center p-2">
                                <Users size={18} className="text-zinc-400 mb-1" />
                                <span className="font-bold text-lg leading-none">{course.students}</span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Students</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center p-2 border-x border-zinc-100 dark:border-zinc-900/50">
                                <GitGraph size={18} className="text-zinc-400 mb-1" />
                                <span className="font-bold text-lg leading-none">{course.nodes}</span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Nodes</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center p-2">
                                <span className={`font-black text-lg leading-none ${course.avgMastery > 50 ? 'text-emerald-600' : 'text-amber-500'}`}>{course.avgMastery}%</span>
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1 mt-auto">Mastery</span>
                            </div>
                        </CardContent>

                        <CardFooter className="relative z-10 pt-4 pb-4 px-4 bg-zinc-50 dark:bg-zinc-950/80">
                            <Button
                                className="w-full font-bold shadow-sm gap-2 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                                onClick={() => navigate(`/educator/courses/${course.id}`, { state: { course } })}
                            >
                                <Settings2 size={16} /> Manage Course
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                {/* Create New Course Blank Card */}
                <Card
                    className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 dark:border-zinc-800 shadow-none hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all cursor-pointer min-h-[300px]"
                    onClick={() => navigate('/educator/builder')}
                >
                    <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-500 flex items-center justify-center mb-4 transition-colors group-hover:bg-blue-100 group-hover:text-blue-600">
                        <BookOpen size={32} />
                    </div>
                    <h3 className="text-xl font-bold">Design New Curriculum</h3>
                    <p className="text-sm font-medium text-zinc-500 mt-2 text-center px-6">Use the AI Curriculum Architect to generate a new graph.</p>
                </Card>
            </div>
        </div>
    );
}
