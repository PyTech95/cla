import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import api, { formatApiErrorDetail, setAuthTokens, clearAuthTokens } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null); // null = checking, false = unauth, object = auth
    const [loading, setLoading] = useState(true);

    const fetchMe = useCallback(async () => {
        try {
            const { data } = await api.get("/auth/me");
            setUser(data);
        } catch {
            setUser(false);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMe();
    }, [fetchMe]);

    const login = useCallback(async (email, password) => {
        const { data } = await api.post("/auth/login", { email, password });
        if (data?.access_token) setAuthTokens(data.access_token, data.refresh_token);
        setUser(data);
        return data;
    }, []);

    const register = useCallback(async (payload) => {
        const { data } = await api.post("/auth/register", payload);
        if (data?.access_token) setAuthTokens(data.access_token, data.refresh_token);
        setUser(data);
        return data;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } catch (err) {
            console.error("Logout request failed:", err);
        }
        clearAuthTokens();
        setUser(false);
    }, []);

    const value = useMemo(
        () => ({ user, loading, login, register, logout, refresh: fetchMe }),
        [user, loading, login, register, logout, fetchMe]
    );

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}

export { formatApiErrorDetail };
