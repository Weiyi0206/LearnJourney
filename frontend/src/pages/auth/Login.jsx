import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, Book, Compass } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const { signIn } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { data, error: signInError } = await signIn(email, password);

        if (signInError) {
            setError(signInError.message);
            setIsLoading(false);
            return;
        }

        // Role-based redirection logic handled in App.jsx via IndexRedirect
        navigate('/');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
            {/* Decorative background blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-500/10 blur-[140px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

            <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 gap-6 z-10">

                {/* Left Side: Bento Illustration / Info */}
                <div className="hidden lg:flex flex-col justify-center gap-6 p-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-semibold mb-6 text-sm">
                            <Sparkles size={16} /> Welcome to LearnJourney
                        </div>
                        <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
                            Unlock your <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-pink-500">
                                true potential
                            </span>.
                        </h1>
                        <p className="mt-4 text-lg text-zinc-500 font-medium">
                            Join an interactive learning experience designed to help you master new skills at your own pace.
                        </p>
                    </div>

                    {/* Mini Bento Cards */}
                    <div className="grid grid-cols-2 gap-4 mt-6">
                        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 shadow-sm flex flex-col gap-3 group hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <Book size={20} />
                            </div>
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Smart Curricula</h3>
                            <p className="text-xs text-zinc-500 font-medium">Bite-sized, engaging lessons.</p>
                        </div>
                        <div className="p-5 rounded-3xl bg-white dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800 shadow-sm flex flex-col gap-3 group hover:shadow-md transition-all">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                <Compass size={20} />
                            </div>
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100">Guided Paths</h3>
                            <p className="text-xs text-zinc-500 font-medium">Diagnostic-driven learning.</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Auth Form */}
                <div className="flex items-center justify-center lg:justify-end">
                    <Card className="w-full max-w-md border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
                        <CardHeader className="space-y-2 pt-10 pb-6 relative z-10 px-8">
                            <CardTitle className="text-3xl font-extrabold tracking-tight">Sign In</CardTitle>
                            <CardDescription className="text-zinc-500 dark:text-zinc-400 font-medium text-base">
                                Welcome back! Please enter your details.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit} className="relative z-10 px-8 pb-10">
                            <CardContent className="space-y-5 px-0 pb-6">
                                {error && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                        {error}
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="font-bold text-zinc-700 dark:text-zinc-300">Email Address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="bg-white/50 dark:bg-zinc-900/50 rounded-xl h-12 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Label htmlFor="password" className="font-bold text-zinc-700 dark:text-zinc-300">Password</Label>
                                        <Link to="/forgot-password" className="text-sm font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors">
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="bg-white/50 dark:bg-zinc-900/50 rounded-xl h-12 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500"
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col space-y-6 px-0 pb-0">
                                <Button
                                    type="submit"
                                    className="w-full h-12 rounded-xl text-md font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-lg shadow-zinc-900/10 transition-transform active:scale-[0.98]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Authenticating...
                                        </>
                                    ) : (
                                        'Sign In to Dashboard'
                                    )}
                                </Button>
                                <div className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                                    Don&apos;t have an account?{' '}
                                    <Link to="/register" className="font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 transition-colors">
                                        Sign up for free
                                    </Link>
                                </div>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
