import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Wand2, Loader2, Network, BrainCircuit, Plus, X, Sparkles, BookOpen } from 'lucide-react';
import { CourseAPI } from "@/lib/apiClient";

export default function CourseArchitectForm({ onGenerate }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [inputMode, setInputMode] = useState('bullet'); // 'bullet', 'csv', 'raw'
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingText, setLoadingText] = useState('Encoding semantics via SBERT...');
    const [field, setField] = useState('python'); // 'python', 'accounting', 'economics'

    // Bullet-point mode state
    const [bulletSkills, setBulletSkills] = useState(['']);

    // CSV / Raw text mode state
    const [rawText, setRawText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [parsedSkills, setParsedSkills] = useState(null); // null = not parsed yet

    // ── Bullet helpers ──
    const addBulletSkill = () => {
        setBulletSkills(prev => [...prev, '']);
    };

    const updateBulletSkill = (index, value) => {
        setBulletSkills(prev => {
            const updated = [...prev];
            updated[index] = value;
            return updated;
        });
    };

    const removeBulletSkill = (index) => {
        setBulletSkills(prev => prev.filter((_, i) => i !== index));
    };

    // ── Parse CSV / Raw via Gemini ──
    const handleParseSkills = async () => {
        if (!rawText.trim()) return;
        setIsParsing(true);
        setParsedSkills(null);
        try {
            const result = await CourseAPI.parseSkills(rawText, inputMode);
            setParsedSkills(result.skills || []);
        } catch (err) {
            console.error('Failed to parse skills:', err);
            // Fallback: split locally
            const fallback = rawText
                .split(/[\n,]+/)
                .map(s => s.trim().replace(/^[-•*]\s*/, ''))
                .filter(s => s.length > 0);
            setParsedSkills(fallback);
        } finally {
            setIsParsing(false);
        }
    };

    const removeParsedSkill = (index) => {
        setParsedSkills(prev => prev.filter((_, i) => i !== index));
    };

    // ── Collect final skills array ──
    const getSkillsArray = () => {
        if (inputMode === 'bullet') {
            return bulletSkills.map(s => s.trim()).filter(s => s.length > 0);
        }
        // csv / raw – use parsed list
        if (parsedSkills && parsedSkills.length > 0) {
            return parsedSkills;
        }
        return [];
    };

    const hasSkills = getSkillsArray().length > 0;

    // ── Generate ──
    const handleGenerate = async () => {
        const skillsArray = getSkillsArray();
        if (skillsArray.length === 0) return;

        setIsGenerating(true);
        setLoadingText('Connecting to Graph Inference Engine...');

        try {
            const response = await CourseAPI.generateGraph(skillsArray, field);
            setLoadingText('Structuring Direct Acyclic Graph...');
            onGenerate({ title, description, nodes: response.nodes, edges: response.edges });
        } catch (error) {
            console.error("Failed to generate graph:", error);
            setIsGenerating(false);
        }
    };

    // ── When switching mode, reset parsed results ──
    const handleModeChange = (mode) => {
        setInputMode(mode);
        setParsedSkills(null);
    };

    // ── Loading overlay ──
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
                    {/* Title & Description */}
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

                    {/* Field / Corpus Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-bold uppercase tracking-widest text-zinc-500">Knowledge Domain</Label>
                        <p className="text-sm text-zinc-400 font-medium">Select the field that best matches your course. This determines which pedagogical corpus the AI engine uses to infer prerequisite relationships.</p>
                        <Select value={field} onValueChange={setField}>
                            <SelectTrigger className="h-14 text-lg font-bold border-2 rounded-xl focus-visible:ring-indigo-500 bg-white dark:bg-zinc-950 px-4">
                                <div className="flex items-center gap-3">
                                    <BookOpen size={20} className="text-indigo-500" />
                                    <SelectValue placeholder="Select a field" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="python">
                                    <span className="text-sm font-semibold">Python Programming</span>
                                </SelectItem>
                                <SelectItem value="accounting">
                                    <span className="text-sm font-semibold">Financial Accounting</span>
                                </SelectItem>
                                <SelectItem value="economics">
                                    <span className="text-sm font-semibold">Economics</span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Skills Input Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <Label className="text-sm font-bold uppercase tracking-widest text-zinc-500">Skills & Concepts</Label>
                            <Select value={inputMode} onValueChange={handleModeChange}>
                                <SelectTrigger className="w-[200px] h-10 rounded-xl border-2 bg-white dark:bg-zinc-950 font-semibold text-sm">
                                    <SelectValue placeholder="Input mode" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bullet">Bullet Points</SelectItem>
                                    <SelectItem value="csv">CSV (Comma-Separated)</SelectItem>
                                    <SelectItem value="raw">Raw Text / Paste</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* ───── BULLET POINT MODE ───── */}
                        {inputMode === 'bullet' && (
                            <div className="space-y-3">
                                <p className="text-sm text-zinc-400 font-medium">Add skills one by one. Each entry becomes a graph node.</p>
                                <div className="space-y-2">
                                    {bulletSkills.map((skill, index) => (
                                        <div key={index} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${index * 30}ms` }}>
                                            <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-sm font-bold">
                                                {index + 1}
                                            </span>
                                            <Input
                                                placeholder={`E.g. ${['Variables & Data Types', 'Control Flow', 'Functions', 'Object-Oriented Programming', 'Data Structures'][index % 5]}`}
                                                className="h-12 text-base font-medium border-2 rounded-xl focus-visible:ring-indigo-500 bg-white dark:bg-zinc-950 px-4 flex-1"
                                                value={skill}
                                                onChange={(e) => updateBulletSkill(index, e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addBulletSkill();
                                                    }
                                                }}
                                                autoFocus={index === bulletSkills.length - 1 && index > 0}
                                            />
                                            {bulletSkills.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="flex-shrink-0 h-10 w-10 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                                    onClick={() => removeBulletSkill(index)}
                                                >
                                                    <X size={16} />
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={addBulletSkill}
                                    className="w-full h-12 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:border-indigo-400 hover:text-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all font-semibold flex items-center gap-2"
                                >
                                    <Plus size={18} /> Add Skill
                                </Button>
                            </div>
                        )}

                        {/* ───── CSV / RAW TEXT MODE ───── */}
                        {(inputMode === 'csv' || inputMode === 'raw') && (
                            <div className="space-y-4">
                                <p className="text-sm text-zinc-400 font-medium">
                                    {inputMode === 'csv'
                                        ? 'Paste comma-separated skill names. AI will clean and structure them.'
                                        : 'Paste your syllabus, documentation, or braindump. AI will extract individual skills.'}
                                </p>
                                <Textarea
                                    placeholder={
                                        inputMode === 'csv'
                                            ? 'E.g. Variables, Data Types, Control Flow, Functions, OOP, Recursion, Sorting Algorithms'
                                            : 'Paste your syllabus, documentation, or braindump here. The AI will parse nodes and infer prerequisites automatically.'
                                    }
                                    className="min-h-[200px] text-lg font-medium p-6 resize-y border-2 rounded-2xl focus-visible:ring-indigo-500 bg-white dark:bg-zinc-950 leading-relaxed"
                                    value={rawText}
                                    onChange={(e) => {
                                        setRawText(e.target.value);
                                        setParsedSkills(null); // Reset parsed when text changes
                                    }}
                                />
                                <Button
                                    type="button"
                                    onClick={handleParseSkills}
                                    disabled={!rawText.trim() || isParsing}
                                    className="h-12 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold flex items-center gap-2 shadow-lg shadow-violet-500/20 transition-all"
                                >
                                    {isParsing ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" /> AI is parsing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} /> Extract Skills
                                        </>
                                    )}
                                </Button>

                                {/* Parsed results preview */}
                                {parsedSkills && parsedSkills.length > 0 && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="flex items-center gap-2">
                                            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                                            <span className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                                                {parsedSkills.length} skills identified
                                            </span>
                                            <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {parsedSkills.map((skill, i) => (
                                                <div
                                                    key={i}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm font-semibold border border-emerald-200 dark:border-emerald-800 animate-in fade-in zoom-in-95 duration-300"
                                                    style={{ animationDelay: `${i * 40}ms` }}
                                                >
                                                    {skill}
                                                    <button
                                                        onClick={() => removeParsedSkill(i)}
                                                        className="ml-0.5 p-0.5 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {parsedSkills && parsedSkills.length === 0 && (
                                    <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                                        No skills could be extracted. Try rephrasing your input.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>

                {/* Footer / Submit */}
                <div className="p-6 md:p-8 bg-zinc-50 dark:bg-zinc-950/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                    <Button
                        size="lg"
                        disabled={!title || !hasSkills}
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
