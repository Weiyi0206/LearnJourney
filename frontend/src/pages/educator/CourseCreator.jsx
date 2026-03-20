import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save, Settings2, ShieldCheck, FileKey } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import CourseArchitectForm from "@/components/graph/CourseArchitectForm";
import CurriculumGraphEditor from "@/components/graph/CurriculumGraphEditor";
import NodeEditorSheet from "@/components/graph/NodeEditorSheet";

export default function CourseCreator() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Core App State
    const [step, setStep] = useState('input'); // 'input' | 'editor'

    // Global Course Metadata
    const [courseInfo, setCourseInfo] = useState({ title: '', description: '', published: false });

    // Overlays
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isNodeEditorOpen, setIsNodeEditorOpen] = useState(false);
    const [selectedNodeId, setSelectedNodeId] = useState(null);

    // Graph Data State
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    // Handlers: Form
    const handleGenerate = (data) => {
        setCourseInfo({ ...courseInfo, title: data.title, description: data.description });

        // Mock generation of nodes natively in Editor Flow
        // Extracted from hypothetical raw string text into structural graph via AI...
        const mockNodes = [
            { id: 'n1', type: 'editorNode', position: { x: 400, y: 100 }, data: { label: 'Variables & Types', complexity: '3' } },
            { id: 'n2', type: 'editorNode', position: { x: 200, y: 250 }, data: { label: 'Conditionals', complexity: '4' } },
            { id: 'n3', type: 'editorNode', position: { x: 600, y: 250 }, data: { label: 'Loops', complexity: '5' } },
            { id: 'n4', type: 'editorNode', position: { x: 400, y: 400 }, data: { label: 'Functions', complexity: '7' } },
        ];
        const mockEdges = [
            { id: 'e1-2', source: 'n1', target: 'n2', animated: true, style: { stroke: '#818cf8', strokeWidth: 3 } },
            { id: 'e1-3', source: 'n1', target: 'n3', animated: true, style: { stroke: '#818cf8', strokeWidth: 3 } },
            { id: 'e2-4', source: 'n2', target: 'n4', animated: true, style: { stroke: '#818cf8', strokeWidth: 3 } },
            { id: 'e3-4', source: 'n3', target: 'n4', animated: true, style: { stroke: '#818cf8', strokeWidth: 3 } },
        ];

        setNodes(mockNodes);
        setEdges(mockEdges);
        setStep('editor');
    };

    // Handlers: Graph Edits
    const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection) => {
        connection.animated = true;
        connection.style = { stroke: '#818cf8', strokeWidth: 3 };
        setEdges((eds) => addEdge(connection, eds));
    }, []);

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

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-zinc-950">

            {/* Top Navigation Strip */}
            <div className="flex-none px-4 md:px-8 py-4 border-b border-zinc-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md z-20 flex justify-between items-center transition-all">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-500 shrink-0" onClick={() => navigate('/educator/dashboard')}>
                        <ArrowLeft size={18} />
                    </Button>
                    {step === 'editor' && (
                        <div className="flex gap-3 flex-col sm:flex-row sm:items-center">
                            <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">{courseInfo.title}</h1>
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="uppercase tracking-widest text-[10px] font-black text-zinc-500 flex items-center gap-2"><FileKey size={14} /> Privacy State</Label>
                                <Select value={courseInfo.published ? "published" : "draft"} onValueChange={(val) => setCourseInfo({ ...courseInfo, published: val === 'published' })}>
                                    <SelectTrigger className="h-14 font-bold border-2 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft"><span className="font-bold flex items-center tracking-normal text-zinc-500">Private Draft</span></SelectItem>
                                        <SelectItem value="published"><span className="font-bold flex items-center tracking-normal text-emerald-600">Published live</span></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button size="lg" className="w-full font-bold h-14 bg-zinc-900 border-none hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl" onClick={() => setIsSettingsOpen(false)}>
                            <ShieldCheck size={18} className="mr-2" /> Verify Settings
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
