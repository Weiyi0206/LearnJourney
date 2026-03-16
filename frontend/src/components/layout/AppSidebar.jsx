import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
    Sidebar,
    SidebarHeader,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    useSidebar,
} from "@/components/ui/sidebar";
import { Home, BookOpen, GitGraph, Settings, LogOut, CheckSquare } from "lucide-react";

export function AppSidebar() {
    const { user } = useAuth();
    const location = useLocation();
    const { state } = useSidebar();

    if (!user) return null;

    const educatorItems = [
        { title: "Dashboard", url: "/educator/dashboard", icon: Home },
        { title: "Course Builder", url: "/educator/builder", icon: BookOpen },
        { title: "Graph Editor", url: "/educator/graph", icon: GitGraph },
    ];

    const studentItems = [
        { title: "Dashboard", url: "/student/dashboard", icon: Home },
        { title: "Learning Path", url: "/student/path", icon: GitGraph },
        { title: "Quizzes", url: "/student/quizzes", icon: CheckSquare },
    ];

    const menuItems = user.role === "educator" ? educatorItems : studentItems;

    return (
        <Sidebar variant="inset">
            <SidebarHeader className="h-16 flex items-center px-4 border-b">
                <span className="text-lg font-bold text-blue-600 tracking-tight">LearnJourney</span>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {menuItems.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={location.pathname === item.url}
                                    >
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="border-t p-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {user.name.charAt(0)}
                    </div>
                    {state === "expanded" && (
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate">{user.name}</span>
                            <span className="text-xs text-zinc-500 truncate capitalize">{user.role}</span>
                        </div>
                    )}
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
