import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, BrainCircuit, ShieldAlert, Sparkles, Send, Loader2, ChevronRight, Trophy, RotateCcw } from "lucide-react";
import confetti from "canvas-confetti";
import { QuizService, StudentService } from "@/lib/apiClient";
import { useAuth } from "@/contexts/AuthContext";

const DEFAULT_PASS_THRESHOLD = 60;

// Deduplicate concurrent requests (e.g. from React 18 Strict Mode double-mounting)
const pendingQuizRequests = new Map();

export default function Quizzes() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { state } = location;

    const skillId = state?.skillId;
    const skillName = state?.skillName || "Functions";
    const courseId = state?.courseId;
    const courseTitle = state?.courseTitle || "Python 101";
    const masteredPrerequisites = state?.masteredPrerequisites || [];

    // Quiz data
    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [passThreshold, setPassThreshold] = useState(DEFAULT_PASS_THRESHOLD);

    // Quiz state
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [answers, setAnswers] = useState({}); // { questionIndex: { selected, correct } }

    // Results
    const [showResults, setShowResults] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    useEffect(() => {
        let isMounted = true;
        
        const fetchQuiz = async () => {
            if (!skillId) {
                setError("No topic selected. Return to the course map and try again.");
                setIsLoading(false);
                return;
            }
            if (state?.status === "Mastered") {
                setError(`You have already mastered "${skillName}". There's no need to take this quiz again!`);
                setIsLoading(false);
                return;
            }
            try {
                const reqKey = `${courseId}-${skillId}`;
                let res;
                if (pendingQuizRequests.has(reqKey)) {
                    res = await pendingQuizRequests.get(reqKey);
                } else {
                    const promise = QuizService.generateQuiz({
                        courseTitle,
                        skillName,
                        skillId,
                        courseId,
                        masteredPrerequisites
                    }).finally(() => {
                        pendingQuizRequests.delete(reqKey);
                    });
                    pendingQuizRequests.set(reqKey, promise);
                    res = await promise;
                }
                
                if (!isMounted) return;

                if (res?.questions?.length > 0) {
                    if (res.pass_threshold) setPassThreshold(res.pass_threshold);
                    const mapped = res.questions.map((q, qi) => {
                        const mappedOptions = q.options.map((opt, i) => ({
                            id: String.fromCharCode(97 + i),
                            text: opt
                        }));
                        return {
                            question: q.question,
                            options: mappedOptions,
                            correctAnswer: mappedOptions[q.correct_index]?.id,
                            explanation: q.explanation
                        };
                    });
                    setQuestions(mapped);
                } else {
                    setError("AI returned no questions. Please try again.");
                }
            } catch (err) {
                if (!isMounted) return;
                console.error(err);
                setError("The Knowledge Oracle is currently unavailable. Try again later.");
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchQuiz();

        return () => {
            isMounted = false;
        };
    }, [courseTitle, skillName, skillId]);

    const currentQuestion = questions[currentIndex];
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;

    const score = Object.values(answers).filter(a => a.correct).length;
    const scorePercent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const passed = scorePercent >= passThreshold;

    const handleSelect = (optionId) => {
        if (!isSubmitted) setSelectedOption(optionId);
    };

    const handleSubmit = () => {
        if (!selectedOption) return;
        setIsSubmitted(true);
        setAnswers(prev => ({
            ...prev,
            [currentIndex]: {
                selected: selectedOption,
                correct: selectedOption === currentQuestion.correctAnswer
            }
        }));
    };

    const handleNext = () => {
        if (currentIndex < totalQuestions - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setIsSubmitted(false);
        } else {
            // Last question — show results
            setShowResults(true);
            const allAnswers = {
                ...answers,
                [currentIndex]: {
                    selected: selectedOption,
                    correct: selectedOption === currentQuestion.correctAnswer
                }
            };
            const finalScore = Object.values(allAnswers).filter(a => a.correct).length;
            const finalPercent = Math.round((finalScore / totalQuestions) * 100);
            const didPass = finalPercent >= passThreshold;

            // Build Q&A records for history
            const questionRecords = questions.map((q, idx) => {
                const ans = allAnswers[idx];
                const selectedIdx = ans ? q.options.findIndex(o => o.id === ans.selected) : -1;
                const correctIdx = q.options.findIndex(o => o.id === q.correctAnswer);
                return {
                    question: q.question,
                    options: q.options.map(o => o.text),
                    correct_index: correctIdx,
                    selected_index: selectedIdx,
                    is_correct: ans?.correct || false,
                    explanation: q.explanation
                };
            });

            // Submit to backend
            if (user?.id && courseId && skillId) {
                QuizService.submitQuiz({
                    student_id: user.id,
                    course_id: courseId,
                    skill_id: skillId,
                    score: finalScore,
                    total_questions: totalQuestions,
                    percentage: finalPercent,
                    passed: didPass,
                    questions: questionRecords
                }).catch(e => console.error("Failed to save quiz attempt:", e));

                if (didPass) {
                    StudentService.updateProgress({
                        student_id: user.id,
                        course_id: courseId,
                        skill_id: skillId,
                        status: "Mastered",
                        mastery_score: finalPercent
                    }).catch(e => console.error("Failed to sync progress:", e));
                }
            }

            if (didPass) {
                confetti({ particleCount: 300, spread: 120, origin: { y: 0.4 }, colors: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'] });
                setTimeout(() => setShowCelebration(true), 800);
            }
        }
    };

    const handleReturn = () => {
        if (courseId) navigate(`/courses/${courseId}`);
        else navigate("/student/dashboard");
    };

    // ────── LOADING ──────
    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-blue-500" size={48} />
                    <p className="font-bold tracking-widest text-zinc-500 uppercase text-sm">Generating your adaptive quiz...</p>
                    <p className="text-xs text-zinc-400">This may take a moment for {totalQuestions || 20} questions</p>
                </div>
            </div>
        );
    }

    // ────── ERROR ──────
    if (error || questions.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <Card className="max-w-md p-8 text-center border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900">
                    <XCircle className="mx-auto text-red-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">{error || "No questions loaded."}</h2>
                    <Button onClick={handleReturn} className="mt-4">Go Back</Button>
                </Card>
            </div>
        );
    }

    // ────── RESULTS SCREEN ──────
    if (showResults && !showCelebration) {
        const finalScore = Object.values(answers).filter(a => a.correct).length;
        const finalPercent = Math.round((finalScore / totalQuestions) * 100);
        const didPass = finalPercent >= passThreshold;

        return (
            <div className="flex items-center justify-center h-full p-8">
                <Card className={`max-w-lg w-full p-10 text-center border-2 shadow-2xl rounded-3xl ${didPass
                    ? "border-emerald-300 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/30 dark:to-zinc-950"
                    : "border-red-300 bg-gradient-to-b from-red-50 to-white dark:from-red-950/30 dark:to-zinc-950"
                    }`}>
                    <div className={`mx-auto w-20 h-20 rounded-3xl flex items-center justify-center mb-6 ${didPass ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"}`}>
                        {didPass ? <Trophy size={40} /> : <XCircle size={40} />}
                    </div>
                    <h2 className={`text-3xl font-black mb-2 ${didPass ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}`}>
                        {didPass ? "Quiz Passed!" : "Not Quite Yet"}
                    </h2>
                    <p className="text-zinc-500 font-medium mb-8">
                        {didPass
                            ? `Excellent work! You scored ${finalPercent}% and have demonstrated mastery.`
                            : `You scored ${finalPercent}%. You need at least ${passThreshold}% to master this skill.`
                        }
                    </p>

                    <div className="mb-8">
                        <div className="flex justify-between text-sm font-bold mb-2">
                            <span className="text-zinc-500">Score</span>
                            <span className={didPass ? "text-emerald-600" : "text-red-600"}>{finalScore} / {totalQuestions} correct</span>
                        </div>
                        <Progress value={finalPercent} className={`h-4 ${didPass ? "bg-emerald-100 [&>div]:bg-emerald-500" : "bg-red-100 [&>div]:bg-red-500"} rounded-full`} />
                    </div>

                    <div className="flex flex-col gap-3">
                        {didPass ? (
                            <Button className="w-full py-6 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xl" onClick={handleReturn}>
                                Return to Knowledge Map
                            </Button>
                        ) : (
                            <>
                                <Button className="w-full py-6 text-lg font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 rounded-xl shadow-xl gap-2" onClick={() => window.location.reload()}>
                                    <RotateCcw size={18} /> Retry Quiz
                                </Button>
                                <Button variant="outline" className="w-full py-4 font-bold rounded-xl" onClick={handleReturn}>
                                    Back to Path
                                </Button>
                            </>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    // ────── QUIZ UI ──────
    const progressPercent = totalQuestions > 0 ? Math.round(((currentIndex) / totalQuestions) * 100) : 0;

    return (
        <div className="flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
            {/* Header Fixed Area */}
            <div className="flex-shrink-0 px-4 pt-4 md:px-8 md:pt-8 bg-zinc-50 dark:bg-zinc-950 z-10 w-full max-w-7xl mx-auto">
                <Card className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 md:p-6 gap-5 md:gap-6 border-zinc-200/60 dark:border-zinc-800 bg-gradient-to-r from-blue-500/10 to-indigo-500/5 backdrop-blur-md shadow-sm border-none">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                            <BrainCircuit size={24} className="md:w-7 md:h-7" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Knowledge Check</h1>
                            <p className="text-xs md:text-base font-medium text-blue-600/80 mt-0.5 flex items-center gap-2">
                                <Sparkles size={14} className="md:w-4 md:h-4" /> {skillName} — Question {currentIndex + 1} of {totalQuestions}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-3 w-full md:w-auto md:min-w-[240px]">
                        <div className="flex items-center justify-between text-xs md:text-sm font-bold bg-white/50 dark:bg-zinc-900/50 p-2 md:p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
                            <div className="flex flex-col items-center flex-1">
                                <span className="text-[9px] uppercase tracking-widest text-zinc-400">Live Score</span>
                                <span className="text-emerald-600 dark:text-emerald-400 text-sm md:text-base">{score}</span>
                            </div>
                            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800"></div>
                            <div className="flex flex-col items-center flex-1">
                                <span className="text-[9px] uppercase tracking-widest text-zinc-400">To Pass</span>
                                <span className="text-blue-600 dark:text-blue-400 text-sm md:text-base">{Math.ceil((passThreshold / 100) * totalQuestions)}</span>
                            </div>
                            <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 hidden md:block"></div>
                            <div className="flex-col items-center flex-1 hidden md:flex">
                                <span className="text-[9px] uppercase tracking-widest text-zinc-400">Progress</span>
                                <span className="text-zinc-600 dark:text-zinc-300 text-sm md:text-base">{progressPercent}%</span>
                            </div>
                        </div>
                        <Progress value={progressPercent} className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 [&>div]:bg-blue-500 rounded-full" />
                    </div>
                </Card>
            </div>

            {/* Main Scrollable Content Area */}
            <div className="flex-grow overflow-y-auto flex flex-col items-center px-4 md:px-8 pb-32">
                <div className="w-full max-w-4xl mx-auto flex flex-col flex-grow justify-center py-8 md:py-12 gap-8 md:gap-12">
                    
                    {/* The Question Area */}
                    <div className="w-full flex flex-col items-center text-center gap-4">
                        <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500">
                            <ShieldAlert size={20} />
                            <span className="text-sm font-bold tracking-widest uppercase">Question {currentIndex + 1}</span>
                        </div>
                        <pre className="text-2xl md:text-4xl font-extrabold whitespace-pre-wrap font-sans leading-snug md:leading-tight text-zinc-800 dark:text-zinc-100 max-w-3xl">
                            {currentQuestion.question}
                        </pre>
                    </div>

                    {/* The Feedback/Explanation Area (Middle) */}
                    {isSubmitted && (
                        <div className={`w-full p-6 md:p-8 rounded-3xl animate-in fade-in slide-in-from-bottom-4 shadow-xl border-2 ${
                            selectedOption === currentQuestion.correctAnswer
                                ? "bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-50"
                                : "bg-red-50 border-red-200 text-red-950 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-50"
                        }`}>
                            <div className="flex items-center gap-3 font-black text-2xl mb-3">
                                {selectedOption === currentQuestion.correctAnswer ? (
                                    <><CheckCircle size={28} className="text-emerald-500" /> Outstanding!</>
                                ) : (
                                    <><XCircle size={28} className="text-red-500" /> Not quite</>
                                )}
                            </div>
                            <p className="leading-relaxed text-base md:text-lg font-medium opacity-90">
                                {currentQuestion.explanation}
                            </p>
                        </div>
                    )}

                    {/* The Options Area (2x2 Grid) */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
                        {currentQuestion.options.map((option) => {
                            const isSelected = selectedOption === option.id;
                            const isCorrectRow = isSubmitted && option.id === currentQuestion.correctAnswer;
                            const isWrongRow = isSubmitted && isSelected && option.id !== currentQuestion.correctAnswer;

                            let style = "py-6 md:py-8 text-lg justify-start px-6 font-bold border-2 transition-all text-left whitespace-normal h-auto rounded-3xl min-h-[100px]";

                            if (isSelected && !isSubmitted) style += " border-blue-500 bg-blue-50/80 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-[0_0_0_4px_rgba(59,130,246,0.1)] scale-[1.02] z-10";
                            else if (isCorrectRow) style += " border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 shadow-lg scale-[1.02] z-10";
                            else if (isWrongRow) style += " border-red-500 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 shadow-md";
                            else style += " border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:scale-[1.01]";

                            if (isSubmitted && !isCorrectRow && !isWrongRow) {
                                style += " opacity-50 grayscale hover:scale-100 hover:bg-white dark:hover:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800";
                            }

                            return (
                                <Button
                                    key={option.id}
                                    variant="outline"
                                    className={style}
                                    onClick={() => handleSelect(option.id)}
                                    disabled={isSubmitted}
                                >
                                    <span className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center rounded-xl mr-4 md:mr-5 text-sm md:text-base font-black tracking-wider uppercase flex-shrink-0 transition-colors
                                        ${(isSelected && !isSubmitted) ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200" :
                                            isCorrectRow ? "bg-emerald-200 text-emerald-900 dark:bg-emerald-800 dark:text-emerald-100" :
                                                isWrongRow ? "bg-red-200 text-red-900 dark:bg-red-800 dark:text-red-100" :
                                                    "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                                        }`}>
                                        {option.id}
                                    </span>
                                    <span className="leading-snug">{option.text}</span>
                                </Button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Bottom Anchored Action Bar */}
            <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl border-t border-zinc-200/60 dark:border-zinc-800/60 shadow-[0_-20px_40px_-15px_rgba(0,0,0,0.1)] z-20">
                <div className="w-full max-w-4xl mx-auto flex justify-end">
                    {!isSubmitted ? (
                        <Button 
                            size="lg" 
                            className={`w-full md:w-auto md:min-w-[320px] h-14 md:h-16 text-xl font-black rounded-2xl transition-all shadow-xl ${
                                selectedOption 
                                    ? "bg-zinc-900 text-white hover:bg-zinc-800 hover:-translate-y-1 hover:shadow-2xl dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 dark:hover:shadow-white/20" 
                                    : "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600 cursor-not-allowed border-none shadow-none"
                            }`} 
                            onClick={handleSubmit} 
                            disabled={!selectedOption}
                        >
                            Check Answer
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            className={`w-full md:w-auto md:min-w-[320px] h-14 md:h-16 text-xl font-black gap-3 rounded-2xl hover:-translate-y-1 transition-all shadow-xl ${
                                selectedOption === currentQuestion.correctAnswer 
                                    ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-emerald-500/30 dark:bg-emerald-500 dark:hover:bg-emerald-400" 
                                    : "bg-red-600 text-white hover:bg-red-700 hover:shadow-red-500/30 dark:bg-red-500 dark:hover:bg-red-400"
                            }`}
                            onClick={handleNext}
                        >
                            {currentIndex < totalQuestions - 1 ? (
                                <>Continue <ChevronRight size={24} /></>
                            ) : (
                                <>View Results <Trophy size={24} /></>
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Celebration Dialog */}
            <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
                <DialogContent className="sm:max-w-md text-center p-10 border-emerald-500 border-2 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/40 dark:to-zinc-950 shadow-2xl overflow-hidden">
                    <DialogHeader>
                        <div className="mx-auto bg-emerald-100 text-emerald-600 rounded-[2rem] p-6 mb-6 ring-8 ring-emerald-50 dark:bg-emerald-900/50 dark:ring-emerald-900/20 inline-flex shadow-inner">
                            <CheckCircle size={56} strokeWidth={2.5} />
                        </div>
                        <DialogTitle className="text-4xl font-black text-emerald-700 dark:text-emerald-400 mb-3 tracking-tight">Mastered!</DialogTitle>
                        <DialogDescription className="text-xl text-emerald-600/80 font-bold leading-relaxed px-4">
                            You scored {scorePercent}% and your mastery of <span className="text-emerald-800 dark:text-emerald-300 underline decoration-emerald-500 decoration-2 underline-offset-4">{skillName}</span> has been recorded.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <div className="flex justify-between text-sm font-bold mb-2">
                            <span className="text-emerald-600">Score</span>
                            <span className="text-emerald-700">{score} / {totalQuestions}</span>
                        </div>
                        <Progress value={scorePercent} className="h-4 bg-emerald-100 [&>div]:bg-emerald-500 shadow-inner rounded-full" />
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 hover:scale-[1.02] text-white shadow-xl shadow-emerald-600/30 w-full text-xl py-8 rounded-2xl font-extrabold transition-all" onClick={handleReturn}>
                            Unlock Next Horizon
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
