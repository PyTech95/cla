import React, { useEffect, useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { useContent, t } from "@/context/ContentContext";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function Testimonials({ linkTo, all }) {
    const { content } = useContent();
    const [items, setItems] = useState([]);
    const [i, setI] = useState(0);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        api.get("/testimonials").then(({ data }) => setItems(data.testimonials || [])).catch(() => {});
    }, []);

    useEffect(() => {
        if (items.length < 2) return;
        const id = setInterval(() => setI((p) => (p + 1) % items.length), 6000);
        return () => clearInterval(id);
    }, [items.length, tick]);

    if (items.length === 0) return null;
    const cur = items[Math.min(i, items.length - 1)];
    const go = (idx) => { setI((idx + items.length) % items.length); setTick((x) => x + 1); };

    return (
        <section id="testimonials" data-testid="testimonials" className="py-20 sm:py-28 bg-noir relative overflow-hidden">
            <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="font-serif text-[22rem] leading-none text-gold/[0.04] select-none">“</span></div>
            <div className="wrap max-w-4xl text-center relative">
                <div className="eyebrow mb-6">{t(content, "testimonials.eyebrow", "Voices")}</div>
                <div className="flex justify-center items-center gap-1 mb-8">
                    {Array.from({ length: cur.rating || 5 }).map((_, s) => <Star key={s} className="w-4 h-4 fill-gold text-gold" />)}
                </div>
                <div key={i} className="testi-in">
                    <p className="font-serif italic text-2xl sm:text-4xl lg:text-5xl text-bone leading-[1.25] tracking-tight">&ldquo;{cur.text}&rdquo;</p>
                    <p className="font-script text-4xl text-gold-light mt-8">{cur.name}</p>
                </div>
                <div className="flex items-center justify-center gap-4 mt-10">
                    <button data-testid="testimonial-prev" onClick={() => go(i - 1)} aria-label="Previous testimonial" className="p-3 rounded-full border border-white/15 text-bone hover:border-gold hover:text-gold transition"><ChevronLeft className="w-4 h-4" /></button>
                    <div className="flex gap-2">
                        {items.map((it, idx) => <button key={it.id || idx} onClick={() => go(idx)} aria-label={`Go to testimonial ${idx + 1}`} className={`h-1.5 transition-all duration-500 rounded-full ${idx === i ? "w-8 bg-gold" : "w-2 bg-bone/25"}`} />)}
                    </div>
                    <button data-testid="testimonial-next" onClick={() => go(i + 1)} aria-label="Next testimonial" className="p-3 rounded-full border border-white/15 text-bone hover:border-gold hover:text-gold transition"><ChevronRight className="w-4 h-4" /></button>
                </div>
                {linkTo && <Link to={linkTo} data-testid="more-reviews" className="mt-8 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-gold hover:text-gold-light">All reviews <ArrowUpRight className="w-3.5 h-3.5" /></Link>}
            </div>
            {all && (
                <div className="wrap mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="reviews-grid">
                    {items.map((it, idx) => (
                        <div key={it.id || idx} className="card-dark p-6">
                            <div className="flex gap-0.5 mb-3">{Array.from({ length: it.rating || 5 }).map((_, s) => <Star key={s} className="w-3.5 h-3.5 fill-gold text-gold" />)}</div>
                            <p className="font-serif italic text-lg text-bone/90 leading-relaxed">&ldquo;{it.text}&rdquo;</p>
                            <p className="font-script text-3xl text-gold-light mt-4">{it.name}</p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
