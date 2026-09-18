import React from "react";
import { motion } from "framer-motion";
import LuxuryTreatments from "@/components/sections/LuxuryTreatments";

export default function Services() {
    return (
        <section id="services" data-testid="services" className="py-24 sm:py-32 bg-ivory">
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.8, ease: [0.22, 0.68, 0.28, 1] }}
                    className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
                >
                    <div className="max-w-2xl">
                        <div className="text-[11px] uppercase tracking-[0.32em] text-gold-dark mb-3">Treatments</div>
                        <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-charcoal">
                            Signature rituals, <span className="text-shimmer">artfully</span> performed.
                        </h2>
                    </div>
                    <p className="text-charcoal/65 max-w-md font-light leading-relaxed">
                        A curated menu of medical-aesthetic and wellness treatments, every one calibrated to your face, your goals and your day.
                    </p>
                </motion.div>

                <LuxuryTreatments />
            </div>
        </section>
    );
}
