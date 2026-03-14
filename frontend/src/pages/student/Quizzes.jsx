import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CheckCircle, XCircle, BrainCircuit } from "lucide-react";
import api from "@/lib/api";

export default function Quizzes() {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location;

    const skillName = state?.skillName || "Functions";

    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    // Mock Gemini Response Data
    const [quizData, setQuizData] = useState({
        question: `What is the output of the following Python code regarding ${skillName}?\n\ndef greet(name="World"):\n    return f"Hello {name}!"\n\nprint(greet())`,
        options: [
            { id: 'a', text: 'Hello!' },
            { id: 'b', text: 'Hello World!' },
            { id: 'c', text: 'TypeError' },
            { id: 'd', text: 'Undefined' }
        ],
        correctAnswer: 'b',
        explanation: 'When no argument is passed to a function with a default parameter, it uses the default value. Here, name defaults to "World".'
    });

    const handleSubmit = () => {
        setIsSubmitted(true);
        if (selectedOption === quizData.correctAnswer) {
            setTimeout(() => setShowCelebration(true), 1000);
        }
    };

    const handleReturn = () => {
        navigate("/student/path");
    };

    return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-50 dark:bg-zinc-950 p-8 flex items-center justify-center">
            <Card className="w-full max-w-3xl shadow-2xl border-zinc-200/50 dark:border-zinc-800 relative overflow-hidden">

                {/* Background purely aesthetic gradient */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

                <CardHeader className="space-y-4 pb-8 text-center mt-6">
                    <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-2 shadow-inner">
                        <BrainCircuit size={32} />
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight">AI Knowledge Check</CardTitle>
                    <CardDescription className="text-lg font-medium text-zinc-500">
                        Testing your mastery on: <span className="text-blue-600 font-bold">{skillName}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8 px-10">
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                        <pre className="text-lg font-medium whitespace-pre-wrap font-sans leading-relaxed text-zinc-800 dark:text-zinc-200">
                            {quizData.question}
                        </pre>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {quizData.options.map((option) => {
                            const isSelected = selectedOption === option.id;
                            const isCorrectRow = isSubmitted && option.id === quizData.correctAnswer;
                            const isWrongRow = isSubmitted && isSelected && option.id !== quizData.correctAnswer;

                            let buttonStyles = "py-8 h-auto text-lg justify-start px-6 font-medium border-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all text-left whitespace-normal leading-tight";

                            if (isSelected && !isSubmitted) buttonStyles += " border-blue-500 bg-blue-50/50 text-blue-700 dark:bg-blue-900/20";
                            else if (isCorrectRow) buttonStyles += " border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20";
                            else if (isWrongRow) buttonStyles += " border-red-500 bg-red-50 text-red-800 dark:bg-red-900/20";
                            else buttonStyles += " border-zinc-200 bg-white dark:bg-zinc-950 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300";

                            return (
                                <Button
                                    key={option.id}
                                    variant="outline"
                                    className={buttonStyles}
                                    onClick={() => !isSubmitted && setSelectedOption(option.id)}
                                    disabled={isSubmitted}
                                >
                                    <span className="font-bold text-zinc-400 mr-4 tracking-wider uppercase text-sm">{option.id}</span>
                                    {option.text}
                                </Button>
                            );
                        })}
                    </div>

                    {isSubmitted && (
                        <div className={`p-6 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-4 ${selectedOption === quizData.correctAnswer
                                ? "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/30"
                                : "bg-red-50 text-red-900 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30"
                            }`}>
                            {selectedOption === quizData.correctAnswer ? (
                                <CheckCircle className="text-emerald-500 mt-1" size={24} />
                            ) : (
                                <XCircle className="text-red-500 mt-1" size={24} />
                            )}
                            <div>
                                <h4 className="font-bold text-lg mb-1">
                                    {selectedOption === quizData.correctAnswer ? "Correct!" : "Incorrect"}
                                </h4>
                                <p className="leading-relaxed opacity-90">{quizData.explanation}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="bg-zinc-50 dark:bg-zinc-950/50 p-6 flex justify-end rounded-b-xl border-t">
                    {!isSubmitted ? (
                        <Button size="lg" className="px-10 py-6 text-lg font-bold" onClick={handleSubmit} disabled={!selectedOption}>
                            Submit Answer
                        </Button>
                    ) : (
                        <Button size="lg" className="px-10 py-6 text-lg font-bold" onClick={handleReturn}>
                            Return to Path
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <Dialog open={showCelebration} onOpenChange={setShowCelebration}>
                <DialogContent className="sm:max-w-md text-center p-10 border-emerald-500 border-2 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/40 dark:to-zinc-950">
                    <DialogHeader>
                        <div className="mx-auto bg-emerald-100 text-emerald-600 rounded-full p-4 mb-4 ring-8 ring-emerald-50 dark:bg-emerald-900/50 dark:ring-emerald-900/20 inline-flex">
                            <CheckCircle size={48} />
                        </div>
                        <DialogTitle className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 mb-2">Skill Mastered!</DialogTitle>
                        <DialogDescription className="text-lg text-emerald-600/80 font-medium">
                            You've successfully mastered <b>{skillName}</b>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <Progress value={100} className="h-3 bg-emerald-100 [&>div]:bg-emerald-500 shadow-inner" />
                    </div>
                    <DialogFooter className="sm:justify-center">
                        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30 w-full text-lg py-6 font-bold" onClick={handleReturn}>
                            Unlock Next Skills
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
