import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export default function ProtectedRoute({ children, requireRole }) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading || user === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-ivory">
                <div className="text-charcoal/60 font-serif text-2xl">Loading…</div>
            </div>
        );
    }
    if (!user) {
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    if (requireRole && user.role !== requireRole) {
        return <Navigate to="/portal" replace />;
    }
    return children;
}
