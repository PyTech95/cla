import React, { useEffect, useState, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, Play, ArrowUpRight } from "lucide-react";
import api from "@/lib/api";
import { useContent, t } from "@/context/ContentContext";
import { toAbs, mediaKind, embedUrl, posterFor } from "@/lib/media";
import { SectionTitle } from "@/components/sections/About";

export function MediaThumb({ item, className }) {
    const kind = mediaKind(item);
    if (kind === "video") {
        return <video src={toAbs(item.src)} poster={posterFor(item) || undefined} className={className} muted loop playsInline autoPlay preload="metadata" />;
    }
    if (kind === "youtube" || kind === "vimeo") {
        const poster = posterFor(item);
        return poster
            ? <img src={poster} alt={item.alt || "Video"} className={className} loading="lazy" />
            : <div className={`${className} bg-noir-3 flex items-center justify-center text-gold`}><Play className="w-8 h-8" /></div>;
    }
    return <img src={toAbs(item.src)} alt={item.alt || "Gallery moment"} className={className} loading="lazy" />;
}

function LightboxMedia({ item }) {
    const kind = mediaKind(item);
    if (kind === "youtube" || kind === "vimeo") {
        return <iframe title={item.alt || "Video"} src={embedUrl(item, true)} className="w-full aspect-video max-h-[80vh]" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen data-testid="lightbox-embed" />;
    }
    if (kind === "video") {
        return <video src={toAbs(item.src)} className="w-full max-h-[80vh] object-contain bg-noir" controls autoPlay playsInline data-testid="lightbox-video" />;
    }
    return <img src={toAbs(item.src)} alt={item.alt || ""} className="w-full max-h-[80vh] object-contain bg-noir select-none" data-testid="lightbox-image" />;
}

function Strip({ items, onOpen }) {
    const ref = useRef(null);
    const paused = useRef(false);
    const loop = items.length > 1 ? [...items, ...items] : items;

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        let raf;
        const tick = () => {
            if (!paused.current) {
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
        <div ref={ref} data-testid="gallery-marquee" onMouseEnter={pause} onMouseLeave={resume} onTouchStart={pause} onTouchEnd={resume} className="flex gap-4 overflow-x-auto pb-3 no-scrollbar cursor-grab">
            {loop.map((item, i) => (
                <button key={`${item.id || item.src}-${i}`} data-testid={i < items.length ? `gallery-item-${i}` : undefined} onClick={() => onOpen(i % items.length)} className="relative shrink-0 w-[240px] sm:w-[300px] h-[320px] sm:h-[380px] overflow-hidden rounded-[20px] border border-white/10 group bg-noir-3">
                    <MediaThumb item={item} className="absolute inset-0 w-full h-full object-cover image-kenburns" />
                    {mediaKind(item) !== "image" && (
                        <span className="absolute top-3 left-3 w-9 h-9 rounded-full bg-noir/70 backdrop-blur text-gold border border-gold/40 flex items-center justify-center"><Play className="w-4 h-4" /></span>
                    )}
                    <div className="absolute inset-0 flex flex-col justify-end p-5 bg-gradient-to-t from-noir/85 via-noir/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="font-serif text-lg text-bone translate-y-3 group-hover:translate-y-0 transition-transform duration-500">{item.alt || "View"}</span>
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

    const open = activeIdx !== null && items[activeIdx];
    const step = useCallback((dir) => setActiveIdx((prev) => (prev === null ? prev : (prev + dir + items.length) % items.length)), [items.length]);
    const openLightbox = (idx) => { setGridOpen(false); setActiveIdx(idx); };

    useEffect(() => {
        if (activeIdx === null) return;
        const onKey = (e) => { if (e.key === "ArrowRight") step(1); else if (e.key === "ArrowLeft") step(-1); };
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
        <section id="gallery" data-testid="gallery" className="py-20 sm:py-28 bg-noir overflow-hidden">
            <div className="wrap mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
                <SectionTitle eyebrow={t(content, "gallery.eyebrow", "Portfolio")} title={t(content, "gallery.title", "Moments of light & texture.")} italic={t(content, "gallery.title_italic", "light")} />
                {items.length > 0 && (
                    <button onClick={() => setGridOpen(true)} data-testid="gallery-view-all" className="btn-ghost self-start sm:self-auto rounded-full px-7 py-3.5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em] shrink-0">
                        View gallery <ArrowUpRight className="w-4 h-4" />
                    </button>
                )}
            </div>
            <div className="pl-4 sm:pl-6 lg:pl-10">
                <Strip items={items} onOpen={openLightbox} />
            </div>

            <Dialog open={gridOpen} onOpenChange={setGridOpen}>
                <DialogContent className="max-w-6xl bg-noir-2 border-white/10 text-bone p-0 overflow-hidden">
                    <DialogTitle className="px-6 pt-6 font-serif text-2xl">Gallery</DialogTitle>
                    <div data-testid="gallery-grid" className="p-6 pt-4 max-h-[78vh] overflow-y-auto scrollbar-thin grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((g, i) => (
                            <button key={g.id || i} onClick={() => openLightbox(i)} className="relative h-[200px] sm:h-[250px] overflow-hidden rounded-[16px] border border-white/10 group bg-noir-3">
                                <MediaThumb item={g} className="absolute inset-0 w-full h-full object-cover image-kenburns" />
                                {mediaKind(g) !== "image" && <span className="absolute top-3 left-3 w-8 h-8 rounded-full bg-noir/70 text-gold border border-gold/40 flex items-center justify-center"><Play className="w-3.5 h-3.5" /></span>}
                            </button>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={!!open} onOpenChange={(o) => !o && setActiveIdx(null)}>
                <DialogContent className="max-w-5xl bg-noir border-gold/30 p-0 overflow-hidden [&>button]:hidden">
                    <DialogTitle className="sr-only">Gallery item</DialogTitle>
                    {open && (
                        <div className="relative" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
                            <LightboxMedia item={items[activeIdx]} />
                            <button data-testid="lightbox-close" onClick={() => setActiveIdx(null)} aria-label="Close" className="absolute top-3 right-3 w-10 h-10 rounded-full bg-noir/80 border border-white/20 text-bone flex items-center justify-center hover:border-gold transition"><X className="w-5 h-5" /></button>
                            {items.length > 1 && (
                                <>
                                    <button data-testid="lightbox-prev" onClick={() => step(-1)} aria-label="Previous" className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-noir/80 border border-white/20 text-bone flex items-center justify-center hover:border-gold transition"><ChevronLeft className="w-5 h-5" /></button>
                                    <button data-testid="lightbox-next" onClick={() => step(1)} aria-label="Next" className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-noir/80 border border-white/20 text-bone flex items-center justify-center hover:border-gold transition"><ChevronRight className="w-5 h-5" /></button>
                                </>
                            )}
                            <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-white/10 text-bone">
                                <p className="font-serif text-lg">{items[activeIdx].alt || "CLA Aesthetics"}</p>
                                <span className="text-[11px] uppercase tracking-[0.28em] text-bone/50">{activeIdx + 1} / {items.length}</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </section>
    );
}
