import React from "react";
import { Award, HeartHandshake, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useContent, t } from "@/context/ContentContext";

export default function About() {
    const { content } = useContent();
    const aboutImg = t(content, "brand.about_image_url", "");
    const title = t(content, "about.title", "Quiet luxury, remarkable results.");
    const titleItalic = t(content, "about.title_italic", "remarkable");

    // Build a JSX title with italic emphasis substituted
    const titleNodes = (() => {
        if (!titleItalic || !title.includes(titleItalic)) return title;
        const [pre, post] = title.split(titleItalic);
        return (
            <>
                {pre}
                <span className="text-shimmer">{titleItalic}</span>
                {post}
            </>
        );
    })();

    const highlights = [
        { icon: Award, title: t(content, "about.highlight1_title", "Certified Esthetician"), desc: t(content, "about.highlight1_body", "") },
        { icon: HeartHandshake, title: t(content, "about.highlight2_title", "10+ years of care"), desc: t(content, "about.highlight2_body", "") },
        { icon: Sparkles, title: t(content, "about.highlight3_title", "Bespoke results"), desc: t(content, "about.highlight3_body", "") },
    ];

    return (
        <section id="about" data-testid="about" className="py-24 sm:py-32 bg-champagne/40">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-10 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.9, ease: [0.22, 0.68, 0.28, 1] }}
                    className="lg:col-span-6 relative"
                >
                    <div className="rounded-[28px] overflow-hidden card-luxury bg-cream/40">
                        {aboutImg && (
                            <img
                                src={aboutImg}
                                alt="Founder at the studio"
                                className="w-full h-[380px] sm:h-[460px] lg:h-[560px] object-cover object-top image-kenburns"
                            />
                        )}
                    </div>
                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, delay: 0.35 }}
                        className="hidden md:block absolute -bottom-6 -right-6 bg-ivory rounded-[20px] px-6 py-4 border border-gold/40 shadow-xl animate-float-slow"
                    >
                        <p className="font-script text-4xl text-gold-dark leading-none">{t(content, "hero.founder_name", "Cinthia")}</p>
                        <p className="text-[10px] uppercase tracking-[0.32em] text-charcoal/60 mt-1">Founder &amp; CEO · CLA</p>
                    </motion.div>
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.9, delay: 0.1, ease: [0.22, 0.68, 0.28, 1] }}
                    className="lg:col-span-6 space-y-7"
                >
                    <div className="text-[11px] uppercase tracking-[0.32em] text-gold-dark">{t(content, "about.eyebrow", "Our story")}</div>
                    <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-charcoal">
                        {titleNodes}
                    </h2>
                    <p className="text-charcoal/75 text-lg leading-relaxed font-light max-w-xl">{t(content, "about.body", "")}</p>
                    <p className="text-charcoal/70 leading-relaxed max-w-xl font-light">{t(content, "about.body2", "")}</p>
                    <div className="grid sm:grid-cols-3 gap-4 pt-2">
                        {highlights.map((h, i) => (
                            <motion.div
                                key={h.title}
                                initial={{ opacity: 0, y: 22 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, delay: 0.15 + i * 0.12 }}
                                whileHover={{ y: -6 }}
                                className="card-luxury p-5"
                            >
                                <h.icon className="w-6 h-6 text-gold-dark mb-3" />
                                <p className="font-serif text-lg text-charcoal mb-1">{h.title}</p>
                                <p className="text-charcoal/65 text-sm leading-relaxed">{h.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
