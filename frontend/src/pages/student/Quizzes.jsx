import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, BrainCircuit, ShieldAlert, Sparkles, Send, Loader2 } from "lucide-react";
import confetti from "canvas-confetti";
import { QuizService, StudentService } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

export default function Quizzes() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { state } = location;

    const skillId = state?.skillId;
    const skillName = state?.skillName || "Functions";
    const courseId = state?.courseId;
    const courseTitle = state?.courseTitle || "Python 101";

    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    const [isLoading, setIsLoading] = useState(true);
    const [quizData, setQuizData] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchQuiz = async () => {
            if (!skillId) {
                setError("No topic selected. Return to the course map and try again.");
                setIsLoading(false);
                return;
            }
            try {
                const res = await QuizService.generateQuiz(courseTitle, skillName);
                if (res && res.question) {
                    const mappedOptions = res.question.options.map((opt, i) => ({
                        id: String.fromCharCode(97 + i), // 'a', 'b', 'c', 'd'
                        text: opt
                    }));
                    setQuizData({
                        question: res.question.question,
                        options: mappedOptions,
                        correctAnswer: mappedOptions[res.question.correct_index].id,
                        explanation: res.question.explanation
                    });
                } else {
                    setError("Failed to parse quiz format from AI.");
                }
            } catch (err) {
                console.error(err);
                setError("The Knowledge Oracle is currently unavailable. Try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuiz();
    }, [courseTitle, skillName, skillId]);

    const handleSubmit = async () => {
        setIsSubmitted(true);
        const isCorrect = selectedOption === quizData.correctAnswer;

        if (isCorrect) {
            confetti({
                particleCount: 200,
                spread: 90,
                origin: { y: 0.5 },
                colors: ['#10b981', '#3b82f6', '#f59e0b']
            });
            setTimeout(() => setShowCelebration(true), 1200);

            // Update Backend Progress
            // Mastered status allows the backend to unlock prerequisite_edges
            if (user?.id && courseId && skillId) {
                try {
                    await StudentService.updateProgress({
                        student_id: user.id,
                        course_id: courseId,
                        skill_id: skillId,
                        status: "Mastered",
                        mastery_score: 100
                    });
                } catch (e) {
                    console.error("Failed to sync progress with server:", e);
                }
            }
        }
    };

    const handleReturn = () => {
        if (courseId) {
            navigate(`/courses/${courseId}`);
        } else {
            navigate("/student/dashboard");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4 text-amber-500">
                    <Loader2 className="animate-spin" size={48} />
                    <p className="font-bold tracking-widest text-zinc-500 uppercase text-sm">Generating knowledge check...</p>
                </div>
            </div>
        );
    }

    if (error || !quizData) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="max-w-md p-8 text-center border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900">
                    <XCircle className="mx-auto text-red-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">{error}</h2>
                    <Button onClick={handleReturn} className="mt-4">Go Back</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 h-full overflow-auto max-w-7xl mx-auto flex flex-col gap-6">
            {/* Quiz Header Bento */}
            <Card className="flex items-center p-6 border-zinc-200/60 dark:border-zinc-800 bg-gradient-to-r from-blue-500/10 to-indigo-500/5 backdrop-blur-md shadow-sm border-none">
                <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-inner">
                            <BrainCircuit size={32} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Generative Knowledge Check</h1>
                            <p className="text-lg font-medium text-blue-600/80 mt-1 flex items-center gap-2">
                                <Sparkles size={18} /> Testing Mastery on {skillName}
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto min-h-[500px]">
                {/* Question Block (col-span-2) */}
                <Card className="col-span-1 md:col-span-2 border-zinc-200/60 dark:border-zinc-800 shadow-xl flex flex-col overflow-hidden">
                    <CardHeader className="bg-zinc-50 border-b border-zinc-100 dark:bg-zinc-950 dark:border-zinc-900 pb-4">
                        <div className="flex gap-2 items-center">
                            <ShieldAlert size={18} className="text-zinc-500" />
                            <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-500">Scenario Prompt</h2>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8 flex-grow">
                        <pre className="text-xl font-medium whitespace-pre-wrap font-sans leading-relaxed text-zinc-800 dark:text-zinc-200">
                            {quizData.question}
                        </pre>
                    </CardContent>
                </Card>

                {/* Right Sidebar Bento Stack */}
                <div className="col-span-1 flex flex-col gap-6 h-full">
                    {/* Options Grid mapped into Cards */}
                    <Card className="flex-grow border-zinc-200/60 dark:border-zinc-800 shadow-lg p-6 flex flex-col gap-4 bg-zinc-50/50 dark:bg-zinc-950">
                        <div className="text-sm font-bold tracking-widest uppercase text-zinc-500 mb-2">Select Answer</div>
                        {quizData.options.map((option) => {
                            const isSelected = selectedOption === option.id;
                            const isCorrectRow = isSubmitted && option.id === quizData.correctAnswer;
                            const isWrongRow = isSubmitted && isSelected && option.id !== quizData.correctAnswer;

                            let style = "py-6 text-lg justify-start px-6 font-bold border-2 transition-all text-left whitespace-normal h-auto ring-offset-2 focus-visible:ring-2 rounded-xl group relative overflow-hidden";

                            if (isSelected && !isSubmitted) style += " border-blue-500 bg-blue-50/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-md";
                            else if (isCorrectRow) style += " border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-500/50 shadow-md";
                            else if (isWrongRow) style += " border-red-500 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-500/50 shadow-md";
                            else style += " border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700";

                            return (
                                <Button
                                    key={option.id}
                                    variant="outline"
                                    className={style}
                                    onClick={() => !isSubmitted && setSelectedOption(option.id)}
                                    disabled={isSubmitted}
                                >
                                    <span className={`w-8 h-8 flex items-center justify-center rounded-lg mr-4 text-sm tracking-wider uppercase flex-shrink-0 transition-colors
                                        ${(isSelected && !isSubmitted) ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200" :
                                            isCorrectRow ? "bg-emerald-200 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-200" :
                                                isWrongRow ? "bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200" :
                                                    "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                                        }`}
                                    >
                                        {option.id}
                                    </span>
                                    {option.text}
                                </Button>
                            );
                        })}
                    </Card>

                    {/* Submit / Feedback Block */}
                    <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-lg p-1 bg-white dark:bg-zinc-950 overflow-hidden shrink-0 min-h-[140px] flex flex-col justify-center">
                        {!isSubmitted ? (
                            <div className="p-5">
                                <Button size="lg" className="w-full h-16 text-xl font-bold gap-3 rounded-xl hover:-translate-y-1 transition-transform shadow-xl hover:shadow-2xl" onClick={handleSubmit} disabled={!selectedOption}>
                                    Evaluate Answer <Send size={20} />
                                </Button>
                            </div>
                        ) : (
                            <div className={`p-6 rounded-xl inset-0 fill flex items-start gap-4 h-full flex-col justify-center animate-in fade-in slide-in-from-bottom-4 ${selectedOption === quizData.correctAnswer
                                ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100"
                                : "bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100"
                                }`}>
                                <div className="flex items-center gap-2 font-bold text-lg">
                                    {selectedOption === quizData.correctAnswer ? (
                                        <><CheckCircle size={20} className="text-emerald-500" /> Correct!</>
                                    ) : (
                                        <><XCircle size={20} className="text-red-500" /> Incorrect</>
                                    )}
                                </div>
                                <p className="leading-relaxed opacity-90 text-sm font-medium">{quizData.explanation}</p>
                                {selectedOption !== quizData.correctAnswer && (
                                    <Button variant="outline" className="w-full mt-2 font-bold border-red-200 hover:bg-red-100 text-red-800 dark:border-red-800/50 dark:hover:bg-red-900/40 dark:text-red-200" onClick={handleReturn}>
                                        Back to Path
                                    </Button>
                                )}
                            </div>
                        )}
                    </Card>
                </div>
            </div>

            <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
                <DialogContent className="sm:max-w-md text-center p-10 border-emerald-500 border-2 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/40 dark:to-zinc-950 shadow-2xl overflow-hidden box-border">
                    <DialogHeader>
                        <div className="mx-auto bg-emerald-100 text-emerald-600 rounded-[2rem] p-6 mb-6 ring-8 ring-emerald-50 dark:bg-emerald-900/50 dark:ring-emerald-900/20 inline-flex shadow-inner">
                            <CheckCircle size={56} strokeWidth={2.5} />
                        </div>
                        <DialogTitle className="text-4xl font-black text-emerald-700 dark:text-emerald-400 mb-3 tracking-tight">Mastered!</DialogTitle>
                        <DialogDescription className="text-xl text-emerald-600/80 font-bold leading-relaxed px-4">
                            Your Knowledge Tracker has permanently recorded your mastery of <span className="text-emerald-800 dark:text-emerald-300 underline decoration-emerald-500 decoration-2 underline-offset-4">{skillName}</span>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-8">
                        <Progress value={100} className="h-4 bg-emerald-100 [&>div]:bg-emerald-500 shadow-inner rounded-full" />
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] text-white shadow-xl shadow-emerald-600/30 w-full text-xl py-8 rounded-2xl font-extrabold transition-all" onClick={handleReturn}>
                            Unlock Next Horizon
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
