import React, { useState } from "react";
import { ReactFlow, MiniMap, Controls, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Lock, Play } from "lucide-react";

// The status can be 'Locked', 'Unlocked', 'Mastered'
const initialNodes = [
    { id: '1', position: { x: 250, y: 50 }, data: { label: 'Variables', status: 'Mastered' }, style: { backgroundColor: '#10b981', color: 'white', fontWeight: 'bold' } },
    { id: '2', position: { x: 100, y: 150 }, data: { label: 'Loops', status: 'Unlocked' }, style: { backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' } },
    { id: '3', position: { x: 400, y: 150 }, data: { label: 'Functions', status: 'Unlocked' }, style: { backgroundColor: '#3b82f6', color: 'white', fontWeight: 'bold', boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' } },
    { id: '4', position: { x: 250, y: 250 }, data: { label: 'Classes', status: 'Locked' }, style: { backgroundColor: '#e4e4e7', color: '#71717a' } },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { strokeWidth: 2, stroke: '#10b981' } },
    { id: 'e1-3', source: '1', target: '3', animated: true, style: { strokeWidth: 2, stroke: '#10b981' } },
    { id: 'e3-4', source: '3', target: '4', animated: false, style: { strokeWidth: 2, stroke: '#e4e4e7' } },
];

export default function LearningPath() {
    const navigate = useNavigate();

    const onNodeClick = (event, node) => {
        if (node.data.status === 'Unlocked') {
            navigate("/student/material", { state: { skillId: node.id, skillName: node.data.label } });
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] p-6 gap-4 bg-zinc-50 dark:bg-zinc-950">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Learning Path</h1>
                <div className="flex gap-4 mt-3">
                    <span className="flex items-center gap-1.5 text-emerald-600 font-semibold"><CheckCircle2 size={16} /> Mastered</span>
                    <span className="flex items-center gap-1.5 text-blue-600 font-semibold"><Play size={16} /> Unlocked</span>
                    <span className="flex items-center gap-1.5 text-zinc-500 font-semibold"><Lock size={16} /> Locked</span>
                </div>
            </div>

            <Card className="flex-grow flex flex-col shadow-inner overflow-hidden border-zinc-200 dark:border-zinc-800">
                <CardContent className="p-0 flex-grow bg-white dark:bg-black/20 w-full h-full">
                    <ReactFlow
                        nodes={initialNodes}
                        edges={initialEdges}
                        onNodeClick={onNodeClick}
                        fitView
                        className="w-full h-full font-sans"
                    >
                        <Background gap={24} size={2} color="#cbd5e1" className="opacity-50" />
                        <Controls className="bg-white dark:bg-zinc-900 border border-zinc-200 shadow-sm" />
                        <MiniMap
                            className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 shadow-sm rounded-xl overflow-hidden"
                            nodeColor="#e2e8f0"
                        />
                    </ReactFlow>
                </CardContent>
            </Card>
        </div>
    );
}
