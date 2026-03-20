import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { CheckCircle2, Lock, AlertCircle, GripHorizontal } from 'lucide-react';

// ─── Shared base node shell ────────────────────────────────────────────────
// Used by: CourseView (educator/student) + CurriculumGraphEditor (add node / generated)
// Keeps a single source-of-truth for the visual design.

export default function CustomNode({ data }) {
    const { label, isEducator, studentStatus, hasAlert, isDraggable } = data;

    // ── STUDENT VIEW ──────────────────────────────────────────────────────
    if (isEducator === false) {
        if (studentStatus === 'Mastered') {
            return (
                <div className="bg-emerald-500 text-white font-black rounded-2xl px-6 py-4 shadow-[0_0_24px_rgba(16,185,129,0.35)] min-w-[160px] flex items-center justify-between gap-4 border-2 border-transparent">
                    <Handle type="target" position={Position.Top} className="opacity-0" />
                    <span className="text-base tracking-tight">{label}</span>
                    <CheckCircle2 size={18} className="text-emerald-100 shrink-0" />
                    <Handle type="source" position={Position.Bottom} className="opacity-0" />
                </div>
            );
        }

        if (studentStatus === 'Unlocked') {
            return (
                <div className="bg-blue-600 text-white font-black rounded-2xl px-6 py-4 shadow-[0_0_28px_rgba(59,130,246,0.5)] border-4 border-blue-400/30 min-w-[160px] flex items-center justify-between gap-4 relative">
                    <div className="absolute inset-0 bg-blue-400 rounded-2xl animate-ping opacity-20 pointer-events-none" />
                    <Handle type="target" position={Position.Top} className="opacity-0" />
                    <span className="relative z-10 text-base tracking-tight">{label}</span>
                    <div className="w-3 h-3 bg-white rounded-full relative z-10 shadow-[0_0_10px_white] shrink-0" />
                    <Handle type="source" position={Position.Bottom} className="opacity-0" />
                </div>
            );
        }

        // Locked
        return (
            <div className="bg-zinc-200 dark:bg-zinc-800/80 text-zinc-400 dark:text-zinc-500 font-bold rounded-2xl px-6 py-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 min-w-[160px] flex items-center justify-between gap-4 opacity-80 cursor-not-allowed">
                <Handle type="target" position={Position.Top} className="opacity-0" />
                <span className="text-base tracking-tight">{label}</span>
                <Lock size={16} className="shrink-0" />
                <Handle type="source" position={Position.Bottom} className="opacity-0" />
            </div>
        );
    }

    // ── EDUCATOR VIEW (view mode in CourseView + CurriculumGraphEditor) ──
    // Single consistent style: white card, indigo border, indigo pill handles
    return (
        <div className={`
            bg-white dark:bg-zinc-900
            border-2 text-zinc-900 dark:text-zinc-50
            font-extrabold rounded-2xl min-w-[180px]
            shadow-[0_4px_24px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)]
            relative group transition-all hover:shadow-[0_6px_32px_rgba(99,102,241,0.18)]
            ${hasAlert
                ? 'border-red-500 shadow-red-500/10'
                : 'border-indigo-400 dark:border-indigo-500'}
        `}>
            {/* Drag handle hint (only visible when draggable) */}
            {isDraggable && (
                <div className="w-full h-4 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-t-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab absolute top-0">
                    <GripHorizontal size={12} className="text-indigo-400" />
                </div>
            )}

            <Handle
                type="target"
                position={Position.Top}
                className="w-16 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full border-none -top-1"
            />

            <div className="px-6 py-5 text-center">
                <span className="text-base tracking-tight">{label}</span>
            </div>

            {/* High fail-rate alert badge */}
            {hasAlert && (
                <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] uppercase font-black tracking-widest px-2 py-1 rounded-full flex items-center gap-1 shadow-md shadow-red-500/40">
                    <AlertCircle size={10} /> High Fail Rate
                </div>
            )}

            <Handle
                type="source"
                position={Position.Bottom}
                className="w-16 h-2 bg-indigo-400 dark:bg-indigo-500 rounded-full border-none -bottom-1"
            />
        </div>
    );
}
