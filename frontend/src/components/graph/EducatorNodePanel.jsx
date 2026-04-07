import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Book, FileText, Video, ArrowUpCircle, Link as LinkIcon, AlertTriangle, Send, Loader2, Trophy, XCircle, Clock, CheckCircle2, Sparkles, ChevronDown, ChevronRight, Target } from "lucide-react";
import Markdown from "react-markdown";
import { MaterialAPI } from "@/lib/apiClient";
import { supabase } from "@/lib/supabase";

const markdownComponents = {
    p: ({ node, ...props }) => <p className="mb-2 last:mb-0 break-words whitespace-normal" {...props} />,
    pre: ({ node, ...props }) => (
        <pre className="mt-4 mb-4 text-left bg-zinc-900 text-zinc-100 border border-zinc-800 p-4 rounded-xl shadow-lg text-xs md:text-sm font-medium font-mono overflow-x-auto w-full max-w-full" {...props} />
    ),
    code(props) {
        const { children, className, node, ...rest } = props;
        const match = /language-(\w+)/.exec(className || '');
        const isBlock = match || String(children).includes('\n');
        if (!isBlock) {
            return <code className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/40 px-1 py-0.5 rounded break-words whitespace-normal break-all" {...rest}>{children}</code>;
        }
        return <code className="bg-transparent text-inherit p-0 font-mono" {...rest}>{children}</code>;
    }
};

// ── Helper ──
const formatAttemptDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
};

