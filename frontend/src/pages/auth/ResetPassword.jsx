import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, KeyRound, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const { updatePassword } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        const { error: updateError } = await updatePassword(password);

        if (updateError) {
            setError(updateError.message);
            setIsLoading(false);
            return;
        }

        setIsSuccess(true);
        setIsLoading(false);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
                {/* Decorative background blobs */}
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

                <Card className="w-full max-w-md border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden relative text-center pb-8 pt-10 px-8 z-10">
                    <div className="mx-auto w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
                        <CheckCircle className="text-emerald-500 w-10 h-10" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold tracking-tight mb-4">Password Reset!</CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-zinc-400 font-medium text-base mb-8 px-2 leading-relaxed">
                        Your password has been successfully updated. You can now use your new password to log in.
                    </CardDescription>
                    <Button
                        onClick={() => navigate('/login')}
                        className="w-full h-12 rounded-xl text-md font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-transform active:scale-[0.98]"
                    >
                        Continue to Login
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4 relative overflow-hidden">
            {/* Decorative background blobs */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[140px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none mix-blend-multiply dark:mix-blend-screen" />

            <Card className="w-full max-w-md z-10 border-zinc-200/60 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-2xl rounded-[2rem] overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

                <CardHeader className="space-y-2 pt-10 pb-6 relative z-10 px-8">
                    <CardTitle className="text-3xl font-extrabold tracking-tight">Create new password</CardTitle>
                    <CardDescription className="text-zinc-500 dark:text-zinc-400 font-medium text-base">
                        Please enter your new password below.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit} className="relative z-10 px-8 pb-10">
                    <CardContent className="space-y-5 px-0 pb-6">
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-start gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5" />
                                <span>{error}</span>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password" className="font-bold text-zinc-700 dark:text-zinc-300">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="bg-white/50 dark:bg-zinc-900/50 rounded-xl h-12 pl-10 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500"
                                />
                                <KeyRound className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-400" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="font-bold text-zinc-700 dark:text-zinc-300">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="bg-white/50 dark:bg-zinc-900/50 rounded-xl h-12 pl-10 border-zinc-200 dark:border-zinc-800 focus-visible:ring-indigo-500"
                                />
                                <KeyRound className="absolute left-3.5 top-3.5 h-5 w-5 text-zinc-400" />
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
                                    Updating password...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
