import React, { useEffect, useState } from "react";

export default function ScrollProgress() {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const onScroll = () => {
            const h = document.documentElement;
            const total = (h.scrollHeight - h.clientHeight) || 1;
            setProgress((h.scrollTop / total) * 100);
        };
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
    return (
        <div
            data-testid="scroll-progress"
            className="fixed top-0 left-0 right-0 z-50 h-[2px] bg-transparent pointer-events-none"
        >
            <div
                className="h-full"
                style={{
                    width: `${progress}%`,
                    background: "linear-gradient(90deg, #B8932E, #D4AF37, #F6E27A, #D4AF37, #B8932E)",
                }}
            />
        </div>
    );
}
