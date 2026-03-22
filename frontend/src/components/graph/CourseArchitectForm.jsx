import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wand2, Loader2, Network, BrainCircuit } from 'lucide-react';
import { CourseAPI } from "@/lib/apiClient";
export default function CourseArchitectForm({ onGenerate }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [skills, setSkills] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingText, setLoadingText] = useState('Encoding semantics via SBERT...');

    const handleGenerate = async () => {
        setIsGenerating(true);
        setLoadingText('Connecting to Graph Inference Engine...');

        try {
            // Split skills into array
            const skillsArray = skills
                .split(/[\n,]+/)
                .map(s => s.trim())
                .filter(s => s.length > 0);

            // Call backend API
            const response = await CourseAPI.generateGraph(skillsArray);

            setLoadingText('Structuring Direct Acyclic Graph...');

            // Pass complete data back up
            onGenerate({ title, description, nodes: response.nodes, edges: response.edges });
        } catch (error) {
            console.error("Failed to generate graph:", error);
            setIsGenerating(false);
            // In a real app we might show a toast here
        }
    };

    if (isGenerating) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950 absolute inset-0 z-50">
                <div className="w-24 h-24 relative mb-10">
                    <div className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
                    <BrainCircuit size={96} strokeWidth={1.5} className="text-indigo-600 dark:text-indigo-400 relative z-10 animate-pulse" />
                </div>
                <h2 className="text-4xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight text-center mb-4">
                    AI Curriculum Architect Running
                </h2>
                <div className="flex items-center gap-3 text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/20 px-6 py-3 rounded-full mt-4">
                    <Loader2 size={20} className="animate-spin" /> {loadingText}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-4 md:p-8 pt-12 md:pt-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-4 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 rounded-[2rem] shadow-inner mb-6">
                    <Network size={36} />
                </div>
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-zinc-900 dark:text-zinc-50">Architect New Curriculum</h1>
                <p className="text-lg text-zinc-500 font-medium max-w-2xl mx-auto">
                    Provide the high-level intent and unstructured knowledge payload. The AI Engine will construct a perfect prerequisite dependency graph.
                </p>
            </div>

            <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-[2rem] overflow-hidden">
                <CardContent className="p-8 md:p-12 space-y-8">
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-500">Course Identifier / Title</Label>
                            <Input
                                placeholder="E.g. Full-Stack Systems Design"
                                className="h-14 text-lg font-bold border-2 rounded-xl focus-visible:ring-indigo-500 bg-white dark:bg-zinc-950 px-4"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-500">Course Description</Label>
                            <Textarea
                                placeholder="E.g. This course covers everything from frontend basics to scalable backend architecture, focusing on real-world systems design..."
                                className="min-h-[100px] text-lg font-medium border-2 rounded-xl focus-visible:ring-indigo-500 bg-white dark:bg-zinc-950 p-4 leading-relaxed"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-sm font-bold uppercase tracking-widest text-zinc-500">Unstructured Skills & Concepts (CSV, Bullet Points, or Raw Text)</Label>
                        <Textarea
                            placeholder="Paste your syllabus, documentation, or braindump here. The AI will parse nodes and infer prerequisites automatically."
                            className="min-h-[250px] text-lg font-medium p-6 resize-y border-2 rounded-2xl focus-visible:ring-indigo-500 bg-white dark:bg-zinc-950 leading-relaxed"
                            value={skills}
                            onChange={(e) => setSkills(e.target.value)}
                        />
                    </div>
                </CardContent>
                <div className="p-6 md:p-8 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                    <Button
                        size="lg"
                        disabled={!title || !skills}
                        onClick={handleGenerate}
                        className="w-full md:w-auto px-10 h-16 text-xl font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] transition-all flex items-center gap-3"
                    >
                        <Wand2 size={24} /> Synthesize AI Curriculum
                    </Button>
                </div>
            </Card>
        </div>
    );
}
