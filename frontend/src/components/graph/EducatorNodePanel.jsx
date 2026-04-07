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
import { Activity, Book, FileText, Video, ArrowUpCircle, Link as LinkIcon, AlertTriangle, Send, Loader2 } from "lucide-react";
import Markdown from "react-markdown";
import { MaterialAPI } from "@/lib/apiClient";
import { supabase } from "@/lib/supabase";

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

export default function EducatorNodePanel({ node, fullCourseData, isCourseOwner = true }) {
    if (!node) return null;

    const nodeMetadata = fullCourseData.nodesData?.[node.id] || {};
    const analytics = nodeMetadata.analytics || { failRate: '0%', studentAttempts: [] };
    const materials = nodeMetadata.materials || [];

    const [localMaterials, setLocalMaterials] = useState(materials);
    const [newType, setNewType] = useState('text');
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newFile, setNewFile] = useState(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);

    useEffect(() => {
        setLocalMaterials(nodeMetadata.materials || []);
    }, [node.id, fullCourseData]);

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
                        {nodeMetadata.description || "Manage course materials and view granular analytics for this specific concept."}
                    </DialogDescription>
                </DialogHeader>
            </div>

            <div className="flex-grow p-6 md:p-8">
                <Tabs defaultValue="materials" className="w-full">
                    <TabsList className={`grid w-full ${isCourseOwner ? 'grid-cols-2' : 'grid-cols-1'} mb-6`}>
                        <TabsTrigger value="materials" className="font-bold">Materials</TabsTrigger>
                        {isCourseOwner && <TabsTrigger value="analytics" className="font-bold">Analytics</TabsTrigger>}
                    </TabsList>

                    <TabsContent value="materials" className="space-y-6">
                        {isCourseOwner && (
                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50/50 dark:bg-zinc-900/30 mb-6">
                                <h4 className="font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-widest text-zinc-500"><Book size={16} /> Upload New Material</h4>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs font-bold">Type</Label>
                                            <Select value={newType} onValueChange={setNewType}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
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
                                            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="E.g. Dynamic Typing Intro" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">Content / Link Address</Label>
                                        {newType === 'file' ? (
                                            <Input type="file" onChange={e => setNewFile(e.target.files[0])} className="h-12 border-2 dark:bg-zinc-900 flex-1 pt-2.5 cursor-pointer" />
                                        ) : newType === 'video' || newType === 'link' ? (
                                            <Input value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="https://..." className="h-12 border-2 bg-white dark:bg-zinc-900" />
                                        ) : (
                                            <Textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="Type or paste markdown content..." className="min-h-[120px] border-2 bg-white dark:bg-zinc-900" />
                                        )}
                                    </div>
                                    <Button className="w-full font-bold h-12 rounded-xl mt-2" onClick={handlePublish} disabled={isPublishing}>
                                        {isPublishing ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Send size={16} className="mr-2" />} 
                                        {isPublishing ? "Publishing..." : "Publish Resource"}
                                    </Button>
                                </div>
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
                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3 text-red-700 dark:text-red-400">
                                    <AlertTriangle size={24} />
                                    <div>
                                        <h4 className="font-bold">Failure Rate</h4>
                                        <p className="text-xs font-medium opacity-80">Students struggling with this node</p>
                                    </div>
                                </div>
                                <span className="text-3xl font-black text-red-600 tracking-tight">{analytics.failRate}</span>
                            </div>

                            <div>
                                <h4 className="font-bold mb-3 text-sm uppercase tracking-widest text-zinc-500">Recent Attempt Logs</h4>
                                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                                    <Table>
                                        <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/30">
                                            <TableRow>
                                                <TableHead className="font-bold">Student</TableHead>
                                                <TableHead className="font-bold">Score</TableHead>
                                                <TableHead className="font-bold text-right">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {analytics.studentAttempts.map((attempt, i) => (
                                                <TableRow key={i}>
                                                    <TableCell className="py-3 text-sm font-medium">{attempt.name}</TableCell>
                                                    <TableCell className="text-sm font-bold">{attempt.score}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Badge variant={attempt.status === 'Passed' ? 'default' : 'destructive'} className={attempt.status === 'Passed' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs' : 'text-xs'}>
                                                            {attempt.status}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
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
