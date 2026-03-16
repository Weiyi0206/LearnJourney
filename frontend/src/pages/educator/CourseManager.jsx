import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, BarChart3, UploadCloud, Users, AlertTriangle, CheckCircle, Network, FileText, Video, ArrowUpCircle, Link as LinkIcon, Plus, X, MoreVertical } from "lucide-react";

import { ReactFlow, Controls, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { mockCourseData } from "@/data/mockCourseData";

export default function CourseManager() {
    const navigate = useNavigate();
    const { courseId } = useParams();

    const course = mockCourseData;

    const [activeView, setActiveView] = useState("students"); // "students" | "upload"
    const [materialType, setMaterialType] = useState("text");
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [filterType, setFilterType] = useState("all");

    // Filter materials
    const filteredMaterials = (course.generalMaterials || []).filter(m => filterType === "all" || m.type === filterType);

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

    const onNodeClick = (event, node) => {
        navigate(`/educator/courses/${courseId}/nodes/${node.id}`);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden">

            {/* Sticky Header Bar */}
            <div className="flex-none p-4 md:px-8 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/60 dark:border-zinc-800 bg-white dark:bg-zinc-950 z-20">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="rounded-xl border-zinc-200 dark:border-zinc-800" onClick={() => navigate('/educator/dashboard')}>
                        <ArrowLeft size={18} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
                            {course.title}
                            <Badge variant={course.status === "Published" ? "default" : "secondary"} className={course.status === "Published" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400" : ""}>
                                {course.status}
                            </Badge>
                        </h1>
                        <p className="text-zinc-500 font-medium text-sm">Course Overview & Cohort Management.</p>
                    </div>
                </div>
            </div>

            {/* Main Side-by-Side Content */}
            <div className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">

                {/* Left Column: STICKY GRAPH */}
                <div className="w-full lg:w-1/2 xl:w-7/12 h-64 lg:h-full border-b lg:border-b-0 lg:border-r border-zinc-200/60 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 relative group shrink-0">
                    <ReactFlow
                        nodes={course.graph.nodes}
                        edges={course.graph.edges}
                        onNodeClick={onNodeClick}
                        fitView
                        className="w-full h-full font-sans cursor-pointer"
                        nodesDraggable={false}
                    >
                        <Background gap={24} size={2} color="#9ca3af" className="opacity-30 mix-blend-multiply dark:mix-blend-lighten" />
                        <Controls className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-xl overflow-hidden flex flex-col m-4 gap-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="absolute top-4 left-4 z-10 flex gap-2">
                            <div className="bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-xl shadow-sm flex items-center gap-2">
                                <Network size={16} className="text-blue-500" /> Interactive Curriculum Graph
                            </div>
                        </div>

                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                            <div className="bg-zinc-900/80 dark:bg-black/80 text-white backdrop-blur px-4 py-2 rounded-full text-xs font-medium shadow-xl">
                                Click any node to explore student analytics specifically for that concept.
                            </div>
                        </div>
                    </ReactFlow>
                </div>

                {/* Right Column: SCROLLABLE DATA */}
                <div className="w-full lg:w-1/2 xl:w-5/12 h-full overflow-y-auto p-4 md:p-8 bg-white dark:bg-zinc-950">
                    <div className="max-w-3xl mx-auto space-y-6">

                        {/* View Toggles */}
                        <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl shrink-0">
                            <button
                                className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeView === 'students' ? 'bg-white dark:bg-zinc-950 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                onClick={() => setActiveView("students")}
                            >
                                <Users size={16} /> Data Cohort
                            </button>
                            <button
                                className={`flex-1 py-2 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activeView === 'upload' ? 'bg-white dark:bg-zinc-950 shadow-sm text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                                onClick={() => setActiveView("upload")}
                            >
                                <UploadCloud size={16} /> Course Materials
                            </button>
                        </div>

                        {activeView === "students" ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                {/* Bottleneck Warning */}
                                <Card className="border-none shadow-sm bg-gradient-to-br from-red-500/10 to-orange-500/5 dark:from-red-900/20 dark:to-orange-900/10 p-6 rounded-3xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                                        <AlertTriangle size={80} />
                                    </div>
                                    <div className="relative z-10">
                                        <h3 className="font-extrabold flex items-center gap-2 mb-4 text-red-950 dark:text-red-400">
                                            <AlertTriangle size={18} className="text-red-500" /> Need Attention
                                        </h3>
                                        <div className="space-y-2">
                                            {course.generalAnalytics.bottlenecks.map((skill, i) => (
                                                <div
                                                    key={i}
                                                    className="bg-white/80 dark:bg-black/40 backdrop-blur rounded-xl p-3 border border-red-100 dark:border-red-900/30 flex items-center justify-between text-sm cursor-pointer hover:-translate-y-0.5 transition-transform"
                                                    onClick={() => navigate(`/educator/courses/${courseId}/nodes/${skill.id}`)}
                                                >
                                                    <span className="font-bold text-zinc-900 dark:text-zinc-100">{skill.name}</span>
                                                    <span className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 font-bold px-2 py-1 rounded-md text-xs">{skill.failRate} Fail</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </Card>

                                {/* Student Archive Table */}
                                <Card className="shadow-none border border-zinc-200/60 dark:border-zinc-800 rounded-3xl overflow-hidden bg-transparent">
                                    <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 pb-4">
                                        <CardTitle className="text-lg font-bold flex items-center justify-between">
                                            <div className="flex items-center gap-2"><Users size={18} className="text-blue-500" /> Student Progress</div>
                                            <span className="text-zinc-400 text-sm font-medium">{course.generalAnalytics.enrolled} Enrolled</span>
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <Table>
                                            <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/20">
                                                <TableRow className="hover:bg-transparent border-zinc-100 dark:border-zinc-800">
                                                    <TableHead className="font-bold py-4 px-6 h-auto">Student</TableHead>
                                                    <TableHead className="font-bold py-4 h-auto text-center">Graph Mastery</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {course.studentsList.map((student) => (
                                                    <TableRow key={student.id} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 group">
                                                        <TableCell className="py-4 px-6">
                                                            <div className="font-bold text-zinc-900 dark:text-zinc-100">{student.name}</div>
                                                            <div className="text-xs text-zinc-400 font-medium mt-1">Active {student.lastActive}</div>
                                                        </TableCell>
                                                        <TableCell className="py-4 px-4 text-center">
                                                            <div className="flex flex-col items-center gap-2">
                                                                <Badge variant="secondary" className="font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 whitespace-nowrap">
                                                                    {student.completedNodes} / {student.totalNodes} Nodes
                                                                </Badge>
                                                                <div className="flex gap-1 flex-wrap justify-center max-w-[140px]">
                                                                    {student.currentNodes.map(node => (
                                                                        <span key={node} className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
                                                                            {node}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

                                <div className="flex flex-col gap-4">
                                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                                        <h2 className="text-lg font-extrabold flex items-center gap-2">
                                            <FileText size={18} className="text-blue-500" /> File System
                                        </h2>

                                        {!showUploadForm && (
                                            <div className="flex items-center gap-2 w-full lg:w-auto">
                                                <Select value={filterType} onValueChange={setFilterType}>
                                                    <SelectTrigger className="w-full lg:w-32 bg-zinc-50 dark:bg-zinc-900 rounded-lg font-bold text-xs border-zinc-200 dark:border-zinc-800 focus:ring-0">
                                                        <SelectValue placeholder="Filter..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="all">All</SelectItem>
                                                        <SelectItem value="video">Video</SelectItem>
                                                        <SelectItem value="read">Text</SelectItem>
                                                        <SelectItem value="file">File</SelectItem>
                                                        <SelectItem value="link">Link</SelectItem>
                                                    </SelectContent>
                                                </Select>

                                                <Button
                                                    size="sm"
                                                    className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm whitespace-nowrap"
                                                    onClick={() => setShowUploadForm(true)}
                                                >
                                                    <Plus size={14} className="mr-1" /> Add
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-zinc-500 text-sm font-medium">Global resources like course syllabus or welcome videos.</p>
                                </div>

                                {showUploadForm && (
                                    <Card className="shadow-none border border-zinc-200/60 dark:border-zinc-800 rounded-3xl bg-transparent animate-in fade-in slide-in-from-top-2 relative">
                                        <div className="absolute top-0 right-0 p-3 z-10">
                                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400" onClick={() => setShowUploadForm(false)}>
                                                <X size={16} />
                                            </Button>
                                        </div>
                                        <CardHeader className="pb-4 pt-6">
                                            <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                                                Upload Resource
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">

                                            <div className="space-y-2">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Resource Type</Label>
                                                <Select value={materialType} onValueChange={setMaterialType}>
                                                    <SelectTrigger className="w-full text-sm font-bold bg-white dark:bg-zinc-900 border-2 rounded-xl focus:ring-0 focus:border-indigo-500">
                                                        <SelectValue placeholder="Select type..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="text"><div className="flex items-center"><FileText size={14} className="mr-2" /> Markdown Text</div></SelectItem>
                                                        <SelectItem value="video"><div className="flex items-center"><Video size={14} className="mr-2" /> Video Embed URL</div></SelectItem>
                                                        <SelectItem value="file"><div className="flex items-center"><ArrowUpCircle size={14} className="mr-2" /> File Upload</div></SelectItem>
                                                        <SelectItem value="link"><div className="flex items-center"><LinkIcon size={14} className="mr-2" /> Website Link</div></SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {(materialType === "video" || materialType === "link") && (
                                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">{materialType === 'video' ? 'YouTube / Embed URL' : 'Website URL'}</Label>
                                                    <Input placeholder="https://..." className="text-sm font-bold bg-white dark:bg-zinc-900 border-2 rounded-xl focus-visible:ring-0 focus-visible:border-indigo-500" />
                                                </div>
                                            )}

                                            {materialType === "file" && (
                                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                                    <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">Upload Document</Label>
                                                    <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition">
                                                        <UploadCloud size={24} className="text-zinc-400 mb-2" />
                                                        <p className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Click or drag & drop</p>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="space-y-2 flex flex-col h-full">
                                                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                                    {materialType === 'text' ? 'Reading Content (Markdown)' : 'Optional Resource Title'}
                                                </Label>
                                                <Textarea
                                                    placeholder={materialType === 'text' ? "# Introduction\n\nStart writing..." : "Title of the resource..."}
                                                    className="flex-grow min-h-[120px] text-sm resize-y bg-white dark:bg-zinc-900 border-2 rounded-xl focus-visible:ring-0 focus-visible:border-indigo-500 p-3"
                                                />
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20 rounded-b-3xl">
                                            <Button className="w-full text-sm font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 shadow-sm gap-2 rounded-xl">
                                                <CheckCircle size={16} /> Publish Resource
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                )}

                                {!showUploadForm && (
                                    <Card className="shadow-none border border-zinc-200/60 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950">
                                        <Table>
                                            <TableHeader className="bg-zinc-50/80 dark:bg-zinc-900/40">
                                                <TableRow className="hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800">
                                                    <TableHead className="font-bold">Name</TableHead>
                                                    <TableHead className="font-bold hidden md:table-cell">Type</TableHead>
                                                    <TableHead className="font-bold text-right hidden lg:table-cell">Size</TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {filteredMaterials.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-8 text-zinc-500 font-medium">
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <FileText size={20} className="text-zinc-300" />
                                                                <p className="text-sm">No materials matching filter.</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    filteredMaterials.map(m => (
                                                        <TableRow key={m.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 cursor-pointer border-b border-zinc-100 dark:border-zinc-900 group transition-colors">
                                                            <TableCell className="font-medium py-3">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg group-hover:bg-white dark:group-hover:bg-zinc-950 transition-colors shadow-sm">
                                                                        {getIconForType(m.type)}
                                                                    </div>
                                                                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{m.name}</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="hidden md:table-cell">
                                                                <Badge variant="outline" className="text-[10px] font-semibold bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800">
                                                                    {getTypeLabel(m.type)}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell className="text-right text-zinc-500 font-medium text-xs hidden lg:table-cell">{m.size}</TableCell>
                                                            <TableCell className="text-right">
                                                                <Button variant="ghost" size="icon" className="rounded-full text-zinc-400 hover:text-zinc-900 dark:hover:text-white h-8 w-8">
                                                                    <MoreVertical size={14} />
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
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
