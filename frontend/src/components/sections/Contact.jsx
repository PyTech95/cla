import React, { useEffect, useState } from "react";
import { Phone, Mail, MapPin, MessageCircle, Instagram, Clock, Send, CheckCircle2, CalendarCheck } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useContent, t } from "@/context/ContentContext";
import { SectionTitle } from "@/components/sections/About";

const HOURS = [["Monday – Friday", "10:00 AM – 8:00 PM"], ["Saturday", "9:00 AM – 6:00 PM"], ["Sunday", "By appointment"]];

function InquiryForm() {
    const [services, setServices] = useState([]);
    const [form, setForm] = useState({ name: "", phone: "", email: "", interest: "", contact_via: "call", message: "" });
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        api.get("/treatments-menu").then(({ data }) => setServices((data.items || []).map((x) => x.name))).catch(() => {});
    }, []);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.phone.trim()) return toast.error("Please add your name and phone number.");
        setBusy(true);
        try {
            await api.post("/leads", form);
            setDone(true);
            toast.success("Thank you — we'll be in touch shortly.");
        } catch {
            toast.error("Could not send your inquiry. Please call us instead.");
        } finally { setBusy(false); }
    };

    if (done) {
        return (
            <div data-testid="inquiry-success" className="card-dark p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-gold mx-auto mb-4" />
                <p className="font-serif text-2xl text-bone">Inquiry received.</p>
                <p className="text-bone/60 mt-2 text-sm">Cinthia's team will reach out to you within one business day.</p>
                <button onClick={() => { setDone(false); setForm({ name: "", phone: "", email: "", interest: "", contact_via: "call", message: "" }); }} className="btn-ghost rounded-full px-5 py-2 text-[11px] uppercase tracking-widest mt-6">Send another</button>
            </div>
        );
    }

    return (
        <form onSubmit={submit} data-testid="inquiry-form" className="card-dark p-6 sm:p-8 space-y-4">
            <div>
                <p className="eyebrow mb-1">Send an inquiry</p>
                <p className="font-serif text-2xl text-bone">Tell us what you're dreaming of.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <input data-testid="inquiry-name" className="field" placeholder="Full name *" value={form.name} onChange={set("name")} required />
                <input data-testid="inquiry-phone" className="field" placeholder="Phone *" type="tel" value={form.phone} onChange={set("phone")} required />
                <input data-testid="inquiry-email" className="field" placeholder="Email" type="email" value={form.email} onChange={set("email")} />
                <select data-testid="inquiry-service" className="field" value={form.interest} onChange={set("interest")}>
                    <option value="">Service of interest</option>
                    {services.map((s) => <option key={s} value={s}>{s}</option>)}
                    <option value="Consultation">General consultation</option>
                </select>
            </div>
            <textarea data-testid="inquiry-message" className="field min-h-[110px]" placeholder="Your message (optional)" value={form.message} onChange={set("message")} />
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-4 text-sm text-bone/70">
                    <span className="text-[11px] uppercase tracking-widest text-bone/45">Reach me by</span>
                    {["call", "whatsapp", "email"].map((v) => (
                        <label key={v} className="inline-flex items-center gap-1.5 cursor-pointer capitalize">
                            <input type="radio" name="contact_via" value={v} checked={form.contact_via === v} onChange={set("contact_via")} className="accent-[#D4AF37]" /> {v}
                        </label>
                    ))}
                </div>
                <button type="submit" data-testid="inquiry-submit" disabled={busy} className="btn-gold rounded-full px-7 py-3 text-xs uppercase tracking-[0.24em] inline-flex items-center justify-center gap-2 disabled:opacity-60">
                    {busy ? "Sending…" : "Send inquiry"} <Send className="w-3.5 h-3.5" />
                </button>
            </div>
        </form>
    );
}

