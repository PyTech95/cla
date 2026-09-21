import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowUpRight, Clock } from "lucide-react";
import api from "@/lib/api";
import { useContent, t } from "@/context/ContentContext";
import { toAbs } from "@/lib/media";
import { SectionTitle } from "@/components/sections/About";

function daysLeft(endsAt) {
    if (!endsAt) return null;
    const diff = Math.ceil((new Date(endsAt) - new Date()) / 86400000);
    if (Number.isNaN(diff)) return null;
    if (diff <= 0) return "Ends today";
    return diff === 1 ? "1 day left" : `${diff} days left`;
}

export default function Offers() {
    const { content } = useContent();
    const [items, setItems] = useState([]);
    useEffect(() => {
        api.get("/offers").then(({ data }) => setItems(data.items || [])).catch(() => {});
    }, []);

    if (!items.length) return null;

    return (
        <section id="offers" data-testid="offers" className="py-20 sm:py-28 bg-noir-2 border-y border-white/5">
            <div className="wrap">
                <SectionTitle eyebrow={t(content, "offers.eyebrow", "Offers")} title={t(content, "offers.title", "Thoughtfully curated rituals.")} italic={t(content, "offers.title_italic", "curated")} />
                <div className="grid md:grid-cols-2 gap-6 mt-12">
                    {items.map((o, i) => {
                        const dl = daysLeft(o.ends_at);
                        return (
                            <motion.div key={o.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.7, delay: i * 0.08 }} className="card-dark overflow-hidden flex flex-col md:flex-row">
                                {o.banner_image_url && (
                                    <div className="md:w-56 h-48 md:h-auto shrink-0 overflow-hidden bg-noir-3">
                                        <img src={toAbs(o.banner_image_url)} alt={o.title} className="w-full h-full object-cover image-kenburns" />
                                    </div>
                                )}
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-3 flex-wrap mb-3">
                                        <span className="text-[10px] uppercase tracking-[0.28em] border border-gold/50 text-gold rounded-full px-2.5 py-0.5">Offer</span>
                                        {dl && <span className="text-[10px] uppercase tracking-[0.28em] text-bone/50 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {dl}</span>}
                                    </div>
                                    <h3 className="font-serif text-2xl text-bone leading-snug">{o.title}</h3>
                                    {o.description && <p className="text-bone/60 mt-3 leading-relaxed text-sm flex-1">{o.description}</p>}
                                    {o.cta_url
                                        ? <a href={o.cta_url} target="_blank" rel="noreferrer" className="mt-5 self-start btn-gold rounded-full px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] inline-flex items-center gap-2">{o.cta_label || "Claim"} <ArrowUpRight className="w-3 h-3" /></a>
                                        : <Link to="/contact" className="mt-5 self-start btn-gold rounded-full px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] inline-flex items-center gap-2">{o.cta_label || "Claim"} <ArrowUpRight className="w-3 h-3" /></Link>}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
