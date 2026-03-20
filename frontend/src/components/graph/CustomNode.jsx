import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, Lock, AlertCircle } from 'lucide-react';

export default function CustomNode({ data }) {
    const { label, isEducator, status, hasAlert } = data;

    // Student View Styling
    if (!isEducator) {
        if (status === 'Mastered') {
            return (
                <div className="bg-emerald-500 text-white font-black rounded-2xl px-6 py-4 shadow-[0_0_20px_rgba(16,185,129,0.3)] min-w-[140px] flex items-center justify-between border-2 border-transparent">
                    <Handle type="target" position={Position.Top} className="opacity-0" />
                    <span>{label}</span>
                    <CheckCircle2 size={18} className="text-emerald-100" />
                    <Handle type="source" position={Position.Bottom} className="opacity-0" />
                </div>
            );
        } else if (status === 'Unlocked') {
            return (
                <div className="bg-blue-600 text-white font-black rounded-2xl px-6 py-4 shadow-[0_0_25px_rgba(59,130,246,0.5)] border-4 border-blue-400/30 min-w-[140px] flex items-center justify-between relative">
                    <div className="absolute inset-0 bg-blue-400 rounded-2xl animate-ping opacity-20 pointer-events-none" />
                    <Handle type="target" position={Position.Top} className="opacity-0" />
                    <span className="relative z-10">{label}</span>
                    {/* Glowing dot implies actionable */}
                    <div className="w-3 h-3 bg-white rounded-full relative z-10 shadow-[0_0_10px_white]" />
                    <Handle type="source" position={Position.Bottom} className="opacity-0" />
                </div>
            );
        } else {
            // Locked
            return (
                <div className="bg-zinc-200 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 font-bold rounded-2xl px-6 py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 min-w-[140px] flex items-center justify-between opacity-80 cursor-not-allowed">
                    <Handle type="target" position={Position.Top} className="opacity-0" />
                    <span>{label}</span>
                    <Lock size={16} />
                    <Handle type="source" position={Position.Bottom} className="opacity-0" />
                </div>
            );
        }
    }

    // Educator View Styling
    return (
        <div className={`bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-extrabold rounded-xl px-6 py-4 shadow-lg border-2 min-w-[150px] relative transition-transform hover:scale-105 ${hasAlert ? 'border-red-500 shadow-red-500/10' : 'border-zinc-200 dark:border-zinc-800'}`}>
            <Handle type="target" position={Position.Top} className="w-12 h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full border-none -top-1" />

            <div className="flex justify-between items-center">
                <span>{label}</span>
            </div>

            {hasAlert && (
                <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-full flex items-center gap-1 shadow-md shadow-red-500/40">
                    <AlertCircle size={10} /> High Fail Rate
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="w-12 h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full border-none -bottom-1" />
        </div>
    );
}
