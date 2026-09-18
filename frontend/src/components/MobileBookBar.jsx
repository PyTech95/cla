import React from "react";
import { Phone, ChevronRight } from "lucide-react";
import { useContent, t } from "@/context/ContentContext";

export default function MobileBookBar() {
    const { content } = useContent();
    const bookingEnabled = t(content, "brand.booking_enabled", "false") === "true";
    const bookingUrl = t(content, "brand.booking_url", "");
    const phoneLink = t(content, "brand.phone_link", "+15166209158");

    return (
        <div
            data-testid="mobile-book-bar"
            className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pt-3 pb-safe bg-ivory/90 backdrop-blur-xl border-t border-charcoal/10 shadow-[0_-10px_30px_-18px_rgba(44,42,41,0.35)]"
        >
            <div className="flex gap-3 max-w-md mx-auto">
                <a
                    href={`tel:${phoneLink}`}
                    data-testid="mobile-call-btn"
                    className={`btn-ghost-charcoal rounded-full ${bookingEnabled && bookingUrl ? "flex-1" : "w-full"} min-h-[52px] flex items-center justify-center gap-2 text-xs uppercase tracking-[0.2em]`}
                >
                    <Phone className="w-4 h-4" /> Call
                </a>
                {bookingEnabled && bookingUrl && (
                    <a
                        href={bookingUrl}
                        target="_blank"
                        rel="noreferrer"
                        data-testid="mobile-book-btn"
                        className="btn-gold rounded-full flex-[1.6] min-h-[52px] flex items-center justify-center gap-2 text-xs uppercase tracking-[0.24em] font-medium"
                    >
                        Book Now <ChevronRight className="w-4 h-4" />
                    </a>
                )}
            </div>
        </div>
    );
}
