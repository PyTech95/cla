import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api, { formatApiErrorDetail } from "@/lib/api";
import { Check, Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

const LOGO = "https://customer-assets.emergentagent.com/job_cinthia-spa/artifacts/9tpekrrz_image.png";

const PLANS = [
    {
        id: "first-visit",
        badge: "New Client",
        title: "First Visit Ritual",
        price: "$120",
        subtitle: "One-time · Save $25",
        perks: ["30-min consult with Cinthia", "Signature facial", "Take-home serum"],
        dark: false,
    },
    {
        id: "glow",
        badge: "Most Loved",
        title: "Glow Membership",
        price: "$129",
        unit: "/mo",
        subtitle: "Recurring · Cancel anytime",
        perks: ["One facial each month", "15% off retail", "Member-only events", "Priority booking"],
        dark: true,
    },
    {
        id: "couples",
        badge: "Limited",
        title: "Couple's Retreat",
        price: "$320",
        subtitle: "One-time · For two",
        perks: ["Side-by-side 60-min massage", "Champagne service", "Private suite"],
        dark: false,
    },
];

export default function Membership() {
    const { user } = useAuth();
    const nav = useNavigate();
    const [loading, setLoading] = useState("");

    const purchase = async (planId) => {
        if (!user) {
            sessionStorage.setItem("cla_post_login", `/membership?plan=${planId}`);
            nav("/login");
            return;
        }
        setLoading(planId);
        try {
            const { data } = await api.post("/checkout/membership", {
                plan_id: planId,
                origin_url: window.location.origin,
            });
            window.location.href = data.url;
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Could not start checkout.");
            setLoading("");
        }
    };

    return (
        <div className="min-h-screen bg-ivory">
            <header className="border-b border-charcoal/10 bg-ivory/90 backdrop-blur sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <img src={LOGO} alt="CLA" className="w-12 h-12 object-contain" />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal/55">Membership</span>
                    </Link>
                    {user ? (
                        <Link to="/portal" className="text-xs uppercase tracking-widest text-charcoal/70 hover:text-charcoal">My portal</Link>
                    ) : (
                        <Link to="/login" className="text-xs uppercase tracking-widest text-charcoal/70 hover:text-charcoal">Sign in</Link>
                    )}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
                <div className="text-center max-w-3xl mx-auto mb-12">
                    <p className="text-[11px] uppercase tracking-[0.32em] text-gold-dark mb-2">Offers &amp; Membership</p>
                    <h1 className="font-serif text-5xl sm:text-6xl tracking-tight leading-[1.05]">
                        Quietly luxurious, <span className="text-shimmer">monthly</span>.
                    </h1>
                    <p className="text-charcoal/65 mt-4">Curated rituals priced for your year — not just your visit.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    {PLANS.map((p) => (
                        <div
                            key={p.id}
                            data-testid={`plan-${p.id}`}
                            className={`relative rounded-[28px] p-7 sm:p-8 flex flex-col gap-5 transition-all hover:-translate-y-1 ${
                                p.dark ? "bg-charcoal-deep text-ivory border border-gold/40 shadow-2xl shadow-gold/10" : "card-luxury"
                            }`}
                        >
                            <div className={`inline-flex self-start items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.28em] ${p.dark ? "bg-gold text-charcoal" : "bg-cream text-charcoal/80 border border-gold/30"}`}>
                                <Sparkles className="w-3 h-3" /> {p.badge}
                            </div>
                            <div>
                                <h3 className={`font-serif text-3xl mb-2 ${p.dark ? "text-ivory" : "text-charcoal"}`}>{p.title}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className={`font-serif text-5xl ${p.dark ? "text-gold-light" : "text-charcoal"}`}>{p.price}</span>
                                    {p.unit && <span className={`text-sm ${p.dark ? "text-ivory/60" : "text-charcoal/50"}`}>{p.unit}</span>}
                                </div>
                                <p className={`text-xs uppercase tracking-[0.28em] mt-1 ${p.dark ? "text-gold-light" : "text-gold-dark"}`}>{p.subtitle}</p>
                            </div>
                            <ul className="space-y-2.5">
                                {p.perks.map((perk, i) => (
                                    <li key={i} className={`flex items-start gap-2.5 text-sm ${p.dark ? "text-ivory/85" : "text-charcoal/75"}`}>
                                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${p.dark ? "text-gold" : "text-gold-dark"}`} /> {perk}
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => purchase(p.id)}
                                disabled={loading === p.id}
                                data-testid={`buy-${p.id}`}
                                className={`mt-auto rounded-full px-6 py-3 text-xs uppercase tracking-[0.28em] disabled:opacity-60 ${p.dark ? "bg-gold text-charcoal hover:bg-gold-light" : "btn-gold"}`}
                            >
                                {loading === p.id ? "Redirecting…" : (p.id === "glow" ? "Start membership" : "Reserve this offer")}
                            </button>
                        </div>
                    ))}
                </div>

                <p className="text-xs text-charcoal/55 mt-10 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-gold-dark" /> Secure checkout via Stripe · Cancel memberships anytime from your portal.
                </p>
            </main>
        </div>
    );
}
