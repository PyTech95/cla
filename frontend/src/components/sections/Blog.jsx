import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { useContent, t } from "@/context/ContentContext";
import { toAbs } from "@/lib/media";
import { SectionTitle } from "@/components/sections/About";

export function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); } catch { return ""; }
}

export default function Blog({ linkTo, limit, all }) {
    const { content } = useContent();
    const [items, setItems] = useState([]);
    useEffect(() => {
        api.get("/blog").then(({ data }) => setItems(data.items || [])).catch(() => {});
    }, []);

    if (!items.length && !all) return null;

    return (
        <section id="blog" data-testid="blog" className="py-20 sm:py-28 bg-noir-2 border-y border-white/5">
            <div className="wrap">
                <SectionTitle eyebrow={t(content, "blog.eyebrow", "Journal")} title={t(content, "blog.title", "Notes on skin, science & self-care.")} italic={t(content, "blog.title_italic", "self-care")} more={linkTo} moreLabel="All articles" />
                {all && !items.length && <p className="text-bone/45 mt-10">No articles published yet — check back soon.</p>}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
                    {(all ? items : items.slice(0, limit || 6)).map((n, i) => (
                        <motion.article key={n.id} data-testid={`blog-card-${i}`} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.7, delay: i * 0.08 }} className="card-dark overflow-hidden flex flex-col group">
                            <Link to={`/blog/${n.slug}`} className="flex flex-col flex-1">
                                <div className="h-56 overflow-hidden bg-noir-3">
                                    {n.cover_image_url
                                        ? <img src={toAbs(n.cover_image_url)} alt={n.title} className="w-full h-full object-cover image-kenburns" />
                                        : <div className="w-full h-full flex items-center justify-center font-serif italic text-3xl text-gold/40">CLA</div>}
                                </div>
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex items-center gap-3 mb-3 text-[10px] uppercase tracking-[0.28em]">
                                        {n.tag && <span className="text-gold border border-gold/40 rounded-full px-2.5 py-0.5">{n.tag}</span>}
                                        <span className="text-bone/45">{fmtDate(n.created_at)}</span>
                                    </div>
                                    <h3 className="font-serif text-2xl text-bone leading-snug group-hover:text-gold-light transition-colors">{n.title}</h3>
                                    {n.excerpt && <p className="text-bone/60 mt-3 leading-relaxed text-sm flex-1">{n.excerpt}</p>}
                                    <span className="mt-5 text-[11px] uppercase tracking-[0.24em] text-gold inline-flex items-center gap-1.5">Read article <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" /></span>
                                </div>
                            </Link>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
