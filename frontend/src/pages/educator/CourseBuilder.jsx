import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Brain, Layers, Cpu, ArrowRight } from "lucide-react";

export default function CourseBuilder() {
    const [courseTitle, setCourseTitle] = useState("");
    const [skills, setSkills] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleGenerateGraph = async () => {
        setIsLoading(true);
        const skillsList = skills.split(",").map(s => s.trim()).filter(Boolean);
        setTimeout(() => {
            setIsLoading(false);
            navigate("/educator/graph", { state: { courseTitle, skills: skillsList } });
        }, 1500);
    };

    return (
        <div className="p-4 md:p-8 h-full overflow-auto">
            <div className="mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight">AI Curriculum Architect</h1>
                <p className="text-zinc-500 mt-1 font-medium">Build a logical prerequisite DAG from raw skills.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl">

                {/* Main Form Bento */}
                <Card className="col-span-1 md:col-span-2 shadow-lg border-zinc-200/60 dark:border-zinc-800 flex flex-col transition-all">
                    <CardHeader className="space-y-3 pb-6 border-b border-zinc-100 dark:border-zinc-900">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
                                <Layers className="text-zinc-900 dark:text-zinc-100" />
                            </div>
                            <CardTitle className="text-2xl font-bold tracking-tight">Course Design</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-8 pt-8 flex-grow">
                        <div className="space-y-3">
                            <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Course Identifier</Label>
                            <Input
                                id="title"
                                className="text-xl py-6 md:py-8 font-bold bg-zinc-50 border-2 focus-visible:ring-0 focus-visible:border-blue-500 dark:bg-zinc-950 rounded-xl"
                                placeholder="e.g. Adv. Data Structures"
                                value={courseTitle}
                                onChange={(e) => setCourseTitle(e.target.value)}
                            />
                        </div>

                        <div className="space-y-3 flex-grow flex flex-col">
                            <Label htmlFor="skills" className="text-xs font-bold uppercase tracking-widest text-zinc-500">Semantic Skill Nodes (CSV)</Label>
                            <Textarea
                                id="skills"
                                className="flex-grow min-h-[250px] text-lg resize-y bg-zinc-50 border-2 focus-visible:ring-0 focus-visible:border-blue-500 dark:bg-zinc-950 font-medium leading-relaxed rounded-xl p-4"
                                placeholder="Lists, Arrays, Trees, Heaps, Graph Theory, DFS, BFS..."
                                value={skills}
                                onChange={(e) => setSkills(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-6 border-t bg-zinc-50/50 dark:bg-zinc-950">
                        <Button
                            onClick={handleGenerateGraph}
                            disabled={!courseTitle || !skills || isLoading}
                            className="w-full md:w-auto px-10 py-6 text-lg font-bold gap-3 group"
                        >
                            {isLoading ? "Generating Prerequisite Graph..." : "Synthesize Architecture"}
                            {!isLoading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </Button>
                    </CardFooter>
                </Card>

                {/* AI Info Bento Side Column */}
                <div className="col-span-1 flex flex-col gap-6">
                    <Card className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-none shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-1/4 -translate-y-1/4 pointer-events-none">
                            <Brain size={160} />
                        </div>
                        <CardContent className="h-full flex flex-col justify-end p-8 relative z-10">
                            <div className="p-3 bg-white/20 backdrop-blur rounded-full w-fit mb-4">
                                <Brain className="text-white" size={24} />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">Semantic Inferencing</h3>
                            <p className="text-blue-100 font-medium leading-relaxed opacity-90">
                                The engine uses SBERT to calculate cosine similarities between skills to automatically hook up logically connected concepts.
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 bg-zinc-900 dark:bg-zinc-800 border-none shadow-xl text-zinc-100 overflow-hidden relative">
                        <div className="absolute bottom-0 right-0 p-8 opacity-10 pointer-events-none">
                            <Cpu size={120} />
                        </div>
                        <CardContent className="h-full flex flex-col justify-end p-8 relative z-10">
                            <div className="p-3 bg-zinc-800 dark:bg-zinc-700 rounded-full w-fit mb-4">
                                <Cpu className="text-zinc-100" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Complexity Matrix</h3>
                            <p className="text-zinc-400 font-medium leading-relaxed text-sm">
                                Word Frequency data from "Automate the Boring Stuff" calibrates the root vs edge placement within the Directed Acyclic Graph.
                            </p>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
