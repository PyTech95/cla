import React, { useEffect, useRef, useState } from "react";
import { Star, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useContent, t, toAbs } from "@/context/ContentContext";
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
                const step = (t) => {
                    const p = Math.min(1, (t - start) / duration);
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

export default function Hero() {
    const [scrollY, setScrollY] = useState(0);
    const { content } = useContent();
    const [heroImages, setHeroImages] = useState([]);
    const [activeImg, setActiveImg] = useState(0);

    useEffect(() => {
        const onScroll = () => setScrollY(window.scrollY);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Fetch carousel images managed via Site Editor
    useEffect(() => {
        let cancelled = false;
        api.get("/hero-images")
            .then(({ data }) => {
                if (cancelled) return;
                const imgs = (data?.images || []).filter((x) => x && x.src);
                setHeroImages(imgs);
            })
            .catch((err) => console.error("Failed to load hero images:", err));
        return () => { cancelled = true; };
    }, []);

    // Auto-advance the carousel
    useEffect(() => {
        if (heroImages.length <= 1) return;
        const t = setInterval(() => {
            setActiveImg((i) => (i + 1) % heroImages.length);
        }, 4500);
        return () => clearInterval(t);
    }, [heroImages.length]);

    const HERO_BG = t(content, "brand.hero_bg_url", "");
    const FACILITY = t(content, "brand.hero_facility_image_url", "") || t(content, "brand.about_image_url", "");
    const bookingEnabled = t(content, "brand.booking_enabled", "false") === "true";
    const bookingUrl = t(content, "brand.booking_url", "");
    const phoneLink = t(content, "brand.phone_link", "+15166209158");
    const counterTo = parseInt(t(content, "hero.counter_to", "200"), 10) || 200;

    // Hero right-column now shows a curated facility image (not founder — that lives in About)
    const slides = heroImages.length > 0
        ? heroImages
        : (FACILITY ? [{ id: "facility", src: FACILITY, alt: "Inside the CLA Aesthetics studio" }] : []);

    return (
        <section id="home" data-testid="hero" className="relative overflow-hidden min-h-[100svh] flex items-center pt-28 pb-16">
            <div
                aria-hidden
                className="absolute inset-0 -z-10"
                style={{
                    backgroundImage: HERO_BG ? `url(${HERO_BG})` : "none",
                    backgroundSize: "cover",
                    backgroundPosition: `center ${50 + scrollY * 0.04}%`,
                    transform: `scale(1.08) translateY(${scrollY * 0.06}px)`,
                    filter: "saturate(0.92)",
                }}
            />
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-ivory/25 via-ivory/40 to-ivory/80" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ivory/90 via-ivory/35 to-transparent" />
            <div aria-hidden className="pointer-events-none absolute top-24 right-[10%] w-40 h-40 rounded-full bg-gold/10 blur-3xl animate-float" />
            <div aria-hidden className="pointer-events-none absolute bottom-28 left-[6%] w-56 h-56 rounded-full bg-gold/10 blur-3xl animate-float-slow" />
            <a href="#about" aria-label="Scroll to explore" className="hidden sm:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2 text-charcoal/50 hover:text-gold-dark transition-colors">
                <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
                <span className="w-5 h-8 rounded-full border border-charcoal/30 flex justify-center pt-1.5">
                    <span className="w-1 h-1.5 rounded-full bg-gold animate-scroll-cue" />
                </span>
            </a>

            <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-10 w-full">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.22, 0.68, 0.28, 1] }}
                    className="lg:col-span-7 space-y-8"
                >
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        data-testid="hero-eyebrow"
                        className="inline-flex items-center gap-3 px-4 py-1.5 mt-10 rounded-full border border-gold/40 bg-ivory/70 backdrop-blur-sm text-[11px] tracking-[0.32em] uppercase text-charcoal/70"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" /> {t(content, "hero.eyebrow", "South Hempstead, NY")}
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 26 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1.0, delay: 0.18, ease: [0.22, 0.68, 0.28, 1] }}
                        className="relative font-serif fluid-display tracking-tight text-charcoal max-w-4xl"
                    >
                        <SparkleBurst points={[
                            { top: "-8%", left: "0%", size: 22, delay: 0 },
                            { top: "4%", right: "16%", size: 14, delay: 0.7 },
                            { bottom: "12%", left: "42%", size: 16, delay: 1.3 },
                            { top: "-4%", right: "2%", size: 12, delay: 1.9 },
                            { bottom: "-6%", right: "28%", size: 18, delay: 2.4 },
                        ]} />
                        {t(content, "hero.title_part1", "Elevate your")} <span className="text-shimmer glow-pulse">{t(content, "hero.title_part1_italic", "glow.")}</span>
                        <br />
                        {t(content, "hero.title_part2", "Restore your")} <span className="text-shimmer glow-pulse">{t(content, "hero.title_part2_italic", "calm.")}</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.32 }}
                        className="text-charcoal/75 text-lg sm:text-xl max-w-xl leading-relaxed font-light"
                    >
                        {t(content, "hero.subtitle", "")}
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.44 }}
                        className="flex flex-wrap gap-3 sm:gap-4"
                    >
                        {bookingEnabled && bookingUrl && (
                            <motion.a whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} href={bookingUrl} target="_blank" rel="noreferrer" data-testid="hero-cta-book" className="btn-gold rounded-full px-7 py-3.5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em]">
                                {t(content, "hero.cta_primary", "Book your session")} <ChevronRight className="w-4 h-4" />
                            </motion.a>
                        )}
                        <motion.a whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} href="#services" data-testid="hero-cta-services" className={`${bookingEnabled && bookingUrl ? "btn-ghost-charcoal" : "btn-gold"} rounded-full px-7 py-3.5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em]`}>
                            {t(content, "hero.cta_secondary", "View services")} <ChevronRight className="w-4 h-4" />
                        </motion.a>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.58 }}
                        className="pt-2"
                        data-testid="hero-reviews"
                    >
                        <div className="inline-flex items-center gap-3 bg-ivory/90 backdrop-blur border border-gold/30 rounded-2xl pl-3 pr-5 py-2.5 shadow-[0_14px_44px_-20px_rgba(44,42,41,0.35)]">
                            <GoogleG className="w-8 h-8 shrink-0" />
                            <div className="text-left leading-tight">
                                <div className="flex items-center gap-2">
                                    <span className="font-serif text-xl text-charcoal">5.0</span>
                                    <span className="flex items-center gap-0.5">
                                        {[0, 1, 2, 3, 4].map((s) => <Star key={s} className="w-3.5 h-3.5 fill-gold text-gold" />)}
                                    </span>
                                </div>
                                <p className="text-[11px] text-charcoal/60 mt-0.5">
                                    Based on <span className="font-medium text-charcoal/80"><Counter to={counterTo} /></span> Google reviews
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.94, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 1.1, delay: 0.2, ease: [0.22, 0.68, 0.28, 1] }}
                    className="lg:col-span-5 relative flex items-center justify-center"
                >
                    <div className="relative w-full max-w-sm animate-floatY">
                        <div className="absolute -inset-3 rounded-[28px] bg-gradient-to-br from-gold/30 via-transparent to-gold/10 blur-2xl" aria-hidden />
                        <div className="relative card-luxury overflow-hidden rounded-[28px]">
                            <div className="relative w-full h-[340px] sm:h-[440px]">
                                {slides.map((img, idx) => (
                                    <img
                                        key={img.id || img.src}
                                        src={toAbs(img.src)}
                                        alt={img.alt || "Inside the CLA Aesthetics studio"}
                                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${idx === activeImg ? "opacity-100 image-kenburns" : "opacity-0"}`}
                                    />
                                ))}
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-charcoal/85 via-charcoal/40 to-transparent p-5 pt-16 text-ivory pointer-events-none">
                                <p className="font-script text-4xl text-gold-light leading-none">{t(content, "hero.facility_signature", "Step inside.")}</p>
                                <p className="font-serif text-2xl mt-1">{t(content, "hero.facility_title", "The CLA Studio")}</p>
                                <p className="text-[11px] uppercase tracking-[0.28em] text-ivory/70 mt-1">{t(content, "hero.facility_subtitle", "South Hempstead, NY")}</p>
                            </div>
                            {slides.length > 1 && (
                                <div className="absolute bottom-3 right-4 flex gap-1.5" data-testid="hero-carousel-dots">
                                    {slides.map((s, idx) => (
                                        <button
                                            key={s.id || s.src}
                                            type="button"
                                            onClick={() => setActiveImg(idx)}
                                            aria-label={`Show slide ${idx + 1}`}
                                            className={`h-1.5 rounded-full transition-all duration-500 ${idx === activeImg ? "w-6 bg-gold-light" : "w-2 bg-ivory/50 hover:bg-ivory/80"}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
