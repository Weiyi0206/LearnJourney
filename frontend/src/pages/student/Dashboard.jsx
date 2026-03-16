import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Play, Book, Target, CheckCircle2, Trophy, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
    const navigate = useNavigate();

    return (
        <div className="p-4 md:p-8 h-full overflow-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight">Your Journey</h1>
                <p className="text-zinc-500 mt-1 font-medium">Continue your learning journey where you left off.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4 md:gap-6 min-h-[600px]">

                {/* Main Course Card (Hero Bento) */}
                <Card className="col-span-1 md:col-span-2 row-span-2 flex flex-col border-zinc-200/60 dark:border-zinc-800 overflow-hidden group hover:shadow-xl transition-all relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 pointer-events-none" />
                    <CardHeader className="pb-2 border-b border-zinc-100 dark:border-zinc-900/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-2xl font-extrabold">Introduction to Python</CardTitle>
                                <CardDescription className="text-blue-600/80 font-bold mt-1">Dr. Smith</CardDescription>
                            </div>
                            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl dark:bg-blue-900/30">
                                <Book size={24} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8 flex-grow flex flex-col justify-center">
                        <div className="space-y-4">
                            <div className="flex justify-between text-base font-bold">
                                <span className="text-zinc-600 dark:text-zinc-400">Mastery Level</span>
                                <span className="text-blue-600 dark:text-blue-400 text-xl">35%</span>
                            </div>
                            <Progress value={35} className="h-4 bg-zinc-100 dark:bg-zinc-800 [&>div]:bg-blue-500" />
                            <p className="text-sm text-zinc-500 font-medium">Current Focus: <span className="text-zinc-900 dark:text-zinc-100 font-bold">Loops & Functions</span></p>
                        </div>
                    </CardContent>
                    <CardFooter className="pt-0 p-6">
                        <Button className="w-full py-6 text-lg font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-xl shadow-zinc-900/10 gap-2" onClick={() => navigate("/student/path")}>
                            <Play size={18} fill="currentColor" />
                            Resume Learning
                        </Button>
                    </CardFooter>
                </Card>

                {/* Quick Stats Bento 1 */}
                <Card className="col-span-1 row-span-1 border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-center p-6 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl dark:bg-emerald-900/30">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <p className="text-zinc-500 font-bold text-sm">Skills Mastered</p>
                            <h3 className="text-3xl font-extrabold">12</h3>
                        </div>
                    </div>
                </Card>

                {/* Quick Stats Bento 2 */}
                <Card className="col-span-1 row-span-1 border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex flex-col justify-center p-6 hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-amber-100 text-amber-600 rounded-2xl dark:bg-amber-900/30">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-zinc-500 font-bold text-sm">Hours Learned</p>
                            <h3 className="text-3xl font-extrabold">14.5</h3>
                        </div>
                    </div>
                </Card>

                {/* Achievements Bento */}
                <Card className="col-span-1 md:col-span-2 row-span-2 bg-gradient-to-br from-zinc-900 to-black text-white border-none flex flex-col p-6 hover:shadow-2xl transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                        <Trophy size={160} />
                    </div>
                    <h3 className="text-xl font-bold flex items-center gap-2 mb-4">
                        <Trophy size={20} className="text-amber-400" />
                        Recent Achievements
                    </h3>
                    <div className="flex-grow flex flex-col justify-center gap-4 relative z-10">
                        {['First Node Conquered', 'Perfect Score: Variables'].map((ach, i) => (
                            <div key={i} className="flex items-center gap-4 bg-white/10 backdrop-blur p-4 rounded-xl border border-white/10">
                                <div className="w-10 h-10 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center font-bold">
                                    {i + 1}
                                </div>
                                <span className="font-semibold text-lg">{ach}</span>
                            </div>
                        ))}
                    </div>
                </Card>

            </div>
        </div>
    );
}
