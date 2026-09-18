import React, { useEffect, useState } from "react";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import { useContent, t } from "@/context/ContentContext";

export default function Testimonials() {
    const { content } = useContent();
    const [items, setItems] = useState([]);
    const [i, setI] = useState(0);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        api.get("/testimonials").then(({ data }) => setItems(data.testimonials || [])).catch(() => {});
    }, []);

    // Auto-advance every 6s. Depending on `tick` means any manual navigation
    // (next / prev / dot) restarts the countdown from zero.
    useEffect(() => {
        if (items.length < 2) return;
        const id = setInterval(() => setI((p) => (p + 1) % items.length), 6000);
        return () => clearInterval(id);
    }, [items.length, tick]);

    if (items.length === 0) return null;
    const cur = items[Math.min(i, items.length - 1)];
    const go = (idx) => { setI((idx + items.length) % items.length); setTick((t) => t + 1); };

    return (
        <section id="testimonials" data-testid="testimonials" className="py-24 sm:py-32 bg-ivory">
            <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
                <div className="text-[11px] uppercase tracking-[0.32em] text-gold-dark mb-6">{t(content, "testimonials.eyebrow", "Voices")}</div>
                <div className="flex justify-center items-center gap-1 mb-8">
                    {Array.from({ length: cur.rating || 5 }).map((_, s) => <Star key={s} className="w-4 h-4 fill-gold text-gold" />)}
                </div>
                <div key={i} className="testi-in">
                    <p className="font-serif italic text-3xl sm:text-4xl lg:text-5xl text-charcoal leading-[1.2] tracking-tight">
                        &ldquo;{cur.text}&rdquo;
                    </p>
                    <p className="font-script text-4xl text-gold-dark mt-8">{cur.name}</p>
                </div>

                <div className="flex items-center justify-center gap-4 mt-10">
                    <button data-testid="testimonial-prev" onClick={() => go(i - 1)} aria-label="Previous testimonial" className="p-3 rounded-full border border-charcoal/15 hover:border-gold hover:text-gold-dark transition active:scale-95">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex gap-2">
                        {items.map((it, idx) => (
                            <button
                                key={it.id || it.name || idx}
                                onClick={() => go(idx)}
                                aria-label={`Go to testimonial ${idx + 1}`}
                                className={`h-1.5 transition-all duration-500 rounded-full ${idx === i ? "w-8 bg-gold" : "w-2 bg-charcoal/20"}`}
                            />
                        ))}
                    </div>
                    <button data-testid="testimonial-next" onClick={() => go(i + 1)} aria-label="Next testimonial" className="p-3 rounded-full border border-charcoal/15 hover:border-gold hover:text-gold-dark transition active:scale-95">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </section>
    );
}
