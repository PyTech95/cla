import React from "react";
import { Phone, MessageCircle, Send } from "lucide-react";
import { useContent, t } from "@/context/ContentContext";

export default function MobileBookBar() {
    const { content } = useContent();
    const phoneLink = t(content, "brand.phone_link", "+15166209158");
    const whatsapp = t(content, "brand.whatsapp", "");
    const BOOK = t(content, "brand.booking_url", "/contact");

    return (
        <div data-testid="mobile-book-bar" className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pt-3 pb-safe bg-noir/90 backdrop-blur-xl border-t border-white/10">
            <div className="flex gap-2 max-w-md mx-auto">
                <a href={`tel:${phoneLink}`} data-testid="mobile-call-btn" className="btn-ghost rounded-full flex-1 min-h-[48px] flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em]"><Phone className="w-4 h-4" /> Call</a>
                {whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer" data-testid="mobile-whatsapp-btn" className="btn-ghost rounded-full flex-1 min-h-[48px] flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em]"><MessageCircle className="w-4 h-4" /> WhatsApp</a>}
                <a href={BOOK} target="_blank" rel="noreferrer" data-testid="mobile-book-btn" className="btn-gold rounded-full flex-[1.4] min-h-[48px] flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.2em]"><Send className="w-4 h-4" /> {t(content, "brand.booking_label", "Book Now")}</a>
            </div>
        </div>
    );
}
