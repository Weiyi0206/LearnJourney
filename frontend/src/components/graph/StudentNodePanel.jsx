import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import Markdown from 'react-markdown';
import { Sparkles, FileText, Video, ArrowUpCircle, Link as LinkIcon, CheckCircle2, Book, History, Trophy, XCircle, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { QuizService } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

const markdownComponents = {
    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 inline-block w-full" {...props} />,
    pre: ({ node, ...props }) => (
        <pre className="mt-4 mb-4 text-left bg-zinc-900 text-zinc-100 border border-zinc-800 p-4 rounded-xl shadow-lg text-xs md:text-sm font-medium font-mono overflow-x-auto w-full max-w-full" {...props} />
    ),
    code(props) {
        const { children, className, node, ...rest } = props;
        const match = /language-(\w+)/.exec(className || '');
        const isBlock = match || String(children).includes('\n');
        if (!isBlock) {
            return <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-1 py-0.5 rounded break-words" {...rest}>{children}</code>;
        }
        return <code className="bg-transparent text-inherit p-0 font-mono" {...rest}>{children}</code>;
    }
};

export default function StudentNodePanel({ node, fullCourseData }) {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [quizHistory, setQuizHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedAttempt, setSelectedAttempt] = useState(null);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    useEffect(() => {
        if (user?.id && node?.id) {
            setHistoryLoading(true);
            QuizService.getHistory(user.id, node.id)
                .then(data => setQuizHistory(data || []))
                .catch(() => setQuizHistory([]))
                .finally(() => setHistoryLoading(false));
        }
    }, [user?.id, node?.id]);

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

    const getHoverText = (m) => {
        if (!m || !m.content) return '';
        switch (m.type) {
            case "file":
                try {
                    return m.content.split('/').pop().split('?')[0] || m.content;
                } catch {
                    return m.content;
                }
            case "link":
            case "video":
                return m.content;
            case "text":
            case "read":
                return m.content.length > 100 ? m.content.substring(0, 100) + '...' : m.content;
            default:
                return m.content;
        }
    };

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <SheetContent className="w-full sm:max-w-md lg:max-w-xl overflow-y-auto premium-scrollbar bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 p-0 flex flex-col">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                <SheetHeader>
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-[10px] uppercase tracking-widest mb-2">
                        <Sparkles size={14} /> Knowledge Node
                    </div>
                    <div className="flex justify-between items-start">
                        <SheetTitle className="text-3xl font-extrabold">{node?.data?.label}</SheetTitle>
                        {status === 'Mastered' ? (
                            <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 px-3 py-1 font-bold text-xs"><CheckCircle2 size={12} className="mr-1" /> Mastered</Badge>
                        ) : (status === 'Unlocked' || status === 'In Progress') ? (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 px-3 py-1 font-bold text-xs">In Progress</Badge>
                        ) : (
                            <Badge variant="outline" className="text-zinc-400 border-zinc-200 bg-zinc-50 px-3 py-1 font-bold text-xs">Locked</Badge>
                        )}
                    </div>
                    <SheetDescription className="text-base font-medium mt-2">
                        {node?.data?.description || "Review the core concepts provided by your educator before attempting verification."}
                    </SheetDescription>
                </SheetHeader>
                <div className="flex gap-4 mt-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 dark:text-zinc-500">Quiz Length</span>
                        <Badge variant="outline" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs font-bold py-1 px-3">
                            {node?.data?.questions_count || 20} Questions
                        </Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 dark:text-zinc-500">Mastery Bar</span>
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400 text-xs font-bold py-1 px-3">
                            {node?.data?.pass_threshold || 60}% to Pass
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="flex-grow p-6 space-y-6">
                {/* Learning Materials */}
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <FileText size={18} className="text-blue-500" /> Learning Materials
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {materials.map((m, i) => (
                        <div 
                            key={i} 
                            onClick={() => {
                                if (['link', 'file'].includes(m.type)) {
                                    window.open(m.content, "_blank");
                                } else {
                                    setSelectedMaterial(m);
                                }
                            }}
                            title={getHoverText(m)}
                            className="group flex flex-col gap-2 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm transition-all hover:shadow-md hover:border-blue-300 dark:hover:border-blue-900/50 cursor-pointer select-none"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl group-hover:scale-110 transition-transform">
                                    {getIconForType(m.type)}
                                </div>
                                <div className="flex flex-col overflow-hidden">
                                     <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200 truncate">{m.name || m.title}</span>
                                     <Badge variant="outline" className="w-fit text-[9px] uppercase mt-0.5 font-bold tracking-wider">{m.type}</Badge>
                                </div>
                            </div>
                        </div>
                    ))}
                    {materials.length === 0 && (
                        <div className="col-span-full p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                            <Book size={24} className="mx-auto text-zinc-400 mb-2 opacity-50" />
                            <p className="text-zinc-500 font-medium">No specific materials uploaded yet.</p>
                        </div>
                    )}
                </div>

                {/* Quiz History Section - Only show if not locked */}
                {status !== 'Locked' && (
                    <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                            <History size={18} className="text-amber-500" /> Quiz History
                        </h3>

                        {historyLoading ? (
                            <p className="text-sm text-zinc-400 font-medium">Loading history...</p>
                        ) : quizHistory.length === 0 ? (
                            <div className="p-6 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                                <History size={24} className="mx-auto text-zinc-400 mb-2 opacity-50" />
                                <p className="text-zinc-500 font-medium text-sm">No quiz attempts yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {quizHistory.map((attempt, idx) => (
                                    <div key={attempt.id || idx} className={`border rounded-xl overflow-hidden transition-all ${attempt.passed
                                        ? "border-emerald-200 dark:border-emerald-900/50"
                                        : "border-red-200 dark:border-red-900/50"
                                        }`}>
                                        <button
                                            className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                                            onClick={() => setSelectedAttempt(attempt)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${attempt.passed
                                                    ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30"
                                                    : "bg-red-100 text-red-600 dark:bg-red-900/30"
                                                    }`}>
                                                    {attempt.passed ? <Trophy size={18} /> : <XCircle size={18} />}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm">
                                                        {attempt.score}/{attempt.total_questions} correct — {attempt.percentage}%
                                                    </div>
                                                    <div className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                                                        <Clock size={10} /> {formatDate(attempt.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className={`text-[10px] px-2 py-0.5 font-bold ${attempt.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                                    {attempt.passed ? "PASS" : "FAIL"}
                                                </Badge>
                                                <ChevronRight size={16} className="text-zinc-400" />
                                            </div>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Material Text Viewer Dialog */}
            <Dialog open={!!selectedMaterial} onOpenChange={(open) => !open && setSelectedMaterial(null)}>
                <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
                    <DialogHeader className="p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black">
                            <Book className="text-blue-500" />
                            {selectedMaterial?.name || selectedMaterial?.title}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="overflow-y-auto premium-scrollbar p-6 md:p-8 flex-1 prose prose-zinc dark:prose-invert max-w-none">
                        {selectedMaterial?.type === 'video' ? (
                            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                                <iframe 
                                    src={selectedMaterial?.content?.includes('watch?v=') ? selectedMaterial.content.replace('watch?v=', 'embed/') : selectedMaterial?.content} 
                                    className="w-full h-full" 
                                    allowFullScreen 
                                    allow="autoplay; encrypted-media" 
                                />
                            </div>
                        ) : (
                            <Markdown components={markdownComponents}>{selectedMaterial?.content}</Markdown>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!selectedAttempt} onOpenChange={(open) => !open && setSelectedAttempt(null)}>
                <DialogContent className="sm:max-w-2xl lg:max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
                    <DialogHeader className="p-6 md:p-8 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black text-zinc-900 dark:text-zinc-50">
                            {selectedAttempt?.passed ? <Trophy className="text-emerald-500" /> : <XCircle className="text-red-500" />}
                            Comprehensive Quiz Review
                            <Badge className={`ml-auto px-4 py-1 text-xs font-black ${selectedAttempt?.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                                {selectedAttempt?.passed ? "PASSED" : "FAILED"}
                            </Badge>
                        </DialogTitle>
                        <DialogDescription className="font-bold text-sm text-zinc-500 dark:text-zinc-400 flex justify-between items-center mt-3">
                            <span className="bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg flex gap-2">
                                Score: <strong className={selectedAttempt?.passed ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}>{selectedAttempt?.score} / {selectedAttempt?.total_questions} ({selectedAttempt?.percentage}%)</strong>
                            </span>
                            <span className="flex items-center gap-1"><Clock size={14} className="text-zinc-400" /> {selectedAttempt && formatDate(selectedAttempt.created_at)}</span>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="overflow-y-auto premium-scrollbar p-4 md:p-8 space-y-6 flex-1">
                        {selectedAttempt?.questions?.map((q, qIdx) => (
                            <div key={qIdx} className={`rounded-2xl border-2 shadow-sm bg-white dark:bg-zinc-900 ${q.is_correct ? 'border-emerald-100 dark:border-emerald-900/40' : 'border-red-100 dark:border-red-900/40'}`}>
                                <div className={`p-5 md:p-6 border-b ${q.is_correct ? 'bg-emerald-50/50 border-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/20' : 'bg-red-50/50 border-red-50 dark:bg-red-950/20 dark:border-red-900/20'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 shrink-0">
                                            {q.is_correct ? <CheckCircle2 className="text-emerald-500" size={24} /> : <XCircle className="text-red-500" size={24} />}
                                        </div>
                                        <div className="w-full font-bold text-base md:text-lg text-zinc-800 dark:text-zinc-100">
                                            <Markdown components={markdownComponents}>{q.question}</Markdown>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-5 md:p-6 space-y-4">
                                    {q.is_correct ? (
                                        <div className="flex flex-col text-sm font-medium">
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold mb-1 tracking-wide uppercase text-[11px]">Correct Answer Selected</span>
                                            <span className="text-zinc-700 dark:text-zinc-300 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800">{q.options[q.correct_index]}</span>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex flex-col text-sm font-medium">
                                                <span className="text-red-500 font-bold mb-1 tracking-wide uppercase text-[11px]">Your Answer</span>
                                                <span className="text-zinc-500 p-3 bg-red-50/30 dark:bg-red-950/10 rounded-xl border border-red-100 dark:border-red-900/30 line-through decoration-red-300 dark:decoration-red-800/50">{q.options[q.selected_index] || "No answer provided"}</span>
                                            </div>
                                            <div className="flex flex-col text-sm font-medium">
                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold mb-1 tracking-wide uppercase text-[11px]">Correct Answer</span>
                                                <span className="text-zinc-700 dark:text-zinc-300 p-3 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30">{q.options[q.correct_index]}</span>
                                            </div>
                                        </div>
                                    )}
                                    {q.explanation && (
                                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                                <span className="text-blue-500 font-bold flex items-center gap-1.5 mb-2 text-sm"><Sparkles size={16}/> Knowledge Oracle Explanation:</span>
                                                <div className="text-zinc-700 dark:text-zinc-300 prose prose-sm dark:prose-invert max-w-none [&_p]:mb-0">
                                                    <Markdown components={markdownComponents}>{q.explanation}</Markdown>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {status !== 'Locked' ? (
                <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/80 dark:bg-zinc-900/80 mt-auto shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10 sticky bottom-0">
                    <Button
                        size="lg"
                        className={`w-full text-lg font-bold py-6 shadow-2xl transition-transform active:scale-95 rounded-xl border-4 ${status === 'Mastered'
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-50 cursor-not-allowed opacity-80"
                            : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 border-zinc-900/10 dark:border-white/10"
                            }`}
                        onClick={() => status !== 'Mastered' && navigate("/student/quizzes", { state: { skillId: node?.id, skillName: node?.data?.label, courseId: fullCourseData.id, courseTitle: fullCourseData.title, status } })}
                        disabled={status === 'Mastered'}
                    >
                        {status === 'Mastered' ? (
                            <><CheckCircle2 className="mr-2" size={20} /> Content Mastered</>
                        ) : (
                            "Take Verification Quiz"
                        )}
                    </Button>
                </div>
            ) : (
                <div className="p-6 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/80 dark:bg-zinc-900/80 mt-auto shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10 sticky bottom-0 text-center">
                    <p className="text-zinc-500 font-bold text-sm tracking-wide">Master prerequisite nodes to unlock the quiz!</p>
                </div>
            )}
        </SheetContent>
    );
}
