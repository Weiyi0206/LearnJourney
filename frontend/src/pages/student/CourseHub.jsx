import React, { useState, useEffect } from "react";
import { CourseService, StudentService } from "@/lib/apiClient";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, CheckCircle2, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function CourseHub() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [availableCourses, setAvailableCourses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchCourses = async () => {
        if (!user?.id) return;
        try {
            setIsLoading(true);
            const availableData = await CourseService.getAllCourses();

            let enrolledData = [];
            try {
                enrolledData = await StudentService.getEnrolledCourses(user.id);
            } catch (e) {
                console.warn("Could not fetch enrolled courses");
            }

            const enrolledIdsSet = new Set(enrolledData.map(c => c.id));
            const filteredAvailable = availableData.filter(c => !enrolledIdsSet.has(c.id));

            const colors = [
                { colorClass: "from-blue-500/10 to-indigo-500/10", iconColor: "text-blue-500", bgIconColor: "bg-blue-100 dark:bg-blue-900/30" },
                { colorClass: "from-emerald-500/10 to-teal-500/10", iconColor: "text-emerald-500", bgIconColor: "bg-emerald-100 dark:bg-emerald-900/30" },
                { colorClass: "from-amber-500/10 to-orange-500/10", iconColor: "text-amber-500", bgIconColor: "bg-amber-100 dark:bg-amber-900/30" }
            ];

            const mapped = filteredAvailable.map((c, idx) => ({
                ...c,
                educator: c.educator_name || c.educator || "Community Educator",
                ...colors[idx % colors.length]
            }));

            setAvailableCourses(mapped);
        } catch (err) {
            console.error("Failed to load courses:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, [user?.id]);

    const handleViewCourse = (courseId) => {
        navigate(`/courses/${courseId}`);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-zinc-500 font-medium">Loading Course Hub...</div>;
    }

    return (
        <div className="p-4 md:p-8 h-full overflow-auto max-w-7xl mx-auto space-y-10 pb-24">
            <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
                    <Sparkles size={36} className="text-indigo-500" /> Discover Public Courses
                </h1>
                <p className="text-zinc-500 mt-2 font-medium text-lg">Browse available curricula built by other educators and enroll to start learning.</p>
            </div>

            {availableCourses.length === 0 ? (
                <div className="bg-zinc-50 dark:bg-zinc-900/30 rounded-3xl p-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                    <CheckCircle2 size={56} className="mx-auto text-emerald-400 mb-4 opacity-70 drop-shadow-lg" />
                    <h3 className="font-extrabold text-2xl text-zinc-800 dark:text-zinc-200 tracking-tight">You've unlocked everything!</h3>
                    <p className="mt-2 text-zinc-500 text-lg font-medium">There are no new public courses available to enroll in right now.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {availableCourses.map((course) => (
                        <Card key={course.id} className="flex flex-col border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-3xl shadow-sm hover:shadow-xl transition-all hover:-translate-y-1 duration-300 group overflow-hidden relative">
                            <div className={`absolute inset-0 bg-gradient-to-br ${course.colorClass} opacity-30 pointer-events-none transition-opacity group-hover:opacity-60`} />

                            <CardHeader className="pb-3 relative z-10 pt-6">
                                <CardTitle className="text-2xl font-black tracking-tight leading-tight">{course.title}</CardTitle>
                                <CardDescription className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-widest text-xs mt-2">{course.educator}</CardDescription>
                            </CardHeader>

                            <CardContent className="pt-2 flex-grow relative z-10">
                                <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium line-clamp-3">{course.description || "No description provided."}</p>
                            </CardContent>

                            <CardFooter className="p-5 mt-auto bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800/80 relative z-10">
                                <Button
                                    variant="ghost"
                                    className="w-full font-bold bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white hover:bg-zinc-100 hover:text-indigo-600 dark:hover:bg-zinc-700 dark:hover:text-indigo-400 rounded-xl h-12 shadow-sm transition-all"
                                    onClick={() => handleViewCourse(course.id)}
                                >
                                    View Details <ArrowRight size={16} className="ml-2 opacity-70 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
