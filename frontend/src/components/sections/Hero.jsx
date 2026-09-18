import React, { useEffect, useRef, useState } from "react";
import { Star, ChevronRight, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useContent, t } from "@/context/ContentContext";
import { toAbs } from "@/lib/media";
import SparkleBurst from "@/components/Sparkle";

function Counter({ to = 200, duration = 1800 }) {
    const [val, setVal] = useState(0);
    const ref = useRef(null);
    useEffect(() => {
        let started = false;
        const obs = new IntersectionObserver(([e]) => {
            if (e.isIntersecting && !started) {
                started = true;
                const start = performance.now();
                const step = (ts) => {
                    const p = Math.min(1, (ts - start) / duration);
                    setVal(Math.round(p * to));
                    if (p < 1) requestAnimationFrame(step);
                };
                requestAnimationFrame(step);
            }
        }, { threshold: 0.5 });
        if (ref.current) obs.observe(ref.current);
        return () => obs.disconnect();
    }, [to, duration]);
    return <span ref={ref} data-testid="hero-counter">{val}+</span>;
}

function GoogleG({ className }) {
    return (
        <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
            <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z" />
            <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z" />
            <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z" />
            <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z" />
        </svg>
    );
}

const fade = (delay) => ({ initial: { opacity: 0, y: 22 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.9, delay, ease: [0.22, 0.68, 0.28, 1] } });

export default function Hero() {
    const { content } = useContent();
    const [slides, setSlides] = useState([]);
    const [active, setActive] = useState(0);

    useEffect(() => {
        api.get("/hero-images").then(({ data }) => setSlides((data?.images || []).filter((x) => x?.src))).catch(() => {});
    }, []);

    useEffect(() => {
        if (slides.length <= 1) return;
        const id = setInterval(() => setActive((i) => (i + 1) % slides.length), 4500);
        return () => clearInterval(id);
    }, [slides.length]);

    const HERO_BG = t(content, "brand.hero_bg_url", "");
    const counterTo = parseInt(t(content, "hero.counter_to", "200"), 10) || 200;

    return (
        <section id="home" data-testid="hero" className="relative overflow-hidden min-h-[100svh] flex items-center pt-28 pb-20">
            <div aria-hidden className="absolute inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: HERO_BG ? `url(${HERO_BG})` : "none", filter: "grayscale(0.35) brightness(0.5)" }} />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-noir/70 via-noir/75 to-noir" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-noir via-noir/60 to-transparent" />
            <div aria-hidden className="pointer-events-none absolute -top-20 right-[8%] w-[28rem] h-[28rem] rounded-full bg-gold/10 blur-[110px] animate-float" />
            <div aria-hidden className="pointer-events-none absolute bottom-0 left-[4%] w-72 h-72 rounded-full bg-gold/5 blur-[90px] animate-float-slow" />

            <div className="wrap grid lg:grid-cols-12 gap-10 lg:gap-6 items-center">
                <div className="lg:col-span-7 space-y-8">
                    <motion.div {...fade(0.05)} data-testid="hero-eyebrow" className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-gold/40 bg-white/[0.03] text-[11px] tracking-[0.32em] uppercase text-bone/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> {t(content, "hero.eyebrow", "South Hempstead, NY")}
                    </motion.div>
                    <motion.h1 {...fade(0.15)} className="relative font-serif fluid-display tracking-tight text-bone max-w-4xl">
                        <SparkleBurst color="#EEDEA8" points={[
                            { top: "-8%", left: "0%", size: 22, delay: 0 },
                            { top: "4%", right: "16%", size: 14, delay: 0.7 },
                            { bottom: "12%", left: "42%", size: 16, delay: 1.3 },
                            { bottom: "-6%", right: "28%", size: 18, delay: 2.4 },
                        ]} />
                        {t(content, "hero.title_part1", "Elevate your")} <span className="text-shimmer glow-pulse">{t(content, "hero.title_part1_italic", "glow.")}</span>
                        <br />
                        {t(content, "hero.title_part2", "Restore your")} <span className="text-shimmer glow-pulse">{t(content, "hero.title_part2_italic", "calm.")}</span>
                    </motion.h1>
                    <motion.p {...fade(0.28)} className="text-bone/70 text-lg sm:text-xl max-w-xl leading-relaxed font-light">
                        {t(content, "hero.subtitle", "")}
                    </motion.p>
                    <motion.div {...fade(0.4)} className="flex flex-wrap gap-3 sm:gap-4">
                        <a href="#contact" data-testid="hero-cta-inquire" className="btn-gold rounded-full px-7 py-3.5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em]">
                            {t(content, "hero.cta_primary", "Book a consultation")} <ChevronRight className="w-4 h-4" />
                        </a>
                        <a href="#services" data-testid="hero-cta-services" className="btn-ghost rounded-full px-7 py-3.5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em]">
                            {t(content, "hero.cta_secondary", "View services")}
                        </a>
                    </motion.div>
                    <motion.div {...fade(0.52)} data-testid="hero-reviews" className="inline-flex items-center gap-3 border border-white/10 bg-white/[0.03] rounded-2xl pl-3 pr-5 py-2.5">
                        <GoogleG className="w-8 h-8 shrink-0" />
                        <div className="leading-tight">
                            <div className="flex items-center gap-2">
                                <span className="font-serif text-xl">5.0</span>
                                <span className="flex items-center gap-0.5">{[0, 1, 2, 3, 4].map((s) => <Star key={s} className="w-3.5 h-3.5 fill-gold text-gold" />)}</span>
                            </div>
                            <p className="text-[11px] text-bone/55 mt-0.5">Based on <span className="text-bone/85"><Counter to={counterTo} /></span> Google reviews</p>
                        </div>
                    </motion.div>
                </div>

                <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ duration: 1.1, delay: 0.25, ease: [0.22, 0.68, 0.28, 1] }} className="lg:col-span-5 flex justify-center lg:justify-end">
                    <div className="relative w-full max-w-md gold-frame rounded-[26px]">
                        <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-noir-3">
                            <div className="relative w-full h-[360px] sm:h-[480px]">
                                {slides.map((img, idx) => (
                                    <img key={img.id || img.src} src={toAbs(img.src)} alt={img.alt || "Inside the CLA Aesthetics studio"} className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === active ? "opacity-100" : "opacity-0"}`} />
                                ))}
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-noir via-noir/60 to-transparent p-6 pt-20 pointer-events-none">
                                <p className="font-script text-4xl text-gold-light leading-none">{t(content, "hero.facility_signature", "Step inside.")}</p>
                                <p className="font-serif text-2xl mt-1 text-bone">{t(content, "hero.facility_title", "The CLA Studio")}</p>
                                <p className="text-[11px] uppercase tracking-[0.28em] text-bone/60 mt-1">{t(content, "hero.facility_subtitle", "South Hempstead, NY")}</p>
                            </div>
                            {slides.length > 1 && (
                                <div className="absolute top-4 right-4 flex gap-1.5" data-testid="hero-carousel-dots">
                                    {slides.map((s, idx) => (
                                        <button key={s.id || s.src} type="button" onClick={() => setActive(idx)} aria-label={`Show slide ${idx + 1}`} className={`h-1.5 rounded-full transition-all duration-500 ${idx === active ? "w-6 bg-gold" : "w-2 bg-bone/40 hover:bg-bone/70"}`} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            <a href="#about" aria-label="Scroll to explore" className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-2 text-bone/40 hover:text-gold transition-colors text-[10px] uppercase tracking-[0.3em]">
                Scroll <ArrowDown className="w-3.5 h-3.5 animate-scroll-cue" />
            </a>
        </section>
    );
}
