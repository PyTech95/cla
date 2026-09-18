import React, { useEffect, useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Maximize2, X, ChevronLeft, ChevronRight, Play, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useContent, t, toAbs } from "@/context/ContentContext";

function isVideo(item) {
    if (!item) return false;
    if (item.type === "video") return true;
    const s = item.src || "";
    return /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|$)/i.test(s);
}

function Media({ item, className, controls = false, autoPlay = false, testId }) {
    if (isVideo(item)) {
        return (
            <video
                src={toAbs(item.src)}
                className={className}
                data-testid={testId}
                muted
                loop
                playsInline
                autoPlay={autoPlay}
                controls={controls}
                preload="metadata"
            />
        );
    }
    return <img src={toAbs(item.src)} alt={item.alt || "Gallery moment"} className={className} data-testid={testId} loading="lazy" />;
}

// Auto-scrolling, finger-swipeable strip. Runs left→right on every device;
// pauses while the guest is touching / hovering so they can browse freely.
function Marquee({ items, onOpen }) {
    const ref = useRef(null);
    const paused = useRef(false);
    const loop = items.length > 1 ? [...items, ...items] : items;

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let raf;
        const tick = () => {
            if (el && !paused.current) {
                el.scrollLeft += 0.6;
                const half = el.scrollWidth / 2;
                if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
            }
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [items.length]);

    const pause = () => { paused.current = true; };
    const resume = () => { paused.current = false; };

    return (
        <div
            ref={ref}
            data-testid="gallery-marquee"
            onMouseEnter={pause}
            onMouseLeave={resume}
            onTouchStart={pause}
            onTouchEnd={resume}
            className="flex gap-4 overflow-x-auto pb-3 no-scrollbar cursor-grab"
        >
            {loop.map((item, i) => (
                <button
                    key={`${item.id || item.src}-${i}`}
                    data-testid={i < items.length ? `gallery-item-${i}` : undefined}
                    onClick={() => onOpen(i % items.length)}
                    className="relative shrink-0 w-[240px] sm:w-[300px] h-[320px] sm:h-[380px] overflow-hidden rounded-[22px] group card-luxury"
                >
                    <Media item={item} autoPlay className="absolute inset-0 w-full h-full object-cover image-kenburns" />
                    {isVideo(item) && (
                        <span className="absolute top-3 left-3 w-9 h-9 rounded-full bg-charcoal/55 backdrop-blur text-ivory flex items-center justify-center">
                            <Play className="w-4 h-4" />
                        </span>
                    )}
                    <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-charcoal/75 via-charcoal/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="flex items-center gap-2 text-ivory translate-y-3 group-hover:translate-y-0 transition-transform duration-500">
                            <span className="w-8 h-8 rounded-full bg-ivory/15 backdrop-blur border border-ivory/30 flex items-center justify-center shrink-0">
                                <Maximize2 className="w-3.5 h-3.5" />
                            </span>
                            <span className="font-serif text-lg leading-tight">{item.alt || "View"}</span>
                        </div>
                    </div>
                </button>
            ))}
        </div>
    );
}

