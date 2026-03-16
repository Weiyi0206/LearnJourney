import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, UploadCloud, BrainCircuit, Activity, FileText, Video, ArrowUpCircle, Link as LinkIcon, Download, Plus, X, Search, MoreVertical } from "lucide-react";
import { mockCourseData } from "@/data/mockCourseData";

export default function NodeManager() {
    const { courseId, nodeId } = useParams();
    const navigate = useNavigate();

    // Try to find the specific node. Fallback if undefined.
    const node = mockCourseData.nodesData[nodeId] || {
        title: "Unnamed Node",
        description: "No data available",
        analytics: { totalAttempts: 0, failRate: "0%", studentAttempts: [] },
        promptFocus: "Ensure questions are strictly Multiple Choice Questions (MCQ) format. No open-ended or subjective text questions allowed.",
        materials: []
    };

    const [promptFocus, setPromptFocus] = useState(node.promptFocus);
    const [materialType, setMaterialType] = useState("text");
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [filterType, setFilterType] = useState("all");

    // Filter materials
    const filteredMaterials = node.materials.filter(m => filterType === "all" || m.type === filterType);

    const getIconForType = (type) => {
        switch (type) {
            case "video": return <Video size={18} className="text-blue-500" />;
            case "read": return <FileText size={18} className="text-amber-500" />;
            case "file": return <ArrowUpCircle size={18} className="text-emerald-500" />;
            case "link": return <LinkIcon size={18} className="text-pink-500" />;
            default: return <FileText size={18} />;
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case "video": return "Video Embed";
            case "read": return "Markdown Document";
            case "file": return "File Upload";
            case "link": return "External Website Link";
            default: return "Document";
        }
    };

    return (
        <div className="p-4 md:p-8 h-full overflow-auto max-w-7xl mx-auto flex flex-col gap-8">

            {/* Header Bar */}
            <div className="flex items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-6">
                <Button variant="outline" size="icon" className="rounded-xl border-zinc-200 dark:border-zinc-800" onClick={() => navigate(`/educator/courses/${courseId}`)}>
                    <ArrowLeft size={18} />
                </Button>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl dark:bg-indigo-900/40 flex justify-center items-center shadow-inner">
                            <Activity size={24} />
                        </div>
                        {node.title} Management
                    </h1>
                    <p className="text-zinc-500 font-medium text-lg mt-1">Add materials, monitor specific student analytics, and tune the AI engine.</p>
                </div>
            </div>

            {/* SECTION 1: Materials File Manager */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-extrabold flex items-center gap-2">
                        <FileText size={20} className="text-blue-500" /> Concept Materials
                    </h2>

                    {!showUploadForm && (
                        <div className="flex items-center gap-3">
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="w-40 bg-zinc-50 dark:bg-zinc-900 rounded-xl font-bold border-zinc-200 dark:border-zinc-800 focus:ring-0">
                                    <SelectValue placeholder="Filter..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Files</SelectItem>
                                    <SelectItem value="video">Videos</SelectItem>
                                    <SelectItem value="read">Markdown</SelectItem>
                                    <SelectItem value="file">Documents</SelectItem>
                                    <SelectItem value="link">Links</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md gap-2"
                                onClick={() => setShowUploadForm(true)}
                            >
                                <Plus size={16} /> Upload Material
                            </Button>
                        </div>
                    )}
                </div>

                {/* Upload Form Overlay/Section */}
                {showUploadForm && (
                    <Card className="border-indigo-200 dark:border-indigo-900 shadow-xl bg-white dark:bg-zinc-950 overflow-hidden rounded-3xl animate-in fade-in slide-in-from-top-4 relative">
                        <div className="absolute top-0 right-0 p-4">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400" onClick={() => setShowUploadForm(false)}>
                                <X size={20} />
                            </Button>
                        </div>
                        <CardHeader className="bg-indigo-50/50 dark:bg-indigo-900/10 border-b border-indigo-100 dark:border-indigo-900 pb-6">
                            <CardTitle className="text-xl font-extrabold flex items-center gap-2 text-indigo-950 dark:text-indigo-400">
                                <UploadCloud size={20} /> Add New Resource
                            </CardTitle>
                            <CardDescription>Multiple resources can be attached to this node. Select the appropriate format.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Resource Type</Label>
                                    <Select value={materialType} onValueChange={setMaterialType}>
                                        <SelectTrigger className="w-full text-base py-6 font-bold bg-zinc-50 dark:bg-zinc-900 border-2 rounded-xl focus:ring-0 focus:border-indigo-500">
                                            <SelectValue placeholder="Select type..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="text"><div className="flex items-center"><FileText size={16} className="mr-2" /> Markdown Text</div></SelectItem>
                                            <SelectItem value="video"><div className="flex items-center"><Video size={16} className="mr-2" /> Video Embed URL</div></SelectItem>
                                            <SelectItem value="file"><div className="flex items-center"><ArrowUpCircle size={16} className="mr-2" /> File Upload (PDF, Slides)</div></SelectItem>
                                            <SelectItem value="link"><div className="flex items-center"><LinkIcon size={16} className="mr-2" /> Website Link</div></SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {(materialType === "video" || materialType === "link") && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">{materialType === 'video' ? 'YouTube / Embed URL' : 'Website URL'}</Label>
                                        <Input placeholder="https://..." className="text-base py-5 font-bold bg-zinc-50 dark:bg-zinc-900 border-2 rounded-xl focus-visible:ring-0 focus-visible:border-indigo-500" />
                                    </div>
                                )}

                                {materialType === "file" && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                        <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Upload Document</Label>
                                        <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition bg-white dark:bg-zinc-950">
                                            <UploadCloud size={40} className="text-indigo-400 mb-2" />
                                            <p className="font-bold text-indigo-900 dark:text-indigo-300">Click to upload or drag & drop</p>
                                            <p className="text-zinc-500 text-sm mt-1">Supports multiple files (max 25MB each)</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-3 flex flex-col h-full">
                                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                    {materialType === 'text' ? 'Reading Content (Markdown)' : 'Optional Resource Title / Notes'}
                                </Label>
                                <Textarea
                                    placeholder={materialType === 'text' ? "# Introduction\n\nStart writing..." : "Title of the resource..."}
                                    className="flex-grow min-h-[220px] text-base resize-y bg-zinc-50 dark:bg-zinc-900 border-2 rounded-xl focus-visible:ring-0 focus-visible:border-indigo-500 p-4"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 flex justify-end gap-3 rounded-b-3xl">
                            <Button variant="ghost" className="font-bold" onClick={() => setShowUploadForm(false)}>Cancel</Button>
                            <Button size="lg" className="px-8 py-5 text-base font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl gap-2 rounded-xl">
                                Upload to Node
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {/* File Manager Table */}
                {!showUploadForm && (
                    <Card className="shadow-none border border-zinc-200/60 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950">
                        <Table>
                            <TableHeader className="bg-zinc-50/80 dark:bg-zinc-900/40">
                                <TableRow className="hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800">
                                    <TableHead className="font-bold w-[50%]">Name</TableHead>
                                    <TableHead className="font-bold hidden md:table-cell">Type</TableHead>
                                    <TableHead className="font-bold hidden md:table-cell">Date Added</TableHead>
                                    <TableHead className="font-bold text-right">Size</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMaterials.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-zinc-500 font-medium h-48">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <UploadCloud size={32} className="text-zinc-300" />
                                                <p>Directory is empty for this folder type.</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredMaterials.map(m => (
                                        <TableRow key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 cursor-pointer border-b border-zinc-100 dark:border-zinc-900 group transition-colors">
                                            <TableCell className="font-medium py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:bg-white dark:group-hover:bg-zinc-950 transition-colors shadow-sm">
                                                        {getIconForType(m.type)}
                                                    </div>
                                                    <span className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{m.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">
                                                <Badge variant="outline" className="font-semibold bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800">
                                                    {getTypeLabel(m.type)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-zinc-500 font-medium hidden md:table-cell">{m.dateAdded}</TableCell>
                                            <TableCell className="text-right text-zinc-500 font-medium">{m.size}</TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white">
                                                    <MoreVertical size={18} />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                )}
            </div>

            {/* SECTION 2: Analytics Tracking */}
            <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                    <Activity size={20} className="text-amber-500" /> Specific Node Analytics
                </h2>
                <Card className="shadow-none border border-zinc-200/60 dark:border-zinc-800 rounded-3xl flex flex-col bg-white dark:bg-zinc-950">
                    <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 flex flex-row items-center justify-between pb-4 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-t-3xl">
                        <div>
                            <CardTitle className="text-lg font-bold">Quiz Attempt History</CardTitle>
                            <CardDescription>Filtered to show metrics explicitly tied to this node.</CardDescription>
                        </div>
                        <div className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400 font-bold px-4 py-2 rounded-xl flex flex-col items-center">
                            <span className="text-xs uppercase tracking-widest opacity-80">Fail Rate</span>
                            <span className="text-2xl">{node.analytics.failRate}</span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-zinc-50/30 dark:bg-zinc-900/10">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="font-bold py-3 px-6 h-auto">Student Name</TableHead>
                                    <TableHead className="font-bold py-3 h-auto">Date</TableHead>
                                    <TableHead className="font-bold py-3 h-auto text-center">Score</TableHead>
                                    <TableHead className="font-bold py-3 h-auto flex justify-end px-6">Result</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {node.analytics.studentAttempts.map((attempt, index) => (
                                    <TableRow key={index} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/20">
                                        <TableCell className="font-bold px-6 py-3">{attempt.name}</TableCell>
                                        <TableCell className="text-zinc-500 font-medium py-3">{attempt.date}</TableCell>
                                        <TableCell className="font-bold text-center text-zinc-800 dark:text-zinc-200 py-3">{attempt.score}</TableCell>
                                        <TableCell className="text-right px-6 py-3">
                                            <Badge variant="outline" className={
                                                attempt.status === "Passed"
                                                    ? "border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:bg-emerald-900/20 px-3 py-1"
                                                    : "border-red-200 text-red-700 bg-red-50 dark:border-red-800 dark:text-red-400 dark:bg-red-900/20 px-3 py-1"
                                            }>
                                                {attempt.status}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {node.analytics.studentAttempts.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-zinc-500 font-medium">No quiz attempts recorded for this node yet.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* SECTION 3: AI Prompt Tuning */}
            <div className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 pb-12">
                <h2 className="text-2xl font-extrabold flex items-center gap-2">
                    <BrainCircuit size={20} className="text-pink-500" /> Generative Assessment Behavior
                </h2>
                <Card className="shadow-none border border-zinc-200/60 dark:border-zinc-800 rounded-3xl bg-white dark:bg-zinc-950 h-fit">
                    <CardHeader className="pb-6">
                        <CardDescription className="text-base font-medium">
                            Override the global AI behavior specific to testing this node's knowledge. The system strictly mandates Multiple Choice Questions (MCQ) formatting.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Custom System Prompt Addition</Label>
                            <Textarea
                                value={promptFocus}
                                onChange={(e) => setPromptFocus(e.target.value)}
                                className="min-h-[150px] text-lg font-medium bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl focus-visible:ring-0 focus-visible:border-pink-500 p-6 leading-relaxed shadow-inner"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="pt-2 pb-6 px-6 flex justify-between items-center">
                        <div className="flex gap-2 items-center text-xs font-bold uppercase tracking-widest text-zinc-500">
                            <Activity size={12} className="text-emerald-500" /> Structure Validated internally.
                        </div>
                        <Button size="lg" className="px-8 font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-lg rounded-xl">
                            Save Prompt Logic
                        </Button>
                    </CardFooter>
                </Card>
            </div>

        </div>
    );
}
