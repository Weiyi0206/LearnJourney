import React, { useState, useCallback, useEffect } from "react";
import { ReactFlow, MiniMap, Controls, Background, addEdge, useNodesState, useEdgesState, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLocation } from "react-router-dom";
import { Award, Target, Save } from "lucide-react";

const initialNodes = [
    { id: '1', position: { x: 250, y: 50 }, data: { label: 'Variables' }, type: 'input' },
    { id: '2', position: { x: 100, y: 150 }, data: { label: 'Loops' } },
    { id: '3', position: { x: 400, y: 150 }, data: { label: 'Functions' } },
    { id: '4', position: { x: 250, y: 250 }, data: { label: 'Classes' }, type: 'output' },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3', animated: true },
    { id: 'e3-4', source: '3', target: '4', animated: true },
];

export default function GraphEditor() {
    const [nodes, setNodes] = useNodesState(initialNodes);
    const [edges, setEdges] = useEdgesState(initialEdges);
    const location = useLocation();
    const { state } = location;

    const onNodesChange = useCallback(
        (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes]
    );

    const onEdgesChange = useCallback(
        (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );

    const onConnect = useCallback(
        (params) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] p-6 gap-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{state?.courseTitle || "Course Prerequisite Graph"}</h1>
                    <p className="text-zinc-500 mt-1">Review and modify the AI-inferred curriculum DAG before publishing.</p>
                </div>
                <Button className="gap-2 shrink-0 px-6 font-semibold" size="lg">
                    <Save size={18} />
                    Publish Course
                </Button>
            </div>

            <Card className="flex-grow flex flex-col shadow-inner overflow-hidden border-zinc-200 dark:border-zinc-800">
                <CardContent className="p-0 flex-grow relative bg-zinc-50 dark:bg-zinc-950/50 h-full w-full">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        fitView
                        className="w-full h-full"
                        defaultEdgeOptions={{
                            style: { strokeWidth: 2, stroke: '#3b82f6' },
                            animated: true
                        }}
                    >
                        <Background gap={24} size={2} color="#9ca3af" className="opacity-20" />
                        <Controls className="bg-white dark:bg-zinc-900 border border-zinc-200 shadow-sm rounded-lg overflow-hidden" />
                        <MiniMap
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 shadow-sm rounded-xl overflow-hidden"
                            nodeColor="#e2e8f0"
                            maskColor="rgba(255, 255, 255, 0.5)"
                        />
                    </ReactFlow>
                </CardContent>
            </Card>
        </div>
    );
}
