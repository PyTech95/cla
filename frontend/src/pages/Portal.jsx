import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LogOut, Receipt, BadgeCheck, FileText, NotebookPen } from "lucide-react";

const LOGO = "https://customer-assets.emergentagent.com/job_cinthia-spa/artifacts/9tpekrrz_image.png";

function statusPill(s) {
    const map = {
        pending: "bg-cream text-charcoal border-gold/30",
        confirmed: "bg-gold/15 text-gold-dark border-gold/40",
        completed: "bg-charcoal text-ivory border-charcoal",
        cancelled: "bg-destructive/10 text-destructive border-destructive/30",
        active: "bg-gold/15 text-gold-dark border-gold/40",
        paid: "bg-gold/15 text-gold-dark border-gold/40",
        refunded: "bg-charcoal/5 text-charcoal/60 border-charcoal/20",
        pending_payment: "bg-cream text-charcoal border-gold/30",
        initiated: "bg-cream text-charcoal border-gold/30",
    };
    return `inline-flex px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-[0.24em] ${map[s] || "bg-charcoal/5 border-charcoal/10"}`;
}

const PLAN_LABELS = {
    "glow": "Glow Membership",
    "first-visit": "First Visit Ritual",
    "couples": "Couple's Retreat",
};

export default function Portal() {
    const { user, logout } = useAuth();
    const nav = useNavigate();
    const [params, setParams] = useSearchParams();
    const [payments, setPayments] = useState([]);
    const [subs, setSubs] = useState([]);
    const [intake, setIntake] = useState({ allergies: "", medications: "", skin_concerns: "", goals: "", medical_history: "", pregnancy: false, dob: "", consent: false });
    const [loading, setLoading] = useState(true);

    const tab = params.get("tab") || "invoices";
    const setTab = (v) => setParams({ tab: v });

    const load = async () => {
        setLoading(true);
        try {
            const [p, s, i] = await Promise.all([
                api.get("/payments/mine"),
                api.get("/subscriptions/mine"),
                api.get("/intake/mine"),
            ]);
            setPayments(p.data.payments || []);
            setSubs(s.data.subscriptions || []);
            if (i.data && Object.keys(i.data).length) setIntake({ ...intake, ...i.data });
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

    const cancelSub = async (planId) => {
        if (!window.confirm("Cancel this membership?")) return;
        try { await api.post(`/subscriptions/${planId}/cancel`); toast.success("Cancelled."); load(); }
        catch { toast.error("Could not cancel."); }
    };

    const saveIntake = async (e) => {
        e.preventDefault();
        try {
            await api.put("/intake/mine", intake);
            toast.success("Intake saved.");
        } catch { toast.error("Could not save."); }
    };

    const activeSub = subs.find((s) => s.status === "active");

    return (
        <div className="min-h-screen bg-ivory">
            <header className="border-b border-charcoal/10 bg-ivory/90 backdrop-blur sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <img src={LOGO} alt="CLA" className="w-12 h-12 object-contain" />
                        <div>
                            <p className="font-serif text-lg leading-none">My Portal</p>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal/55 mt-1">{user?.name}</p>
                        </div>
                    </Link>
                    <button onClick={async () => { await logout(); nav("/"); }} className="btn-ghost-charcoal rounded-full px-4 py-2 text-xs uppercase tracking-widest inline-flex items-center gap-2">
                        <LogOut className="w-3.5 h-3.5" /> Sign out
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-5 sm:px-8 py-10 sm:py-12 space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.32em] text-gold-dark mb-2">Your rituals</p>
                        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal">Welcome, <span className="text-shimmer">{user?.name?.split(" ")[0]}</span>.</h1>
                    </div>
                </div>

                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="bg-cream border border-gold/30 rounded-full p-1 flex flex-wrap h-auto">
                        <TabsTrigger value="invoices" className="rounded-full px-4 py-2 text-[11px] uppercase tracking-widest data-[state=active]:bg-gold data-[state=active]:text-charcoal"><Receipt className="w-3.5 h-3.5 mr-1.5 inline" />Invoices</TabsTrigger>
                        <TabsTrigger value="subscription" className="rounded-full px-4 py-2 text-[11px] uppercase tracking-widest data-[state=active]:bg-gold data-[state=active]:text-charcoal"><BadgeCheck className="w-3.5 h-3.5 mr-1.5 inline" />Membership</TabsTrigger>
                        <TabsTrigger value="intake" className="rounded-full px-4 py-2 text-[11px] uppercase tracking-widest data-[state=active]:bg-gold data-[state=active]:text-charcoal"><FileText className="w-3.5 h-3.5 mr-1.5 inline" />Intake form</TabsTrigger>
                        <TabsTrigger value="notes" className="rounded-full px-4 py-2 text-[11px] uppercase tracking-widest data-[state=active]:bg-gold data-[state=active]:text-charcoal"><NotebookPen className="w-3.5 h-3.5 mr-1.5 inline" />Notes</TabsTrigger>
                    </TabsList>

                    <TabsContent value="invoices" className="mt-6">
                        {payments.length === 0 ? (
                            <div className="card-luxury p-8 text-center text-charcoal/55">No payments yet.</div>
                        ) : (
                            <div className="card-luxury overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="text-left text-[10px] uppercase tracking-[0.24em] text-charcoal/55 bg-cream/50">
                                        <tr>
                                            <th className="px-5 py-3">Date</th>
                                            <th className="px-5 py-3">Type</th>
                                            <th className="px-5 py-3">Amount</th>
                                            <th className="px-5 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-charcoal/10">
                                        {payments.map((p) => (
                                            <tr key={p.id}>
                                                <td className="px-5 py-3">{new Date(p.created_at).toLocaleDateString()}</td>
                                                <td className="px-5 py-3 font-serif">{p.kind === "booking_deposit" ? "Booking deposit" : p.kind === "membership" ? "Membership" : "Package"}</td>
                                                <td className="px-5 py-3 font-serif">${Number(p.amount).toFixed(2)} {String(p.currency || "usd").toUpperCase()}</td>
                                                <td className="px-5 py-3"><span className={statusPill(p.payment_status)}>{p.payment_status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="subscription" className="mt-6">
                        {!activeSub ? (
                            <div className="card-luxury p-10 text-center space-y-4">
                                <p className="font-serif text-2xl">No active membership</p>
                                <p className="text-charcoal/60">Join the Glow Membership for $129/mo — a monthly facial + member perks.</p>
                                <Link to="/membership" className="btn-gold rounded-full px-6 py-3 text-xs uppercase tracking-widest inline-block mt-2">Explore membership</Link>
                            </div>
                        ) : (
                            <div className="card-luxury p-7 space-y-4 max-w-2xl">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-serif text-3xl">{PLAN_LABELS[activeSub.plan_id] || activeSub.plan_id}</p>
                                        <p className="text-charcoal/55 text-sm mt-1">Renews on {new Date(activeSub.current_period_end).toLocaleDateString()}</p>
                                    </div>
                                    <span className={statusPill(activeSub.status)}>{activeSub.status}</span>
                                </div>
                                <p className="font-serif text-2xl">${Number(activeSub.amount).toFixed(2)}<span className="text-sm text-charcoal/50">/mo</span></p>
                                <button onClick={() => cancelSub(activeSub.plan_id)} className="text-xs uppercase tracking-[0.28em] text-destructive/80 hover:text-destructive">Cancel membership</button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="intake" className="mt-6">
                        <form onSubmit={saveIntake} className="card-luxury p-7 space-y-5 max-w-3xl">
                            <div>
                                <h3 className="font-serif text-2xl">Medical &amp; skincare intake</h3>
                                <p className="text-charcoal/55 text-sm mt-1">A few details help us tailor every treatment safely.</p>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-5">
                                <IField label="Date of birth" type="date" value={intake.dob} onChange={(v) => setIntake({ ...intake, dob: v })} />
                                <IField label="Allergies" value={intake.allergies} onChange={(v) => setIntake({ ...intake, allergies: v })} />
                                <IField label="Current medications" value={intake.medications} onChange={(v) => setIntake({ ...intake, medications: v })} />
                                <IField label="Skin concerns" value={intake.skin_concerns} onChange={(v) => setIntake({ ...intake, skin_concerns: v })} />
                            </div>
                            <ITextarea label="Treatment goals" value={intake.goals} onChange={(v) => setIntake({ ...intake, goals: v })} />
                            <ITextarea label="Relevant medical history" value={intake.medical_history} onChange={(v) => setIntake({ ...intake, medical_history: v })} />
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={intake.pregnancy} onChange={(e) => setIntake({ ...intake, pregnancy: e.target.checked })} className="w-4 h-4 accent-gold" />
                                Pregnant or breastfeeding
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <input type="checkbox" checked={intake.consent} onChange={(e) => setIntake({ ...intake, consent: e.target.checked })} className="w-4 h-4 accent-gold" required />
                                I confirm this information is accurate to the best of my knowledge.
                            </label>
                            <button type="submit" disabled={!intake.consent} className="btn-gold rounded-full px-6 py-2.5 text-xs uppercase tracking-widest disabled:opacity-50">Save intake</button>
                        </form>
                    </TabsContent>

                    <TabsContent value="notes" className="mt-6">
                        <div className="card-luxury p-7 max-w-2xl">
                            <p className="text-[11px] uppercase tracking-[0.3em] text-gold-dark mb-2">Personal notes</p>
                            <p className="font-serif text-2xl text-charcoal mb-3">A space just for you.</p>
                            <p className="text-charcoal/65 text-sm leading-relaxed">Notes from Cinthia after your visits will appear here — products applied, recommendations and what to revisit at your next ritual.</p>
                            <div className="mt-6 italic text-charcoal/55 text-sm">No notes yet — your story with us is just beginning.</div>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

function IField({ label, value, onChange, type = "text" }) {
    return (
        <div>
            <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">{label}</label>
            <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent border-b border-charcoal/20 focus:border-gold-dark py-2 outline-none font-serif text-base" />
        </div>
    );
}
function ITextarea({ label, value, onChange }) {
    return (
        <div>
            <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">{label}</label>
            <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full bg-transparent border-b border-charcoal/20 focus:border-gold-dark py-2 outline-none font-serif text-base resize-none" />
        </div>
    );
}