export default function EducatorNodePanel({ node, fullCourseData, isCourseOwner = true }) {
    if (!node) return null;

    const nodeMetadata = fullCourseData.nodesData?.[node.id] || {};
    const analytics = nodeMetadata.analytics || { failRate: '0%', studentAttempts: [] };
    const materials = nodeMetadata.materials || [];

    const [localMaterials, setLocalMaterials] = useState(materials);
    const [localAnalytics, setLocalAnalytics] = useState({ passingRate: '0%', studentAttempts: [] });
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [expandedAttemptId, setExpandedAttemptId] = useState(null);
    
    // Upload Form State
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [newType, setNewType] = useState('text');
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newFile, setNewFile] = useState(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    // Hydrate Materials
    useEffect(() => {
        setLocalMaterials(nodeMetadata.materials || []);
    }, [node.id, fullCourseData]);

    // Hydrate Analytics dynamically from Supabase
    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!isCourseOwner) return;
            setLoadingAnalytics(true);
            try {
                // Primary query with profiles join
                let res = await supabase.from("quiz_attempts").select("*, profiles(full_name)").eq("skill_id", node.id).order("created_at", { ascending: false });
                
                // Fallback if profiles table relationship errors out
                if (res.error) {
                    res = await supabase.from("quiz_attempts").select("*").eq("skill_id", node.id).order("created_at", { ascending: false });
                }

                const data = res.data || [];
                if (data.length === 0) {
                    setLocalAnalytics({ passingRate: '0%', studentAttempts: [] });
                    return;
                }
                
                const passed = data.filter(d => d.passed).length;
                const passingRate = Math.round((passed / data.length) * 100) + "%";
                
                const attempts = data.map(d => ({
                    ...d,
                    name: d.profiles?.full_name || d.student_id?.split('-')[0] + "...",
                    scoreText: `${d.score}/${d.total_questions}`,
                    status: d.passed ? 'Passed' : 'Failed'
                }));
                
                setLocalAnalytics({ passingRate, studentAttempts: attempts });
            } catch (err) {
                console.error("Failed to fetch analytics:", err);
            } finally {
                setLoadingAnalytics(false);
            }
        };
        fetchAnalytics();
    }, [node.id, isCourseOwner]);

    const handlePublish = async () => {
        if (!newTitle.trim()) {
            return alert("Material Title is required.");
        }
        
        let finalContent = newContent;

        if (newType === 'file') {
            if (!newFile) return alert("Please select a file to upload.");
            setIsPublishing(true);
            try {
                const fileExt = newFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `${node.id}/${fileName}`;
                
                const { error: uploadError } = await supabase.storage.from('materials').upload(filePath, newFile);
                if (uploadError) throw uploadError;
                
                const { data } = supabase.storage.from('materials').getPublicUrl(filePath);
                finalContent = data.publicUrl;
            } catch (err) {
                setIsPublishing(false);
                return alert("Failed to upload file: " + err.message);
            }
        } else if (!finalContent.trim()) {
            return alert("Content or URL is required.");
        }

        setIsPublishing(true);
        try {
            const added = await MaterialAPI.createMaterial(node.id, {
                title: newTitle,
                type: newType,
                content: finalContent
            });
            const mat = { ...added, name: added.title || added.name };
            setLocalMaterials(prev => [...prev, mat]);
            setNewTitle('');
            setNewContent('');
            setNewFile(null);
        } catch (error) {
            alert("Failed to publish material: " + (error.response?.data?.detail || error.message));
        } finally {
            setIsPublishing(false);
        }
    };

    const getIconForType = (type) => {
        switch (type) {
            case "video": return <Video size={16} className="text-blue-500" />;
            case "read": return <FileText size={16} className="text-amber-500" />;
            case "file": return <ArrowUpCircle size={16} className="text-emerald-500" />;
            case "link": return <LinkIcon size={16} className="text-pink-500" />;
            default: return <FileText size={16} />;
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
                return m.content.length > 100 ? m.content.substring(0, 100) + '...' : m.content;
            default:
                return m.content;
        }
    };

    const handleOpenMaterial = (m) => {
        if (m.type === 'link' || m.type === 'file') {
            window.open(m.content, "_blank");
        } else {
            setSelectedMaterial(m);
        }
    };

    return (
        <DialogContent className="sm:max-w-2xl lg:max-w-4xl max-h-[95vh] overflow-y-auto premium-scrollbar bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-0 flex flex-col rounded-[2rem] gap-0 shadow-2xl">
            <div className="p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                <DialogHeader>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
                        <Activity size={14} /> Educator Management Pane
                    </div>
                    <DialogTitle className="text-3xl font-extrabold flex justify-between items-center">
                        {node?.data?.label}
                    </DialogTitle>
                    <DialogDescription className="text-sm font-medium mt-2">
                        {node?.data?.description || "Manage course materials and view granular analytics for this specific concept."}
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-4 mt-6">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 dark:text-zinc-500">Quiz Length</span>
                        <Badge variant="outline" className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-xs font-bold py-1 px-3">
                            {node?.data?.questions_count || 20} Questions
                        </Badge>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-tighter text-zinc-400 dark:text-zinc-500">Mastery Bar</span>
                        <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold py-1 px-3">
                            {node?.data?.pass_threshold || 60}% to Pass
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="flex-grow p-6 md:p-8">
                <Tabs defaultValue="materials" className="w-full">
                    <TabsList className={`grid w-full ${isCourseOwner ? 'grid-cols-2' : 'grid-cols-1'} mb-6`}>
                        <TabsTrigger value="materials" className="font-bold">Materials</TabsTrigger>
                        {isCourseOwner && <TabsTrigger value="analytics" className="font-bold">Analytics</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="materials" className="space-y-6">
                        {isCourseOwner && (
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50/50 dark:bg-zinc-900/30 mb-6 transition-all">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-bold flex items-center gap-2 text-sm uppercase tracking-widest text-zinc-500">
                                        <Book size={16} /> Course Materials
                                    </h4>
                                    <Button 
                                        variant={showUploadForm ? "ghost" : "default"} 
                                        size="sm" 
                                        className={showUploadForm ? "text-zinc-500 hover:text-red-500" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md"}
                                        onClick={() => setShowUploadForm(!showUploadForm)}
                                    >
                                        {showUploadForm ? 'Cancel' : '+ Upload Material'}
                                    </Button>
                                </div>
                                
                                {showUploadForm && (
                                    <div className="space-y-4 mt-6 animate-in slide-in-from-top-4 fade-in duration-300 border-t border-zinc-200 dark:border-zinc-800 pt-6">
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold">Type</Label>
                                                <Select value={newType} onValueChange={setNewType}>
                                                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="text">Markdown Text</SelectItem>
                                                        <SelectItem value="video">Video Embed</SelectItem>
                                                        <SelectItem value="file">File Upload</SelectItem>
                                                        <SelectItem value="link">Website Link</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-1">
                                                <Label className="text-xs font-bold">Material Title</Label>
                                                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="E.g. Dynamic Typing Intro" className="h-11" />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">Content / Link Address</Label>
                                            {newType === 'file' ? (
                                                <Input type="file" onChange={e => setNewFile(e.target.files[0])} className="h-11 border-2 dark:bg-zinc-900 flex-1 pt-2 cursor-pointer" />
                                            ) : newType === 'video' || newType === 'link' ? (
                                                <Input value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="https://..." className="h-11 border-2 bg-white dark:bg-zinc-900" />
                                            ) : (
                                                <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Type or paste markdown content..." className="min-h-[120px] border-2 bg-white dark:bg-zinc-900" />
                                            )}
                                        </div>
                                        <Button className="w-full font-bold h-12 rounded-xl mt-2 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handlePublish} disabled={isPublishing}>
                                            {isPublishing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Send size={16} className="mr-2" />} 
                                            {isPublishing ? "Publishing..." : "Publish Resource"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div>
                            <h4 className="font-bold mb-3 text-sm uppercase tracking-widest text-zinc-500">Current Attachments</h4>
                            {localMaterials.length === 0 ? (
                                <p className="text-zinc-500 font-medium text-sm">No materials added yet.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {localMaterials.map(m => (
                                        <div 
                                            key={m.id} 
                                            onDoubleClick={() => handleOpenMaterial(m)}
                                            title={getHoverText(m)}
                                            className="group flex flex-col gap-2 p-4 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm transition-all hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-900/50 cursor-pointer select-none"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="p-2.5 bg-zinc-100 dark:bg-zinc-900 rounded-xl group-hover:scale-110 transition-transform">
                                                    {getIconForType(m.type)}
                                                </div>
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200 truncate">{m.name || m.title}</span>
                                                    <Badge variant="outline" className="w-fit text-[9px] uppercase mt-0.5 font-bold tracking-wider">{m.type}</Badge>
                                                </div>
                                            </div>
                                            <div className="mt-2 text-[11px] font-bold text-zinc-400 dark:text-zinc-600 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                Double-click to open
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {isCourseOwner && (
                        <TabsContent value="analytics" className="space-y-6">
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
                                    <Target size={24} />
                                    <div>
                                        <h4 className="font-bold">Passing Rate</h4>
                                        <p className="text-xs font-medium opacity-80">Students successfully mastering this node</p>
                                    </div>
                                </div>
                                <span className="text-3xl font-black text-emerald-600 tracking-tight">{localAnalytics.passingRate}</span>
                            </div>

                            <div>
                                <h4 className="font-bold mb-3 text-sm uppercase tracking-widest text-zinc-500">Recent Attempt Logs</h4>
                                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                                    {loadingAnalytics ? (
                                        <div className="p-6 text-center text-zinc-500 font-bold text-sm">
                                            <Loader2 size={20} className="animate-spin mx-auto mb-2 text-indigo-500" />
                                            Syncing Analytics...
                                        </div>
                                    ) : localAnalytics.studentAttempts.length === 0 ? (
                                        <div className="p-8 text-center text-zinc-500 font-bold text-sm bg-zinc-50/50 dark:bg-zinc-900/30">
                                            No students have completed a quiz attempt for this node yet.
                                        </div>
                                    ) : (
                                        <Table className="table-fixed w-full">
                                            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/30">
                                                <TableRow>
                                                    <TableHead className="font-bold w-[45%]">Student</TableHead>
                                                    <TableHead className="font-bold w-[35%]">Score</TableHead>
                                                    <TableHead className="font-bold w-[20%] text-right">Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {localAnalytics.studentAttempts.map((attempt) => (
                                                    <React.Fragment key={attempt.id}>
                                                        <TableRow 
                                                            className="cursor-pointer hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors group"
                                                            onClick={() => setExpandedAttemptId(expandedAttemptId === attempt.id ? null : attempt.id)}
                                                        >
                                                            <TableCell className="py-4 text-sm font-bold">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`p-1.5 rounded-md ${attempt.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                                                        {attempt.passed ? <Trophy size={14} /> : <XCircle size={14} />}
                                                                    </div>
                                                                    {attempt.name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-sm font-bold">
                                                                {attempt.scoreText} <span className="text-xs text-zinc-400 font-medium ml-1">({attempt.percentage}%)</span>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Badge variant={attempt.passed ? 'default' : 'destructive'} className={attempt.passed ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[10px] shadow-sm' : 'text-[10px] shadow-sm shadow-red-500/10'}>
                                                                        {attempt.status}
                                                                    </Badge>
                                                                    {expandedAttemptId === attempt.id ? <ChevronDown size={14} className="text-zinc-400" /> : <ChevronRight size={14} className="text-zinc-400" />}
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                        {expandedAttemptId === attempt.id && (
                                                            <TableRow className="bg-zinc-50/80 dark:bg-zinc-900/50 hover:bg-zinc-50/80 shadow-[inset_0_4px_10px_rgba(0,0,0,0.02)]">
                                                                <TableCell colSpan={3} className="p-0 border-b-0">
                                                                    <div className="p-4 md:p-6 space-y-4 max-h-[60vh] overflow-y-auto premium-scrollbar border-t border-zinc-200 dark:border-zinc-800">
                                                                        <div className="flex items-center gap-2 mb-2">
                                                                            <Clock size={12} className="text-zinc-400" />
                                                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Attempted on {formatAttemptDate(attempt.created_at)}</span>
                                                                        </div>
                                                                        {attempt.questions?.map((q, qIdx) => (
                                                                            <div key={qIdx} className={`rounded-2xl border-2 shadow-sm bg-white dark:bg-zinc-950/50 ${q.is_correct ? 'border-emerald-100 dark:border-emerald-900/40' : 'border-red-100 dark:border-red-900/40'}`}>
                                                                                <div className={`p-4 md:p-5 border-b ${q.is_correct ? 'bg-emerald-50/30 border-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-900/20' : 'bg-red-50/30 border-red-50 dark:bg-red-950/20 dark:border-red-900/20'}`}>
                                                                                    <div className="flex items-start gap-3">
                                                                                        <div className="mt-1 shrink-0">
                                                                                            {q.is_correct ? <CheckCircle2 className="text-emerald-500" size={20} /> : <XCircle className="text-red-500" size={20} />}
                                                                                        </div>
                                                                                        <div className="min-w-0 w-full font-bold text-sm text-zinc-800 dark:text-zinc-100 prose prose-sm dark:prose-invert max-w-full">
                                                                                            <Markdown components={markdownComponents}>{q.question}</Markdown>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="p-4 md:p-5 space-y-4">
                                                                                    {q.is_correct ? (
                                                                                        <div className="flex flex-col text-sm font-medium">
                                                                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold mb-1 tracking-wide uppercase text-[10px]">Correct Answer Selected</span>
                                                                                            <div className="text-zinc-700 dark:text-zinc-300 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-800 break-words whitespace-normal w-full">{q.options[q.correct_index]}</div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                            <div className="flex flex-col text-sm font-medium min-w-0 w-full">
                                                                                                <span className="text-red-500 font-bold mb-1 tracking-wide uppercase text-[10px]">Student Answer</span>
                                                                                                <div className="text-zinc-500 p-3 bg-red-50/30 dark:bg-red-950/10 rounded-xl border border-red-100 dark:border-red-900/30 line-through decoration-red-300 dark:decoration-red-800/50 break-words whitespace-normal w-full">{q.options[q.selected_index] || "No answer provided"}</div>
                                                                                            </div>
                                                                                            <div className="flex flex-col text-sm font-medium min-w-0 w-full">
                                                                                                <span className="text-emerald-600 dark:text-emerald-400 font-bold mb-1 tracking-wide uppercase text-[10px]">Correct Answer</span>
                                                                                                <div className="text-zinc-700 dark:text-zinc-300 p-3 bg-emerald-50/30 dark:bg-emerald-950/10 rounded-xl border border-emerald-100 dark:border-emerald-900/30 break-words whitespace-normal w-full">{q.options[q.correct_index]}</div>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                    {q.explanation && (
                                                                                        <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                                                                                            <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                                                                                <span className="text-blue-500 font-bold flex items-center gap-1.5 mb-1.5 text-xs uppercase tracking-widest"><Sparkles size={12}/> AI Explanation</span>
                                                                                                <div className="min-w-0 text-zinc-700 dark:text-zinc-300 prose prose-sm dark:prose-invert max-w-full [&_p]:mb-0">
                                                                                                    <Markdown components={markdownComponents}>{q.explanation}</Markdown>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </div>

            {/* Material Preview Dialog */}
            <Dialog open={!!selectedMaterial} onOpenChange={(open) => !open && setSelectedMaterial(null)}>
                <DialogContent className="sm:max-w-2xl lg:max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-[2rem]">
                    <DialogHeader className="p-6 md:p-8 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
                        <DialogTitle className="flex items-center gap-3 text-2xl font-black">
                            <Book className="text-indigo-500" />
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
        </DialogContent>
    );
}
