import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, CheckCircle, Video, FileText, ArrowUpCircle, Link as LinkIcon, Download, Search, MoreVertical, PlayCircle, Lock } from "lucide-react";
import { mockCourseData } from "@/data/mockCourseData";

export default function CourseMaterial() {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location;

    const skillName = state?.skillName || "Functions";

    // Simulate finding the node materials (for mock demonstration)
    const nodeMaterials = mockCourseData.nodesData['3']?.materials || [];

    const [filterType, setFilterType] = useState("all");

    // Filter materials
    const filteredMaterials = nodeMaterials.filter(m => filterType === "all" || m.type === filterType);

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

            <div className="mb-2 border-b border-zinc-200 dark:border-zinc-800 pb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl dark:bg-blue-900/30 shadow-inner">
                            <BookOpen size={24} />
                        </div>
                        {skillName}
                    </h1>
                    <p className="text-zinc-500 mt-2 font-medium text-lg">Master the core concepts before verifying your knowledge.</p>
                </div>
            </div>

            {/* SECTION 1: Materials File Manager (Student Read-Only View) */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-extrabold flex items-center gap-2">
                        <FileText size={20} className="text-blue-500" /> Concept Materials
                    </h2>

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
                    </div>
                </div>

                <Card className="shadow-xl border border-zinc-200/60 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950">
                    <Table>
                        <TableHeader className="bg-zinc-50/80 dark:bg-zinc-900/40">
                            <TableRow className="hover:bg-transparent border-b border-zinc-200 dark:border-zinc-800">
                                <TableHead className="font-bold w-[50%]">Name</TableHead>
                                <TableHead className="font-bold hidden md:table-cell">Type</TableHead>
                                <TableHead className="font-bold hidden md:table-cell">Date Added</TableHead>
                                <TableHead className="font-bold text-right">Size</TableHead>
                                <TableHead className="w-[100px] text-right">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredMaterials.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-zinc-500 font-medium h-48">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FileText size={32} className="text-zinc-300" />
                                            <p>No materials available for this filter.</p>
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
                                                <span className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{m.name}</span>
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
                                            <Button variant="ghost" size="sm" className="font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 dark:text-blue-400 rounded-lg">
                                                {m.type === 'link' || m.type === 'video' ? 'View' : 'Open'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>

            {/* SECTION 2: Launch Generative Quiz Action */}
            <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800 space-y-4">
                <Card className="shadow-lg border-zinc-200/60 dark:border-zinc-800 bg-emerald-50 dark:bg-emerald-950/20 flex flex-col justify-center items-center text-center p-8 border-emerald-200 dark:border-emerald-900/40 relative overflow-hidden group rounded-3xl">
                    <div className="absolute -right-6 -bottom-6 opacity-10 pt-4">
                        <CheckCircle size={180} className="text-emerald-500 group-hover:scale-[1.15] transition-transform duration-700" />
                    </div>
                    <div className="absolute -left-6 top-0 opacity-[0.03] pt-4">
                        <Lock size={120} className="text-emerald-900 group-hover:-translate-y-4 transition-transform duration-1000" />
                    </div>

                    <h3 className="text-3xl font-black tracking-tight text-emerald-950 dark:text-emerald-300 relative z-10">Knowledge Check</h3>
                    <p className="text-emerald-700/80 dark:text-emerald-500/80 font-medium text-lg mb-8 mt-2 relative z-10">Take the Generative AI MCQ test when you feel prepared.</p>

                    <Button
                        size="lg"
                        className="w-full max-w-md bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-8 py-7 text-xl shadow-xl shadow-emerald-600/20 relative z-10 transition-transform active:scale-95 rounded-2xl"
                        onClick={() => navigate("/student/quizzes", { state: { skillId: state?.skillId, skillName } })}
                    >
                        Launch Assessment
                    </Button>
                </Card>
            </div>

        </div>
    );
}
