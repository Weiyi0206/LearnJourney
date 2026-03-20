import React from 'react';
import { SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Book, FileText, Video, ArrowUpCircle, Link as LinkIcon, AlertTriangle, Send } from "lucide-react";

export default function EducatorNodePanel({ node, fullCourseData }) {
    if (!node) return null;

    const nodeMetadata = fullCourseData.nodesData?.[node.id] || {};
    const analytics = nodeMetadata.analytics || { failRate: '0%', studentAttempts: [] };
    const materials = nodeMetadata.materials || [];

    const getIconForType = (type) => {
        switch (type) {
            case "video": return <Video size={16} className="text-blue-500" />;
            case "read": return <FileText size={16} className="text-amber-500" />;
            case "file": return <ArrowUpCircle size={16} className="text-emerald-500" />;
            case "link": return <LinkIcon size={16} className="text-pink-500" />;
            default: return <FileText size={16} />;
        }
    };

    return (
        <SheetContent className="w-full sm:max-w-md lg:max-w-2xl overflow-y-auto bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 p-0 flex flex-col">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                <SheetHeader>
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-1">
                        <Activity size={14} /> Educator Management Pane
                    </div>
                    <SheetTitle className="text-3xl font-extrabold flex justify-between items-center">
                        {node?.data?.label}
                        <Badge variant="secondary" className="bg-white dark:bg-zinc-900">ID: {node.id}</Badge>
                    </SheetTitle>
                    <SheetDescription className="text-sm font-medium mt-2">
                        {nodeMetadata.description || "Manage course materials and view granular analytics for this specific concept."}
                    </SheetDescription>
                </SheetHeader>
            </div>

            <div className="flex-grow p-6">
                <Tabs defaultValue="materials" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="materials" className="font-bold">Materials</TabsTrigger>
                        <TabsTrigger value="analytics" className="font-bold">Analytics</TabsTrigger>
                    </TabsList>

                    <TabsContent value="materials" className="space-y-6">
                        <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50/50 dark:bg-zinc-900/30">
                            <h4 className="font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-widest text-zinc-500"><Book size={16} /> Upload New Material</h4>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs font-bold">Type</Label>
                                        <Select defaultValue="text">
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
                                        <Input placeholder="E.g. Dynamic Typing Intro" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">Content / Link Address</Label>
                                    <Textarea placeholder="Paste content or direct URL..." className="min-h-[80px]" />
                                </div>
                                <Button className="w-full font-bold"><Send size={16} className="mr-2" /> Publish Resource</Button>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold mb-3 text-sm uppercase tracking-widest text-zinc-500">Current Attachments</h4>
                            {materials.length === 0 ? (
                                <p className="text-zinc-500 font-medium text-sm">No materials added yet.</p>
                            ) : (
                                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                                    <Table>
                                        <TableBody>
                                            {materials.map(m => (
                                                <TableRow key={m.id}>
                                                    <TableCell className="font-medium py-3 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            {getIconForType(m.type)} <span>{m.name}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right text-xs font-bold text-zinc-400 uppercase">{m.type}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </TabsContent>

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
                </Tabs>
            </div>
        </SheetContent>
    );
}
