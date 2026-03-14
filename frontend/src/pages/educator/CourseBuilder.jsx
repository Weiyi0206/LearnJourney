import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";

export default function CourseBuilder() {
    const [courseTitle, setCourseTitle] = useState("");
    const [skills, setSkills] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleGenerateGraph = async () => {
        setIsLoading(true);
        // Ideally post to the FastAPI backend, but we'll simulate the AI generation step locally
        const skillsList = skills.split(",").map(s => s.trim()).filter(Boolean);

        try {
            // Mock API trigger
            // await api.post("/api/curriculum/generate", { title: courseTitle, skills: skillsList });
            setTimeout(() => {
                setIsLoading(false);
                navigate("/educator/graph", { state: { courseTitle, skills: skillsList } });
            }, 1500);

        } catch (e) {
            console.error(e);
            setIsLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <Card className="shadow-lg border-zinc-200/60 dark:border-zinc-800">
                <CardHeader className="space-y-3 pb-8">
                    <CardTitle className="text-3xl font-extrabold tracking-tight">AI Curriculum Architect</CardTitle>
                    <CardDescription className="text-base text-zinc-500">
                        Enter a course title and an unstructured list of skills. The AI engine will
                        compute semantics & complexity to generate a prerequisite graph automatically.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2.5">
                        <Label htmlFor="title" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Course Title</Label>
                        <Input
                            id="title"
                            className="text-lg py-6 bg-zinc-50 focus-visible:ring-blue-500 dark:bg-zinc-900"
                            placeholder="e.g. Introduction to Python Programming"
                            value={courseTitle}
                            onChange={(e) => setCourseTitle(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2.5">
                        <Label htmlFor="skills" className="text-sm font-semibold uppercase tracking-wider text-zinc-500">Target Skills (comma separated)</Label>
                        <Textarea
                            id="skills"
                            className="min-h-[200px] text-base resize-y bg-zinc-50 focus-visible:ring-blue-500 dark:bg-zinc-900 leading-relaxed"
                            placeholder="Variables, Loops, Functions, Classes, File I/O, Generators, Decorators..."
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="pt-6 border-t mt-4 bg-zinc-50 dark:bg-zinc-950/40 rounded-b-xl flex justify-end">
                    <Button
                        onClick={handleGenerateGraph}
                        disabled={!courseTitle || !skills || isLoading}
                        className="px-8 py-6 text-base font-semibold transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/40"
                    >
                        {isLoading ? "Generating Prerequisite Graph..." : "Generate Curriculum Structure"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
