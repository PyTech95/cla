import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useContent, t } from "@/context/ContentContext";
import { SectionTitle } from "@/components/sections/About";

export default function Services({ linkTo, compact }) {
    const { content } = useContent();
    const [items, setItems] = useState([]);

    useEffect(() => {
        api.get("/treatments-menu").then(({ data }) => setItems(data.items || [])).catch(() => {});
    }, []);

    const cols = [
        { cat: "luxury", title: t(content, "treatments.col_luxury_title", "Luxury") },
        { cat: "wellness", title: t(content, "treatments.col_wellness_title", "Wellness") },
    ];

    return (
        <section id="services" data-testid="services" className="py-20 sm:py-28 bg-noir relative overflow-hidden">
            <div aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-[60rem] h-[30rem] rounded-full bg-gold/[0.06] blur-[140px] pointer-events-none" />
            <div className="wrap">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                    <SectionTitle eyebrow={t(content, "treatments.eyebrow", "Treatments")} title={t(content, "treatments.title", "Signature rituals, artfully performed.")} italic={t(content, "treatments.title_italic", "artfully")} more={linkTo} moreLabel="Full price list" />
                    <p className="text-bone/60 max-w-md font-light leading-relaxed">{t(content, "treatments.lede", "")}</p>
                </div>

                <div data-testid="luxury-treatments" className="relative rounded-[28px] border border-gold/25 bg-noir-2 overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
                    <div className="px-5 sm:px-10 lg:px-16 py-12 sm:py-16">
                        <div className="text-center max-w-3xl mx-auto">
                            <p className="font-serif italic text-xl text-gold">{t(content, "brand.studio_name", "CLA Aesthetics & Wellness")}</p>
                            <div className="flex items-center justify-center gap-4 my-4"><span className="h-px w-16 bg-gold/50" /><span className="text-gold">✦</span><span className="h-px w-16 bg-gold/50" /></div>
                            <h3 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-[0.05em] leading-none text-shimmer not-italic">{t(content, "treatments.menu_header", "LUXURY TREATMENTS")}</h3>
                            <p className="font-serif italic text-bone/60 text-lg sm:text-xl mt-4">{t(content, "treatments.subtitle", "Modern Luxury, Refined Results")}</p>
                        </div>

                        <div className="mt-12 grid md:grid-cols-2 gap-x-12 lg:gap-x-20 gap-y-10">
                            {cols.map((col) => {
                                const colItems = items.filter((tr) => (tr.category || "luxury").toLowerCase() === col.cat).slice(0, compact ? 4 : undefined);
                                if (!colItems.length) return <div key={col.cat} />;
                                return (
                                    <div key={col.cat}>
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="h-px flex-1 bg-gold/30" />
                                            <h4 className="font-serif italic text-2xl text-gold whitespace-nowrap">{col.title}</h4>
                                            <span className="h-px flex-1 bg-gold/30" />
                                        </div>
                                        {colItems.map((tr, i) => (
                                            <motion.div key={tr.id || i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.05 }} className="py-4 border-b border-white/[0.07] last:border-b-0 group">
                                                <div className="flex items-baseline gap-3">
                                                    <h5 className="font-serif text-xl sm:text-2xl text-bone group-hover:text-gold-light transition-colors">{tr.name}</h5>
                                                    <span className="flex-1 border-b border-dotted border-gold/30 translate-y-[-4px]" aria-hidden />
                                                    <span className="font-serif text-sm sm:text-base text-gold whitespace-nowrap">{tr.price}</span>
                                                </div>
                                                {(tr.bullets || []).length > 0 && (
                                                    <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                                                        {tr.bullets.map((b) => <li key={b} className="text-bone/50 text-sm flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-gold" />{b}</li>)}
                                                    </ul>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-12 flex flex-col items-center text-center">
                            <a href={t(content, "brand.booking_url", "/contact")} target="_blank" rel="noreferrer" data-testid="treatments-cta" className="btn-gold rounded-full px-9 py-4 text-xs uppercase tracking-[0.32em] text-center">{t(content, "treatments.cta", "Book your appointment today")}</a>
                            <p className="font-serif italic text-2xl text-bone mt-8">{t(content, "treatments.closing", "Enhancing Your Natural Beauty")}</p>
                            <p className="eyebrow mt-2">{t(content, "treatments.tagline", "with precision & care")}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
