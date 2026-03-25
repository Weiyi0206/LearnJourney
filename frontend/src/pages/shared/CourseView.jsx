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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Icons
import { ArrowLeft, Users, Activity, CheckCircle2, Pencil, Eye, Settings2, BrainCircuit, Target, ShieldCheck, Loader2 } from "lucide-react";

// Local Sub-components
import CourseGraph from "@/components/graph/CourseGraph";
import EducatorNodePanel from "@/components/graph/EducatorNodePanel";
import StudentNodePanel from "@/components/graph/StudentNodePanel";
import CurriculumGraphEditor from "@/components/graph/CurriculumGraphEditor";
import NodeEditorSheet from "@/components/graph/NodeEditorSheet";

export default function CourseView() {
    const navigate = useNavigate();
    const { courseId = "course_001" } = useParams();
    const { user, profile } = useAuth();

    // The user's role can come from the persistent profiles table or the JWT metadata
    const userRole = profile?.role || user?.user_metadata?.role || "student";
    const isEducator = userRole === "educator";

    // API Data state
    const [course, setCourse] = useState(null);
    const [displayNodes, setDisplayNodes] = useState([]);
    const [editableNodes, setEditableNodes] = useState([]);
    const [editableEdges, setEditableEdges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Educator: edit mode toggle
    const [isEditMode, setIsEditMode] = useState(false);

    // Modals / Overlays State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [nodeCounter, setNodeCounter] = useState(100);
    const [studentStats, setStudentStats] = useState({ mastered: 0, total: 0, percent: 0 });

    // Settings dialog (for edit mode)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [courseQuestionsCount, setCourseQuestionsCount] = useState(20);
    const [coursePassThreshold, setCoursePassThreshold] = useState(70);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // Simple layout algorithm
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

    useEffect(() => {
        const fetchGraph = async () => {
            try {
                setIsLoading(true);
                const data = await CourseService.getCourseGraph(courseId);

                let progressMap = {};
                let enrolledTotal = data.skills.length;
                let masteredCount = 0;

                if (!isEducator && user?.id) {
                    try {
                        const progData = await StudentService.getProgress(user.id, courseId);
                        progData.forEach(p => {
                            progressMap[p.skill_id] = p.status;
                            if (p.status === 'Mastered') masteredCount++;
                        });
                        const percent = enrolledTotal > 0 ? Math.round((masteredCount / enrolledTotal) * 100) : 0;
                        setStudentStats({ mastered: masteredCount, total: enrolledTotal, percent });
                    } catch (e) {
                        console.warn("Could not fetch progress", e);
                    }
                }

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
                    if (!isEducator) {
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
                            hasAlert: false, // fake stat
                            isDraggable: false
                        }
                    };
                });

                const layedOutNodes = layoutGraph(mappedNodes, mappedEdges);

                // Fetch real roster for educators
                let studentsList = [];
                if (isEducator) {
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
        };
        fetchGraph();
    }, [courseId, isEducator, layoutGraph, user?.id]);

    // ---- DAG helpers for edit mode ----
    const wouldCreateCycle = useCallback((sourceId, targetId, currentEdges) => {
        const adjacency = {};
        currentEdges.forEach(e => {
            if (!adjacency[e.source]) adjacency[e.source] = [];
            adjacency[e.source].push(e.target);
        });
        const visited = new Set();
        const queue = [targetId];
        while (queue.length > 0) {
            const current = queue.shift();
            if (current === sourceId) return true;
            if (visited.has(current)) continue;
            visited.add(current);
            const neighbors = adjacency[current] || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) queue.push(neighbor);
            }
        }
        return false;
    }, []);

    const edgeExists = useCallback((sourceId, targetId, currentEdges) => {
        return currentEdges.some(e =>
            (e.source === sourceId && e.target === targetId) ||
            (e.source === targetId && e.target === sourceId)
        );
    }, []);

    // ---- Edit mode handlers ----
    const onNodesChange = useCallback((changes) => setEditableNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEditableEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection) => {
        setEditableEdges((eds) => {
            if (connection.source === connection.target) return eds;
            if (edgeExists(connection.source, connection.target, eds)) return eds;
            if (wouldCreateCycle(connection.source, connection.target, eds)) return eds;
            connection.animated = true;
            connection.style = { stroke: '#818cf8', strokeWidth: 3 };
            return addEdge(connection, eds);
        });
    }, [edgeExists, wouldCreateCycle]);

    const onEditNodeClick = (event, node) => {
        setSelectedNode(node);
        setIsSheetOpen(true);
    };

    const updateNodeData = (nodeId, newData) => {
        setEditableNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: newData } : n));
        setIsSheetOpen(false);
    };

    const deleteNode = (nodeId) => {
        setEditableNodes(nds => nds.filter(n => n.id !== nodeId));
        setEditableEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
        setIsSheetOpen(false);
    };

    const addNode = useCallback(() => {
        const newId = `n${nodeCounter}`;
        const offsetX = (Math.random() - 0.5) * 200;
        const offsetY = (Math.random() - 0.5) * 200;
        const newNode = {
            id: newId,
            type: 'editorNode',
            position: { x: 300 + offsetX, y: 200 + offsetY },
            data: { label: `New Concept ${nodeCounter}` },
        };
        setEditableNodes(nds => [...nds, newNode]);
        setNodeCounter(c => c + 1);
        setSelectedNode(newNode);
        setIsSheetOpen(true);
    }, [nodeCounter]);

    const handleSaveEdits = useCallback(() => {
        // In a real app, POST the updated graph to backend
        setIsEditMode(false);
    }, []);

    // Event Handler (view mode)
    const onNodeClick = (event, node) => {
        if (!isEducator && node.data?.studentStatus === 'Locked') {
            return; // locked nodes unclickable for students
        }
        setSelectedNode(node);
        setIsSheetOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-zinc-500">
                <p>Loading course content...</p>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex flex-col h-full items-center justify-center text-red-500">
                <p>Failed to load course.</p>
            </div>
        );
    }

    // ---- EDIT MODE RENDER ----
    if (isEducator && isEditMode) {
        return (
            <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-zinc-950">
                {/* Edit Mode Header */}
                <header className="flex-none p-4 md:px-8 border-b border-zinc-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md z-20 flex items-center justify-between gap-4 h-[80px]">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="rounded-xl border-zinc-200 dark:border-zinc-800 shrink-0" onClick={() => setIsEditMode(false)}>
                            <ArrowLeft size={18} />
                        </Button>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-extrabold tracking-tight">{course.title}</h1>
                            <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 font-bold tracking-widest text-[10px] uppercase">
                                <Pencil size={10} className="mr-1" /> Editing
                            </Badge>
                        </div>
                    </div>
                    <Button className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-lg px-6" onClick={handleSaveEdits}>
                        <CheckCircle2 size={16} className="mr-2" /> Save & Publish Changes
                    </Button>
                </header>

                {/* Graph Editor (same component as CourseCreator uses) */}
                <main className="flex-1 w-full relative outline-none">
                    <CurriculumGraphEditor
                        nodes={editableNodes}
                        edges={editableEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onEditNodeClick}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onAddNode={addNode}
                        onDeploy={handleSaveEdits}
                    />
                </main>

                {/* Node Editor Sheet */}
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <NodeEditorSheet
                        node={editableNodes.find(n => n.id === selectedNode?.id)}
                        onUpdateNode={updateNodeData}
                        onDeleteNode={deleteNode}
                    />
                </Sheet>

                {/* Course Settings Dialog (Edit Mode) */}
                <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                    <DialogContent className="sm:max-w-xl md:max-w-2xl overflow-hidden rounded-[2rem] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-8">
                        <DialogHeader>
                            <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-2"><Settings2 size={14} /> Course Quiz Settings</div>
                            <DialogTitle className="text-3xl font-extrabold tracking-tight">Quiz Configuration</DialogTitle>
                            <DialogDescription className="text-base font-medium">Set default quiz parameters for all nodes in this course. You can also override per-node by clicking on individual nodes.</DialogDescription>
                        </DialogHeader>

                        <div className="space-y-8 pt-6 pb-4">
                            {/* Number of Questions */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><BrainCircuit size={14} /> Number of Questions</span>
                                    <span className="text-lg font-black text-blue-600">{courseQuestionsCount}</span>
                                </Label>
                                <input
                                    type="range"
                                    min={5}
                                    max={50}
                                    step={5}
                                    value={courseQuestionsCount}
                                    onChange={(e) => setCourseQuestionsCount(parseInt(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600 bg-zinc-200 dark:bg-zinc-800"
                                />
                                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                    <span>5 min</span>
                                    <span>50 max</span>
                                </div>
                            </div>

                            {/* Pass Threshold */}
                            <div className="space-y-3">
                                <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                                    <span className="flex items-center gap-2"><Target size={14} /> Pass Threshold</span>
                                    <span className="text-lg font-black text-emerald-600">{coursePassThreshold}%</span>
                                </Label>
                                <input
                                    type="range"
                                    min={30}
                                    max={100}
                                    step={5}
                                    value={coursePassThreshold}
                                    onChange={(e) => setCoursePassThreshold(parseInt(e.target.value))}
                                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-600 bg-zinc-200 dark:bg-zinc-800"
                                />
                                <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                    <span>30% min</span>
                                    <span>100% max</span>
                                </div>
                                <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                                    Students must score at or above this percentage to master each node and unlock downstream prerequisites.
                                </p>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                size="lg"
                                className="w-full font-bold h-14 bg-zinc-900 border-none hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl"
                                disabled={isSavingSettings}
                                onClick={async () => {
                                    setIsSavingSettings(true);
                                    try {
                                        // Update all nodes in frontend state
                                        setEditableNodes(nds => nds.map(n => ({
                                            ...n,
                                            data: {
                                                ...n.data,
                                                questions_count: courseQuestionsCount,
                                                pass_threshold: coursePassThreshold
                                            }
                                        })));
                                        // Also persist to DB
                                        await CourseAPI.updateCourseSettings(courseId, {
                                            questions_count: courseQuestionsCount,
                                            pass_threshold: coursePassThreshold
                                        });
                                        setIsSettingsOpen(false);
                                    } catch (err) {
                                        console.error("Failed to save course settings:", err);
                                        alert("Failed to save settings: " + (err.response?.data?.detail || err.message));
                                    } finally {
                                        setIsSavingSettings(false);
                                    }
                                }}
                            >
                                {isSavingSettings ? <><Loader2 size={18} className="mr-2 animate-spin" /> Saving...</> : <><ShieldCheck size={18} className="mr-2" /> Apply to All Nodes</>}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // ---- VIEW MODE RENDER ----
    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-zinc-950">

            {/* 1. STICKY HEADER */}
            <header className="flex-none p-4 md:px-8 border-b border-zinc-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md z-20 flex flex-col md:flex-row md:items-center justify-between gap-4 h-[80px]">
                {/* Left Side: Navigation & Title */}
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" className="rounded-xl border-zinc-200 dark:border-zinc-800 shrink-0" onClick={() => navigate(`/${userRole}/dashboard`)}>
                        <ArrowLeft size={18} />
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-extrabold tracking-tight">{course.title}</h1>
                        <Badge variant={course.status === "Published" ? "default" : "secondary"} className={course.status === "Published" ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-400 font-bold tracking-widest text-[10px] uppercase" : ""}>
                            {course.status}
                        </Badge>
                    </div>
                </div>

                {/* Right Side: Role Specific Stats / Actions */}
                <div className="flex items-center gap-3 shrink-0">
                    {isEducator ? (
                        <>
                            {/* Edit Graph Button */}
                            <Button variant="outline" className="font-bold rounded-xl border-zinc-200 dark:border-zinc-800 flex gap-2" onClick={() => setIsEditMode(true)}>
                                <Pencil size={16} /> Edit Graph
                            </Button>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-lg rounded-xl flex gap-2">
                                        <Users size={16} /> Course Roster & Analytics
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-xl md:max-w-3xl overflow-hidden rounded-[2rem] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                                    <DialogHeader className="p-4 md:p-6 pb-0">
                                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest mb-1"><Activity size={14} /> Cohort Overview</div>
                                        <DialogTitle className="text-2xl font-extrabold flex items-center justify-between">
                                            Student Progress Table <span className="text-zinc-400 text-sm font-medium">{course?.generalAnalytics?.enrolled || 0} Enrolled</span>
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-500 font-medium">Holistic view of current mastery levels across all nodes.</DialogDescription>
                                    </DialogHeader>
                                    <div className="p-4 md:p-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                                        {course?.studentsList?.length > 0 ? (
                                            <Table>
                                                <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                                                    <TableRow className="border-zinc-100 dark:border-zinc-800">
                                                        <TableHead className="font-bold">Student Name</TableHead>
                                                        <TableHead className="font-bold">Last Active</TableHead>
                                                        <TableHead className="font-bold text-center">Mastery Status</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody className="bg-transparent border-t border-zinc-100 dark:border-zinc-800">
                                                    {course?.studentsList?.map((student) => (
                                                        <TableRow key={student.id} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                                                            <TableCell className="font-bold">{student.name}</TableCell>
                                                            <TableCell className="text-sm text-zinc-500">{new Date(student.lastActive).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</TableCell>
                                                            <TableCell className="text-center">
                                                                <Badge variant="secondary" className="font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 whitespace-nowrap px-3 py-1">
                                                                    {student.completedNodes} / {student.totalNodes} Nodes Perfected
                                                                </Badge>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <div className="py-12 text-center text-zinc-400 font-medium">
                                                No students enrolled yet.
                                            </div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </>
                    ) : (
                        <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/60 pl-3 pr-6 py-1.5 rounded-full border border-zinc-200/50 dark:border-zinc-800 shadow-inner">
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
                </div>
            </header>

            {/* 2. MAIN CANVAS VIEWPORT */}
            <main className="flex-1 w-full relative outline-none">
                <CourseGraph
                    nodes={displayNodes}
                    edges={editableEdges} // mappedEdges = editableEdges during read
                    onNodeClick={onNodeClick}
                    isEducator={isEducator}
                />
            </main>

            {/* 3. SIDE PANEL INTERACTIVE OVERLAY */}
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                {isEducator ? (
                    <EducatorNodePanel node={selectedNode} fullCourseData={course} />
                ) : (
                    <StudentNodePanel node={selectedNode} fullCourseData={course} />
                )}
            </Sheet>

        </div>
    );
}
