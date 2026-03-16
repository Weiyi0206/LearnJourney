import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { BookOpen, GitGraph, Sparkles, BrainCircuit, Blocks } from "lucide-react";

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = (role) => {
        login(role);
        if (role === "educator") {
            navigate("/educator/dashboard");
        } else {
            navigate("/student/dashboard");
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">

                {/* Bento Hero Header */}
                <Card className="col-span-1 md:col-span-3 row-span-1 flex flex-col md:flex-row items-center border-none shadow-none bg-transparent">
                    <div className="md:w-2/3">
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-zinc-900 dark:text-zinc-50 leading-tight">
                            Master the<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                                Knowledge Frontier.
                            </span>
                        </h1>
                        <p className="mt-4 text-xl text-zinc-500 font-medium max-w-xl leading-relaxed">
                            Explore dynamic prerequisite graphs, personalized AI paths, and frictionless learning experiences.
                        </p>
                    </div>
                    <div className="hidden md:flex md:w-1/3 justify-end items-center opacity-80">
                        <Blocks size={120} className="text-blue-500/20" strokeWidth={1} />
                    </div>
                </Card>

                {/* Educator Login Bento */}
                <Card className="col-span-1 md:col-span-2 row-span-1 flex flex-col transform transition-transform duration-300 hover:scale-[1.02] border border-zinc-200/60 dark:border-zinc-800 shadow-xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/10 z-0 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
                    <CardHeader className="relative z-10 flex flex-row items-center gap-4">
                        <div className="p-4 bg-emerald-100 text-emerald-600 rounded-2xl dark:bg-emerald-900/30 dark:text-emerald-400 shadow-inner">
                            <GitGraph size={32} />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-bold">Educator Portal</CardTitle>
                            <CardDescription className="text-base text-zinc-500 font-medium">Build AI-driven logic graphs and curricula.</CardDescription>
                        </div>
                    </CardHeader>
                    <CardFooter className="pt-8 pb-6 mt-auto relative z-10">
                        <Button className="w-full md:w-auto px-8 py-6 text-lg font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity gap-2" onClick={() => handleLogin("educator")}>
                            <Sparkles size={18} /> Enter as Educator
                        </Button>
                    </CardFooter>
                </Card>

                {/* Student Login Bento */}
                <Card className="col-span-1 row-span-1 flex flex-col transform transition-transform duration-300 hover:scale-[1.02] border border-zinc-200/60 dark:border-zinc-800 shadow-xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/10 z-0 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50" />
                    <CardHeader className="relative z-10">
                        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 dark:bg-blue-900/30 dark:text-blue-400 shadow-inner">
                            <BookOpen size={28} />
                        </div>
                        <CardTitle className="text-2xl font-bold mb-2">Student Portal</CardTitle>
                        <CardDescription className="text-base text-zinc-500 font-medium leading-relaxed">Access personalized paths & quizzes.</CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-6 pb-6 mt-auto relative z-10">
                        <Button variant="outline" className="w-full py-6 text-lg font-bold border-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors" onClick={() => handleLogin("student")}>
                            Enter as Student
                        </Button>
                    </CardFooter>
                </Card>

                {/* Info Decorative Bento */}
                <Card className="col-span-1 md:col-span-3 row-span-1 border border-zinc-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md shadow-sm p-6 flex flex-col md:flex-row items-center gap-6 mt-4">
                    <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-full flex-shrink-0">
                        <BrainCircuit size={24} className="text-zinc-500" />
                    </div>
                    <p className="text-zinc-500 font-medium text-center md:text-left flex-1">
                        LearnJourney utilizes Semantic Encoders (SBERT) and Generative AI to revolutionize technical learning by computing course graphs interactively.
                    </p>
                </Card>

            </div>
        </div>
    );
}
