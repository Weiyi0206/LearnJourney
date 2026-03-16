import React, { useCallback } from "react";
import { ReactFlow, MiniMap, Controls, Background, addEdge, useNodesState, useEdgesState, applyNodeChanges, applyEdgeChanges } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useLocation } from "react-router-dom";
import { Award, Target, Save, Eye, Layers } from "lucide-react";

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
        <div className="flex flex-col h-[calc(100vh-64px)] p-4 md:p-8 gap-4 overflow-hidden">
            <div className="flex items-center justify-between shrink-0 mb-2">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl dark:bg-indigo-900/30">
                            <Layers size={24} />
                        </div>
                        {state?.courseTitle || "Course Prerequisite Graph"}
                    </h1>
                    <p className="text-zinc-500 mt-2 font-medium">Review and modify the AI-inferred curriculum dependency graph.</p>
                </div>
            </div>

            {/* Bento Grid layout containing Graph Map and Context Tooling */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-grow min-h-0">

                {/* Main Visualizer */}
                <Card className="col-span-1 md:col-span-3 flex shrink-0 h-full flex-col shadow-xl border-zinc-200/60 dark:border-zinc-800 rounded-3xl overflow-hidden relative group">
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                        <div className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm">
                            Graph Engine View
                        </div>
                    </div>
                    <CardContent className="p-0 flex-grow relative bg-zinc-50/50 dark:bg-zinc-950/50 h-full w-full">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            fitView
                            className="w-full h-full font-sans"
                            defaultEdgeOptions={{
                                style: { strokeWidth: 3, stroke: '#6366f1' },
                                animated: true
                            }}
                        >
                            <Background gap={24} size={2} color="#9ca3af" className="opacity-30 mix-blend-multiply dark:mix-blend-lighten" />
                            <Controls className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-xl overflow-hidden flex flex-col m-4 gap-1 p-1" />
                        </ReactFlow>
                    </CardContent>
                </Card>

                {/* Side Toolbar Bento */}
                <div className="col-span-1 flex flex-col gap-6 h-full">

                    {/* Map Stats */}
                    <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-lg bg-zinc-950 text-white border-none rounded-3xl p-6 relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 text-zinc-800">
                            <Target size={120} />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div>
                                <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Nodes Detected</div>
                                <div className="text-4xl font-black">{nodes.length}</div>
                            </div>
                            <div className="bg-zinc-800 h-px w-full" />
                            <div>
                                <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-1">Inferred Edges</div>
                                <div className="text-4xl font-black">{edges.length}</div>
                            </div>
                        </div>
                    </Card>

                    {/* Action Publisher */}
                    <Card className="flex-grow border-zinc-200/60 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-900 rounded-3xl p-6 flex flex-col justify-between">
                        <div>
                            <h3 className="font-extrabold text-xl mb-2">Publish Settings</h3>
                            <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                                Ensure there are no cyclic loops before publishing. Once published, this creates the Knowledge Frontier matrix for students.
                            </p>
                        </div>

                        <div className="space-y-3 mt-4">
                            <Button variant="outline" className="w-full py-6 font-bold rounded-xl border-zinc-300 dark:border-zinc-700 shadow-sm gap-2 text-zinc-700 dark:text-zinc-300">
                                <Eye size={18} /> Preview Experience
                            </Button>
                            <Button className="w-full py-6 font-extrabol rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-600/20 text-lg gap-2">
                                <Save size={20} /> Deploy Curriculum
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
