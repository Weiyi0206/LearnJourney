import React, { useState, useEffect } from 'react';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Trash2, Edit3, Type, GitBranch } from "lucide-react";

export default function NodeEditorSheet({ node, onUpdateNode, onDeleteNode }) {
    const [label, setLabel] = useState("");
    const [complexity, setComplexity] = useState("5");

    useEffect(() => {
        if (node) {
            setLabel(node.data?.label || "");
            setComplexity(node.data?.complexity || "5");
        }
    }, [node]);

    if (!node) return null;

    const handleSave = () => {
        onUpdateNode(node.id, { ...node.data, label, complexity });
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
                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><Type size={14} /> Node Title / Concept</Label>
                    <Input
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        className="h-12 text-lg font-bold border-2 focus-visible:ring-indigo-500 bg-white dark:bg-zinc-900 rounded-xl"
                    />
                </div>

                <div className="space-y-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2"><GitBranch size={14} /> Cognitive Complexity Score (1-10)</Label>
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl">
                        {[1, 3, 5, 7, 10].map(val => (
                            <button
                                key={val}
                                onClick={() => setComplexity(val.toString())}
                                className={`flex-1 py-3 text-sm font-black rounded-lg transition-all ${complexity === val.toString() ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)]' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                            >
                                {val}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/80 dark:bg-zinc-900/80 mt-auto flex flex-col gap-3">
                <Button
                    size="lg"
                    className="w-full text-lg font-bold py-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] rounded-xl border-none"
                    onClick={handleSave}
                >
                    <Save size={18} className="mr-2" /> Commit Changes
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
