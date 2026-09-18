import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Newspaper, ArrowRight } from "lucide-react";
import api from "@/lib/api";

export default function News() {
    const [items, setItems] = useState([]);
    useEffect(() => {
        let cancelled = false;
        api.get("/news").then(({ data }) => {
            if (!cancelled) setItems(data.items || []);
        }).catch(() => { /* silent */ });
        return () => { cancelled = true; };
    }, []);

    if (!items.length) return null;

    return (
        <section id="news" data-testid="news" className="py-24 sm:py-28 bg-ivory">
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.8, ease: [0.22, 0.68, 0.28, 1] }}
                    className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
                >
                    <div>
                        <div className="text-[11px] uppercase tracking-[0.32em] text-gold-dark mb-3 inline-flex items-center gap-2">
                            <Newspaper className="w-3.5 h-3.5" /> Journal
                        </div>
                        <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-charcoal">
                            News &amp; <span className="text-shimmer">notes</span>
                        </h2>
                    </div>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((n, i) => (
                        <motion.article
                            key={n.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.7, delay: i * 0.08 }}
                            whileHover={{ y: -6 }}
                            className="card-luxury overflow-hidden flex flex-col"
                        >
                            {n.image_url && (
                                <div className="h-52 overflow-hidden bg-cream/40">
                                    <img src={n.image_url} alt={n.title} className="w-full h-full object-cover image-kenburns" />
                                </div>
                            )}
                            <div className="p-6 flex-1 flex flex-col">
                                {n.tag && (
                                    <span className="self-start text-[10px] uppercase tracking-[0.28em] text-gold-dark border border-gold/40 rounded-full px-2 py-0.5 mb-3">
                                        {n.tag}
                                    </span>
                                )}
                                <h3 className="font-serif text-2xl text-charcoal leading-snug">{n.title}</h3>
                                {n.summary && (
                                    <p className="text-charcoal/65 mt-3 leading-relaxed text-sm flex-1">{n.summary}</p>
                                )}
                                <div className="mt-4 text-[11px] uppercase tracking-[0.24em] text-charcoal/50 inline-flex items-center gap-1">
                                    Read more <ArrowRight className="w-3 h-3" />
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
