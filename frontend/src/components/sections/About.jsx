import React from "react";
import { Award, HeartHandshake, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { useContent, t } from "@/context/ContentContext";
import { toAbs } from "@/lib/media";

export function SectionTitle({ eyebrow, title, italic, lede, align = "left", testId }) {
    const nodes = (() => {
        if (!italic || !title.includes(italic)) return title;
        const [pre, post] = title.split(italic);
        return (<>{pre}<span className="text-shimmer">{italic}</span>{post}</>);
    })();
    return (
        <div className={`max-w-2xl ${align === "center" ? "mx-auto text-center" : ""}`} data-testid={testId}>
            {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-bone">{nodes}</h2>
            {lede && <p className="text-bone/65 mt-5 font-light leading-relaxed text-base md:text-lg">{lede}</p>}
        </div>
    );
}

export default function About() {
    const { content } = useContent();
    const aboutImg = toAbs(t(content, "brand.about_image_url", ""));
    const highlights = [
        { icon: Award, title: t(content, "about.highlight1_title", "Certified Esthetician"), desc: t(content, "about.highlight1_body", "") },
        { icon: HeartHandshake, title: t(content, "about.highlight2_title", "10+ years of care"), desc: t(content, "about.highlight2_body", "") },
        { icon: Sparkles, title: t(content, "about.highlight3_title", "Bespoke results"), desc: t(content, "about.highlight3_body", "") },
    ];

    return (
        <section id="about" data-testid="about" className="py-20 sm:py-28 bg-noir">
            <div className="wrap grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.9 }} className="lg:col-span-5 relative">
                    <div className="gold-frame rounded-[24px]">
                        <div className="rounded-[24px] overflow-hidden border border-white/10 bg-noir-3">
                            {aboutImg && <img src={aboutImg} alt="Founder at the studio" className="w-full h-[400px] sm:h-[500px] lg:h-[580px] object-cover object-top image-kenburns" />}
                        </div>
                    </div>
                    <div className="absolute -bottom-5 left-5 bg-noir-2 border border-gold/40 rounded-2xl px-5 py-3.5 shadow-2xl">
                        <p className="font-script text-4xl text-gold-light leading-none">{t(content, "hero.founder_name", "Cinthia")}</p>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-bone/55 mt-1">{t(content, "hero.founder_role", "Founder & CEO")} · CLA</p>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.9, delay: 0.1 }} className="lg:col-span-7 space-y-7 lg:pl-6">
                    <SectionTitle eyebrow={t(content, "about.eyebrow", "Our story")} title={t(content, "about.title", "Quiet luxury, remarkable results.")} italic={t(content, "about.title_italic", "remarkable")} />
                    <p className="text-bone/75 text-lg leading-relaxed font-light max-w-2xl">{t(content, "about.body", "")}</p>
                    <p className="text-bone/60 leading-relaxed max-w-2xl font-light">{t(content, "about.body2", "")}</p>
                    <div className="grid sm:grid-cols-3 gap-6 pt-4 border-t border-white/10">
                        {highlights.map((h, i) => (
                            <motion.div key={h.title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 + i * 0.1 }} className="pt-4 border-l border-gold/30 pl-4">
                                <h.icon className="w-5 h-5 text-gold mb-3" />
                                <p className="font-serif text-lg text-bone mb-1">{h.title}</p>
                                <p className="text-bone/55 text-sm leading-relaxed">{h.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
