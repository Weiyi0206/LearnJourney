import React, { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CourseService, StudentService, CourseAPI } from "@/lib/apiClient";
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import { getLayoutedElements } from '@/utils/layoutGraph';

// Shadcn UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Icons
import { ArrowLeft, Users, Activity, CheckCircle2, Pencil, Settings2, BrainCircuit, Target, ShieldCheck, Loader2, Trash2, MoreVertical, Link as LinkIcon, AlertCircle, Globe, Lock, FileKey } from "lucide-react";

// Local Sub-components
import CourseGraph from "@/components/graph/CourseGraph";
import EducatorNodePanel from "@/components/graph/EducatorNodePanel";
import StudentNodePanel from "@/components/graph/StudentNodePanel";
import CurriculumGraphEditor from "@/components/graph/CurriculumGraphEditor";
import NodeEditorSheet from "@/components/graph/NodeEditorSheet";
import DiagnosticWizard from "@/components/diagnostic/DiagnosticWizard";

export default function CourseView() {
    const navigate = useNavigate();
    const { courseId } = useParams();
    const { user, profile } = useAuth();

    const userRole = profile?.role || user?.user_metadata?.role || "student";
    const isEducator = userRole === "educator";

    const [course, setCourse] = useState(null);
    const [displayNodes, setDisplayNodes] = useState([]);
    const [editableNodes, setEditableNodes] = useState([]);
    const [editableEdges, setEditableEdges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isEditMode, setIsEditMode] = useState(false);
    const [committedNodes, setCommittedNodes] = useState([]); // snapshot for cancel
    const [committedEdges, setCommittedEdges] = useState([]);
    const [isEnrolled, setIsEnrolled] = useState(false);
    const [isCourseOwner, setIsCourseOwner] = useState(false);
    const [isEnrolling, setIsEnrolling] = useState(false);

    const [isSheetOpen, setIsSheetOpen] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [nodeCounter, setNodeCounter] = useState(100);
    const [studentStats, setStudentStats] = useState({ mastered: 0, total: 0, percent: 0 });

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [courseTitle, setCourseTitle] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [courseQuestionsCount, setCourseQuestionsCount] = useState(20);
    const [coursePassThreshold, setCoursePassThreshold] = useState(70);
    const [courseVisibility, setCourseVisibility] = useState('public');
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    const [showDiagnosticWizard, setShowDiagnosticWizard] = useState(false);

    const [isUnenrollDialogOpen, setIsUnenrollDialogOpen] = useState(false);
    const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
    const [isUnenrolling, setIsUnenrolling] = useState(false);
    const [isSkipping, setIsSkipping] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);

    const fetchGraph = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await CourseService.getCourseGraph(courseId);

            const isOwner = isEducator && data.educator_id === user?.id;
            setIsCourseOwner(isOwner);

            let progressMap = {};
            let enrolledTotal = data.skills.length;
            let masteredCount = 0;
            let currentlyEnrolled = false;

            if (!isEducator && user?.id) {
                try {
                    const myCourses = await StudentService.getEnrolledCourses(user.id);
                    currentlyEnrolled = myCourses.some(c => c.id === courseId);

                    if (currentlyEnrolled) {
                        const progData = await StudentService.getProgress(user.id, courseId);
                        progData.forEach(p => {
                            progressMap[p.skill_id] = p.status;
                            if (p.status === 'Mastered') masteredCount++;
                        });
                        const percent = enrolledTotal > 0 ? Math.round((masteredCount / enrolledTotal) * 100) : 0;
                        setStudentStats({ mastered: masteredCount, total: enrolledTotal, percent });
                    }
                } catch (e) {
                    console.warn("Could not fetch progress or enrollment", e);
                }
            }

            setIsEnrolled(currentlyEnrolled || isEducator);

            const mappedEdges = data.prerequisite_edges.map(e => ({
                id: `e-${e.source_skill_id}-${e.target_skill_id}`,
                source: e.source_skill_id,
                target: e.target_skill_id,
                type: 'default',
                animated: true,
                style: { stroke: '#818cf8', strokeWidth: 3 }
            }));

            const mappedNodes = data.skills.map(s => {
                let studentStatus = 'Locked';
                if (!isEducator && currentlyEnrolled) {
                    studentStatus = progressMap[s.id] || 'Locked';
                }

                return {
                    id: s.id,
                    type: 'customNode',
                    // Use saved position if it exists, otherwise place at origin for dagre
                    position: {
                        x: s.position_x ?? 0,
                        y: s.position_y ?? 0,
                    },
                    data: {
                        label: s.name,
                        isEducator,
                        studentStatus,
                        hasAlert: false,
                        isDraggable: false,
                        description: s.description,
                        questions_count: s.questions_count,
                        pass_threshold: s.pass_threshold,
                    }
                };
            });

            // Only run dagre if NO node has a saved position yet (first load after AI generation)
            const hasStoredPositions = data.skills.some(
                s => s.position_x !== null && s.position_x !== undefined
            );
            const layedOutNodes = hasStoredPositions
                ? mappedNodes
                : getLayoutedElements(mappedNodes, mappedEdges, 'LR').nodes;

            let studentsList = [];
            if (isEducator && isOwner) {
                try {
                    studentsList = await StudentService.getCourseRoster(courseId);
                } catch (e) {
                    console.warn("Could not fetch roster", e);
                }
            }

            const nodesDataMap = {};
            if (data.materials && Array.isArray(data.materials)) {
                data.materials.forEach(m => {
                    const sid = m.skill_id;
                    if (!nodesDataMap[sid]) nodesDataMap[sid] = { materials: [] };
                    // Replace 'title' with 'name' for the frontend rendering if needed, 
                    // though we can map it here seamlessly.
                    nodesDataMap[sid].materials.push({
                        ...m,
                        name: m.title || m.name
                    });
                });
            }

            setCourse({
                ...data,
                nodesData: nodesDataMap,
                title: data.title,
                description: data.description,
                status: data.is_published ? "Published" : "Draft",
                generalAnalytics: { enrolled: studentsList.length },
                studentsList
            });
            setCourseVisibility(data.is_public ? "public" : "private");

            setDisplayNodes(layedOutNodes);
            // Give editor nodes the correct type and educator flags
            setEditableNodes(layedOutNodes.map(n => ({
                ...n,
                type: 'editorNode',
                data: { ...n.data, isEducator: true, isDraggable: true }
            })));
            setEditableEdges(mappedEdges);
        } catch (err) {
            console.error("Failed to fetch course graph:", err);
        } finally {
            setIsLoading(false);
        }
    }, [courseId, isEducator, user?.id]);

    useEffect(() => {
        fetchGraph();
    }, [fetchGraph]);

    const onNodesChange = useCallback((changes) => setEditableNodes((nds) => applyNodeChanges(changes, nds)), []);
    const onEdgesChange = useCallback((changes) => setEditableEdges((eds) => applyEdgeChanges(changes, eds)), []);
    const onConnect = useCallback((connection) => {
        setEditableEdges((eds) => {
            connection.type = 'default';
            connection.animated = true;
            connection.style = { stroke: '#818cf8', strokeWidth: 3 };
            return addEdge(connection, eds);
        });
    }, []);

    const handleSaveEdits = useCallback(async () => {
        setIsSavingSettings(true);
        try {
            const payload = {
                nodes: editableNodes,
                edges: editableEdges
            };
            await CourseAPI.updateCourseGraph(courseId, payload);
            setIsEditMode(false);
            await fetchGraph(); // Refresh to get real UUID IDs for new nodes
        } catch (error) {
            alert("Failed to save edits: " + (error.response?.data?.detail || error.message));
        } finally {
            setIsSavingSettings(false);
        }
    }, [courseId, editableNodes, editableEdges, fetchGraph]);

    const handleCancelEdits = useCallback(() => {
        // Restore the snapshot taken when edit mode was entered
        setEditableNodes(committedNodes);
        setEditableEdges(committedEdges);
        setIsEditMode(false);
        setIsSheetOpen(false);
    }, [committedNodes, committedEdges]);

    const updateNodeData = useCallback((nodeId, newData) => {
        setEditableNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: newData } : n));
        setIsSheetOpen(false);
    }, []);

    const deleteNode = useCallback((nodeId) => {
        setEditableNodes(nds => nds.filter(n => n.id !== nodeId));
        setEditableEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
        setIsSheetOpen(false);
    }, []);

    const handleEnroll = () => {
        if (!user?.id) return;
        setIsEnrollDialogOpen(true);
    };

    const confirmEnrollment = async (takeDiagnostic) => {
        if (takeDiagnostic) {
            setIsEnrolling(true);
        } else {
            setIsSkipping(true);
        }
        
        try {
            await StudentService.enroll(user.id, courseId);
            setIsEnrollDialogOpen(false);
            await fetchGraph(); // Refresh to populate nodes and progress mapping
            if (takeDiagnostic) {
                setShowDiagnosticWizard(true);
            }
        } catch (err) {
            console.error("Failed to enroll", err);
            alert("Failed to enroll: " + (err.response?.data?.detail || err.message));
        } finally {
            setIsEnrolling(false);
            setIsSkipping(false);
        }
    };

    const handleUnenroll = async () => {
        if (!user?.id) return;
        setIsUnenrolling(true);
        try {
            await StudentService.unenroll(user.id, courseId);
            navigate(`/${userRole}/dashboard`);
        } catch (err) {
            console.error("Failed to unenroll:", err);
            alert("Failed to unenroll: " + (err.response?.data?.detail || err.message));
        } finally {
            setIsUnenrolling(false);
            setIsUnenrollDialogOpen(false);
        }
    };

    const copyInviteLink = () => {
        const link = `${window.location.origin}/courses/${courseId}`;
        navigator.clipboard.writeText(link);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
        setIsMenuOpen(false);
    };

    const onNodeClick = (event, node) => {
        // In edit mode always open the editor sheet
        // In view mode only open if enrolled or is educator
        if (!isEditMode && !isEducator && !isEnrolled) {
            return;
        }
        setSelectedNode(node);
        setIsSheetOpen(true);
    };

    if (isLoading) {
        return <div className="flex h-full items-center justify-center text-zinc-500 font-medium tracking-widest uppercase text-xs animate-pulse">Loading Course Canvas...</div>;
    }

    if (!course) {
        return <div className="flex h-full items-center justify-center text-red-500 font-bold">Failed to load course.</div>;
    }

    return (
        <div className="flex flex-col h-full w-full overflow-hidden bg-white dark:bg-zinc-950">
            {/* STICKY HEADER */}
            <header className="flex-none p-4 md:px-8 border-b border-zinc-200/60 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md z-20 flex flex-col md:flex-row md:items-center justify-between gap-4">

                <div className="flex flex-col md:flex-row md:items-center gap-4 max-w-2xl flex-1">
                    <Button variant="outline" size="icon" className="rounded-xl border-zinc-200 dark:border-zinc-800 shrink-0" onClick={() => navigate(`/${userRole}/dashboard`)}>
                        <ArrowLeft size={18} />
                    </Button>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">{course.title}</h1>
                            {isEducator && (
                                <div className="flex gap-2 items-center">
                                    <Badge variant="secondary" className="bg-zinc-100 dark:bg-zinc-800 font-bold tracking-widest text-[10px] uppercase">
                                        {isCourseOwner ? 'Your Course' : 'External Course'}
                                    </Badge>
                                    {isCourseOwner && (
                                        <Badge variant="secondary" className={`text-[10px] font-bold uppercase tracking-widest flex items-center ${course.is_public ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'}`}>
                                            {course.is_public ? <><Globe size={10} className="mr-1" /> Public</> : <><Lock size={10} className="mr-1" /> Private</>}
                                        </Badge>
                                    )}
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-zinc-500 font-medium">{course.description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    {!isEducator && !isEnrolled && (
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 h-10 rounded-xl transition-all shadow-md"
                            onClick={() => handleEnroll()}
                            disabled={isEnrolling}
                        >
                            {isEnrolling ? <Loader2 size={16} className="mr-2 animate-spin" /> : 'Enroll Now'}
                        </Button>
                    )}

                    {isEducator && isCourseOwner ? (
                        <>
                            <Button variant="outline" className="font-bold rounded-xl border-zinc-200 dark:border-zinc-800 flex gap-2"
                                onClick={() => {
                                    // Snapshot current committed state before entering edit
                                    setCommittedNodes(editableNodes);
                                    setCommittedEdges(editableEdges);
                                    setIsEditMode(true);
                                }}>
                                <Pencil size={16} /> Edit Course
                            </Button>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button className="font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-lg rounded-xl flex gap-2">
                                        <Users size={16} /> Student Stats
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-3xl overflow-hidden rounded-[2rem]" aria-describedby="roster-description">
                                    {/* Cohort dialog same logic inside... omitted for brevity visually */}
                                    <DialogHeader className="p-4 pb-0">
                                        <DialogTitle className="text-2xl font-extrabold">Student Roster</DialogTitle>
                                        <DialogDescription id="roster-description" className="sr-only">View enrolled student progress and analytics</DialogDescription>
                                    </DialogHeader>

                                    {/* ── Summary Stats ── */}
                                    {(() => {
                                        const total = course?.studentsList?.length ?? 0;
                                        const mastered = course?.studentsList?.filter(s => s.totalNodes > 0 && s.completedNodes === s.totalNodes).length ?? 0;
                                        const inProgress = total - mastered;
                                        return (
                                            <div className="grid grid-cols-3 gap-3 px-4 pt-4">
                                                <div className="flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl py-4">
                                                    <span className="text-3xl font-black text-zinc-900 dark:text-zinc-50">{total}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Total Enrolled</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl py-4">
                                                    <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{mastered}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mt-1">Mastered All</span>
                                                </div>
                                                <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-2xl py-4">
                                                    <span className="text-3xl font-black text-blue-600 dark:text-blue-400">{inProgress}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 mt-1">In Progress</span>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    <div className="p-4 max-h-[50vh] overflow-y-auto">
                                        {course?.studentsList?.length > 0 ? (
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Student Name</TableHead>
                                                        <TableHead>Last Active</TableHead>
                                                        <TableHead className="text-center">Nodes Perfected</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {course.studentsList.map(s => (
                                                        <TableRow key={s.id}>
                                                            <TableCell className="font-bold">{s.name}</TableCell>
                                                            <TableCell className="text-sm text-zinc-500">{new Date(s.lastActive).toLocaleDateString()}</TableCell>
                                                            <TableCell className="text-center font-bold text-blue-600">{s.completedNodes} / {s.totalNodes}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        ) : (
                                            <div className="py-12 text-center text-zinc-500">No students enrolled yet.</div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </>
                    ) : null}

                    {/* Progress tracking indicator for enrolled students */}
                    {!isEducator && isEnrolled && (
                        <div className="hidden sm:flex items-center gap-4 bg-zinc-50 dark:bg-zinc-900/60 pl-3 pr-6 py-1.5 rounded-full border border-zinc-200/50 dark:border-zinc-800 shadow-inner">
                            <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center text-emerald-500 shadow-sm border border-zinc-100 dark:border-zinc-700">
                                <CheckCircle2 size={20} />
                            </div>
                            <div className="flex flex-col min-w-[120px]">
                                <div className="flex justify-between items-center w-full pb-1">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Mastery</span>
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{studentStats.mastered} / {studentStats.total} Nodes</span>
                                </div>
                                <Progress value={studentStats.percent} className="h-2 bg-zinc-200 dark:bg-zinc-700 [&>div]:bg-emerald-500" />
                            </div>
                        </div>
                    )}

                    {/* Three Dots Menu Settings */}
                    {(isEnrolled || isCourseOwner) && (
                        <div className="relative z-50">
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-xl border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900/50 h-10 w-10"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                <MoreVertical size={18} />
                            </Button>

                            {isMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                                    <div className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-2 transform origin-top-right animate-in fade-in zoom-in duration-100">

                                        {isEducator && isCourseOwner && (
                                            <button
                                                className="w-full text-left px-3 py-2.5 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg flex items-center transition-colors"
                                                onClick={copyInviteLink}
                                            >
                                                <LinkIcon size={16} className="mr-2 text-indigo-500" />
                                                {copiedLink ? <span className="text-emerald-500">Copied!</span> : "Copy Invite Link"}
                                            </button>
                                        )}

                                        {!isEducator && isEnrolled && (
                                            <>
                                                <div className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1 mt-1">Actions</div>
                                                <button
                                                    className="w-full text-left px-3 py-2.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center transition-colors"
                                                    onClick={() => {
                                                        setIsMenuOpen(false);
                                                        setIsUnenrollDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 size={16} className="mr-2" /> Unenroll from Course
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </header>

            {/* MAIN CANVAS VIEWPORT */}
            <main className="flex-1 w-full relative outline-none">
                {!isEnrolled && !isEducator && (
                    <div className="absolute inset-x-0 bottom-10 z-10 mx-auto w-fit flex bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-200/60 dark:border-zinc-800 px-6 py-4 rounded-3xl shadow-2xl items-center gap-3 animate-bounce">
                        <AlertCircle size={20} className="text-indigo-500" />
                        <span className="font-bold">You are viewing a public curriculum preview. Enroll to begin!</span>
                    </div>
                )}

                {isEditMode ? (
                    <CurriculumGraphEditor 
                        nodes={editableNodes}
                        edges={editableEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onOpenSettings={() => {
                            setCourseTitle(course?.title ?? '');
                            setCourseDescription(course?.description ?? '');
                            setCourseVisibility(course?.is_public ? 'public' : 'private');
                            setIsSettingsOpen(true);
                        }}
                        onAddNode={() => {
                            const newCount = nodeCounter + 1;
                            const newNodeId = `n-${newCount}`;
                            setNodeCounter(newCount);
                            // Place new node near the centre of the existing graph
                            const xs = editableNodes.map(n => n.position?.x ?? 0);
                            const ys = editableNodes.map(n => n.position?.y ?? 0);
                            const cx = xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 300;
                            const cy = ys.length ? (Math.min(...ys) + Math.max(...ys)) / 2 : 200;
                            const newNode = {
                                id: newNodeId,
                                type: 'editorNode',
                                position: {
                                    x: cx + (Math.random() - 0.5) * 200,
                                    y: cy + (Math.random() - 0.5) * 200,
                                },
                                data: { label: `New Concept ${newCount}`, isEducator: true, isDraggable: true }
                            };
                            setEditableNodes(nds => [...nds, newNode]);
                            // Immediately open the editor sheet for the new node
                            setSelectedNode(newNode);
                            setIsSheetOpen(true);
                        }}
                        onDeploy={handleSaveEdits}
                        isDeploying={isSavingSettings}
                        onCancel={handleCancelEdits}
                    />
                ) : (
                    <CourseGraph
                        nodes={displayNodes}
                        edges={editableEdges}
                        onNodeClick={onNodeClick}
                        isEducator={isEducator}
                    />
                )}
            </main>

            {/* SIDE PANEL INTERACTIVE OVERLAY */}
            <Sheet open={isSheetOpen && (!isEducator || isEditMode)} onOpenChange={setIsSheetOpen}>
                {isEditMode ? (
                    <NodeEditorSheet
                        node={selectedNode}
                        onUpdateNode={updateNodeData}
                        onDeleteNode={deleteNode}
                    />
                ) : !isEducator ? (
                    <StudentNodePanel node={selectedNode} fullCourseData={course} />
                ) : null}
            </Sheet>

            {/* EDUCATOR NODE FULL DIALOG */}
            <Dialog open={isSheetOpen && isEducator && !isEditMode} onOpenChange={setIsSheetOpen}>
                <EducatorNodePanel node={selectedNode} fullCourseData={course} isCourseOwner={isCourseOwner} />
            </Dialog>

            {/* Unenroll Confirmation Dialog */}
            <Dialog open={isUnenrollDialogOpen} onOpenChange={setIsUnenrollDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[2rem] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-8 z-[100]">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-widest mb-2"><Trash2 size={14} /> Critical Action</div>
                        <DialogTitle className="text-2xl font-extrabold">Abandon Journey?</DialogTitle>
                        <DialogDescription className="text-base font-medium text-zinc-500 mt-2">
                            Unenrolling permanently deletes your progress and quiz history. <span className="text-red-500 font-bold">This cannot be undone.</span>
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
                        <Button
                            variant="ghost"
                            className="flex-1 font-bold rounded-xl h-12 hover:bg-zinc-100"
                            onClick={() => setIsUnenrollDialogOpen(false)}
                            disabled={isUnenrolling}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 font-bold h-12 bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 rounded-xl"
                            onClick={handleUnenroll}
                            disabled={isUnenrolling}
                        >
                            {isUnenrolling ? <Loader2 size={18} className="mr-2 animate-spin" /> : "Yes, Unenroll"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Enrollment Confirmation / Diagnostic Prompt Dialog */}
            <Dialog open={isEnrollDialogOpen} onOpenChange={setIsEnrollDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-[2rem] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-8 z-[100]">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-2"><BrainCircuit size={14} /> Diagnostic Assessment</div>
                        <DialogTitle className="text-2xl font-extrabold">Take a Placement Test?</DialogTitle>
                        <DialogDescription className="text-base font-medium text-zinc-500 mt-2 leading-relaxed">
                            Before jumping in, do you want to take a quick <span className="relative group inline-block text-indigo-600 dark:text-indigo-400 font-bold border-b border-indigo-500/50 cursor-help">diagnostic assessment<div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-900 text-white text-xs rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl font-medium leading-relaxed">A smart assessment that identifies your current skill level, automatically bypassing topics you already know to save you time.</div></span>? 
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="flex flex-col sm:flex-row gap-3 mt-8">
                        <Button
                            variant="ghost"
                            className="flex-1 font-bold rounded-xl h-12 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                            onClick={() => confirmEnrollment(false)}
                            disabled={isEnrolling || isSkipping}
                        >
                            {isSkipping ? <Loader2 size={18} className="mr-2 animate-spin" /> : "Skip, start from scratch"}
                        </Button>
                        <Button
                            className="flex-1 font-bold h-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 rounded-xl"
                            onClick={() => confirmEnrollment(true)}
                            disabled={isEnrolling || isSkipping}
                        >
                            {isEnrolling ? <Loader2 size={18} className="mr-2 animate-spin" /> : "Yes, test me!"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Course Global Settings Dialog */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                <DialogContent className="sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 p-8">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest mb-2"><Settings2 size={14} /> Course Parameters</div>
                        <DialogTitle className="text-3xl font-extrabold tracking-tight">Configuration Profile</DialogTitle>
                        <DialogDescription className="text-base font-medium">Protect and modify global properties for your generated curriculum map.</DialogDescription>
                    </DialogHeader>

                    {/* Course Info Section */}
                    <div className="space-y-6 pt-6">
                        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
                            <Settings2 size={14} /> Course Identity
                        </div>
                        <div className="space-y-3">
                            <Label className="uppercase tracking-widest text-[10px] font-black text-zinc-500">Course Title</Label>
                            <Input
                                value={courseTitle}
                                onChange={(e) => setCourseTitle(e.target.value)}
                                className="h-12 font-bold text-base border-2 rounded-xl focus-visible:ring-indigo-500"
                                placeholder="e.g. Introduction to Python"
                            />
                        </div>
                        <div className="space-y-3 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                            <Label className="uppercase tracking-widest text-[10px] font-black text-zinc-500">Course Description</Label>
                            <Textarea
                                value={courseDescription}
                                onChange={(e) => setCourseDescription(e.target.value)}
                                className="min-h-[90px] font-medium resize-y border-2 rounded-xl focus-visible:ring-indigo-500"
                                placeholder="Describe what students will learn..."
                            />
                        </div>
                    </div>

                    {/* Quiz Configuration Section */}
                    <div className="space-y-6 pt-2">
                        {/* Course Visibility */}
                        <div className="space-y-3 pb-6 border-b border-zinc-200 dark:border-zinc-800">
                            <Label className="uppercase tracking-widest text-[10px] font-black text-zinc-500 flex items-center gap-2"><FileKey size={14} /> Course Visibility</Label>
                            <Select value={courseVisibility} onValueChange={setCourseVisibility}>
                                <SelectTrigger className="h-14 font-bold border-2 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">
                                        <span className="font-bold flex items-center gap-2 tracking-normal text-emerald-600">
                                            <Globe size={14} /> Public — Anyone can enroll
                                        </span>
                                    </SelectItem>
                                    <SelectItem value="private">
                                        <span className="font-bold flex items-center gap-2 tracking-normal text-zinc-500">
                                            <Lock size={14} /> Private — By link or invitation only
                                        </span>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs font-medium text-zinc-400 pl-1">
                                {courseVisibility === 'public'
                                    ? 'This course will be discoverable and open for anyone to enroll.'
                                    : 'Only users with a direct link or an invitation can access this course.'}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-widest">
                            <BrainCircuit size={14} /> Quiz Configuration (All Nodes)
                        </div>

                        {/* Number of Questions */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                                <span className="flex items-center gap-2"><BrainCircuit size={12} /> Number of Questions</span>
                                <span className="text-lg font-black text-blue-600">{courseQuestionsCount}</span>
                            </Label>
                            <input
                                type="range"
                                min={5}
                                max={50}
                                step={5}
                                value={courseQuestionsCount}
                                onChange={(e) => setCourseQuestionsCount(parseInt(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-600 bg-zinc-200 dark:bg-zinc-800"
                            />
                            <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                <span>5 min</span>
                                <span>50 max</span>
                            </div>
                        </div>

                        {/* Pass Threshold */}
                        <div className="space-y-3">
                            <Label className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Target size={12} /> Pass Threshold</span>
                                <span className="text-lg font-black text-emerald-600">{coursePassThreshold}%</span>
                            </Label>
                            <input
                                type="range"
                                min={30}
                                max={100}
                                step={5}
                                value={coursePassThreshold}
                                onChange={(e) => setCoursePassThreshold(parseInt(e.target.value))}
                                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-emerald-600 bg-zinc-200 dark:bg-zinc-800"
                            />
                            <div className="flex justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                <span>30% min</span>
                                <span>100% max</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                                Students must score at or above this percentage to master each node.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="mt-8">
                        <Button 
                            size="lg" 
                            className="w-full font-bold h-14 bg-zinc-900 border-none hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl" 
                            disabled={isSavingSettings}
                            onClick={async () => {
                                setIsSavingSettings(true);
                                try {
                                    await CourseAPI.updateCourseSettings(courseId, {
                                        title: courseTitle,
                                        description: courseDescription,
                                        questions_count: courseQuestionsCount,
                                        pass_threshold: coursePassThreshold,
                                        is_public: courseVisibility === 'public'
                                    });
                                    setIsSettingsOpen(false);
                                    // Update local node quiz data
                                    setEditableNodes(nds => nds.map(n => ({
                                        ...n,
                                        data: {
                                            ...n.data,
                                            questions_count: courseQuestionsCount,
                                            pass_threshold: coursePassThreshold
                                        }
                                    })));
                                    // Update local course metadata
                                    setCourse(c => ({
                                        ...c,
                                        title: courseTitle,
                                        description: courseDescription,
                                        is_public: courseVisibility === 'public'
                                    }));
                                    setShowSuccessDialog(true);
                                } catch (error) {
                                    alert("Failed to update settings: " + (error.response?.data?.detail || error.message));
                                } finally {
                                    setIsSavingSettings(false);
                                }
                            }}
                        >
                            {isSavingSettings ? <Loader2 size={18} className="mr-2 animate-spin" /> : <ShieldCheck size={18} className="mr-2" />} 
                            {isSavingSettings ? "Saving Settings..." : "Save Settings"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Celebration Dialog */}
            <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
                <DialogContent className="sm:max-w-md text-center p-10 border-emerald-500 border-2 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/40 dark:to-zinc-950 shadow-2xl overflow-hidden" showCloseButton={false}>
                    <DialogHeader>
                        <div className="mx-auto bg-emerald-100 text-emerald-600 rounded-[2rem] p-6 mb-6 ring-8 ring-emerald-50 dark:bg-emerald-900/50 dark:ring-emerald-900/20 inline-flex shadow-inner">
                            <CheckCircle2 size={56} strokeWidth={2.5} />
                        </div>
                        <DialogTitle className="text-4xl font-black text-emerald-700 dark:text-emerald-400 mb-3 tracking-tight">Success!</DialogTitle>
                        <DialogDescription className="text-xl text-emerald-600/80 font-bold leading-relaxed px-4">
                            Course settings have been successfully updated.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6" />
                    <DialogFooter className="sm:justify-center">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] text-white shadow-xl shadow-emerald-600/30 w-full text-xl py-8 rounded-2xl font-extrabold transition-all" onClick={() => setShowSuccessDialog(false)}>
                            Continue Editing
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Diagnostic Wizard Overlay */}
            {showDiagnosticWizard && (
                <div className="absolute inset-0 z-[100] bg-zinc-50 dark:bg-zinc-950 animate-in fade-in duration-300">
                    <DiagnosticWizard 
                        courseId={courseId} 
                        studentId={user.id} 
                        onComplete={() => {
                            setShowDiagnosticWizard(false);
                            fetchGraph(); // Let them see their updated progress
                        }} 
                    />
                </div>
            )}
        </div>
    );
}
