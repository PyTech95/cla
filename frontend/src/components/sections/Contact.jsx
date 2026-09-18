import React from "react";
import { Phone, Mail, MapPin, MessageCircle, Instagram, ArrowUpRight, Clock } from "lucide-react";
import { useContent, t } from "@/context/ContentContext";

const HOURS = [
    ["Monday – Friday", "10:00 AM – 8:00 PM"],
    ["Saturday", "9:00 AM – 6:00 PM"],
    ["Sunday", "By appointment"],
];

export default function Contact() {
    const { content } = useContent();
    const phone = t(content, "brand.phone", "516-620-9158");
    const phoneLink = t(content, "brand.phone_link", "+15166209158");
    const email = t(content, "brand.email", "cinthia@claaesthetics.com");
    const address = t(content, "brand.address", "1078 Grand Avenue, South Hempstead, NY 11550");
    const mapsQuery = t(content, "brand.maps_query", address);
    const instagram = t(content, "brand.instagram", "https://instagram.com/");
    const whatsapp = t(content, "brand.whatsapp", "https://wa.me/15166209158");
    const bookingEnabled = t(content, "brand.booking_enabled", "false") === "true";
    const bookingUrl = t(content, "brand.booking_url", "");
    const hoursTitle = t(content, "contact.hours_title", "Hours");
    const hoursRaw = t(content, "contact.hours", "");
    const hours = hoursRaw
        ? hoursRaw.split("\n").map((l) => l.split("|").map((s) => s.trim())).filter((p) => p[0])
        : HOURS;

    return (
        <section id="contact" data-testid="contact" className="py-24 sm:py-32 bg-cream/30">
            <div className="max-w-7xl mx-auto px-5 sm:px-8">
                <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                    {/* Left — invitation + CTA */}
                    <div className="lg:col-span-6 space-y-8">
                        <div>
                            <div className="text-[11px] uppercase tracking-[0.32em] text-gold-dark mb-3">
                                {t(content, "booking.eyebrow", "Book your visit")}
                            </div>
                            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-charcoal">
                                We&rsquo;ve been <span className="text-shimmer">waiting</span> for you.
                            </h2>
                            <p className="text-charcoal/65 mt-5 font-light leading-relaxed max-w-lg text-lg">
                                {t(content, "booking.lede", "Reserve your appointment online in a few taps, or reach us directly — we'd love to help you glow.")}
                            </p>
                        </div>

                        {bookingEnabled && bookingUrl && (
                            <a
                                href={bookingUrl}
                                target="_blank"
                                rel="noreferrer"
                                data-testid="contact-book-now"
                                className="btn-gold inline-flex items-center gap-3 rounded-full px-9 py-4 text-sm uppercase tracking-[0.28em]"
                            >
                                Book now <ArrowUpRight className="w-4 h-4" />
                            </a>
                        )}

                        <div className="card-luxury p-6 space-y-4">
                            <a href={`tel:${phoneLink}`} data-testid="contact-phone" className="flex items-center gap-3 group">
                                <span className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-gold-dark"><Phone className="w-4 h-4" /></span>
                                <span className="text-charcoal text-lg group-hover:text-gold-dark transition-colors">{phone}</span>
                            </a>
                            <a href={`mailto:${email}`} data-testid="contact-email" className="flex items-center gap-3 group">
                                <span className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-gold-dark"><Mail className="w-4 h-4" /></span>
                                <span className="text-charcoal group-hover:text-gold-dark transition-colors">{email}</span>
                            </a>
                            <a href={`https://maps.google.com/?q=${encodeURIComponent(mapsQuery)}`} target="_blank" rel="noreferrer" data-testid="contact-address" className="flex items-start gap-3 group">
                                <span className="w-10 h-10 rounded-full bg-cream flex items-center justify-center text-gold-dark shrink-0"><MapPin className="w-4 h-4" /></span>
                                <span className="text-charcoal group-hover:text-gold-dark transition-colors">{address}</span>
                            </a>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <a href={`tel:${phoneLink}`} className="btn-ghost-charcoal rounded-2xl p-3 text-center text-xs uppercase tracking-widest"><Phone className="w-4 h-4 mx-auto mb-1" />Call</a>
                            <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-ghost-charcoal rounded-2xl p-3 text-center text-xs uppercase tracking-widest"><MessageCircle className="w-4 h-4 mx-auto mb-1" />WhatsApp</a>
                            <a href={instagram} target="_blank" rel="noreferrer" className="btn-ghost-charcoal rounded-2xl p-3 text-center text-xs uppercase tracking-widest"><Instagram className="w-4 h-4 mx-auto mb-1" />Instagram</a>
                        </div>
                    </div>

                    {/* Right — hours + map */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="card-luxury p-6 sm:p-8">
                            <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.32em] text-gold-dark mb-4">
                                <Clock className="w-3.5 h-3.5" /> {hoursTitle}
                            </p>
                            <ul className="divide-y divide-charcoal/10">
                                {hours.map(([d, h], i) => (
                                    <li key={`${d}-${i}`} className="flex justify-between py-3 gap-4">
                                        <span className="text-charcoal/80">{d}</span>
                                        <span className="text-charcoal font-medium text-right">{h || ""}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="card-luxury overflow-hidden">
                            <iframe
                                title="CLA Aesthetics Map"
                                src={`https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed`}
                                className="w-full h-[340px] sm:h-[420px] border-0"
                                loading="lazy"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
