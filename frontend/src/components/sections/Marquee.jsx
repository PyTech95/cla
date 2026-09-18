import React from "react";

const items = [
    "Botox", "Dermal Fillers", "PDO Lift", "PRP Facial", "Hydrofacial", "Microneedling",
    "Laser Therapy", "IV Nutrition", "Hair Restoration", "Skin Rejuvenation", "Weight Loss",
];

export default function Marquee() {
    const row = [...items, ...items];
    return (
        <section id="marquee" data-testid="marquee" aria-hidden className="bg-noir-2 border-y border-gold/20 overflow-hidden">
            <div className="flex w-max animate-marquee py-5">
                {row.map((s, i) => (
                    <span key={i} className="flex items-center gap-6 sm:gap-8 pr-8 sm:pr-10 font-serif italic text-shimmer text-2xl sm:text-3xl tracking-wide whitespace-nowrap">
                        {s}
                        <span className="text-gold/40 not-italic text-base">✦</span>
                    </span>
                ))}
            </div>
        </section>
    );
}
