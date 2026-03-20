import React, { useMemo } from 'react';
import { ReactFlow, Controls, Background, MiniMap, Handle, Position } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from "@/components/ui/button";
import { Plus, Settings, Save, GripHorizontal } from "lucide-react";

// Educator's Draggable Solid Color Node
function EditorCustomNode({ data }) {
    return (
        <div className="bg-white dark:bg-zinc-900 border-2 border-indigo-500 text-zinc-900 dark:text-zinc-50 font-extrabold rounded-2xl min-w-[180px] shadow-2xl relative group">
            <div className="w-full h-4 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-t-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab top-0 absolute">
                <GripHorizontal size={12} className="text-indigo-500" />
            </div>
            <Handle type="target" position={Position.Top} className="w-16 h-2 bg-indigo-500 rounded-full border-none -top-1" />

            <div className="px-6 py-5 text-center">
                <span className="text-lg tracking-tight">{data.label}</span>
                <div className="mt-2 flex justify-center">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-2 py-1 rounded-md">
                        Complexity: {data.complexity || 5}/10
                    </span>
                </div>
            </div>

            <Handle type="source" position={Position.Bottom} className="w-16 h-2 bg-indigo-500 rounded-full border-none -bottom-1" />
        </div>
    );
}

export default function CurriculumGraphEditor({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onOpenSettings }) {
    const nodeTypes = useMemo(() => ({ editorNode: EditorCustomNode }), []);

    return (
        <div className="w-full h-full relative bg-zinc-50/30 dark:bg-zinc-950">
            {/* FLOATING ACTION BAR OVERLAY */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.1)] rounded-full px-4 py-3 animate-in fade-in slide-in-from-top-8">
                <div className="flex gap-4 pr-6 border-r border-zinc-200 dark:border-zinc-800">
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Nodes</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{nodes.length}</span>
                    </div>
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Edges</span>
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">{edges.length}</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="font-bold rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => { }}>
                        <Plus size={16} className="mr-2 text-indigo-500" /> Add Node
                    </Button>
                    <Button variant="ghost" size="sm" className="font-bold rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={onOpenSettings}>
                        <Settings size={16} className="mr-2 text-zinc-500" /> Settings
                    </Button>
                </div>

                <div className="pl-4">
                    <Button className="font-bold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-full shadow-lg shadow-zinc-900/20 px-6">
                        <Save size={16} className="mr-2" /> Deploy Curriculum
                    </Button>
                </div>
            </div>

            {/* REACT FLOW CANVAS */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodesDraggable={true}
                fitView
                className="w-full h-full"
            >
                <Background variant="dots" gap={20} size={1.5} color="#94a3b8" className="opacity-60 dark:opacity-30 mix-blend-multiply dark:mix-blend-screen" />
                <Controls className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl" />
                <MiniMap className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-2xl mb-4 mr-4" nodeColor="#6366f1" />
            </ReactFlow>
        </div>
    );
}
