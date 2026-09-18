import React, { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send, Phone, MessageCircle } from "lucide-react";
import api, { formatApiErrorDetail } from "@/lib/api";

function uid() {
    return "s-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export default function Concierge() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: "assistant", text: "Hello, I'm Camille — Cinthia's AI concierge. How can I help you glow today?" },
    ]);
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);
    const [leadShown, setLeadShown] = useState(false);
    const [leadSent, setLeadSent] = useState(false);
    const [lead, setLead] = useState({ name: "", phone: "", interest: "", contact_via: "call" });
    const sessionRef = useRef(null);
    const scrollerRef = useRef(null);

    if (!sessionRef.current) sessionRef.current = uid();

    // Auto open once per session after 10s
    useEffect(() => {
        if (sessionStorage.getItem("cla_camille_seen")) return;
        const t = setTimeout(() => {
            setOpen(true);
            sessionStorage.setItem("cla_camille_seen", "1");
        }, 10000);
        return () => clearTimeout(t);
    }, []);

    useEffect(() => {
        if (scrollerRef.current) scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }, [messages, open, leadShown]);

    const send = async (e) => {
        e?.preventDefault();
        const text = input.trim();
        if (!text || sending) return;
        setInput("");
        const newMsgs = [...messages, { role: "user", text }];
        setMessages(newMsgs);
        setSending(true);
        try {
            const { data } = await api.post("/chat", { session_id: sessionRef.current, message: text });
            setMessages([...newMsgs, { role: "assistant", text: data.response }]);
            // After 2 user turns surface lead capture
            const userCount = newMsgs.filter((m) => m.role === "user").length;
            if (userCount >= 2 && !leadShown && !leadSent) setLeadShown(true);
        } catch (err) {
            const msg = formatApiErrorDetail(err.response?.data?.detail) || "I'm resting for a moment.";
            setMessages([...newMsgs, { role: "assistant", text: msg }]);
        } finally {
            setSending(false);
        }
    };

    const submitLead = async (e) => {
        e.preventDefault();
        if (!lead.name || !lead.phone) return;
        try {
            await api.post("/leads", lead);
            setLeadSent(true);
            setLeadShown(false);
        } catch (err) {
            console.error("Concierge lead submission failed:", err);
        }
    };

    return (
        <>
            {/* Launcher */}
            <button
                data-testid="camille-launcher"
                onClick={() => setOpen((o) => !o)}
                aria-label="Open AI concierge"
                className="fixed z-[10001] bottom-5 left-5 sm:bottom-6 sm:left-6 group"
            >
                <span className="absolute inset-0 rounded-full bg-gold/40 blur-xl group-hover:bg-gold/60 transition-all" />
                <span className="relative flex items-center gap-2 bg-charcoal-deep text-ivory border border-gold/40 rounded-full pl-3 pr-5 py-3 shadow-2xl hover:bg-charcoal transition-colors">
                    <span className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-gold text-charcoal">
                        <Sparkles className="w-4 h-4" />
                    </span>
                    <span className="font-serif text-base">Ask Camille</span>
                </span>
            </button>

            {/* Panel */}
            {open && (
                <div
                    data-testid="camille-panel"
                    className="fixed z-[10001] bottom-24 left-3 sm:left-6 w-[calc(100%-1.5rem)] sm:w-[400px] max-h-[72vh] rounded-[24px] bg-ivory border border-gold/30 shadow-2xl flex flex-col overflow-hidden"
                >
                    <header className="flex items-center justify-between px-5 py-4 bg-charcoal-deep text-ivory">
                        <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-gold text-charcoal flex items-center justify-center"><Sparkles className="w-4 h-4" /></span>
                            <div>
                                <p className="font-serif text-lg">Camille</p>
                                <p className="text-[10px] uppercase tracking-[0.28em] text-ivory/60">CLA Concierge</p>
                            </div>
                        </div>
                        <button data-testid="camille-close" onClick={() => setOpen(false)} aria-label="Close" className="text-ivory/70 hover:text-ivory">
                            <X className="w-5 h-5" />
                        </button>
                    </header>
                    <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-ivory scrollbar-thin">
                        {messages.map((m, i) => (
                            <div key={m.id || `${m.role}-${i}`} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[82%] text-sm leading-relaxed rounded-2xl px-4 py-2.5 ${
                                    m.role === "user"
                                        ? "bg-gold text-charcoal rounded-br-md"
                                        : "bg-cream text-charcoal rounded-bl-md border border-gold/20"
                                }`}>
                                    {m.text}
                                </div>
                            </div>
                        ))}
                        {sending && (
                            <div className="flex justify-start">
                                <div className="bg-cream rounded-2xl px-4 py-2.5 text-charcoal/60 text-sm">Camille is typing…</div>
                            </div>
                        )}

                        {leadShown && !leadSent && (
                            <form onSubmit={submitLead} className="bg-charcoal-deep text-ivory rounded-2xl p-4 space-y-3 mt-2">
                                <p className="font-serif text-lg">Would you like Cinthia to reach out?</p>
                                <input
                                    data-testid="lead-name"
                                    placeholder="Your name"
                                    value={lead.name}
                                    onChange={(e) => setLead({ ...lead, name: e.target.value })}
                                    className="w-full bg-transparent border-b border-ivory/30 py-2 outline-none text-sm placeholder:text-ivory/40"
                                />
                                <input
                                    data-testid="lead-phone"
                                    placeholder="Phone number"
                                    value={lead.phone}
                                    onChange={(e) => setLead({ ...lead, phone: e.target.value })}
                                    className="w-full bg-transparent border-b border-ivory/30 py-2 outline-none text-sm placeholder:text-ivory/40"
                                />
                                <input
                                    data-testid="lead-interest"
                                    placeholder="Interested in… (optional)"
                                    value={lead.interest}
                                    onChange={(e) => setLead({ ...lead, interest: e.target.value })}
                                    className="w-full bg-transparent border-b border-ivory/30 py-2 outline-none text-sm placeholder:text-ivory/40"
                                />
                                <div className="flex gap-2">
                                    {[
                                        { v: "call", label: "Call me", icon: Phone },
                                        { v: "whatsapp", label: "WhatsApp", icon: MessageCircle },
                                    ].map((opt) => (
                                        <button
                                            type="button"
                                            key={opt.v}
                                            onClick={() => setLead({ ...lead, contact_via: opt.v })}
                                            className={`flex-1 px-3 py-2 rounded-full text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition ${
                                                lead.contact_via === opt.v ? "bg-gold text-charcoal" : "border border-ivory/30 text-ivory/80"
                                            }`}
                                        >
                                            <opt.icon className="w-3.5 h-3.5" /> {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <button data-testid="lead-submit" type="submit" className="w-full bg-gold text-charcoal rounded-full py-2.5 text-xs uppercase tracking-[0.28em]">
                                    Send
                                </button>
                            </form>
                        )}

                        {leadSent && (
                            <div className="bg-cream rounded-2xl p-4 text-charcoal text-sm border border-gold/30">
                                <p className="font-serif text-lg mb-2">Thank you. We&rsquo;ll be in touch soon.</p>
                                <div className="flex gap-2 mt-3">
                                    <a href="tel:+15166209158" className="flex-1 bg-charcoal text-ivory rounded-full py-2 text-center text-xs uppercase tracking-widest">Call now</a>
                                    <a href="https://wa.me/15166209158" target="_blank" rel="noreferrer" className="flex-1 border border-charcoal/20 rounded-full py-2 text-center text-xs uppercase tracking-widest">WhatsApp</a>
                                </div>
                            </div>
                        )}
                    </div>
                    <form onSubmit={send} className="border-t border-gold/20 px-3 py-3 flex items-center gap-2 bg-ivory">
                        <input
                            data-testid="camille-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about a service, prices, or hours…"
                            className="flex-1 bg-transparent outline-none px-3 py-2 text-sm"
                        />
                        <button data-testid="camille-send" type="submit" disabled={sending} className="w-10 h-10 rounded-full bg-gold text-charcoal flex items-center justify-center disabled:opacity-50">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
