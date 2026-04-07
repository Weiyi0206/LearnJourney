import React, { useMemo, useEffect } from 'react';
import { ReactFlow, Controls, Background, MiniMap, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';

export default function CourseGraph({ nodes, edges, onNodeClick, isEducator }) {
    // Only register the custom node type once
    const nodeTypes = useMemo(() => ({ customNode: CustomNode }), []);

    // Bridge controlled upstream props into local self-measured state 
    // This allows React Flow to inject node dimensions (width/height), which MiniMap requires.
    const [localNodes, setNodes, onNodesChange] = useNodesState(nodes);
    const [localEdges, setEdges, onEdgesChange] = useEdgesState(edges);

    useEffect(() => {
        setNodes(nodes);
        setEdges(edges);
    }, [nodes, edges, setNodes, setEdges]);

    return (
        <div className="w-full h-full relative cursor-pointer bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800">
            <ReactFlow
                nodes={localNodes}
                edges={localEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                nodesDraggable={false}
                defaultEdgeOptions={{ type: 'default' }}
                fitView
                className="w-full h-full"
            >
                <Background
                    gap={24}
                    size={2}
                    color={isEducator ? "#a1a1aa" : "#94a3b8"}
                    className={isEducator ? "opacity-30 mix-blend-multiply dark:mix-blend-lighten" : "opacity-60 mix-blend-multiply dark:mix-blend-screen"}
                />
                <Controls className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl" />
                <MiniMap
                    className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl mb-4 mr-4 overflow-hidden"
                    nodeColor={(n) => {
                        if (isEducator) return "#818cf8"; // Indigo core for educators
                        // Contextual colors for students
                        if (n.data?.studentStatus === 'Mastered') return "#10b981"; // Emerald
                        if (n.data?.studentStatus === 'Unlocked' || n.data?.studentStatus === 'In Progress') return "#3b82f6"; // Blue
                        return "#a1a1aa"; // Zinc/Slate for Locked
                    }}
                    nodeStrokeColor={(n) => {
                        if (isEducator) return "#6366f1";
                        if (n.data?.studentStatus === 'Mastered') return "#059669";
                        if (n.data?.studentStatus === 'Unlocked' || n.data?.studentStatus === 'In Progress') return "#2563eb";
                        return "#71717a";
                    }}
                    nodeStrokeWidth={2}
                    nodeBorderRadius={8}
                    maskColor="rgba(0, 0, 0, 0.05)"
                />
            </ReactFlow>
        </div>
    );
}