export default function Gallery() {
    const { content } = useContent();
    const [items, setItems] = useState([]);
    const [activeIdx, setActiveIdx] = useState(null);
    const [gridOpen, setGridOpen] = useState(false);
    const touchStartX = useRef(null);

    useEffect(() => {
        api.get("/gallery").then(({ data }) => setItems(data.gallery || [])).catch(() => {});
    }, []);

    const title = t(content, "gallery.title", "Moments of light & texture.");
    const titleItalic = t(content, "gallery.title_italic", "light");
    const titleNodes = (() => {
        if (!titleItalic || !title.includes(titleItalic)) return title;
        const [pre, post] = title.split(titleItalic);
        return (<>{pre}<span className="text-shimmer glow-pulse">{titleItalic}</span>{post}</>);
    })();

    const open = activeIdx !== null && items[activeIdx];
    const step = useCallback((dir) => {
        setActiveIdx((prev) => (prev === null ? prev : (prev + dir + items.length) % items.length));
    }, [items.length]);

    const openLightbox = (idx) => { setGridOpen(false); setActiveIdx(idx); };

    useEffect(() => {
        if (activeIdx === null) return;
        const onKey = (e) => {
            if (e.key === "ArrowRight") step(1);
            else if (e.key === "ArrowLeft") step(-1);
            else if (e.key === "Escape") setActiveIdx(null);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [activeIdx, step]);

    const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
    const onTouchEnd = (e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) > 45 && items.length > 1) step(dx < 0 ? 1 : -1);
    };

    return (
        <section id="gallery" data-testid="gallery" className="py-24 sm:py-32 bg-cream/40 overflow-hidden">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                <div className="max-w-2xl">
                    <div className="text-[11px] uppercase tracking-[0.32em] text-gold-dark mb-3">{t(content, "gallery.eyebrow", "Portfolio")}</div>
                    <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-charcoal">
                        {titleNodes}
                    </h2>
                </div>
                {items.length > 0 && (
                    <motion.button
                        whileHover={{ y: -3 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setGridOpen(true)}
                        data-testid="gallery-view-all"
                        className="btn-gold self-start sm:self-auto rounded-full px-7 py-3.5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] shrink-0"
                    >
                        View gallery <ArrowUpRight className="w-4 h-4" />
                    </motion.button>
                )}
            </div>

            {/* Auto-running strip — full-bleed so it flows off both edges */}
            <div className="pl-5 sm:pl-8">
                <Marquee items={items} onOpen={openLightbox} />
            </div>

            {/* Full gallery grid */}
            <Dialog open={gridOpen} onOpenChange={setGridOpen}>
                <DialogContent className="max-w-6xl bg-ivory border-gold/30 p-0 overflow-hidden">
                    <DialogTitle className="px-6 pt-6 font-serif text-2xl text-charcoal">Gallery</DialogTitle>
                    <div data-testid="gallery-grid" className="p-6 pt-4 max-h-[78vh] overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((g, i) => (
                            <button
                                key={g.id || i}
                                onClick={() => openLightbox(i)}
                                className="relative h-[220px] sm:h-[260px] overflow-hidden rounded-[18px] group"
                            >
                                <Media item={g} className="absolute inset-0 w-full h-full object-cover image-kenburns" />
                                {isVideo(g) && (
                                    <span className="absolute top-3 left-3 w-8 h-8 rounded-full bg-charcoal/55 backdrop-blur text-ivory flex items-center justify-center">
                                        <Play className="w-3.5 h-3.5" />
                                    </span>
                                )}
                                <span className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/20 transition-colors" />
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Lightbox */}
            <Dialog open={!!open} onOpenChange={(o) => !o && setActiveIdx(null)}>
                <DialogContent className="max-w-5xl bg-charcoal-deep border-gold/30 p-0 overflow-hidden [&>button]:hidden">
                    <DialogTitle className="sr-only">Gallery item</DialogTitle>
                    {open && (
                        <div className="relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                            <Media
                                item={items[activeIdx]}
                                testId="lightbox-image"
                                controls={isVideo(items[activeIdx])}
                                autoPlay={isVideo(items[activeIdx])}
                                className="w-full max-h-[80vh] object-contain bg-charcoal-deep select-none"
                            />
                            <button
                                data-testid="lightbox-close"
                                onClick={() => setActiveIdx(null)}
                                aria-label="Close"
                                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-ivory/90 text-charcoal flex items-center justify-center hover:bg-ivory transition active:scale-95"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            {items.length > 1 && (
                                <>
                                    <button
                                        data-testid="lightbox-prev"
                                        onClick={() => step(-1)}
                                        aria-label="Previous"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-ivory/85 text-charcoal flex items-center justify-center hover:bg-gold transition active:scale-95"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <button
                                        data-testid="lightbox-next"
                                        onClick={() => step(1)}
                                        aria-label="Next"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-ivory/85 text-charcoal flex items-center justify-center hover:bg-gold transition active:scale-95"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </>
                            )}
                            <div className="absolute bottom-0 inset-x-0 flex items-center justify-between gap-4 px-6 py-4 bg-gradient-to-t from-charcoal-deep/90 to-transparent text-ivory pointer-events-none">
                                <p className="font-serif text-xl">{items[activeIdx].alt || "CLA Aesthetics"}</p>
                                <span className="text-[11px] uppercase tracking-[0.28em] text-ivory/60">{activeIdx + 1} / {items.length}</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}
