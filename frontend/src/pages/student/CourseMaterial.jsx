import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle, Video, FileText } from "lucide-react";

export default function CourseMaterial() {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location;

    const skillName = state?.skillName || "Functions";

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center gap-3 border-b pb-4 border-zinc-200 dark:border-zinc-800">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-xl dark:bg-blue-900/30">
                    <BookOpen />
                </div>
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Learning Module: {skillName}</h1>
                    <p className="text-zinc-500 font-medium">Review the material below, then take the knowledge check.</p>
                </div>
            </div>

            <div className="grid gap-6">
                <Card className="shadow-md border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="bg-zinc-50 dark:bg-zinc-950/50 flex flex-row items-center gap-3 rounded-t-xl">
                        <Video className="text-pink-500" />
                        <CardTitle className="text-xl">Video Lecture</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="aspect-video bg-zinc-200 dark:bg-zinc-900 rounded-xl flex items-center justify-center font-bold text-zinc-400">
                            [ Video Player Placeholder ]
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-md border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="bg-zinc-50 dark:bg-zinc-950/50 flex flex-row items-center gap-3 rounded-t-xl">
                        <FileText className="text-amber-500" />
                        <CardTitle className="text-xl">Reading Material</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <article className="prose dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300">
                            <p className="font-medium text-lg mb-4">
                                A function is a block of code which only runs when it is called. You can pass data, known as parameters, into a function.
                            </p>
                            <pre className="bg-zinc-900 text-zinc-100 p-4 rounded-xl text-sm mb-4">
                                <code>
                                    {`def my_function(name):
  print("Hello " + name)

my_function("Alice")`}
                                </code>
                            </pre>
                        </article>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-end pt-6">
                <Button
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 px-8 py-6 text-lg shadow-lg shadow-emerald-500/20"
                    onClick={() => navigate("/student/quizzes", { state: { skillId: state?.skillId, skillName } })}
                >
                    <CheckCircle size={24} />
                    Take Knowledge Check
                </Button>
            </div>
        </div>
    );
}
