import React, { useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { mockCourseData } from "@/data/mockCourseData";
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";

// Icons
import { ArrowLeft, Users, Activity, CheckCircle2, Pencil, Eye } from "lucide-react";

// Local Sub-components
import CourseGraph from "@/components/graph/CourseGraph";
import EducatorNodePanel from "@/components/graph/EducatorNodePanel";
import StudentNodePanel from "@/components/graph/StudentNodePanel";
import CurriculumGraphEditor from "@/components/graph/CurriculumGraphEditor";
import NodeEditorSheet from "@/components/graph/NodeEditorSheet";

export default function CourseView() {
    const navigate = useNavigate();
    const { courseId = "course_001" } = useParams();
    const { user } = useAuth();

    // Mock course data logic
    const course = mockCourseData;
    const isEducator = user?.role === "educator";

    // Educator: edit mode toggle
    const [isEditMode, setIsEditMode] = useState(false);

    // Modals / Overlays State
    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);

    // Editable graph state (for educator edit mode)
    const [editableNodes, setEditableNodes] = useState(() =>
        course.graph.nodes.map(n => ({
            ...n,
            type: 'editorNode',
            data: { label: n.data.label },
        }))
    );
    const [editableEdges, setEditableEdges] = useState([...course.graph.edges]);
    const [nodeCounter, setNodeCounter] = useState(100);

    // Settings dialog (for edit mode)
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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

    // Prepare Custom Nodes Payload (view mode)
    const displayNodes = course.graph.nodes.map(n => {
        let hasAlert = false;
        if (isEducator && course.nodesData[n.id]?.analytics?.failRate) {
            const failScore = parseInt(course.nodesData[n.id].analytics.failRate.replace('%', ''));
            if (failScore > 30) hasAlert = true;
        }

        let studentStatus = 'Locked';
        if (!isEducator) {
            if (n.id === '1') studentStatus = 'Mastered';
            else if (n.id === '2' || n.id === '3') studentStatus = 'Unlocked';
        }

        return {
            ...n,
            type: 'customNode',
            style: undefined,          // strip any legacy inline styles from mock data
            data: {
                label: n.data.label,   // only carry through what CustomNode needs
                isEducator,
                studentStatus,
                hasAlert,
                isDraggable: false,    // no drag-handle hint in view mode
            }
        };
    });

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
                        onOpenSettings={() => setIsSettingsOpen(false)}
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
                    <Button variant="outline" size="icon" className="rounded-xl border-zinc-200 dark:border-zinc-800 shrink-0" onClick={() => navigate(`/${user.role}/dashboard`)}>
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
                                            Student Progress Table <span className="text-zinc-400 text-sm font-medium">{course.generalAnalytics.enrolled} Enrolled</span>
                                        </DialogTitle>
                                        <DialogDescription className="text-zinc-500 font-medium">Holistic view of current mastery levels across all nodes.</DialogDescription>
                                    </DialogHeader>
                                    <div className="p-4 md:p-6 max-h-[60vh] overflow-y-auto no-scrollbar">
                                        <Table>
                                            <TableHeader className="bg-zinc-50 dark:bg-zinc-900/50">
                                                <TableRow className="border-zinc-100 dark:border-zinc-800">
                                                    <TableHead className="font-bold">Student Name</TableHead>
                                                    <TableHead className="font-bold">Last Active</TableHead>
                                                    <TableHead className="font-bold text-center">Mastery Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody className="bg-transparent border-t border-zinc-100 dark:border-zinc-800">
                                                {course.studentsList.map((student) => (
                                                    <TableRow key={student.id} className="border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30">
                                                        <TableCell className="font-bold">{student.name}</TableCell>
                                                        <TableCell className="text-sm text-zinc-500">{student.lastActive}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Badge variant="secondary" className="font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 whitespace-nowrap px-3 py-1">
                                                                {student.completedNodes} / {student.totalNodes} Nodes Perfected
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
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
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">1 / 4 Nodes</span>
                                </div>
                                <Progress value={25} className="h-2 bg-zinc-200 dark:bg-zinc-700 [&>div]:bg-emerald-500" />
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* 2. MAIN CANVAS VIEWPORT */}
            <main className="flex-1 w-full relative outline-none">
                <CourseGraph
                    nodes={displayNodes}
                    edges={course.graph.edges}
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
