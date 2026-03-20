import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings2, ShieldCheck, FileKey, Globe, Lock, Link as LinkIcon } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

import CourseArchitectForm from "@/components/graph/CourseArchitectForm";
import CurriculumGraphEditor from "@/components/graph/CurriculumGraphEditor";
import NodeEditorSheet from "@/components/graph/NodeEditorSheet";

export default function CourseCreator() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Core App State
    const [step, setStep] = useState('input'); // 'input' | 'editor'

    // Global Course Metadata
    const [courseInfo, setCourseInfo] = useState({
        title: '',
        description: '',
        visibility: 'public', // 'public' | 'private'
        published: false,
    });

    // Overlays
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNodeEditorOpen, setIsNodeEditorOpen] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState(null);

    // Graph Data State
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    // Node ID Counter
    const [nodeCounter, setNodeCounter] = useState(0);

    // ------- Utility: Check if adding edge would create a cycle -------
    const wouldCreateCycle = useCallback((sourceId, targetId, currentEdges) => {
        // BFS/DFS from targetId to see if we can reach sourceId
        // If yes, adding sourceId -> targetId would create a cycle
        const adjacency = {};
        currentEdges.forEach(e => {
            if (!adjacency[e.source]) adjacency[e.source] = [];
            adjacency[e.source].push(e.target);
        });

        const visited = new Set();
        const queue = [targetId];
        while (queue.length > 0) {
            const current = queue.shift();
            if (current === sourceId) return true; // cycle detected
            if (visited.has(current)) continue;
            visited.add(current);
            const neighbors = adjacency[current] || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    queue.push(neighbor);
                }
            }
        }
        return false;
    }, []);

    // ------- Utility: Check if edge already exists (non-repeatable) -------
    const edgeExists = useCallback((sourceId, targetId, currentEdges) => {
        return currentEdges.some(e =>
            (e.source === sourceId && e.target === targetId) ||
            (e.source === targetId && e.target === sourceId)
        );
    }, []);

    // Handlers: Form
    const handleGenerate = (data) => {
        setCourseInfo({ ...courseInfo, title: data.title, description: data.description });

        // Mock generation of nodes (complexity removed)
        const mockNodes = [
            { id: 'n1', type: 'editorNode', position: { x: 400, y: 100 }, data: { label: 'Variables & Types' } },
            { id: 'n2', type: 'editorNode', position: { x: 200, y: 250 }, data: { label: 'Conditionals' } },
            { id: 'n3', type: 'editorNode', position: { x: 600, y: 250 }, data: { label: 'Loops' } },
            { id: 'n4', type: 'editorNode', position: { x: 400, y: 400 }, data: { label: 'Functions' } },
        ];
        const mockEdges = [
            { id: 'e1-2', source: 'n1', target: 'n2', animated: true, style: { stroke: '#818cf8', strokeWidth: 3 } },
            { id: 'e1-3', source: 'n1', target: 'n3', animated: true, style: { stroke: '#818cf8', strokeWidth: 3 } },
            { id: 'e2-4', source: 'n2', target: 'n4', animated: true, style: { stroke: '#818cf8', strokeWidth: 3 } },
            { id: 'e3-4', source: 'n3', target: 'n4', animated: true, style: { stroke: '#818cf8', strokeWidth: 3 } },
        ];

        setNodes(mockNodes);
        setEdges(mockEdges);
        setNodeCounter(5); // next id starts at 5
        setStep('editor');
    };

    // Handlers: Graph Edits
    const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

    // Enforce DAG: no cycles, no duplicate/reverse edges
    const onConnect = useCallback((connection) => {
        setEdges((eds) => {
            // Prevent self-loop
            if (connection.source === connection.target) return eds;

            // Prevent duplicate edge (in either direction)
            if (edgeExists(connection.source, connection.target, eds)) return eds;

            // Prevent cycle: if target can already reach source, adding this edge creates a cycle
            if (wouldCreateCycle(connection.source, connection.target, eds)) return eds;

            connection.animated = true;
            connection.style = { stroke: '#818cf8', strokeWidth: 3 };
            return addEdge(connection, eds);
        });
    }, [edgeExists, wouldCreateCycle]);

    const onNodeClick = (event, node) => {
        setSelectedNodeId(node.id);
        setIsNodeEditorOpen(true);
    };

    const updateNodeData = (nodeId, newData) => {
        setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: newData } : n));
        setIsNodeEditorOpen(false);
    };

    const deleteNode = (nodeId) => {
        setNodes(nds => nds.filter(n => n.id !== nodeId));
        setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
        setIsNodeEditorOpen(false);
    };

    // Add Node: creates a new node at center of viewport with a default label
    const addNode = useCallback(() => {
        const newId = `n${nodeCounter}`;
        const offsetX = (Math.random() - 0.5) * 200;
        const offsetY = (Math.random() - 0.5) * 200;
        const newNode = {
            id: newId,
            type: 'editorNode',
            position: { x: 400 + offsetX, y: 300 + offsetY },
            data: { label: `New Concept ${nodeCounter}` },
        };
        setNodes(nds => [...nds, newNode]);
        setNodeCounter(c => c + 1);

        // Immediately open editor for the new node
        setSelectedNodeId(newId);
        setIsNodeEditorOpen(true);
    }, [nodeCounter]);

    // Deploy Curriculum: mark as published and navigate to course page
    const handleDeploy = useCallback(() => {
        const courseId = `course_${Date.now()}`;
        setCourseInfo(prev => ({ ...prev, published: true }));

        // In a real app, this would POST to the backend with:
        // { courseInfo, nodes, edges, visibility }
        // For now, navigate to the course view page
        navigate(`/courses/${courseId}`);
    }, [navigate]);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-zinc-950">

            {/* Top Navigation Strip */}
            <div className="flex-none px-4 md:px-8 py-4 border-b border-zinc-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md z-20 flex justify-between items-center transition-all">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 shrink-0" onClick={() => navigate('/educator/dashboard')}>
                        <ArrowLeft size={18} />
                    </Button>
                    {step === 'editor' && (
                        <div className="flex gap-3 items-center">
                            <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{courseInfo.title}</h1>
                            <Badge variant="secondary" className={`text-[10px] font-bold uppercase tracking-widest ${courseInfo.visibility === 'public' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
                                {courseInfo.visibility === 'public' ? <><Globe size={10} className="mr-1" /> Public</> : <><Lock size={10} className="mr-1" /> Private</>}
                            </Badge>
                        </div>
                    )}
                </div>
            </div>

            {/* Dynamic Content Switching */}
            <div className="flex-1 w-full relative outline-none flex items-stretch min-h-0">
                {step === 'input' && (
                    <div className="w-full h-full overflow-y-auto pb-20">
                        <CourseArchitectForm onGenerate={handleGenerate} />
                    </div>
                )}
                {step === 'editor' && (
                    <CurriculumGraphEditor
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onAddNode={addNode}
                        onDeploy={handleDeploy}
                    />
                )}
            </div>

            {/* Float UI Panels */}
            {step === 'editor' && (
                <Sheet open={isNodeEditorOpen} onOpenChange={setIsNodeEditorOpen}>
                    <NodeEditorSheet
                        node={nodes.find(n => n.id === selectedNodeId)}
                        onUpdateNode={updateNodeData}
                        onDeleteNode={deleteNode}
                    />
                </Sheet>
            )}

            {/* Course Global Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-xl md:max-w-2xl overflow-hidden rounded-[2rem] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-8">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-2"><Settings2 size={14} /> Course Parameters</div>
                        <DialogTitle className="text-3xl font-extrabold tracking-tight">Configuration Profile</DialogTitle>
                        <DialogDescription className="text-base font-medium">Protect and modify global properties for your generated curriculum map.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-6 pb-8">
                        <div className="space-y-3">
                            <Label className="uppercase tracking-widest text-[10px] font-black text-zinc-500">Course Identifier / Title</Label>
                            <Input value={courseInfo.title} onChange={(e) => setCourseInfo({ ...courseInfo, title: e.target.value })} className="h-14 font-bold text-lg border-2 rounded-xl focus-visible:ring-indigo-500" />
                        </div>
                        <div className="space-y-3">
                            <Label className="uppercase tracking-widest text-[10px] font-black text-zinc-500">Curriculum Description</Label>
                            <Textarea value={courseInfo.description} onChange={(e) => setCourseInfo({ ...courseInfo, description: e.target.value })} className="min-h-[120px] font-medium resize-y border-2 rounded-xl focus-visible:ring-indigo-500" />
                        </div>

                        {/* Course Visibility Setting */}
                        <div className="space-y-3">
                            <Label className="uppercase tracking-widest text-[10px] font-black text-zinc-500 flex items-center gap-2"><FileKey size={14} /> Course Visibility</Label>
                            <Select value={courseInfo.visibility} onValueChange={(val) => setCourseInfo({ ...courseInfo, visibility: val })}>
                                <SelectTrigger className="h-14 font-bold border-2 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">
                                        <span className="font-bold flex items-center gap-2 tracking-normal text-emerald-600">
                                            <Globe size={14} /> Public — Anyone can enroll
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="private">
                                        <span className="font-bold flex items-center gap-2 tracking-normal text-zinc-500">
                                            <Lock size={14} /> Private — By link or invitation only
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs font-medium text-zinc-400 pl-1">
                                {courseInfo.visibility === 'public'
                                    ? 'This course will be discoverable and open for anyone to enroll.'
                                    : 'Only users with a direct link or an invitation can access this course.'}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button size="lg" className="w-full font-bold h-14 bg-zinc-900 border-none hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl" onClick={() => setIsSettingsOpen(false)}>
                            <ShieldCheck size={18} className="mr-2" /> Save Settings
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
