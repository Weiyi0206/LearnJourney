import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, User, GraduationCap, CheckCircle } from 'lucide-react';

export default function Register() {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { signUp } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const { data, error: signUpError } = await signUp(email, password, fullName, role);

        if (signUpError) {
            setError(signUpError.message);
            setIsLoading(false);
            return;
        }

        // Usually, if email confirmation is turned on in Supabase,
        // data.user will exist, but data.session will be null.
        // We update the local state to show the success view.
        setIsSuccess(true);
        setIsLoading(false);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
                {/* Decorative background blobs */}
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 blur-[140px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

                <Card className="w-full max-w-md border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden relative text-center pb-8 pt-10 px-8 z-10">
                    <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <CheckCircle className="text-emerald-500 w-10 h-10" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight mb-4">Check your email</CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-zinc-400 font-medium text-base mb-8 px-2 leading-relaxed">
                        We've sent a verification link to <span className="font-bold text-zinc-900 dark:text-zinc-100">{email}</span>.
                        Please check your inbox to confirm your account before logging in.
                    </CardDescription>
                    <Link to="/login">
                        <Button className="w-full h-12 rounded-xl text-md font-bold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 transition-transform active:scale-[0.98]">
                            Back to Sign In
                        </Button>
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
            {/* Decorative background blobs */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-500/10 blur-[140px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

            <Card className="w-full max-w-[500px] z-10 border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] pointer-events-none" />

                <CardHeader className="space-y-2 pt-10 pb-6 relative z-10 px-8 lg:px-10">
                    <div className="inline-flex items-center gap-2 mb-2">
                        <Sparkles size={18} className="text-pink-500" />
                        <span className="text-sm font-bold tracking-widest uppercase text-pink-500">Join Us</span>
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight">Create an account</CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-zinc-400 font-medium text-base">
                        Enter your details below to get started.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit} className="relative z-10 px-8 lg:px-10 pb-10">
                    <CardContent className="space-y-5 px-0 pb-6">
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="fullName" className="font-bold text-zinc-700 dark:text-zinc-300">Full Name</Label>
                                <div className="relative">
                                    <Input
                                        id="fullName"
                                        placeholder="John Doe"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="bg-white/50 dark:bg-zinc-900/50 rounded-xl h-12 pl-10 border-zinc-200 dark:border-zinc-800 focus-visible:ring-pink-500"
                                    />
                                    <User className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-400" />
                                </div>
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="email" className="font-bold text-zinc-700 dark:text-zinc-300">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="bg-white/50 dark:bg-zinc-900/50 rounded-xl h-12 border-zinc-200 dark:border-zinc-800 focus-visible:ring-pink-500"
                                />
                            </div>

                            <div className="col-span-2 space-y-2">
                                <Label htmlFor="password" className="font-bold text-zinc-700 dark:text-zinc-300">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white/50 dark:bg-zinc-900/50 rounded-xl h-12 border-zinc-200 dark:border-zinc-800 focus-visible:ring-pink-500"
                                />
                            </div>

                            <div className="col-span-2 space-y-2 mt-2">
                                <Label htmlFor="role" className="font-bold text-zinc-700 dark:text-zinc-300">I am a...</Label>
                                <div className="grid grid-cols-2 gap-3 mt-1">
                                    <div
                                        className={`border-2 rounded-xl p-4 cursor-pointer flex flex-col items-center gap-2 transition-all ${role === 'student'
                                                ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/10'
                                                : 'border-zinc-200 dark:border-zinc-800 hover:border-pink-300 dark:hover:border-pink-800'
                                            }`}
                                        onClick={() => setRole('student')}
                                    >
                                        <User size={24} className={role === 'student' ? 'text-pink-500' : 'text-zinc-400'} />
                                        <span className={`font-bold text-sm ${role === 'student' ? 'text-pink-600 dark:text-pink-400' : 'text-zinc-500'}`}>Student</span>
                                    </div>
                                    <div
                                        className={`border-2 rounded-xl p-4 cursor-pointer flex flex-col items-center gap-2 transition-all ${role === 'educator'
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10'
                                                : 'border-zinc-200 dark:border-zinc-800 hover:border-indigo-300 dark:hover:border-indigo-800'
                                            }`}
                                        onClick={() => setRole('educator')}
                                    >
                                        <GraduationCap size={24} className={role === 'educator' ? 'text-indigo-500' : 'text-zinc-400'} />
                                        <span className={`font-bold text-sm ${role === 'educator' ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500'}`}>Educator</span>
                                    </div>
                                </div>
                            </div>
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
                                    Creating account...
                                </>
                            ) : (
                                'Create Account'
                            )}
                        </Button>
                        <div className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            Already have an account?{' '}
                            <Link to="/login" className="font-bold text-pink-600 hover:text-pink-700 dark:text-pink-400 transition-colors">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
