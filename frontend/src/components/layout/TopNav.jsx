import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, BookOpen, GitGraph, CheckSquare, LogOut, Hexagon } from "lucide-react";

export function TopNav() {
    const { user, profile, signOut } = useAuth();
    const location = useLocation();

    if (!user) return null;

    const educatorItems = [
        { title: "Dashboard", url: "/educator/dashboard", icon: Home },
        { title: "Course Creator", url: "/educator/builder", icon: GitGraph },
    ];

    const studentItems = [
        { title: "Dashboard", url: "/student/dashboard", icon: Home },
        { title: "Course Hub", url: "/student/hub", icon: BookOpen },
    ];

    const role = profile?.role || user?.user_metadata?.role;
    const menuItems = role === "educator" ? educatorItems : studentItems;

    // A clever check to see if an item is active (including deep links)
    const checkIsActive = (itemUrl) => {
        if (location.pathname === itemUrl) return true;
        // Keep Dashboard active if we are deep into courses/nodes
        if (itemUrl.includes('dashboard') && location.pathname.includes('/courses/')) return false;
        if (itemUrl.includes('/courses/') && location.pathname.includes('/courses/')) return true;
        return false;
    };

    const userName = profile?.full_name || user?.user_metadata?.full_name || user?.email || "User";

    return (
        <div className="w-full flex justify-center px-4 md:px-8 pointer-events-none">
            {/* Glassmorphic floating pill wrapper */}
            <div className="pointer-events-auto flex items-center justify-between w-full max-w-6xl bg-white/60 dark:bg-zinc-900/80 backdrop-blur-2xl border border-white dark:border-zinc-800 shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] rounded-[2rem] px-3 py-2.5 transition-all duration-300">

                {/* Logo Area */}
                <div className="flex items-center gap-3 pl-2 pr-6 border-r border-zinc-200 dark:border-zinc-800">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-inner shadow-white/20">
                        <Hexagon size={22} className="text-white fill-white/20" />
                    </div>
                    <span className="font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 hidden sm:block">
                        LearnJourney
                    </span>
                </div>

                {/* Center Navigation Links (Bento Pills) */}
                <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-4 flex-1 justify-center">
                    {menuItems.map((item) => {
                        const isActive = checkIsActive(item.url);
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.title}
                                to={item.url}
                                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-300 shrink-0 ${isActive
                                    ? "bg-zinc-900 text-white shadow-xl shadow-zinc-900/20 dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-white/10 scale-100"
                                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-zinc-800/80 scale-95 hover:scale-100"
                                    }`}
                            >
                                <Icon size={18} className={isActive ? "" : "opacity-70"} />
                                <span className={isActive ? "block" : "hidden md:block"}>{item.title}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Area: Profile / Actions */}
                <div className="flex items-center gap-4 pl-4 border-l border-zinc-200 dark:border-zinc-800 shrink-0">
                    <div className="flex items-center gap-3 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-full pl-4 pr-1.5 py-1.5 border border-zinc-200/50 dark:border-zinc-700/50 hidden sm:flex">
                        <div className="flex flex-col items-end">
                            <span className="text-xs font-black leading-none text-zinc-900 dark:text-zinc-100 italic">{userName}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mt-1">{role}</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-inner uppercase">
                            {userName.charAt(0)}
                        </div>
                    </div>

                    <button
                        onClick={signOut}
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-zinc-400 hover:text-red-600 border border-transparent hover:border-red-100 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:border-red-900/30 transition-all duration-300"
                        title="Log Out"
                    >
                        <LogOut size={18} />
                    </button>
                </div>


            </div>
        </div>
    );
}
