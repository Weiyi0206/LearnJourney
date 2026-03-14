import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { BookOpen, GitGraph } from "lucide-react";

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
        <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-4 dark:bg-zinc-950">
            <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8">

                <Card className="flex flex-col transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl shadow-md border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="flex-1 bg-gradient-to-br from-blue-500/10 to-indigo-500/10">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 dark:bg-blue-900/30 dark:text-blue-400">
                            <BookOpen size={24} />
                        </div>
                        <CardTitle className="text-2xl font-bold">Student Portal</CardTitle>
                        <CardDescription className="text-base mt-2 leading-relaxed">
                            Access your personalized, adaptive learning paths and dynamic assessments.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-6">
                        <Button className="w-full py-6 text-lg" onClick={() => handleLogin("student")}>
                            Log In as Student
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="flex flex-col transform transition-transform duration-300 hover:scale-[1.02] hover:shadow-xl shadow-md border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="flex-1 bg-gradient-to-br from-emerald-500/10 to-teal-500/10">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 dark:bg-emerald-900/30 dark:text-emerald-400">
                            <GitGraph size={24} />
                        </div>
                        <CardTitle className="text-2xl font-bold">Educator Dashboard</CardTitle>
                        <CardDescription className="text-base mt-2 leading-relaxed">
                            Build AI-driven curriculum prerequisite graphs, review student progress, and publish interactive courses.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-6">
                        <Button variant="outline" className="w-full py-6 text-lg border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-300" onClick={() => handleLogin("educator")}>
                            Log In as Educator
                        </Button>
                    </CardFooter>
                </Card>

            </div>
        </div>
    );
}
