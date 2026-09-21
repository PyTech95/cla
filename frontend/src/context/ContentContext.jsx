import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import api from "@/lib/api";

const ContentContext = createContext({});
import { toAbs as abs } from "@/lib/media";

// Walk the content object and absolutise any *_url keys
function normalizeContent(raw) {
    const out = {};
    for (const k of Object.keys(raw || {})) {
        const v = raw[k];
        out[k] = (k.endsWith("_url") || k.includes("_image_url")) && typeof v === "string" ? abs(v) : v;
    }
    return out;
}

export function ContentProvider({ children }) {
    const [content, setContent] = useState({});
    const refresh = useCallback(async () => {
        try {
            const { data } = await api.get("/content");
            setContent(normalizeContent(data || {}));
        } catch (err) {
            console.error("Failed to refresh CMS content:", err);
        }
    }, []);
    useEffect(() => { refresh(); }, [refresh]);
    const value = useMemo(() => ({ content, refresh }), [content, refresh]);
    return (
        <ContentContext.Provider value={value}>
            {children}
        </ContentContext.Provider>
    );
}

export function useContent() {
    return useContext(ContentContext);
}

export function t(content, key, fallback = "") {
    return content?.[key] || fallback;
}

// Useful for non-content image refs (e.g., gallery items from /api/gallery)
export function toAbs(url) {
    return abs(url);
}