export default function Contact() {
    const { content } = useContent();
    const phone = t(content, "brand.phone", "516-620-9158");
    const phoneLink = t(content, "brand.phone_link", "+15166209158");
    const email = t(content, "brand.email", "cinthia@claaesthetics.com");
    const address = t(content, "brand.address", "1078 Grand Avenue, South Hempstead, NY 11550");
    const mapsQuery = t(content, "brand.maps_query", address);
    const instagram = t(content, "brand.instagram", "https://instagram.com/");
    const whatsapp = t(content, "brand.whatsapp", "https://wa.me/15166209158");
    const hoursRaw = t(content, "contact.hours", "");
    const BOOK = t(content, "brand.booking_url", "");
    const hours = hoursRaw ? hoursRaw.split("\n").map((l) => l.split("|").map((s) => s.trim())).filter((p) => p[0]) : HOURS;

    return (
        <section id="contact" data-testid="contact" className="py-20 sm:py-28 bg-noir-2 border-t border-white/5">
            <div className="wrap">
                <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                    <div className="lg:col-span-5 space-y-8">
                        <SectionTitle eyebrow={t(content, "booking.eyebrow", "Book your visit")} title={t(content, "booking.title", "We've been waiting for you.")} italic={t(content, "booking.title_italic", "waiting")} lede={t(content, "booking.lede", "")} />
                        {BOOK && (
                            <a href={BOOK} target="_blank" rel="noreferrer" data-testid="contact-book-now" className="btn-gold inline-flex items-center gap-3 rounded-full px-8 py-4 text-sm uppercase tracking-[0.24em]"><CalendarCheck className="w-4 h-4" /> {t(content, "brand.booking_label", "Book Now")} online</a>
                        )}
                        <div className="space-y-4">
                            <a href={`tel:${phoneLink}`} data-testid="contact-phone" className="flex items-center gap-4 group">
                                <span className="w-11 h-11 rounded-full border border-gold/40 flex items-center justify-center text-gold"><Phone className="w-4 h-4" /></span>
                                <span className="text-bone text-lg group-hover:text-gold-light transition-colors">{phone}</span>
                            </a>
                            <a href={`mailto:${email}`} data-testid="contact-email" className="flex items-center gap-4 group">
                                <span className="w-11 h-11 rounded-full border border-gold/40 flex items-center justify-center text-gold"><Mail className="w-4 h-4" /></span>
                                <span className="text-bone group-hover:text-gold-light transition-colors">{email}</span>
                            </a>
                            <a href={`https://maps.google.com/?q=${encodeURIComponent(mapsQuery)}`} target="_blank" rel="noreferrer" data-testid="contact-address" className="flex items-start gap-4 group">
                                <span className="w-11 h-11 rounded-full border border-gold/40 flex items-center justify-center text-gold shrink-0"><MapPin className="w-4 h-4" /></span>
                                <span className="text-bone group-hover:text-gold-light transition-colors pt-2.5">{address}</span>
                            </a>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <a href={`tel:${phoneLink}`} className="btn-ghost rounded-2xl p-3 text-center text-[11px] uppercase tracking-widest"><Phone className="w-4 h-4 mx-auto mb-1" />Call</a>
                            <a href={whatsapp} target="_blank" rel="noreferrer" className="btn-ghost rounded-2xl p-3 text-center text-[11px] uppercase tracking-widest"><MessageCircle className="w-4 h-4 mx-auto mb-1" />WhatsApp</a>
                            <a href={instagram} target="_blank" rel="noreferrer" className="btn-ghost rounded-2xl p-3 text-center text-[11px] uppercase tracking-widest"><Instagram className="w-4 h-4 mx-auto mb-1" />Instagram</a>
                        </div>
                        <div className="card-dark p-6">
                            <p className="eyebrow flex items-center gap-2 mb-3"><Clock className="w-3.5 h-3.5" /> {t(content, "contact.hours_title", "Hours")}</p>
                            <ul className="divide-y divide-white/10">
                                {hours.map(([d, h], i) => (
                                    <li key={`${d}-${i}`} className="flex justify-between py-2.5 gap-4 text-sm"><span className="text-bone/70">{d}</span><span className="text-bone text-right">{h || ""}</span></li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="lg:col-span-7 space-y-6">
                        <InquiryForm />
                        <div className="rounded-[20px] overflow-hidden border border-white/10">
                            <iframe title="CLA Aesthetics Map" src={`https://www.google.com/maps?q=${encodeURIComponent(mapsQuery)}&output=embed`} className="w-full h-[300px] sm:h-[340px] border-0 map-dark" loading="lazy" />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
