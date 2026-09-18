import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "@/lib/api";

const KEY = "cla_visitor_id";

function visitorId() {
    try {
        let id = localStorage.getItem(KEY);
        if (!id) {
            id = crypto.randomUUID();
            localStorage.setItem(KEY, id);
        }
        return id;
    } catch {
        return "anon-" + Math.random().toString(36).slice(2, 12);
    }
}

export default function Analytics() {
    const { pathname } = useLocation();
    useEffect(() => {
        if (pathname.startsWith("/admin") || pathname.startsWith("/login")) return;
        api.post("/track", { path: pathname, visitor_id: visitorId(), referrer: document.referrer || "" }).catch(() => {});
    }, [pathname]);
    return null;
}
