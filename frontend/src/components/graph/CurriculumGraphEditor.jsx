import React, { useMemo } from 'react';
import { ReactFlow, Controls, Background, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from "@/components/ui/button";
import { Plus, Settings, Rocket } from "lucide-react";

// Re-use the shared node component so style is always identical
import CustomNode from './CustomNode';

// Thin wrapper that injects isDraggable=true and isEducator=true
// so CustomNode renders the educator style + drag handle hint
function EditorNode({ data }) {
    return <CustomNode data={{ ...data, isEducator: true, isDraggable: true }} />;
}

export default function CurriculumGraphEditor({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick, onOpenSettings, onAddNode, onDeploy }) {
    const nodeTypes = useMemo(() => ({ editorNode: EditorNode }), []);

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
                    <Button variant="ghost" size="sm" className="font-bold rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={onAddNode}>
                        <Plus size={16} className="mr-2 text-indigo-500" /> Add Node
                    </Button>
                    <Button variant="ghost" size="sm" className="font-bold rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={onOpenSettings}>
                        <Settings size={16} className="mr-2 text-zinc-500" /> Settings
                    </Button>
                </div>

                <div className="pl-4">
                    <Button
                        className="font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg shadow-indigo-500/20 px-6"
                        onClick={onDeploy}
                    >
                        <Rocket size={16} className="mr-2" /> Deploy Curriculum
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
