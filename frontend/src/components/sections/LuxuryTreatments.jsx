import React, { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { useContent, t } from "@/context/ContentContext";

function useReveal(threshold = 0.15) {
    const ref = useRef(null);
    const [shown, setShown] = useState(false);
    useEffect(() => {
        if (!ref.current) return;
        const obs = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setShown(true);
                    obs.disconnect();
                }
            },
            { threshold, rootMargin: "0px 0px -10% 0px" }
        );
        obs.observe(ref.current);
        return () => obs.disconnect();
    }, [threshold]);
    return [ref, shown];
}

export default function LuxuryTreatments() {
    const [rootRef, shown] = useReveal(0.08);
    const { content } = useContent();
    const bookingUrl = t(content, "brand.booking_url", "");
    const [items, setItems] = useState([]);

    useEffect(() => {
        api.get("/treatments-menu").then(({ data }) => setItems(data.items || [])).catch(() => {});
    }, []);

    const header = t(content, "treatments.menu_header", "LUXURY TREATMENTS");
    const [headerL1, headerL2] = (() => {
        // Split header into two lines on the space — fallback to single line
        const parts = header.split(" ");
        if (parts.length === 1) return [parts[0], ""];
        return [parts[0], parts.slice(1).join(" ")];
    })();

    return (
        <div
            ref={rootRef}
            data-testid="luxury-treatments"
            className="relative mb-4 rounded-[32px] overflow-hidden border border-gold/30 shadow-[0_24px_60px_-22px_rgba(184,147,46,0.35)]"
        >
            <div
                aria-hidden
                className="absolute inset-0"
                style={{
                    background:
                        "radial-gradient(120% 80% at 50% 0%, rgba(238,222,168,0.55) 0%, rgba(245,242,234,1) 40%, rgba(250,249,246,1) 75%)",
                }}
            />
            <div
                aria-hidden
                className="absolute inset-0 opacity-30 mix-blend-multiply"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.4'/></svg>\")",
                }}
            />
            <div aria-hidden className={`absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-gold/15 blur-3xl transition-all duration-[2000ms] ${shown ? "opacity-100" : "opacity-0"}`} />
            <div aria-hidden className={`absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-gold/10 blur-3xl transition-all duration-[2000ms] delay-300 ${shown ? "opacity-100" : "opacity-0"}`} />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />

            <div className="relative px-6 sm:px-12 lg:px-16 py-14 sm:py-20">
                <div className="text-center max-w-3xl mx-auto">
                    <p className={`font-serif italic text-2xl text-gold-dark tracking-wide transition-all duration-700 ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                        {t(content, "brand.studio_name", "CLA Aesthetics & Wellness")}
                    </p>
                    <div className={`flex items-center justify-center gap-4 my-4 transition-all duration-700 delay-150 ${shown ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}>
                        <span className="h-px w-16 bg-gold/60" />
                        <span className="text-gold text-xl rotate-on-show">✦</span>
                        <span className="h-px w-16 bg-gold/60" />
                    </div>
                    <h3 className="font-serif text-5xl sm:text-6xl lg:text-7xl tracking-[0.06em] leading-none overflow-hidden">
                        <span className={`block text-shimmer not-italic transition-all duration-[900ms] delay-200 ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>{headerL1}</span>
                        {headerL2 && (
                            <span className={`block text-shimmer not-italic transition-all duration-[900ms] delay-[350ms] mt-2 ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>{headerL2}</span>
                        )}
                    </h3>
                    <p className={`font-serif italic text-charcoal/70 text-xl sm:text-2xl mt-5 transition-all duration-700 delay-[600ms] ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                        {t(content, "treatments.subtitle", "Modern Luxury, Refined Results")}
                    </p>
                </div>

                <div className="mt-14 grid md:grid-cols-2 gap-x-12 lg:gap-x-20 gap-y-10 max-w-5xl mx-auto">
                    {[
                        { cat: "luxury", title: t(content, "treatments.col_luxury_title", "Luxury") },
                        { cat: "wellness", title: t(content, "treatments.col_wellness_title", "Wellness") },
                    ].map((col) => {
                        const colItems = items.filter((tr) => (tr.category || "luxury").toLowerCase() === col.cat);
                        if (colItems.length === 0) return <div key={col.cat} />;
                        return (
                            <div key={col.cat} className="space-y-1">
                                <div className={`flex items-center gap-3 mb-4 transition-all duration-700 ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
                                    <span className="h-px flex-1 bg-gold/40" />
                                    <h4 className="font-serif italic text-2xl sm:text-3xl text-gold-dark tracking-wide whitespace-nowrap">{col.title}</h4>
                                    <span className="h-px flex-1 bg-gold/40" />
                                </div>
                                {colItems.map((tr, i) => (
                                    <div
                                        key={tr.id || `${col.cat}-${i}`}
                                        style={{ transitionDelay: shown ? `${700 + i * 70}ms` : "0ms" }}
                                        className={`py-5 border-b border-gold/15 last:border-b-0 group cursor-default transition-all duration-700 ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                                    >
                                        <div className="flex items-baseline gap-3">
                                            <h5 className="font-serif text-2xl sm:text-[26px] text-charcoal group-hover:text-gold-dark transition-colors duration-300 group-hover:translate-x-1 will-change-transform">{tr.name}</h5>
                                            <span className="flex-1 border-b border-dotted border-gold/40 translate-y-[-4px] group-hover:border-gold transition-colors duration-300" aria-hidden />
                                            <span className="font-serif text-sm sm:text-base text-gold-dark whitespace-nowrap">{tr.price}</span>
                                        </div>
                                        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                                            {(tr.bullets || []).map((b) => (
                                                <li key={b} className="text-charcoal/65 text-sm flex items-center gap-2">
                                                    <span className="w-1 h-1 rounded-full bg-gold group-hover:scale-150 transition-transform duration-300" />
                                                    {b}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>

                <div className={`mt-14 flex flex-col items-center text-center transition-all duration-700 ${shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: shown ? `${700 + items.length * 70 + 100}ms` : "0ms" }}>
                    <a href={bookingUrl || "#contact"} target={bookingUrl ? "_blank" : undefined} rel={bookingUrl ? "noreferrer" : undefined} className="btn-gold rounded-full px-9 py-4 text-xs uppercase tracking-[0.32em]">{t(content, "treatments.cta", "Book your appointment today")}</a>
                    <div className="mt-10 flex items-center gap-4">
                        <span className="h-px w-20 bg-gold/40" />
                        <span className="text-gold text-sm rotate-on-show">✦</span>
                        <span className="h-px w-20 bg-gold/40" />
                    </div>
                    <p className="font-serif italic text-2xl sm:text-3xl text-charcoal mt-6">
                        {t(content, "treatments.closing", "Enhancing Your Natural Beauty")}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.4em] text-gold-dark mt-2">{t(content, "treatments.tagline", "with precision & care")}</p>
                    <div className="mt-8 text-sm text-charcoal/70 flex flex-col sm:flex-row items-center gap-x-4 gap-y-1">
                        <span>{t(content, "brand.address", "")}</span>
                        <span className="hidden sm:inline text-gold">|</span>
                        <a href={`tel:${t(content, "brand.phone_link", "+15166209158")}`} className="hover:text-gold-dark">{t(content, "brand.phone", "")}</a>
                        <span className="hidden sm:inline text-gold">|</span>
                        <a href={`mailto:${t(content, "brand.email", "")}`} className="hover:text-gold-dark">{t(content, "brand.email", "")}</a>
                    </div>
                </div>
            </div>

            <style>{`
                .rotate-on-show { animation: spinSlow 12s linear infinite; display: inline-block; }
                @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @media (prefers-reduced-motion: reduce) { .rotate-on-show { animation: none; } }
            `}</style>
        </div>
    );
}
