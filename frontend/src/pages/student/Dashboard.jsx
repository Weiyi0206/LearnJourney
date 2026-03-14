import React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
    const navigate = useNavigate();

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Your Dashboard</h1>
                <p className="text-zinc-500 mt-2 text-lg">Continue your learning journey where you left off.</p>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold border-b pb-2">Enrolled Courses</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card className="hover:shadow-lg transition-shadow border-zinc-200 dark:border-zinc-800">
                        <CardHeader className="bg-blue-50/50 dark:bg-blue-900/10 rounded-t-xl">
                            <CardTitle className="text-xl">Introduction to Python</CardTitle>
                            <CardDescription className="text-blue-600/80 font-medium">Dr. Smith</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm font-semibold">
                                    <span className="text-zinc-500">Mastery Level</span>
                                    <span className="text-blue-600">35%</span>
                                </div>
                                <Progress value={35} className="h-2.5 bg-zinc-100" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2" onClick={() => navigate("/student/path")}>
                                <Play size={16} fill="currentColor" />
                                Resume Learning
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
