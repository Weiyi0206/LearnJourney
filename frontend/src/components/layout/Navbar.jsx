import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function Navbar() {
    const { user, profile, signOut } = useAuth();

    return (
        <nav className="flex items-center justify-between px-6 py-4 bg-white border-b shadow-sm dark:bg-zinc-950 dark:border-zinc-800">
            <div className="flex items-center gap-4">
                <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    LearnJourney
                </Link>
            </div>

            <div className="flex items-center gap-4">
                {user ? (
                    <>
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            Welcome, {profile?.full_name || user?.user_metadata?.full_name || user.email} ({profile?.role || user?.user_metadata?.role || "student"})
                        </span>
                        <Button variant="outline" size="sm" onClick={signOut}>
                            Log out
                        </Button>
                    </>
                ) : (
                    <Link to="/login">
                        <Button size="sm">Log in</Button>
                    </Link>
                )}
            </div>
        </nav>
    );
}
