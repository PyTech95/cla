import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Tag, ArrowUpRight, Clock } from "lucide-react";
import api from "@/lib/api";

function daysLeft(endsAt) {
    if (!endsAt) return null;
    try {
        const end = new Date(endsAt);
        const diff = Math.ceil((end - new Date()) / (1000 * 60 * 60 * 24));
        if (diff <= 0) return "Ends today";
        if (diff === 1) return "1 day left";
        return `${diff} days left`;
    } catch { return null; }
}

export default function Offers() {
    const [items, setItems] = useState([]);
    useEffect(() => {
        let cancelled = false;
        api.get("/offers").then(({ data }) => {
            if (!cancelled) setItems(data.items || []);
        }).catch(() => { /* silent */ });
        return () => { cancelled = true; };
    }, []);

    if (!items.length) return null;

    return (
        <section id="offers" data-testid="offers" className="py-24 sm:py-28 bg-champagne/30">
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.8 }}
                    className="mb-12"
                >
                    <div className="text-[11px] uppercase tracking-[0.32em] text-gold-dark mb-3 inline-flex items-center gap-2">
                        <Tag className="w-3.5 h-3.5" /> Offers
                    </div>
                    <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-charcoal">
                        Thoughtfully curated <span className="text-shimmer">rituals</span>.
                    </h2>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6">
                    {items.map((o, i) => {
                        const dl = daysLeft(o.ends_at);
                        return (
                            <motion.div
                                key={o.id}
                                initial={{ opacity: 0, y: 26 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-40px" }}
                                transition={{ duration: 0.7, delay: i * 0.09 }}
                                whileHover={{ y: -6 }}
                                className="card-luxury overflow-hidden flex flex-col md:flex-row"
                            >
                                {o.banner_image_url && (
                                    <div className="md:w-52 h-48 md:h-auto shrink-0 overflow-hidden bg-cream/40">
                                        <img src={o.banner_image_url} alt={o.title} className="w-full h-full object-cover image-kenburns" />
                                    </div>
                                )}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-3 flex-wrap mb-3">
                                        <span className="text-[10px] uppercase tracking-[0.28em] border rounded-full px-2 py-0.5" style={{ color: o.accent_color || "#B8932E", borderColor: (o.accent_color || "#D4AF37") + "88" }}>Offer</span>
                                        {dl && (
                                            <span className="text-[10px] uppercase tracking-[0.28em] text-charcoal/60 inline-flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> {dl}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-serif text-2xl text-charcoal leading-snug">{o.title}</h3>
                                    {o.description && (
                                        <p className="text-charcoal/65 mt-3 leading-relaxed text-sm flex-1">{o.description}</p>
                                    )}
                                    {o.cta_url && (
                                        <a
                                            href={o.cta_url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-5 self-start btn-gold rounded-full px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] inline-flex items-center gap-2"
                                        >
                                            {o.cta_label || "Claim"} <ArrowUpRight className="w-3 h-3" />
                                        </a>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
