import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useContent, t, toAbs } from "@/context/ContentContext";

export default function Team() {
    const { content } = useContent();
    const [members, setMembers] = useState([]);

    useEffect(() => {
        api.get("/team").then(({ data }) => setMembers(data.team || [])).catch(() => {});
    }, []);

    if (!members.length) return null;

    const title = t(content, "team.title", "Meet the hands behind your glow.");
    const titleItalic = t(content, "team.title_italic", "hands");
    const titleNodes = (() => {
        if (!titleItalic || !title.includes(titleItalic)) return title;
        const [pre, post] = title.split(titleItalic);
        return (<>{pre}<span className="text-shimmer glow-pulse">{titleItalic}</span>{post}</>);
    })();

    return (
        <section id="team" data-testid="team" className="py-24 sm:py-32 bg-champagne/25">
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
                <div className="max-w-2xl mb-14">
                    <div className="text-[11px] uppercase tracking-[0.32em] text-gold-dark mb-3">{t(content, "team.eyebrow", "The team")}</div>
                    <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-charcoal">
                        {titleNodes}
                    </h2>
                    {t(content, "team.lede", "") && (
                        <p className="text-charcoal/70 mt-5 font-light leading-relaxed text-lg">{t(content, "team.lede", "")}</p>
                    )}
                </div>

                <div className={`grid gap-8 ${members.length === 1 ? "sm:grid-cols-1 max-w-3xl" : members.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                    {members.map((m, i) => (
                        <motion.div
                            key={m.id || i}
                            data-testid={`team-member-${i}`}
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 0.68, 0.28, 1] }}
                            whileHover={{ y: -6 }}
                            className={`card-luxury overflow-hidden ${members.length === 1 ? "sm:flex" : ""}`}
                        >
                            {m.image && (
                                <div className={`overflow-hidden bg-cream/40 ${members.length === 1 ? "sm:w-1/2" : ""}`}>
                                    <img
                                        src={toAbs(m.image)}
                                        alt={m.name || "Team member"}
                                        className="w-full h-[340px] sm:h-[400px] object-cover object-top image-kenburns"
                                    />
                                </div>
                            )}
                            <div className={`p-6 sm:p-7 ${members.length === 1 ? "sm:w-1/2 sm:flex sm:flex-col sm:justify-center" : ""}`}>
                                <p className="font-serif text-2xl text-charcoal">{m.name || "Team member"}</p>
                                {m.role && <p className="text-[11px] uppercase tracking-[0.28em] text-gold-dark mt-1.5">{m.role}</p>}
                                {m.bio && <p className="text-charcoal/70 leading-relaxed font-light mt-4">{m.bio}</p>}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
