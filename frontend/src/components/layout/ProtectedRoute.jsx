import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute({ allowedRole, children }) {
    const { user, profile, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        // This should ideally never be hit if AuthContext handles its own loading, 
        // but just in case it propagates down immediately.
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        // Redirect to login but save the attempted location so we can redirect back after login
        // if we want to implement that later.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // If a role is strictly required and we have a profile
    if (allowedRole && profile) {
        if (profile.role !== allowedRole) {
            // Redirect cross-roles to their correct dashboard
            return <Navigate to={`/${profile.role}/dashboard`} replace />;
        }
    }

    // If profile is still null because fetch hasn't completed but `user` is there,
    // we could potentially show a spinner, but since AuthContext blocks on `loading`,
    // `profile` should be available.
    if (!profile && user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="w-8 h-8 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
            </div>
        );
    }

    return children || <Outlet />;
}
