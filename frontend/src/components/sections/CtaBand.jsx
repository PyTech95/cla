import React from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Send } from "lucide-react";
import { useContent, t } from "@/context/ContentContext";

export default function CtaBand() {
    const { content } = useContent();
    return (
        <section id="cta" data-testid="cta-band" className="py-16 sm:py-20 bg-noir-2 border-t border-white/5 relative overflow-hidden">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_120%,rgba(212,175,55,0.16),transparent)]" />
            <div className="wrap relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div className="max-w-2xl">
                    <p className="eyebrow mb-3">{t(content, "cta.eyebrow", "Ready when you are")}</p>
                    <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-[1.08] text-bone">{t(content, "cta.title", "Your consultation begins with a conversation.")}</h2>
                    <p className="text-bone/60 mt-4 font-light leading-relaxed">{t(content, "cta.body", "Tell us your goals — we'll design a treatment plan that feels unmistakably you.")}</p>
                </div>
                <div className="flex flex-wrap gap-3 shrink-0">
                    <a href={t(content, "brand.booking_url", "/contact")} target="_blank" rel="noreferrer" data-testid="cta-book" className="btn-gold rounded-full px-7 py-3.5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em]">{t(content, "brand.booking_label", "Book Now")} <ArrowUpRight className="w-4 h-4" /></a>
                    <Link to="/contact" data-testid="cta-inquire" className="btn-ghost rounded-full px-7 py-3.5 inline-flex items-center gap-2 text-sm uppercase tracking-[0.2em]"><Send className="w-4 h-4" /> Send an inquiry</Link>
                </div>
            </div>
        </section>
    );
}
