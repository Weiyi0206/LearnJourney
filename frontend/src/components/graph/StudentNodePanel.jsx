import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Video, ArrowUpCircle, Link as LinkIcon, CheckCircle2, Book, History, Trophy, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { QuizService } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export default function StudentNodePanel({ node, fullCourseData }) {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [quizHistory, setQuizHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [expandedAttempt, setExpandedAttempt] = useState(null);

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

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
                        ) : status === 'Unlocked' ? (
                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50 px-3 py-1 font-bold text-xs">In Progress</Badge>
                        ) : (
                            <Badge variant="outline" className="text-zinc-400 border-zinc-200 bg-zinc-50 px-3 py-1 font-bold text-xs">Locked</Badge>
                        )}
                    </div>
                    <SheetDescription className="text-base font-medium mt-2">
                        {nodeMetadata.description || "Review the core concepts provided by your educator before attempting verification."}
                    </SheetDescription>
                </SheetHeader>
            </div>

            <div className="flex-grow p-6 space-y-6">
                {/* Learning Materials */}
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

                {/* Quiz History Section */}
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
                                        onClick={() => setExpandedAttempt(expandedAttempt === idx ? null : idx)}
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
                                            {expandedAttempt === idx ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
                                        </div>
                                    </button>

                                    {expandedAttempt === idx && attempt.questions && (
                                        <div className="border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/30 space-y-3 max-h-[300px] overflow-y-auto">
                                            {attempt.questions.map((q, qIdx) => (
                                                <div key={qIdx} className={`p-3 rounded-lg border text-sm ${q.is_correct
                                                    ? "border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/10"
                                                    : "border-red-100 bg-red-50/50 dark:border-red-900/30 dark:bg-red-900/10"
                                                    }`}>
                                                    <div className="flex items-start gap-2 mb-1">
                                                        {q.is_correct
                                                            ? <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                                            : <XCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
                                                        }
                                                        <span className="font-medium text-zinc-800 dark:text-zinc-200 line-clamp-2">{q.question}</span>
                                                    </div>
                                                    {!q.is_correct && (
                                                        <div className="ml-6 mt-1 text-[11px] text-zinc-500">
                                                            <span className="text-red-500 font-bold">Your answer:</span> {q.options[q.selected_index] || "—"}
                                                            <br />
                                                            <span className="text-emerald-600 font-bold">Correct:</span> {q.options[q.correct_index]}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

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
        </SheetContent>
    );
}
