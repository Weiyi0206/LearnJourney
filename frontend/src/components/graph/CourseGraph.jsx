import React, { useMemo } from 'react';
import { ReactFlow, Controls, Background, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';

export default function CourseGraph({ nodes, edges, onNodeClick, isEducator }) {
    // Only register the custom node type once
    const nodeTypes = useMemo(() => ({ customNode: CustomNode }), []);

    return (
        <div className="w-full h-full relative cursor-pointer bg-zinc-50/50 dark:bg-zinc-950/50 border-t border-zinc-200 dark:border-zinc-800">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                nodesDraggable={false}
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
                    className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-2xl mb-4 mr-4"
                    nodeColor="#94a3b8"
                />
            </ReactFlow>
        </div>
    );
}
