import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CourseService, StudentService, CourseAPI } from "@/lib/apiClient";
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";

// Icons
import { ArrowLeft, Users, Activity, CheckCircle2, Pencil, Settings2, BrainCircuit, Target, ShieldCheck, Loader2, Trash2, MoreVertical, Link as LinkIcon, AlertCircle } from "lucide-react";

// Local Sub-components
import CourseGraph from "@/components/graph/CourseGraph";
import EducatorNodePanel from "@/components/graph/EducatorNodePanel";
import StudentNodePanel from "@/components/graph/StudentNodePanel";
import CurriculumGraphEditor from "@/components/graph/CurriculumGraphEditor";
import NodeEditorSheet from "@/components/graph/NodeEditorSheet";

export default function CourseView() {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const { user, profile } = useAuth();

    const userRole = profile?.role || user?.user_metadata?.role || "student";
    const isEducator = userRole === "educator";

    const [course, setCourse] = useState(null);
    const [displayNodes, setDisplayNodes] = useState([]);
    const [editableNodes, setEditableNodes] = useState([]);
    const [editableEdges, setEditableEdges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditMode, setIsEditMode] = useState(false);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isCourseOwner, setIsCourseOwner] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [nodeCounter, setNodeCounter] = useState(100);
    const [studentStats, setStudentStats] = useState({ mastered: 0, total: 0, percent: 0 });

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [courseQuestionsCount, setCourseQuestionsCount] = useState(20);
    const [coursePassThreshold, setCoursePassThreshold] = useState(70);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const [isUnenrollDialogOpen, setIsUnenrollDialogOpen] = useState(false);
    const [isUnenrolling, setIsUnenrolling] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    const layoutGraph = useCallback((nodes, edges) => {
        const layers = {};
        const indegree = {};
        const adjacency = {};

        nodes.forEach(n => {
            indegree[n.id] = 0;
            adjacency[n.id] = [];
        });

        edges.forEach(e => {
            if (indegree[e.target] !== undefined) indegree[e.target]++;
            if (adjacency[e.source]) adjacency[e.source].push(e.target);
        });

        let currentLayer = 0;
        let queue = Object.keys(indegree).filter(id => indegree[id] === 0);
        const assigned = new Set();

        while (queue.length > 0) {
            layers[currentLayer] = queue;
            const nextQueue = [];
            queue.forEach(id => {
                assigned.add(id);
                adjacency[id].forEach(neighbor => {
                    indegree[neighbor]--;
                    if (indegree[neighbor] === 0) {
                        nextQueue.push(neighbor);
                    }
                });
            });
            queue = nextQueue;
            currentLayer++;
        }

        const unassigned = nodes.filter(n => !assigned.has(n.id)).map(n => n.id);
        if (unassigned.length > 0) {
            layers[currentLayer] = unassigned;
        }

        const xOffset = 300;
        const yOffset = 150;
        const newNodes = [...nodes];

        Object.keys(layers).forEach(layerIdx => {
            const layerNodes = layers[layerIdx];
            const numNodes = layerNodes.length;
            const startY = -((numNodes - 1) * yOffset) / 2;

            layerNodes.forEach((nodeId, idx) => {
                const node = newNodes.find(n => n.id === nodeId);
                if (node) {
                    node.position = { x: parseInt(layerIdx) * xOffset, y: startY + idx * yOffset };
                }
            });
        });

        return newNodes;
    }, []);

    const fetchGraph = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await CourseService.getCourseGraph(courseId);

            const isOwner = isEducator && data.educator_id === user?.id;
            setIsCourseOwner(isOwner);

            let progressMap = {};
            let enrolledTotal = data.skills.length;
            let masteredCount = 0;
            let currentlyEnrolled = false;

            if (!isEducator && user?.id) {
                try {
                    const myCourses = await StudentService.getEnrolledCourses(user.id);
                    currentlyEnrolled = myCourses.some(c => c.id === courseId);

                    if (currentlyEnrolled) {
                        const progData = await StudentService.getProgress(user.id, courseId);
                        progData.forEach(p => {
                            progressMap[p.skill_id] = p.status;
                            if (p.status === 'Mastered') masteredCount++;
                        });
                        const percent = enrolledTotal > 0 ? Math.round((masteredCount / enrolledTotal) * 100) : 0;
                        setStudentStats({ mastered: masteredCount, total: enrolledTotal, percent });
                    }
                } catch (e) {
                    console.warn("Could not fetch progress or enrollment", e);
                }
            }

            setIsEnrolled(currentlyEnrolled || isEducator);

            const mappedEdges = data.prerequisite_edges.map(e => ({
                id: `e-${e.source_skill_id}-${e.target_skill_id}`,
                source: e.source_skill_id,
                target: e.target_skill_id,
                type: 'default',
                animated: true,
                style: { stroke: '#818cf8', strokeWidth: 3 }
            }));

            const mappedNodes = data.skills.map(s => {
                let studentStatus = 'Locked';
                if (!isEducator && currentlyEnrolled) {
                    studentStatus = progressMap[s.id] || 'Locked';
                }

                return {
                    id: s.id,
                    type: 'customNode',
                    position: { x: 0, y: 0 },
                    data: {
                        label: s.name,
                        isEducator,
                        studentStatus,
                        hasAlert: false,
                        isDraggable: false
                    }
                };
            });

            const layedOutNodes = layoutGraph(mappedNodes, mappedEdges);

            let studentsList = [];
            if (isEducator && isOwner) {
                try {
                    studentsList = await StudentService.getCourseRoster(courseId);
                } catch (e) {
                    console.warn("Could not fetch roster", e);
                }
            }

            setCourse({
                ...data,
                title: data.title,
                description: data.description,
                status: data.is_published ? "Published" : "Draft",
                generalAnalytics: { enrolled: studentsList.length },
                studentsList
            });

            setDisplayNodes(layedOutNodes);
            setEditableNodes(layedOutNodes.map(n => ({ ...n, type: 'editorNode' })));
            setEditableEdges(mappedEdges);
        } catch (err) {
            console.error("Failed to fetch course graph:", err);
        } finally {
            setIsLoading(false);
        }
    }, [courseId, isEducator, user?.id, layoutGraph]);

    useEffect(() => {
        fetchGraph();
    }, [fetchGraph]);

    const onNodesChange = useCallback((changes) => setEditableNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEditableEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection) => {
        setEditableEdges((eds) => {
            connection.animated = true;
            connection.style = { stroke: '#818cf8', strokeWidth: 3 };
            return addEdge(connection, eds);
        });
    }, []);

    const handleSaveEdits = useCallback(() => {
        setIsEditMode(false);
    }, []);

    const handleEnroll = async () => {
        if (!user?.id) return;
        setIsEnrolling(true);
        try {
            await StudentService.enroll(user.id, courseId);
            await fetchGraph(); // Refresh to populate nodes and progress mapping
        } catch (err) {
            console.error("Failed to enroll", err);
            alert("Failed to enroll: " + (err.response?.data?.detail || err.message));
        } finally {
            setIsEnrolling(false);
        }
    };

    const handleUnenroll = async () => {
        if (!user?.id) return;
        setIsUnenrolling(true);
        try {
            await StudentService.unenroll(user.id, courseId);
            navigate(`/${userRole}/dashboard`);
        } catch (err) {
            console.error("Failed to unenroll:", err);
            alert("Failed to unenroll: " + (err.response?.data?.detail || err.message));
        } finally {
            setIsUnenrolling(false);
            setIsUnenrollDialogOpen(false);
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}/courses/${courseId}`;
        navigator.clipboard.writeText(link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        setIsMenuOpen(false);
    };

    const onNodeClick = (event, node) => {
        if (!isEducator && !isEnrolled) {
            return;
        }
        setSelectedNode(node);
        setIsSheetOpen(true);
    };

    if (isLoading) {
        return <div className="flex h-full items-center justify-center text-zinc-500 font-medium tracking-widest uppercase text-xs animate-pulse">Loading Course Canvas...</div>;
    }

    if (!course) {
        return <div className="flex h-full items-center justify-center text-red-500 font-bold">Failed to load course.</div>;
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-zinc-950">
            {/* STICKY HEADER */}
            <header className="flex-none p-4 md:px-8 border-b border-zinc-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">

                <div className="flex flex-col md:flex-row md:items-center gap-4 max-w-2xl flex-1">
                    <Button variant="outline" size="icon" className="rounded-xl border-zinc-200 dark:border-zinc-800 shrink-0" onClick={() => navigate(`/${userRole}/dashboard`)}>
                        <ArrowLeft size={18} />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">{course.title}</h1>
                            {isEducator && (
                                <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 font-bold tracking-widest text-[10px] uppercase">
                                    {isCourseOwner ? 'Your Course' : 'External Course'}
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-zinc-500 font-medium line-clamp-1">{course.description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {!isEducator && !isEnrolled && (
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 h-10 rounded-xl transition-all shadow-md"
                            onClick={handleEnroll}
                            disabled={isEnrolling}
                        >
                            {isEnrolling ? <Loader2 size={16} className="mr-2 animate-spin" /> : 'Enroll Now'}
                        </Button>
                    )}

                    {isEducator && isCourseOwner ? (
                        <>
                            <Button variant="outline" className="font-bold rounded-xl border-zinc-200 dark:border-zinc-800 flex gap-2" onClick={() => setIsEditMode(true)}>
                                <Pencil size={16} /> Edit Graph
                            </Button>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-lg rounded-xl flex gap-2">
                                        <Users size={16} /> Cohort Stats
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-3xl overflow-hidden rounded-[2rem]">
                                    {/* Cohort dialog same logic inside... omitted for brevity visually */}
                                    <DialogHeader className="p-4 pb-0">
                                        <DialogTitle className="text-2xl font-extrabold">Student Roster</DialogTitle>
                                    </DialogHeader>
                                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                                        {course?.studentsList?.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Student Name</TableHead>
                                                        <TableHead>Last Active</TableHead>
                                                        <TableHead className="text-center">Nodes Perfected</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {course.studentsList.map(s => (
                                                        <TableRow key={s.id}>
                                                            <TableCell className="font-bold">{s.name}</TableCell>
                                                            <TableCell className="text-sm text-zinc-500">{new Date(s.lastActive).toLocaleDateString()}</TableCell>
                                                            <TableCell className="text-center font-bold text-blue-600">{s.completedNodes} / {s.totalNodes}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <div className="py-12 text-center text-zinc-500">No students enrolled yet.</div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </>
                    ) : null}

                    {/* Progress tracking indicator for enrolled students */}
                    {!isEducator && isEnrolled && (
                        <div className="hidden sm:flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/60 pl-3 pr-6 py-1.5 rounded-full border border-zinc-200/50 dark:border-zinc-800 shadow-inner">
                            <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center text-emerald-500 shadow-sm border border-zinc-100 dark:border-zinc-700">
                                <CheckCircle2 size={20} />
                            </div>
                            <div className="flex flex-col min-w-[120px]">
                                <div className="flex justify-between items-center w-full pb-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mastery</span>
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{studentStats.mastered} / {studentStats.total} Nodes</span>
                                </div>
                                <Progress value={studentStats.percent} className="h-2 bg-zinc-200 dark:bg-zinc-700 [&>div]:bg-emerald-500" />
                            </div>
                        </div>
                    )}

                    {/* Three Dots Menu Settings */}
                    {(isEnrolled || isCourseOwner) && (
                        <div className="relative z-50">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-xl border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900/50 h-10 w-10"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <MoreVertical size={18} />
                            </Button>

                            {isMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                                    <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-2 transform origin-top-right animate-in fade-in zoom-in duration-100">

                                        {isEducator && isCourseOwner && (
                                            <button
                                                className="w-full text-left px-3 py-2.5 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg flex items-center transition-colors"
                                                onClick={copyInviteLink}
                                            >
                                                <LinkIcon size={16} className="mr-2 text-indigo-500" />
                                                {copiedLink ? <span className="text-emerald-500">Copied!</span> : "Copy Invite Link"}
                                            </button>
                                        )}

                                        {!isEducator && isEnrolled && (
                                            <>
                                                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 mt-1">Actions</div>
                                                <button
                                                    className="w-full text-left px-3 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center transition-colors"
                                                    onClick={() => {
                                                        setIsMenuOpen(false);
                                                        setIsUnenrollDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 size={16} className="mr-2" /> Unenroll from Course
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* MAIN CANVAS VIEWPORT */}
            <main className="flex-1 w-full relative outline-none">
                {!isEnrolled && !isEducator && (
                    <div className="absolute inset-x-0 bottom-10 z-10 mx-auto w-fit flex bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800 px-6 py-4 rounded-3xl shadow-2xl items-center gap-3 animate-bounce">
                        <AlertCircle size={20} className="text-indigo-500" />
                        <span className="font-bold">You are viewing a public curriculum preview. Enroll to begin!</span>
                    </div>
                )}

                <CourseGraph
                    nodes={displayNodes}
                    edges={editableEdges}
                    onNodeClick={onNodeClick}
                    isEducator={isEducator}
                />
            </main>

            {/* SIDE PANEL INTERACTIVE OVERLAY */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                {isEducator ? (
                    <EducatorNodePanel node={selectedNode} fullCourseData={course} isCourseOwner={isCourseOwner} />
                ) : (
                    <StudentNodePanel node={selectedNode} fullCourseData={course} />
                )}
            </Sheet>

            {/* Unenroll Confirmation Dialog */}
            <Dialog open={isUnenrollDialogOpen} onOpenChange={setIsUnenrollDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[2rem] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-8 z-[100]">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-widest mb-2"><Trash2 size={14} /> Critical Action</div>
                        <DialogTitle className="text-2xl font-extrabold">Abandon Journey?</DialogTitle>
                        <DialogDescription className="text-base font-medium text-zinc-500 mt-2">
                            Unenrolling permanently deletes your progress and quiz history. <span className="text-red-500 font-bold">This cannot be undone.</span>
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
                        <Button
                            variant="ghost"
                            className="flex-1 font-bold rounded-xl h-12 hover:bg-zinc-100"
                            onClick={() => setIsUnenrollDialogOpen(false)}
                            disabled={isUnenrolling}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 font-bold h-12 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 rounded-xl"
                            onClick={handleUnenroll}
                            disabled={isUnenrolling}
                        >
                            {isUnenrolling ? <Loader2 size={18} className="mr-2 animate-spin" /> : "Yes, Unenroll"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
