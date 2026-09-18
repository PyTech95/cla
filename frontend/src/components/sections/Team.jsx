import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import api from "@/lib/api";
import { useContent, t } from "@/context/ContentContext";
import { toAbs } from "@/lib/media";
import { SectionTitle } from "@/components/sections/About";

export default function Team() {
    const { content } = useContent();
    const [members, setMembers] = useState([]);

    useEffect(() => {
        api.get("/team").then(({ data }) => setMembers(data.team || [])).catch(() => {});
    }, []);

    if (!members.length) return null;

    return (
        <section id="team" data-testid="team" className="py-20 sm:py-28 bg-noir-2 border-y border-white/5">
            <div className="wrap">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
                    <SectionTitle eyebrow={t(content, "team.eyebrow", "The team")} title={t(content, "team.title", "Meet the hands behind your glow.")} italic={t(content, "team.title_italic", "hands")} />
                    {t(content, "team.lede", "") && <p className="text-bone/60 max-w-md font-light leading-relaxed">{t(content, "team.lede", "")}</p>}
                </div>

                <div className={`grid gap-6 ${members.length === 1 ? "max-w-4xl" : members.length === 2 ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
                    {members.map((m, i) => (
                        <motion.div key={m.id || i} data-testid={`team-member-${i}`} initial={{ opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.7, delay: i * 0.1 }} className={`card-dark overflow-hidden ${members.length === 1 ? "sm:grid sm:grid-cols-2" : ""}`}>
                            {m.image && (
                                <div className="overflow-hidden bg-noir-3">
                                    <img src={toAbs(m.image)} alt={m.name || "Team member"} className={`w-full object-cover object-top image-kenburns ${members.length === 1 ? "h-[360px] sm:h-full" : "h-[340px]"}`} />
                                </div>
                            )}
                            <div className="p-6 sm:p-8 flex flex-col justify-center">
                                <p className="font-serif text-2xl text-bone">{m.name || "Team member"}</p>
                                {m.role && <p className="eyebrow mt-2">{m.role}</p>}
                                {m.bio && <p className="text-bone/65 leading-relaxed font-light mt-4">{m.bio}</p>}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
