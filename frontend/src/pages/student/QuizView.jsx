import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { QuizService, StudentService } from '@/lib/apiClient';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function QuizView() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Extracted from location state
    const { skillId, skillName, courseId, courseTitle } = location.state || {};

    const [questions, setQuestions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    useEffect(() => {
        if (!skillId || !courseId) {
            navigate('/student/dashboard');
            return;
        }

        const fetchQuiz = async () => {
            try {
                const data = await QuizService.generateQuiz(courseTitle || "Course", skillName || "Skill");
                // Assuming backend returns { questions: [ {question, options, correct_index} ] }
                if (data && data.questions) {
                    setQuestions(data.questions);
                }
            } catch (err) {
                console.error("Failed to load quiz", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchQuiz();
    }, [skillId, courseId, skillName, courseTitle, navigate]);

    const handleOptionSelect = (value) => {
        setSelectedAnswers(prev => ({ ...prev, [currentIndex]: parseInt(value) }));
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handleSubmit = async () => {
        // Calculate score
        let correctCount = 0;
        questions.forEach((q, idx) => {
            if (selectedAnswers[idx] === q.correct_index) {
                correctCount += 1;
            }
        });
        const percent = Math.round((correctCount / questions.length) * 100);
        setScore(percent);
        setIsSubmitted(true);

        // Update Backend
        if (!user?.id) return;

        try {
            // If they got >= 60%, they master it
            const newStatus = percent >= 60 ? "Mastered" : "Unlocked";
            await StudentService.updateProgress({
                student_id: user.id,
                course_id: courseId,
                skill_id: skillId,
                status: newStatus,
                mastery_score: percent
            });
        } catch (err) {
            console.error("Failed to update progress", err);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4 text-zinc-500">
                    <Sparkles className="animate-spin text-amber-500" size={32} />
                    <p className="font-bold tracking-wide">AI is generating your quiz...</p>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-red-500 font-bold">
                Failed to load quiz. Please try again.
            </div>
        );
    }

    if (isSubmitted) {
        const passed = score >= 60;
        return (
            <div className="p-8 max-w-3xl mx-auto flex flex-col items-center justify-center h-full">
                <Card className="w-full relative overflow-hidden rounded-3xl border-0 shadow-2xl bg-white dark:bg-zinc-950">
                    <div className={`absolute inset-0 bg-gradient-to-br ${passed ? 'from-emerald-500/20 to-teal-500/20' : 'from-rose-500/20 to-red-500/20'} pointer-events-none`} />
                    <CardHeader className="text-center relative z-10 pt-12">
                        {passed ? (
                            <CheckCircle2 size={80} className="mx-auto text-emerald-500 mb-6 drop-shadow-lg" />
                        ) : (
                            <Sparkles size={80} className="mx-auto text-rose-500 mb-6 drop-shadow-lg" />
                        )}
                        <CardTitle className="text-4xl font-extrabold">{passed ? "Concept Mastered!" : "Keep Practicing!"}</CardTitle>
                        <p className="text-zinc-600 dark:text-zinc-400 font-medium text-lg mt-4">
                            You scored <span className="font-black text-2xl mx-1 text-zinc-900 dark:text-white">{score}%</span> on {skillName}
                        </p>
                    </CardHeader>
                    <CardFooter className="relative z-10 pb-12 pt-8 justify-center">
                        <Button
                            className="text-lg font-bold py-6 px-12 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800"
                            onClick={() => navigate(`/courses/${courseId}`)}
                        >
                            <ArrowRight className="mr-2" size={20} /> Return to Map
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const currentQuestion = questions[currentIndex];
    const isLast = currentIndex === questions.length - 1;
    const canProceed = selectedAnswers[currentIndex] !== undefined;

    return (
        <div className="p-4 md:p-8 max-w-4xl mx-auto h-full overflow-y-auto">
            <div className="mb-8 p-6 bg-white dark:bg-zinc-950 rounded-3xl border-2 border-amber-100 dark:border-zinc-800 shadow-sm flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-extrabold flex items-center gap-2">
                        <Sparkles className="text-amber-500" /> AI Verification Quiz
                    </h1>
                    <p className="text-zinc-500 font-medium mt-1">Topic: <span className="font-bold text-zinc-800 dark:text-zinc-200">{skillName}</span></p>
                </div>
                <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold px-4 py-2 rounded-xl">
                    Question {currentIndex + 1} of {questions.length}
                </div>
            </div>

            <Card className="rounded-3xl border-zinc-200/60 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-950">
                <CardHeader className="p-8">
                    <CardTitle className="text-2xl leading-relaxed">{currentQuestion.question}</CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-8">
                    <RadioGroup
                        value={selectedAnswers[currentIndex] !== undefined ? selectedAnswers[currentIndex].toString() : ""}
                        onValueChange={handleOptionSelect}
                        className="space-y-4"
                    >
                        {currentQuestion.options.map((opt, idx) => (
                            <div key={idx} className="flex items-center space-x-3 p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors cursor-pointer bg-zinc-50 dark:bg-zinc-900/50 hover:bg-white dark:hover:bg-zinc-950">
                                <RadioGroupItem value={idx.toString()} id={`opt-${idx}`} className="w-5 h-5" />
                                <Label htmlFor={`opt-${idx}`} className="flex-grow text-lg font-medium cursor-pointer">{opt}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </CardContent>
                <CardFooter className="p-8 pt-0 flex justify-end">
                    {!isLast ? (
                        <Button
                            className="font-bold text-base px-8 py-6 rounded-xl bg-blue-600 hover:bg-blue-700"
                            disabled={!canProceed}
                            onClick={handleNext}
                        >
                            Next Question <ArrowRight className="ml-2" size={18} />
                        </Button>
                    ) : (
                        <Button
                            className="font-bold text-base px-8 py-6 rounded-xl bg-emerald-600 hover:bg-emerald-700"
                            disabled={!canProceed}
                            onClick={handleSubmit}
                        >
                            Submit Quiz <CheckCircle2 className="ml-2" size={18} />
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    );
}
