import React from "react";
import { Instagram, Facebook, Mail, Phone, Shield } from "lucide-react";
import { useContent, t } from "@/context/ContentContext";
import SparkleBurst from "@/components/Sparkle";

export default function Footer() {
    const { content } = useContent();
    const LOGO = t(content, "brand.logo_url", "");
    const QR = t(content, "brand.qr_url", "");
    const bookingEnabled = t(content, "brand.booking_enabled", "false") === "true";
    const bookingUrl = t(content, "brand.booking_url", "");
    const hours = t(content, "footer.hours_block", "Mon–Fri 10am–8pm\nSat 9am–6pm\nSun by appointment");
    const addressLines = (t(content, "brand.address", "") || "").split(",");

    return (
        <footer data-testid="footer" className="bg-charcoal-deep text-ivory pt-20 pb-10">
            <div className="max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-5 space-y-5">
                    <div className="flex items-center gap-4">
                        {LOGO && <img src={LOGO} alt="CLA" className="w-16 h-16 object-contain" />}
                        <div>
                            <p className="font-serif text-2xl">{t(content, "brand.studio_name", "CLA Aesthetics & Wellness")}</p>
                            <p className="text-ivory/60 text-xs uppercase tracking-[0.3em] mt-1">{t(content, "footer.tagline", "Enhancing your natural beauty")}</p>
                        </div>
                    </div>
                    <p className="text-ivory/70 leading-relaxed max-w-md font-light">
                        {t(content, "footer.body", "")}
                    </p>
                    <div className="flex items-center gap-3">
                        <a href={t(content, "brand.instagram", "#")} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-ivory/15 flex items-center justify-center hover:border-gold hover:text-gold transition-colors" aria-label="Instagram"><Instagram className="w-4 h-4" /></a>
                        <a href={t(content, "brand.facebook", "#")} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-ivory/15 flex items-center justify-center hover:border-gold hover:text-gold transition-colors" aria-label="Facebook"><Facebook className="w-4 h-4" /></a>
                        <a href={`mailto:${t(content, "brand.email", "")}`} className="w-10 h-10 rounded-full border border-ivory/15 flex items-center justify-center hover:border-gold hover:text-gold transition-colors" aria-label="Email"><Mail className="w-4 h-4" /></a>
                        <a href={`tel:${t(content, "brand.phone_link", "")}`} className="w-10 h-10 rounded-full border border-ivory/15 flex items-center justify-center hover:border-gold hover:text-gold transition-colors" aria-label="Phone"><Phone className="w-4 h-4" /></a>
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-gold-light mb-2">Visit</p>
                    <p className="text-ivory/80 text-sm leading-relaxed">{addressLines[0]}<br />{addressLines.slice(1).join(",").trim()}</p>
                    <p className="text-ivory/80 text-sm leading-relaxed whitespace-pre-line">{hours}</p>
                </div>

                <div className="lg:col-span-2 space-y-3">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-gold-light mb-2">Explore</p>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#services" className="text-ivory/75 hover:text-gold transition-colors">Services</a></li>
                        <li><a href="/membership" className="text-ivory/75 hover:text-gold transition-colors">Membership</a></li>
                        {bookingEnabled && bookingUrl && (
                            <li><a href={bookingUrl} target="_blank" rel="noreferrer" className="text-ivory/75 hover:text-gold transition-colors">Book</a></li>
                        )}
                        <li><a href="/portal" className="text-ivory/75 hover:text-gold transition-colors">Client portal</a></li>
                        <li><a href="/contact" className="text-ivory/75 hover:text-gold transition-colors">Contact</a></li>
                    </ul>
                </div>

                <div className="lg:col-span-2">
                    {QR && (
                        <div className="rounded-3xl border border-gold/40 p-4 bg-charcoal/40 text-center">
                            <img src={QR} alt="Scan to book" className="w-full max-w-[140px] mx-auto rounded-xl bg-ivory p-1" />
                            <p className="text-[10px] uppercase tracking-[0.32em] text-gold-light mt-3">Scan to book</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-5 sm:px-8 mt-16">
                <div className="gold-divider mb-8" />
                <div className="relative inline-block">
                    <SparkleBurst color="#E8C877" points={[
                        { top: "-14%", left: "1%", size: 24, delay: 0 },
                        { top: "6%", right: "8%", size: 16, delay: 0.8 },
                        { bottom: "8%", left: "32%", size: 18, delay: 1.4 },
                        { top: "-8%", right: "30%", size: 12, delay: 2.0 },
                        { bottom: "-10%", left: "10%", size: 14, delay: 2.6 },
                    ]} />
                    <p className="font-serif italic text-5xl md:text-7xl lg:text-8xl tracking-tight text-shimmer glow-pulse leading-none">{t(content, "brand.studio_name", "CLA Aesthetics")}</p>
                </div>
                <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 text-xs text-ivory/50">
                    <p>© {new Date().getFullYear()} {t(content, "footer.copyright", "CLA Aesthetics & Wellness. All rights reserved.")}</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 items-center">
                        <a href="/privacy" className="hover:text-gold-light">Privacy</a>
                        <a href="/terms" className="hover:text-gold-light">Terms</a>
                        <a href="/refund-policy" className="hover:text-gold-light">Refunds</a>
                        <a href="/cookies" className="hover:text-gold-light">Cookies</a>
                        <a href="/medical-disclaimer" className="hover:text-gold-light">Medical disclaimer</a>
                        <a href="/accessibility" className="hover:text-gold-light">Accessibility</a>
                        <a href="/contact" className="hover:text-gold-light">Contact</a>
                        <a
                            href="/admin"
                            data-testid="footer-admin-link"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-ivory/15 text-ivory/50 hover:text-gold-light hover:border-gold/40 transition-colors text-[10px] uppercase tracking-[0.28em]"
                            title="Admin access"
                        >
                            <Shield className="w-3 h-3" /> Admin
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
