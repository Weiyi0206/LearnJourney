import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, BrainCircuit, Sparkles, Network } from "lucide-react";

export default function Diagnostic() {
    const navigate = useNavigate();
    const { courseId } = useParams();

    const [step, setStep] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Mock diagnostic questions
    const questions = [
        {
            topic: "Variables & Data Types",
            text: "Which of the following creates a string variable in Python?",
            options: [
                { id: "a", text: "text = 'Hello'" },
                { id: "b", text: "String text = 'Hello';" },
                { id: "c", text: "let text = 'Hello'" },
                { id: "d", text: "text := 'Hello'" }
            ]
        },
        {
            topic: "Control Flow (Loops)",
            text: "How do you start a for loop to iterate from 0 to 4 in Python?",
            options: [
                { id: "a", text: "for (i=0; i<5; i++)" },
                { id: "b", text: "for i in range(5):" },
                { id: "c", text: "foreach i in 5:" },
                { id: "d", text: "loop i from 0 to 4:" }
            ]
        },
        {
            topic: "Functions",
            text: "What keyword is used to define a function in Python?",
            options: [
                { id: "a", text: "function" },
                { id: "b", text: "func" },
                { id: "c", text: "def" },
                { id: "d", text: "method" }
            ]
        }
    ];

    const currentQuestion = questions[step];

    const handleNext = () => {
        if (step < questions.length - 1) {
            setStep(step + 1);
            setSelectedOption(null);
        } else {
            // Finished questions, simulate path generation
            setIsGenerating(true);
            setTimeout(() => {
                // Redirect back to generic Course View (which behaves as Learning Path for students)
                navigate(`/courses/${courseId}`);
            }, 3000); // 3 seconds of "generating" 
        }
    };

    if (isGenerating) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-zinc-950 absolute inset-0 z-50">
                <div className="w-24 h-24 relative mb-8">
                    <div className="absolute inset-0 bg-blue-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
                    <Network size={96} strokeWidth={1.5} className="text-blue-500 animate-bounce relative z-10" />
                </div>
                <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight text-center mb-3">
                    Structuring Your Knowledge Map...
                </h2>
                <p className="text-zinc-500 font-medium text-lg text-center max-w-md">
                    Our AI is analyzing your answers to dynamically unlock the modules you're ready for, and auto-mastering what you already know.
                </p>
                <div className="mt-12 flex items-center gap-3 text-blue-600 font-bold bg-blue-50 dark:bg-blue-900/20 px-6 py-3 rounded-full">
                    <Loader2 size={20} className="animate-spin" /> Generating Graph...
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-white dark:bg-zinc-950 absolute inset-0 z-50">
            <div className="max-w-3xl w-full">

                {/* Intro Header */}
                <div className="text-center mb-10 pb-10 border-b border-zinc-100 dark:border-zinc-900">
                    <div className="inline-flex w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-[2rem] justify-center items-center shadow-lg shadow-blue-500/20 mb-6">
                        <BrainCircuit size={32} />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight mb-4">Let's map your foundation.</h1>
                    <p className="text-zinc-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
                        We're going to ask a few quick questions to resolve your starting point. You'll automatically skip the skills you already know.
                    </p>
                </div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-2 mb-8">
                    {questions.map((_, i) => (
                        <div key={i} className={`h-2 rounded-full transition-all duration-300 ${i === step ? 'w-12 bg-blue-600' : i < step ? 'w-4 bg-emerald-400' : 'w-4 bg-zinc-200 dark:bg-zinc-800'}`} />
                    ))}
                </div>

                {/* Question Card */}
                <Card className="border-none shadow-2xl shadow-zinc-200/50 dark:shadow-black/50 overflow-hidden bg-white dark:bg-zinc-900 rounded-[2rem]">
                    <div className="p-8 md:p-12">
                        <div className="uppercase tracking-widest text-xs font-bold text-blue-500 flex items-center gap-2 mb-4">
                            <Sparkles size={14} /> Diagnostic: {currentQuestion.topic}
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-8">
                            {currentQuestion.text}
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {currentQuestion.options.map((option) => (
                                <Button
                                    key={option.id}
                                    variant="outline"
                                    className={`py-6 px-6 h-auto justify-start text-left whitespace-normal text-lg font-bold border-2 rounded-2xl transition-all ${selectedOption === option.id
                                            ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500/50"
                                            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600 text-zinc-600 dark:text-zinc-300"
                                        }`}
                                    onClick={() => setSelectedOption(option.id)}
                                >
                                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center mr-4 shrink-0 transition-colors ${selectedOption === option.id
                                            ? "bg-blue-200 dark:bg-blue-800"
                                            : "bg-zinc-100 dark:bg-zinc-800"
                                        }`}>
                                        {option.id.toUpperCase()}
                                    </span>
                                    {option.text}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-950 p-6 flex justify-end border-t border-zinc-100 dark:border-zinc-800">
                        <Button
                            disabled={!selectedOption}
                            onClick={handleNext}
                            className={`px-8 py-6 rounded-xl font-bold text-lg shadow-xl transition-all ${selectedOption
                                    ? "bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-zinc-900/20"
                                    : "opacity-50"
                                }`}
                        >
                            {step === questions.length - 1 ? "Complete Verification" : "Next Question"}
                        </Button>
                    </div>
                </Card>

            </div>
        </div>
    );
}
