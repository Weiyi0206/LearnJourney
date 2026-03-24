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
                const res = await QuizService.generateQuiz({
                    courseTitle,
                    skillName,
                    skillId,
                    courseId,
                    masteredPrerequisites
                });
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
                console.error(err);
                setError("The Knowledge Oracle is currently unavailable. Try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchQuiz();
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
        <div className="p-4 md:p-8 h-full overflow-auto max-w-7xl mx-auto flex flex-col gap-6">
            {/* Header */}
            <Card className="flex items-center p-6 border-zinc-200/60 dark:border-zinc-800 bg-gradient-to-r from-blue-500/10 to-indigo-500/5 backdrop-blur-md shadow-sm border-none">
                <div className="flex-1 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-inner">
                            <BrainCircuit size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">Knowledge Check</h1>
                            <p className="text-sm md:text-base font-medium text-blue-600/80 mt-0.5 flex items-center gap-2">
                                <Sparkles size={16} /> {skillName} — Question {currentIndex + 1} of {totalQuestions}
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex flex-col items-end gap-1 min-w-[180px]">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Progress</span>
                        <Progress value={progressPercent} className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 [&>div]:bg-blue-500 rounded-full" />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[500px]">
                {/* Question Block */}
                <Card className="col-span-1 md:col-span-2 border-zinc-200/60 dark:border-zinc-800 shadow-xl flex flex-col overflow-hidden">
                    <CardHeader className="bg-zinc-50 border-b border-zinc-100 dark:bg-zinc-950 dark:border-zinc-900 pb-4">
                        <div className="flex gap-2 items-center">
                            <ShieldAlert size={18} className="text-zinc-500" />
                            <h2 className="text-sm font-bold tracking-widest uppercase text-zinc-500">Question {currentIndex + 1}</h2>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-8 flex-grow">
                        <pre className="text-lg md:text-xl font-medium whitespace-pre-wrap font-sans leading-relaxed text-zinc-800 dark:text-zinc-200">
                            {currentQuestion.question}
                        </pre>
                    </CardContent>
                </Card>

                {/* Options + Submit */}
                <div className="col-span-1 flex flex-col gap-6 h-full">
                    <Card className="flex-grow border-zinc-200/60 dark:border-zinc-800 shadow-lg p-6 flex flex-col gap-3 bg-zinc-50/50 dark:bg-zinc-950">
                        <div className="text-sm font-bold tracking-widest uppercase text-zinc-500 mb-1">Select Answer</div>
                        {currentQuestion.options.map((option) => {
                            const isSelected = selectedOption === option.id;
                            const isCorrectRow = isSubmitted && option.id === currentQuestion.correctAnswer;
                            const isWrongRow = isSubmitted && isSelected && option.id !== currentQuestion.correctAnswer;

                            let style = "py-5 text-base justify-start px-5 font-bold border-2 transition-all text-left whitespace-normal h-auto rounded-xl";

                            if (isSelected && !isSubmitted) style += " border-blue-500 bg-blue-50/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 shadow-md";
                            else if (isCorrectRow) style += " border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 shadow-md";
                            else if (isWrongRow) style += " border-red-500 bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-300 shadow-md";
                            else style += " border-zinc-200 bg-white dark:bg-zinc-900 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300";

                            return (
                                <Button
                                    key={option.id}
                                    variant="outline"
                                    className={style}
                                    onClick={() => handleSelect(option.id)}
                                    disabled={isSubmitted}
                                >
                                    <span className={`w-7 h-7 flex items-center justify-center rounded-lg mr-3 text-xs tracking-wider uppercase flex-shrink-0 transition-colors
                                        ${(isSelected && !isSubmitted) ? "bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200" :
                                            isCorrectRow ? "bg-emerald-200 text-emerald-800" :
                                                isWrongRow ? "bg-red-200 text-red-800" :
                                                    "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500"
                                        }`}>
                                        {option.id}
                                    </span>
                                    {option.text}
                                </Button>
                            );
                        })}
                    </Card>

                    {/* Submit / Feedback */}
                    <Card className="border-zinc-200/60 dark:border-zinc-800 shadow-lg p-1 bg-white dark:bg-zinc-950 overflow-hidden shrink-0 min-h-[120px] flex flex-col justify-center">
                        {!isSubmitted ? (
                            <div className="p-4">
                                <Button size="lg" className="w-full h-14 text-lg font-bold gap-3 rounded-xl hover:-translate-y-0.5 transition-transform shadow-xl" onClick={handleSubmit} disabled={!selectedOption}>
                                    Submit Answer <Send size={18} />
                                </Button>
                            </div>
                        ) : (
                            <div className={`p-5 rounded-xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 ${selectedOption === currentQuestion.correctAnswer
                                ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-100"
                                : "bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-100"
                                }`}>
                                <div className="flex items-center gap-2 font-bold">
                                    {selectedOption === currentQuestion.correctAnswer ? (
                                        <><CheckCircle size={18} className="text-emerald-500" /> Correct!</>
                                    ) : (
                                        <><XCircle size={18} className="text-red-500" /> Incorrect</>
                                    )}
                                </div>
                                <p className="leading-relaxed opacity-90 text-xs font-medium">{currentQuestion.explanation}</p>
                                <Button
                                    className="w-full mt-1 font-bold rounded-xl gap-2 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900"
                                    onClick={handleNext}
                                >
                                    {currentIndex < totalQuestions - 1 ? (
                                        <>Next Question <ChevronRight size={16} /></>
                                    ) : (
                                        <>View Results <Trophy size={16} /></>
                                    )}
                                </Button>
                            </div>
                        )}
                    </Card>
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
