import React from "react";
import { motion } from "framer-motion";

const DEFAULT_POINTS = [
    { top: "-6%", left: "2%", size: 18, delay: 0 },
    { top: "10%", right: "6%", size: 12, delay: 0.6 },
    { bottom: "4%", left: "12%", size: 14, delay: 1.1 },
    { top: "-10%", right: "22%", size: 10, delay: 1.6 },
];

function FourPointStar({ size = 16, color }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M12 0c.85 5.6 5.55 10.3 11.15 11.15C17.55 12 12.85 16.7 12 22.3 11.15 16.7 6.45 12 .85 11.15 6.45 10.3 11.15 5.6 12 0z"
                fill={color || "currentColor"}
            />
        </svg>
    );
}

// A decorative burst of twinkling gold sparkles. Absolutely positioned over its
// relative parent — purely ornamental, so it's aria-hidden and non-interactive.
export default function SparkleBurst({ points = DEFAULT_POINTS, className = "", color }) {
    return (
        <span className={`pointer-events-none absolute inset-0 z-10 ${className}`} aria-hidden="true">
            {points.map((p, i) => (
                <motion.span
                    key={i}
                    className="absolute text-gold"
                    style={{ top: p.top, left: p.left, right: p.right, bottom: p.bottom, color }}
                    initial={{ opacity: 0, scale: 0.3, rotate: 0 }}
                    animate={{
                        opacity: [0, 1, 0.25, 1, 0],
                        scale: [0.3, 1, 0.65, 1.15, 0.3],
                        rotate: [0, 22, -12, 16, 0],
                    }}
                    transition={{ duration: 3.4, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
                >
                    <FourPointStar size={p.size} color={color} />
                </motion.span>
            ))}
        </span>
    );
}
