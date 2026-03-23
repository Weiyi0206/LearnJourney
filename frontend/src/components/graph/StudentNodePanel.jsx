import React from 'react';
import { useNavigate } from "react-router-dom";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Video, ArrowUpCircle, Link as LinkIcon, CheckCircle2, Book } from "lucide-react";

export default function StudentNodePanel({ node, fullCourseData }) {
    const navigate = useNavigate();
    if (!node) return null;

    const nodeMetadata = fullCourseData.nodesData?.[node.id] || {};
    const materials = nodeMetadata.materials || [];
    const status = node.data?.studentStatus || 'Locked';

    const getIconForType = (type) => {
        switch (type) {
            case "video": return <Video size={18} className="text-blue-500" />;
            case "read": return <FileText size={18} className="text-amber-500" />;
            case "file": return <ArrowUpCircle size={18} className="text-emerald-500" />;
            case "link": return <LinkIcon size={18} className="text-pink-500" />;
            default: return <FileText size={18} />;
        }
    };

    return (
        <SheetContent className="w-full sm:max-w-md lg:max-w-xl overflow-y-auto bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 p-0 flex flex-col">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                <SheetHeader>
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-2">
                        <Sparkles size={14} /> Knowledge Node
                    </div>
                    <div className="flex justify-between items-start">
                        <SheetTitle className="text-3xl font-extrabold">{node?.data?.label}</SheetTitle>
                        {status === 'Mastered' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-3 py-1 font-bold text-xs"><CheckCircle2 size={12} className="mr-1" /> Mastered</Badge>
                        ) : (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 px-3 py-1 font-bold text-xs">In Progress</Badge>
                        )}
                    </div>
                    <SheetDescription className="text-base font-medium mt-2">
                        {nodeMetadata.description || "Review the core concepts provided by your educator before attempting verification."}
                    </SheetDescription>
                </SheetHeader>
            </div>

            <div className="flex-grow p-6 space-y-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileText size={18} className="text-blue-500" /> Learning Materials
                </h3>

                <div className="space-y-4">
                    {materials.map((m, i) => (
                        <div key={i} className="flex flex-col gap-3 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm transition-all hover:shadow-md hover:border-blue-200 dark:hover:border-blue-900/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                    {getIconForType(m.type)}
                                </div>
                                <span className="font-bold text-base text-zinc-800 dark:text-zinc-200">{m.name}</span>
                            </div>
                            <Button variant="secondary" className="w-full font-bold dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700">Open Resource</Button>
                        </div>
                    ))}
                    {materials.length === 0 && (
                        <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                            <Book size={24} className="mx-auto text-zinc-400 mb-2 opacity-50" />
                            <p className="text-zinc-500 font-medium">No specific materials uploaded yet.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/80 dark:bg-zinc-900/80 mt-auto shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10 sticky bottom-0">
                <Button
                    size="lg"
                    className="w-full text-lg font-bold py-6 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-2xl transition-transform active:scale-95 rounded-xl border-4 border-zinc-900/10 dark:border-white/10"
                    onClick={() => navigate("/student/quizzes", { state: { skillId: node?.id, skillName: node?.data?.label, courseId: fullCourseData.id, courseTitle: fullCourseData.title } })}
                >
                    Take Verification Quiz
                </Button>
            </div>
        </SheetContent>
    );
}
