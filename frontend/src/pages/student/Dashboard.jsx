import React, { useState, useEffect } from "react";
import { CourseService, StudentService } from "@/lib/apiClient";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Book, Sparkles, Compass, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
    const navigate = useNavigate();
    const { user, profile } = useAuth();

    const [availableCourses, setAvailableCourses] = useState([]);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAll = async () => {
        if (!user?.id) return;
        try {
            setIsLoading(true);
            const availableData = await CourseService.getAllCourses();
            let enrolledData = [];
            try {
                enrolledData = await StudentService.getEnrolledCourses(user.id);
            } catch (e) {
                console.warn("Failed to fetch enrolled courses or no table exists yet", e);
            }

            const enrolledIdsSet = new Set(enrolledData.map(c => c.id));
            const filteredAvailable = availableData.filter(c => !enrolledIdsSet.has(c.id));

            const colors = [
                { colorClass: "from-blue-500/10 to-indigo-500/10", iconColor: "text-blue-500", bgIconColor: "bg-blue-100 dark:bg-blue-900/30" },
                { colorClass: "from-emerald-500/10 to-teal-500/10", iconColor: "text-emerald-500", bgIconColor: "bg-emerald-100 dark:bg-emerald-900/30" },
                { colorClass: "from-amber-500/10 to-orange-500/10", iconColor: "text-amber-500", bgIconColor: "bg-amber-100 dark:bg-amber-900/30" }
            ];

            const mapCourse = (c, idx) => ({
                ...c,
                educator: c.educator_name || c.educator || "Community Educator",
                ...colors[idx % colors.length]
            });

            setAvailableCourses(filteredAvailable.map(mapCourse));
            setEnrolledCourses(enrolledData.map(mapCourse));
        } catch (err) {
            console.error("Failed to load courses:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
    }, [user?.id]);

    const handleEnroll = async (courseId) => {
        if (!user?.id) return;
        try {
            await StudentService.enroll(user.id, courseId);
            await fetchAll();
        } catch (err) {
            console.error("Failed to enroll in course", err);
        }
    };

    const handleResume = (courseId) => {
        navigate(`/courses/${courseId}`);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-zinc-500">Loading your learning journey...</div>;
    }

    return (
        <div className="p-4 md:p-8 h-full overflow-auto max-w-7xl mx-auto space-y-12 pb-24">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                    Welcome back, {((profile?.full_name || user?.user_metadata?.full_name || "Student").split(' ')[0])}.
                </h1>
                <p className="text-zinc-500 mt-2 font-medium text-lg">Continue your learning journey where you left off.</p>
            </div>

            {/* Enrolled Courses Section */}
            <div>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Compass size={24} className="text-blue-500" /> Active Curricula
                </h2>

                {enrolledCourses.length === 0 ? (
                    <div className="bg-zinc-100 dark:bg-zinc-900/50 rounded-3xl p-10 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                        <Book size={48} className="mx-auto text-zinc-400 mb-4 opacity-50" />
                        <h3 className="text-xl font-bold text-zinc-600 dark:text-zinc-400">You aren't enrolled in any courses yet.</h3>
                        <p className="text-zinc-500 mt-2">Explore the Course Hub below to start your journey.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {enrolledCourses.map(course => {
                            const prog = course.progress || { percent: 0, currentFocus: "Getting Started", text: "0 / 0 Nodes" };
                            return (
                                <Card key={course.id} className="col-span-1 flex flex-col border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden group hover:shadow-xl transition-all relative rounded-3xl shadow-md">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${course.colorClass} opacity-40 pointer-events-none`} />

                                    <CardHeader className="pb-4 relative z-10">
                                        <div className="flex justify-between items-start">
                                            <div className="pr-4">
                                                <CardTitle className="text-xl font-extrabold leading-tight">{course.title}</CardTitle>
                                                <CardDescription className="text-zinc-500 font-bold mt-1 tracking-wide">{course.educator}</CardDescription>
                                            </div>
                                            <div className={`p-3 rounded-2xl shrink-0 ${course.bgIconColor} dark:opacity-80`}>
                                                <Book size={24} className={course.iconColor} />
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="pt-2 flex-grow flex flex-col justify-end relative z-10">
                                        <div className="space-y-3 p-4 bg-white/50 dark:bg-black/20 rounded-2xl backdrop-blur-sm border border-zinc-100 dark:border-zinc-800/50">
                                            <div className="flex justify-between text-sm font-bold">
                                                <span className="text-zinc-600 dark:text-zinc-400">Mastery Level <span className="opacity-70 text-[10px] ml-1 uppercase">{prog.text}</span></span>
                                                <span className={`${course.iconColor} font-black`}>{prog.percent}%</span>
                                            </div>
                                            <Progress value={prog.percent} className="h-3 bg-zinc-200 dark:bg-zinc-800 [&>div]:bg-current" style={{ color: 'currentColor' }} />
                                            <p className="text-xs text-zinc-500 font-medium pt-1">Current Focus: <span className="text-zinc-900 dark:text-zinc-100 font-bold">{prog.currentFocus}</span></p>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="pt-0 p-6 relative z-10">
                                        <Button
                                            className="w-full py-6 text-base font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-xl shadow-zinc-900/10 gap-2 rounded-xl transition-transform active:scale-95"
                                            onClick={() => handleResume(course.id)}
                                        >
                                            <Play size={18} fill="currentColor" />
                                            Resume Journey
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Course Hub Section */}
            <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Sparkles size={24} className="text-amber-500" /> Course Hub
                </h2>

                {availableCourses.length === 0 ? (
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl p-8 text-center border border-zinc-200 dark:border-zinc-800">
                        <CheckCircle2 size={40} className="mx-auto text-emerald-400 mb-3 opacity-60" />
                        <h3 className="font-bold text-zinc-500">You've unlocked all available courses!</h3>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {availableCourses.map(course => (
                            <Card key={course.id} className="flex flex-col border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-3xl shadow-sm hover:shadow-lg transition-all border-dashed">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg font-bold">{course.title}</CardTitle>
                                    <CardDescription className="text-zinc-500 font-semibold">{course.educator}</CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0 flex-grow">
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{course.description}</p>
                                </CardContent>
                                <CardFooter className="p-4 bg-white dark:bg-zinc-950 mt-auto rounded-b-3xl border-t border-zinc-200 dark:border-zinc-800">
                                    <Button
                                        variant="outline"
                                        className="w-full font-bold border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900/50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-xl"
                                        onClick={() => handleEnroll(course.id)}
                                    >
                                        Enroll Now
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
