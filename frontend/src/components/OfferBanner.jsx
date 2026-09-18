import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, X, ArrowUpRight } from "lucide-react";
import api from "@/lib/api";

const DISMISS_KEY = "cla_offer_banner_dismissed_id";

export default function OfferBanner() {
    const [offer, setOffer] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let cancelled = false;
        api.get("/offers/banner").then(({ data }) => {
            if (cancelled) return;
            const o = data?.offer;
            if (!o) return;
            let dismissed = "";
            try { dismissed = localStorage.getItem(DISMISS_KEY) || ""; } catch { /* noop */ }
            if (dismissed === o.id) return;
            setOffer(o);
            setVisible(true);
        }).catch(() => { /* silent */ });
        return () => { cancelled = true; };
    }, []);

    const dismiss = () => {
        setVisible(false);
        if (offer?.id) {
            try { localStorage.setItem(DISMISS_KEY, offer.id); } catch { /* noop */ }
        }
    };

    return (
        <AnimatePresence>
            {visible && offer && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.22, 0.68, 0.28, 1] }}
                    data-testid="offer-banner"
                    className="fixed top-0 inset-x-0 z-50 text-ivory"
                    style={{
                        background: `linear-gradient(90deg, ${offer.accent_color || "#D4AF37"}, #B8932E)`,
                    }}
                >
                    <div className="max-w-7xl mx-auto px-5 sm:px-8 py-2.5 flex items-center gap-3">
                        <Sparkles className="w-4 h-4 shrink-0" />
                        <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <span className="font-serif text-sm sm:text-base leading-tight">{offer.title}</span>
                            {offer.description && (
                                <span className="text-ivory/85 text-xs sm:text-sm leading-tight">— {offer.description}</span>
                            )}
                        </div>
                        {offer.cta_url && (
                            <a
                                href={offer.cta_url}
                                target="_blank"
                                rel="noreferrer"
                                className="hidden sm:inline-flex items-center gap-1.5 bg-charcoal/25 hover:bg-charcoal/40 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em] transition-colors"
                            >
                                {offer.cta_label || "Learn more"} <ArrowUpRight className="w-3 h-3" />
                            </a>
                        )}
                        <button
                            onClick={dismiss}
                            aria-label="Dismiss offer"
                            className="p-1 rounded-full hover:bg-charcoal/25 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
