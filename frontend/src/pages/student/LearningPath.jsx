import React from "react";
import { ReactFlow, MiniMap, Controls, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Lock, Play, GitMerge, Compass, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const initialNodes = [
    { id: '1', position: { x: 250, y: 50 }, data: { label: 'Variables', status: 'Mastered' }, style: { backgroundColor: '#10b981', color: 'white', fontWeight: '900', borderRadius: '12px', border: 'none', padding: '10px 20px', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)' } },
    { id: '2', position: { x: 100, y: 150 }, data: { label: 'Loops', status: 'Unlocked' }, style: { backgroundColor: '#3b82f6', color: 'white', fontWeight: '900', borderRadius: '12px', border: 'none', padding: '10px 20px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5)', outline: '4px solid rgba(59, 130, 246, 0.2)' } },
    { id: '3', position: { x: 400, y: 150 }, data: { label: 'Functions', status: 'Unlocked' }, style: { backgroundColor: '#3b82f6', color: 'white', fontWeight: '900', borderRadius: '12px', border: 'none', padding: '10px 20px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.5)', outline: '4px solid rgba(59, 130, 246, 0.2)' } },
    { id: '4', position: { x: 250, y: 250 }, data: { label: 'Classes', status: 'Locked' }, style: { backgroundColor: '#e4e4e7', color: '#a1a1aa', fontWeight: '600', borderRadius: '12px', border: '2px dashed #d4d4d8', padding: '10px 20px' } },
];

const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { strokeWidth: 3, stroke: '#10b981' } },
    { id: 'e1-3', source: '1', target: '3', animated: true, style: { strokeWidth: 3, stroke: '#10b981' } },
    { id: 'e3-4', source: '3', target: '4', animated: false, style: { strokeWidth: 3, stroke: '#e4e4e7' } },
];

export default function LearningPath() {
    const navigate = useNavigate();

    const onNodeClick = (event, node) => {
        if (node.data.status === 'Unlocked') {
            navigate("/student/material", { state: { skillId: node.id, skillName: node.data.label } });
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] p-4 md:p-8 gap-4 overflow-hidden max-w-[1600px] mx-auto">

            {/* Top Bar Bento */}
            <div className="flex flex-col md:flex-row gap-4 shrink-0 mb-2 items-stretch">
                <Card className="flex-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/5 dark:from-emerald-900/30 dark:to-teal-900/10 border-none shadow-none p-6 rounded-3xl flex items-center gap-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <MapPin size={80} />
                    </div>
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl dark:bg-emerald-900/40">
                        <Compass size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Interactive Learning Path</h1>
                        <p className="text-zinc-500 font-medium">Navigate the Knowledge Frontier. Click unlocked nodes to begin.</p>
                    </div>
                </Card>

                {/* Legend Bento */}
                <Card className="w-full md:w-auto p-6 border-zinc-200/60 dark:border-zinc-800 shadow-sm rounded-3xl flex items-center justify-center bg-white dark:bg-zinc-950">
                    <div className="flex gap-6 mt-1">
                        <div className="flex items-center gap-2 text-emerald-600 font-bold tracking-widest text-sm uppercase">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                <CheckCircle2 size={18} />
                            </div> Mastered
                        </div>
                        <div className="flex items-center gap-2 text-blue-600 font-bold tracking-widest text-sm uppercase shadow-blue-500/20 drop-shadow-lg">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center relative">
                                <div className="absolute inset-0 ring-4 ring-blue-500/20 rounded-lg animate-pulse" />
                                <Play size={18} fill="currentColor" />
                            </div> Unlocked
                        </div>
                        <div className="flex items-center gap-2 text-zinc-400 font-bold tracking-widest text-sm uppercase">
                            <div className="w-8 h-8 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex items-center justify-center opacity-70">
                                <Lock size={16} />
                            </div> Locked
                        </div>
                    </div>
                </Card>
            </div>

            {/* Grid containing map and extra stats */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow min-h-0">

                {/* Map Bento spanning main area */}
                <Card className="col-span-1 lg:col-span-3 flex shrink-0 h-full flex-col shadow-xl border-zinc-200/60 dark:border-zinc-800 rounded-3xl overflow-hidden relative">
                    <CardContent className="p-0 flex-grow bg-zinc-50 dark:bg-zinc-950 h-full w-full">
                        <ReactFlow
                            nodes={initialNodes}
                            edges={initialEdges}
                            onNodeClick={onNodeClick}
                            fitView
                            className="w-full h-full font-sans cursor-crosshair"
                            nodesDraggable={false}
                        >
                            <Background gap={20} size={1} color="#cbd5e1" className="opacity-60 mix-blend-multiply dark:mix-blend-screen" />
                            <Controls className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-xl overflow-hidden flex flex-col m-4 gap-1 p-1" />
                            <MiniMap
                                className="bg-white/50 backdrop-blur-xl dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-2xl overflow-hidden mb-4 mr-4"
                                nodeColor="#94a3b8"
                            />
                        </ReactFlow>
                    </CardContent>
                </Card>

                {/* Right Sidebar Bento Stack */}
                <div className="col-span-1 flex flex-col gap-6 h-full">

                    <Card className="bg-zinc-900 dark:bg-zinc-800 border-none shadow-xl text-zinc-100 rounded-3xl p-6 relative overflow-hidden flex-shrink-0">
                        <div className="absolute -bottom-6 -right-6 text-zinc-800 opacity-20 transform -rotate-12">
                            <GitMerge size={140} />
                        </div>
                        <div className="relative z-10 flex flex-col gap-4">
                            <h3 className="text-xl font-bold flex gap-2 items-center"><GitMerge size={20} /> Directed Acyclic Path</h3>
                            <p className="text-zinc-400 font-medium text-sm leading-relaxed">
                                Your learning path is modeled as a DAG. You cannot access a node until all parent prerequisites have been successfully mastered via the AI Quiz.
                            </p>
                        </div>
                    </Card>

                    <Card className="flex-grow bg-white/50 dark:bg-zinc-950/50 backdrop-blur-xl shadow-lg border-zinc-200/60 dark:border-zinc-800 rounded-3xl flex flex-col p-6 overflow-y-auto">
                        <h3 className="font-extrabold text-lg mb-6 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur p-2 rounded-lg -m-2 uppercase tracking-wider text-zinc-500">Upcoming Skills</h3>
                        <div className="space-y-4 flex-grow">
                            {['Generators', 'Decorators', 'Context Managers', 'Regex'].map((skill, i) => (
                                <div key={i} className="flex items-center gap-4 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-not-allowed">
                                    <div className="w-10 h-10 shrink-0 border-2 border-dashed rounded-full flex items-center justify-center">
                                        <Lock size={16} className="text-zinc-400" />
                                    </div>
                                    <span className="font-bold text-zinc-700 dark:text-zinc-300 truncate">{skill}</span>
                                </div>
                            ))}
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}
