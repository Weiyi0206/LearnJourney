import React, { useState, useEffect } from 'react';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Trash2, Edit3, Type, BrainCircuit, Target, Loader2 } from "lucide-react";
import { CourseService } from "@/lib/apiClient";

export default function NodeEditorSheet({ node, onUpdateNode, onDeleteNode }) {
    const [label, setLabel] = useState("");
    const [questionsCount, setQuestionsCount] = useState(20);
    const [passThreshold, setPassThreshold] = useState(60);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (node) {
            setLabel(node.data?.label || "");
            setQuestionsCount(node.data?.questions_count ?? 20);
            setPassThreshold(node.data?.pass_threshold ?? 60);
        }
    }, [node]);

    if (!node) return null;

    // UUID check: deployed skills have UUID IDs, draft nodes have IDs like "n100"
    const isDeployed = node.id && node.id.includes("-");

    const handleSave = async () => {
        const newData = {
            ...node.data,
            label,
            questions_count: questionsCount,
            pass_threshold: passThreshold
        };

        // Persist to DB if this is an already-deployed skill
        if (isDeployed) {
            setIsSaving(true);
            try {
                await CourseService.updateSkillSettings(node.id, {
                    name: label,
                    questions_count: questionsCount,
                    pass_threshold: passThreshold
                });
            } catch (e) {
                console.error("Failed to save skill settings:", e);
            } finally {
                setIsSaving(false);
            }
        }

        onUpdateNode(node.id, newData);
    };

    return (
        <SheetContent className="w-full sm:max-w-md lg:max-w-md overflow-y-auto bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 p-0 flex flex-col">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
                <SheetHeader>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
                        <Edit3 size={14} /> Node Modification
                    </div>
                    <SheetTitle className="text-3xl font-extrabold pb-2">Edit Block Properties</SheetTitle>
                    <SheetDescription className="text-sm font-medium">
                        Fine-tune the AI-generated parameters for this specific learning unit.
                    </SheetDescription>
                </SheetHeader>
            </div>

            <div className="flex-grow p-8 space-y-8">
                {/* Node Title */}
                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Type size={14} /> Node Title / Concept</Label>
                    <Input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="h-12 text-lg font-bold border-2 focus-visible:ring-indigo-500 bg-white dark:bg-zinc-900 rounded-xl"
                    />
                </div>

                {/* Divider */}
                <div className="border-t border-zinc-200 dark:border-zinc-800" />

                {/* Quiz Settings Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
                        <BrainCircuit size={14} /> Quiz Configuration
                    </div>

                    {/* Number of Questions */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                            <span className="flex items-center gap-2"><BrainCircuit size={12} /> Number of Questions</span>
                            <span className="text-lg font-black text-blue-600">{questionsCount}</span>
                        </Label>
                        <input
                            type="range"
                            min={5}
                            max={50}
                            step={5}
                            value={questionsCount}
                            onChange={(e) => setQuestionsCount(parseInt(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600 bg-zinc-200 dark:bg-zinc-800"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            <span>5 min</span>
                            <span>50 max</span>
                        </div>
                    </div>

                    {/* Pass Threshold */}
                    <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                            <span className="flex items-center gap-2"><Target size={12} /> Pass Threshold</span>
                            <span className="text-lg font-black text-emerald-600">{passThreshold}%</span>
                        </Label>
                        <input
                            type="range"
                            min={30}
                            max={100}
                            step={5}
                            value={passThreshold}
                            onChange={(e) => setPassThreshold(parseInt(e.target.value))}
                            className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-600 bg-zinc-200 dark:bg-zinc-800"
                        />
                        <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                            <span>30% min</span>
                            <span>100% max</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                            Students must score at or above this percentage to master this node and unlock downstream prerequisites.
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/80 dark:bg-zinc-900/80 mt-auto flex flex-col gap-3">
                <Button
                    size="lg"
                    className="w-full text-lg font-bold py-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] rounded-xl border-none"
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? <><Loader2 size={18} className="mr-2 animate-spin" /> Saving...</> : <><Save size={18} className="mr-2" /> Commit Changes</>}
                </Button>
                <Button
                    size="lg"
                    variant="outline"
                    className="w-full font-bold py-6 border-2 border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl"
                    onClick={() => onDeleteNode(node.id)}
                >
                    <Trash2 size={16} className="mr-2" /> Delete Node
                </Button>
            </div>
        </SheetContent>
    );
}
