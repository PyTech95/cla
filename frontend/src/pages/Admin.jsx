import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    LogOut, Mail, Phone, Settings, RefreshCw, DollarSign, Users, BadgeCheck,
    Receipt, FileEdit, TrendingUp,
} from "lucide-react";
import { useContent } from "@/context/ContentContext";
import SiteEditor from "@/components/SiteEditor";

const LOGO = "https://customer-assets.emergentagent.com/job_cinthia-spa/artifacts/9tpekrrz_image.png";

const LEAD_STATUSES = ["new", "contacted", "converted", "archived"];

function pill(s) {
    const map = {
        pending: "bg-cream text-charcoal border-gold/30",
        confirmed: "bg-gold/15 text-gold-dark border-gold/40",
        completed: "bg-charcoal text-ivory border-charcoal",
        cancelled: "bg-destructive/10 text-destructive border-destructive/30",
        new: "bg-gold/15 text-gold-dark border-gold/40",
        contacted: "bg-cream text-charcoal border-gold/30",
        converted: "bg-charcoal text-ivory border-charcoal",
        archived: "bg-charcoal/5 text-charcoal/60 border-charcoal/20",
        paid: "bg-gold/15 text-gold-dark border-gold/40",
        refunded: "bg-charcoal/5 text-charcoal/60 border-charcoal/20",
        active: "bg-gold/15 text-gold-dark border-gold/40",
        initiated: "bg-cream text-charcoal border-gold/30",
        pending_payment: "bg-cream text-charcoal border-gold/30",
        expired: "bg-charcoal/5 text-charcoal/60 border-charcoal/20",
    };
    return `inline-flex px-2.5 py-1 rounded-full border text-[10px] uppercase tracking-[0.24em] ${map[s] || "bg-charcoal/5 border-charcoal/10"}`;
}

function fmtDate(d) {
    if (!d) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

export default function Admin() {
    const { user, logout } = useAuth();
    const { refresh: refreshContent } = useContent();
    const nav = useNavigate();

    const [bookings, setBookings] = useState([]);
    const [leads, setLeads] = useState([]);
    const [payments, setPayments] = useState([]);
    const [subs, setSubs] = useState([]);
    const [clients, setClients] = useState([]);
    const [revenue, setRevenue] = useState(null);
    const [services, setServices] = useState([]);
    const [smtp, setSmtp] = useState({ host: "smtp.gmail.com", port: 587, username: "", app_password: "", from_name: "CLA Aesthetics & Wellness", from_email: "", recipients: [], enabled: false });
    const [smtpInfo, setSmtpInfo] = useState({ app_password_set: false });
    const [content, setContent] = useState({});
    const [editing, setEditing] = useState({});
    const [manual, setManual] = useState({ name: "", email: "", phone: "", service: "", date: null, time: "", notes: "" });
    const [news, setNews] = useState([]);
    const [offers, setOffers] = useState([]);
    const [newsForm, setNewsForm] = useState({ title: "", summary: "", body: "", image_url: "", tag: "News", published: true });
    const [offerForm, setOfferForm] = useState({ title: "", description: "", cta_label: "Learn more", cta_url: "", banner_image_url: "", accent_color: "#D4AF37", starts_at: "", ends_at: "", active: true, show_banner: true });

    const load = async () => {
        try {
            const [l, p, s, c, r, sm, ct, svc, nw, of] = await Promise.all([
                api.get("/leads"),
                api.get("/payments"),
                api.get("/subscriptions"),
                api.get("/admin/clients"),
                api.get("/admin/revenue"),
                api.get("/admin/settings/smtp"),
                api.get("/content"),
                api.get("/services"),
                api.get("/admin/news"),
                api.get("/admin/offers"),
            ]);
            setLeads(l.data.leads || []);
            setPayments(p.data.payments || []);
            setSubs(s.data.subscriptions || []);
            setClients(c.data.clients || []);
            setRevenue(r.data);
            const sd = sm.data || {};
            setSmtp((prev) => ({ ...prev, ...sd, app_password: "" }));
            setSmtpInfo({ app_password_set: !!sd.app_password_set });
            setContent(ct.data || {});
            setServices((svc.data.services || []).filter((x) => !x.comingSoon));
            setNews(nw.data.items || []);
            setOffers(of.data.items || []);
        } catch {
            toast.error("Could not load admin data.");
        }
    };
    useEffect(() => { load(); }, []);

    // ---- News handlers ----
    const submitNews = async (e) => {
        e.preventDefault();
        if (!newsForm.title.trim()) return toast.error("Title is required.");
        try {
            await api.post("/admin/news", newsForm);
            toast.success("News item added.");
            setNewsForm({ title: "", summary: "", body: "", image_url: "", tag: "News", published: true });
            load();
        } catch { toast.error("Could not create news."); }
    };
    const deleteNews = async (id) => {
        if (!window.confirm("Delete this news item?")) return;
        try { await api.delete(`/admin/news/${id}`); toast.success("Deleted."); load(); }
        catch { toast.error("Could not delete."); }
    };

    // ---- Offer handlers ----
    const submitOffer = async (e) => {
        e.preventDefault();
        if (!offerForm.title.trim()) return toast.error("Title is required.");
        try {
            const payload = {
                ...offerForm,
                starts_at: offerForm.starts_at || null,
                ends_at: offerForm.ends_at || null,
            };
            await api.post("/admin/offers", payload);
            toast.success("Offer added.");
            setOfferForm({ title: "", description: "", cta_label: "Learn more", cta_url: "", banner_image_url: "", accent_color: "#D4AF37", starts_at: "", ends_at: "", active: true, show_banner: true });
            load();
        } catch { toast.error("Could not create offer."); }
    };
    const deleteOffer = async (id) => {
        if (!window.confirm("Delete this offer?")) return;
        try { await api.delete(`/admin/offers/${id}`); toast.success("Deleted."); load(); }
        catch { toast.error("Could not delete."); }
    };
    const toggleOffer = async (o, field) => {
        try {
            await api.put(`/admin/offers/${o.id}`, { ...o, [field]: !o[field] });
            load();
        } catch { toast.error("Could not update."); }
    };

    const updateLeadStatus = async (id, status) => {
        try { await api.patch(`/leads/${id}?status=${status}`); toast.success("Updated."); load(); }
        catch { toast.error("Could not update."); }
    };
    const refundPayment = async (id) => {
        if (!window.confirm("Refund this payment?")) return;
        try { await api.post(`/admin/payments/${id}/refund`); toast.success("Refunded."); load(); }
        catch (e) { toast.error(e.response?.data?.detail || "Refund failed."); }
    };
    const cancelSub = async (sub) => {
        if (!window.confirm("Cancel this subscription?")) return;
        try { await api.post(`/subscriptions/${sub.plan_id}/cancel`); toast.success("Cancelled."); load(); }
        catch { toast.error("Could not cancel."); }
    };

    const saveSmtp = async () => {
        try {
            const payload = { ...smtp, recipients: typeof smtp.recipients === "string" ? smtp.recipients.split(",").map((s) => s.trim()).filter(Boolean) : smtp.recipients };
            await api.put("/admin/settings/smtp", payload);
            toast.success("SMTP saved."); load();
        } catch { toast.error("Could not save SMTP."); }
    };
    const testSmtp = async () => {
        try { await api.post("/admin/settings/smtp/test"); toast.success("Test email sent."); }
        catch (e) { toast.error(e.response?.data?.detail || "Test failed."); }
    };

    const saveContent = async (key) => {
        const value = editing[key];
        if (value === undefined) return;
        try {
            await api.put("/admin/content", { key, value });
            setContent({ ...content, [key]: value });
            setEditing({ ...editing, [key]: undefined });
            refreshContent();
            toast.success("Saved.");
        } catch { toast.error("Could not save."); }
    };

    const submitManual = async (e) => {
        e.preventDefault();
        toast.error("Bookings are disabled. Manage services and CMS content instead.");
    };

    return (
        <div className="min-h-screen bg-ivory">
            <header className="border-b border-charcoal/10 bg-ivory/90 backdrop-blur sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <img src={LOGO} alt="CLA" className="w-12 h-12 object-contain" />
                        <div>
                            <p className="font-serif text-lg leading-none">CLA Admin</p>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal/55 mt-1">{user?.email}</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-2">
                        <button onClick={load} className="btn-ghost-charcoal rounded-full px-3 py-2 text-xs uppercase tracking-widest inline-flex items-center gap-2">
                            <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </button>
                        <button onClick={async () => { await logout(); nav("/"); }} className="btn-ghost-charcoal rounded-full px-3 py-2 text-xs uppercase tracking-widest inline-flex items-center gap-2">
                            <LogOut className="w-3.5 h-3.5" /> Sign out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-5 sm:px-8 py-10 sm:py-12">
                <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <p className="text-[11px] uppercase tracking-[0.32em] text-gold-dark mb-2">CRM Dashboard</p>
                        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal">Studio <span className="text-shimmer">overview</span></h1>
                    </div>
                    {revenue && (
                        <div className="flex flex-wrap gap-3">
                            <Stat label="Today" value={`$${revenue.today.total.toFixed(2)}`} sub={`${revenue.today.count} txns`} />
                            <Stat label="This week" value={`$${revenue.week.total.toFixed(2)}`} sub={`${revenue.week.count} txns`} />
                            <Stat label="MRR" value={`$${revenue.mrr.toFixed(2)}`} sub={`${revenue.active_subscriptions} members`} highlight />
                        </div>
                    )}
                </div>

                <Tabs defaultValue="leads" className="w-full">
                    <TabsList className="bg-cream border border-gold/30 rounded-full p-1 flex flex-wrap h-auto gap-1">
                        <Tab v="leads" icon={null}>Leads · {leads.length}</Tab>
                        <Tab v="clients" icon={Users}>Clients · {clients.length}</Tab>
                        <Tab v="revenue" icon={TrendingUp}>Revenue</Tab>
                        <Tab v="payments" icon={Receipt}>Payments · {payments.length}</Tab>
                        <Tab v="subscriptions" icon={BadgeCheck}>Memberships · {subs.length}</Tab>
                        <Tab v="news" icon={FileEdit}>News · {news.length}</Tab>
                        <Tab v="offers" icon={FileEdit}>Offers · {offers.length}</Tab>
                        <Tab v="content" icon={FileEdit}>Site editor</Tab>
                        <Tab v="settings" icon={Settings}>Settings</Tab>
                    </TabsList>

                    {/* CLIENTS */}
                    <TabsContent value="clients" className="mt-6">
                        <div className="card-luxury overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left text-[10px] uppercase tracking-[0.24em] text-charcoal/55 bg-cream/50">
                                    <tr>
                                        <th className="px-5 py-3">Name</th>
                                        <th className="px-5 py-3">Email</th>
                                        <th className="px-5 py-3">Bookings</th>
                                        <th className="px-5 py-3">Last visit</th>
                                        <th className="px-5 py-3">LTV</th>
                                        <th className="px-5 py-3">Membership</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-charcoal/10">
                                    {clients.map((c) => (
                                        <tr key={c.id} className="hover:bg-cream/30">
                                            <td className="px-5 py-3 font-serif">{c.name}</td>
                                            <td className="px-5 py-3 text-xs">{c.email}<div className="text-charcoal/55">{c.phone}</div></td>
                                            <td className="px-5 py-3">{c.total_bookings}</td>
                                            <td className="px-5 py-3 text-xs">{c.last_booking || "—"}</td>
                                            <td className="px-5 py-3 font-serif text-gold-dark">${c.lifetime_value?.toFixed(2)}</td>
                                            <td className="px-5 py-3">{c.active_membership ? <span className={pill("active")}>{c.active_membership}</span> : <span className="text-charcoal/40 text-xs">—</span>}</td>
                                        </tr>
                                    ))}
                                    {clients.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-charcoal/55">No clients yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    {/* REVENUE */}
                    <TabsContent value="revenue" className="mt-6">
                        {revenue && (
                            <div className="space-y-6">
                                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <RevCard label="Today" total={revenue.today.total} count={revenue.today.count} />
                                    <RevCard label="Week" total={revenue.week.total} count={revenue.week.count} />
                                    <RevCard label="Month" total={revenue.month.total} count={revenue.month.count} />
                                    <RevCard label="All-time" total={revenue.all_time.total} count={revenue.all_time.count} highlight />
                                </div>
                                <div className="grid lg:grid-cols-3 gap-4">
                                    <div className="card-luxury p-6 lg:col-span-2">
                                        <p className="text-[11px] uppercase tracking-[0.3em] text-gold-dark mb-4">Revenue by service · last 30 days</p>
                                        {revenue.by_service.length === 0 ? (
                                            <p className="text-charcoal/55 text-sm">No service revenue yet.</p>
                                        ) : (
                                            <div className="space-y-3">
                                                {revenue.by_service.map((row) => {
                                                    const max = Math.max(...revenue.by_service.map((r) => r.total));
                                                    const pct = (row.total / max) * 100;
                                                    return (
                                                        <div key={row.service}>
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span className="text-charcoal">{row.service}</span>
                                                                <span className="text-charcoal/70">${row.total.toFixed(2)} · {row.count}</span>
                                                            </div>
                                                            <div className="h-1.5 bg-cream rounded-full overflow-hidden">
                                                                <div className="h-full bg-gradient-to-r from-gold-dark via-gold to-gold-light transition-all" style={{ width: `${pct}%` }} />
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <div className="card-luxury p-6 text-center bg-charcoal text-ivory">
                                        <p className="text-[11px] uppercase tracking-[0.3em] text-gold-light">Recurring</p>
                                        <p className="font-serif text-6xl text-gold-light mt-3">${revenue.mrr.toFixed(0)}</p>
                                        <p className="text-ivory/70 text-sm">MRR · {revenue.active_subscriptions} active</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </TabsContent>

                    {/* PAYMENTS */}
                    <TabsContent value="payments" className="mt-6">
                        <div className="card-luxury overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="text-left text-[10px] uppercase tracking-[0.24em] text-charcoal/55 bg-cream/50">
                                    <tr>
                                        <th className="px-5 py-3">Date</th>
                                        <th className="px-5 py-3">Client</th>
                                        <th className="px-5 py-3">Type</th>
                                        <th className="px-5 py-3">Amount</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-charcoal/10">
                                    {payments.map((p) => (
                                        <tr key={p.id}>
                                            <td className="px-5 py-3 text-xs">{new Date(p.created_at).toLocaleString()}</td>
                                            <td className="px-5 py-3 text-xs">{p.email}</td>
                                            <td className="px-5 py-3 font-serif">{p.kind === "booking_deposit" ? "Deposit" : p.kind === "membership" ? "Membership" : "Package"}</td>
                                            <td className="px-5 py-3 font-serif">${Number(p.amount).toFixed(2)}</td>
                                            <td className="px-5 py-3"><span className={pill(p.payment_status)}>{p.payment_status}</span></td>
                                            <td className="px-5 py-3">
                                                {p.payment_status === "paid" && (
                                                    <button onClick={() => refundPayment(p.id)} className="text-xs uppercase tracking-widest text-destructive hover:underline">Refund</button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {payments.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-charcoal/55">No payments yet.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    {/* SUBSCRIPTIONS */}
                    <TabsContent value="subscriptions" className="mt-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            {subs.map((s) => (
                                <div key={`${s.user_id}-${s.plan_id}`} className="card-luxury p-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-serif text-xl">{s.plan_id}</p>
                                            <p className="text-xs text-charcoal/55">{s.email}</p>
                                        </div>
                                        <span className={pill(s.status)}>{s.status}</span>
                                    </div>
                                    <p className="font-serif text-2xl mt-2">${Number(s.amount).toFixed(2)}<span className="text-sm text-charcoal/50">/mo</span></p>
                                    <p className="text-xs text-charcoal/55 mt-1">Renews {new Date(s.current_period_end).toLocaleDateString()}</p>
                                    {s.status === "active" && (
                                        <button onClick={() => cancelSub(s)} className="mt-3 text-xs uppercase tracking-widest text-destructive/80 hover:text-destructive">Cancel</button>
                                    )}
                                </div>
                            ))}
                            {subs.length === 0 && <div className="card-luxury p-10 text-center col-span-full text-charcoal/55">No subscriptions yet.</div>}
                        </div>
                    </TabsContent>

                    {/* LEADS */}
                    <TabsContent value="leads" className="mt-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            {leads.map((l) => (
                                <div key={l.id} className="card-luxury p-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-serif text-xl">{l.name}</p>
                                            <p className="text-charcoal/55 text-xs mt-0.5">{new Date(l.created_at).toLocaleString()}</p>
                                        </div>
                                        <Select value={l.status} onValueChange={(v) => updateLeadStatus(l.id, v)}>
                                            <SelectTrigger className={`h-7 text-xs ${pill(l.status)}`}><SelectValue /></SelectTrigger>
                                            <SelectContent className="bg-ivory">
                                                {LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="mt-3 space-y-1.5 text-sm">
                                        <p><Phone className="w-3.5 h-3.5 text-gold-dark inline mr-2" /> {l.phone} <span className="text-charcoal/45 text-xs">· {l.contact_via}</span></p>
                                        {l.interest && <p>Interested in: <span className="text-charcoal">{l.interest}</span></p>}
                                        {l.message && <p className="italic text-charcoal/65">&ldquo;{l.message}&rdquo;</p>}
                                    </div>
                                </div>
                            ))}
                            {leads.length === 0 && <div className="card-luxury p-10 text-center col-span-full text-charcoal/55">No leads yet.</div>}
                        </div>
                    </TabsContent>

                    {/* NEWS */}
                    <TabsContent value="news" className="mt-6 space-y-6">
                        <form onSubmit={submitNews} className="card-luxury p-6 space-y-4 max-w-3xl">
                            <div>
                                <h3 className="font-serif text-2xl">Publish news / event</h3>
                                <p className="text-charcoal/55 text-sm">Appears in the Journal section on the homepage.</p>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Field label="Title" value={newsForm.title} onChange={(v) => setNewsForm({ ...newsForm, title: v })} />
                                <Field label="Tag (e.g. News, Event)" value={newsForm.tag} onChange={(v) => setNewsForm({ ...newsForm, tag: v })} />
                                <div className="sm:col-span-2">
                                    <Field label="Image URL (optional)" value={newsForm.image_url} onChange={(v) => setNewsForm({ ...newsForm, image_url: v })} />
                                </div>
                                <div className="sm:col-span-2">
                                    <Field label="Summary (1–2 lines)" value={newsForm.summary} onChange={(v) => setNewsForm({ ...newsForm, summary: v })} />
                                </div>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer text-sm">
                                <input type="checkbox" checked={!!newsForm.published} onChange={(e) => setNewsForm({ ...newsForm, published: e.target.checked })} className="w-4 h-4 accent-gold" />
                                Publish immediately
                            </label>
                            <button type="submit" className="btn-gold rounded-full px-6 py-2.5 text-xs uppercase tracking-widest">Add news item</button>
                        </form>

                        <div className="card-luxury overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="text-left text-[10px] uppercase tracking-[0.24em] text-charcoal/55 bg-cream/50">
                                    <tr>
                                        <th className="px-5 py-3">Title</th>
                                        <th className="px-5 py-3">Tag</th>
                                        <th className="px-5 py-3">Published</th>
                                        <th className="px-5 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-charcoal/10">
                                    {news.length === 0 && <tr><td colSpan={4} className="px-5 py-6 text-center text-charcoal/55">No news yet.</td></tr>}
                                    {news.map((n) => (
                                        <tr key={n.id} className="hover:bg-cream/30">
                                            <td className="px-5 py-3 font-serif">{n.title}</td>
                                            <td className="px-5 py-3 text-charcoal/70">{n.tag || "—"}</td>
                                            <td className="px-5 py-3">{n.published ? "Yes" : "No"}</td>
                                            <td className="px-5 py-3"><button onClick={() => deleteNews(n.id)} className="text-xs uppercase tracking-[0.24em] text-destructive hover:underline">Delete</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    {/* OFFERS */}
                    <TabsContent value="offers" className="mt-6 space-y-6">
                        <form onSubmit={submitOffer} className="card-luxury p-6 space-y-4 max-w-3xl">
                            <div>
                                <h3 className="font-serif text-2xl">Create a time-limited offer</h3>
                                <p className="text-charcoal/55 text-sm">Live offers appear in the Offers section and (optionally) as a top banner.</p>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Field label="Title" value={offerForm.title} onChange={(v) => setOfferForm({ ...offerForm, title: v })} />
                                <Field label="CTA label" value={offerForm.cta_label} onChange={(v) => setOfferForm({ ...offerForm, cta_label: v })} />
                                <div className="sm:col-span-2">
                                    <Field label="Description" value={offerForm.description} onChange={(v) => setOfferForm({ ...offerForm, description: v })} />
                                </div>
                                <Field label="CTA URL" value={offerForm.cta_url} onChange={(v) => setOfferForm({ ...offerForm, cta_url: v })} />
                                <Field label="Banner image URL (optional)" value={offerForm.banner_image_url} onChange={(v) => setOfferForm({ ...offerForm, banner_image_url: v })} />
                                <Field label="Accent colour (hex)" value={offerForm.accent_color} onChange={(v) => setOfferForm({ ...offerForm, accent_color: v })} />
                                <div />
                                <div>
                                    <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">Starts at</label>
                                    <input type="datetime-local" value={offerForm.starts_at} onChange={(e) => setOfferForm({ ...offerForm, starts_at: e.target.value })} className="w-full bg-transparent border-b border-charcoal/20 py-2 font-serif" />
                                </div>
                                <div>
                                    <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">Ends at</label>
                                    <input type="datetime-local" value={offerForm.ends_at} onChange={(e) => setOfferForm({ ...offerForm, ends_at: e.target.value })} className="w-full bg-transparent border-b border-charcoal/20 py-2 font-serif" />
                                </div>
                            </div>
                            <div className="flex gap-6 flex-wrap">
                                <label className="flex items-center gap-3 cursor-pointer text-sm">
                                    <input type="checkbox" checked={!!offerForm.active} onChange={(e) => setOfferForm({ ...offerForm, active: e.target.checked })} className="w-4 h-4 accent-gold" />
                                    Active
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer text-sm">
                                    <input type="checkbox" checked={!!offerForm.show_banner} onChange={(e) => setOfferForm({ ...offerForm, show_banner: e.target.checked })} className="w-4 h-4 accent-gold" />
                                    Show top banner
                                </label>
                            </div>
                            <button type="submit" className="btn-gold rounded-full px-6 py-2.5 text-xs uppercase tracking-widest">Add offer</button>
                        </form>

                        <div className="card-luxury overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="text-left text-[10px] uppercase tracking-[0.24em] text-charcoal/55 bg-cream/50">
                                    <tr>
                                        <th className="px-5 py-3">Title</th>
                                        <th className="px-5 py-3">Window</th>
                                        <th className="px-5 py-3">Active</th>
                                        <th className="px-5 py-3">Top banner</th>
                                        <th className="px-5 py-3">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-charcoal/10">
                                    {offers.length === 0 && <tr><td colSpan={5} className="px-5 py-6 text-center text-charcoal/55">No offers yet.</td></tr>}
                                    {offers.map((o) => (
                                        <tr key={o.id} className="hover:bg-cream/30">
                                            <td className="px-5 py-3 font-serif">{o.title}</td>
                                            <td className="px-5 py-3 text-charcoal/60 text-xs">
                                                {o.starts_at ? new Date(o.starts_at).toLocaleDateString() : "—"} → {o.ends_at ? new Date(o.ends_at).toLocaleDateString() : "—"}
                                            </td>
                                            <td className="px-5 py-3">
                                                <button onClick={() => toggleOffer(o, "active")} className={`text-xs px-3 py-1 rounded-full ${o.active ? "bg-gold text-charcoal" : "bg-charcoal/10 text-charcoal/60"}`}>{o.active ? "On" : "Off"}</button>
                                            </td>
                                            <td className="px-5 py-3">
                                                <button onClick={() => toggleOffer(o, "show_banner")} className={`text-xs px-3 py-1 rounded-full ${o.show_banner ? "bg-gold text-charcoal" : "bg-charcoal/10 text-charcoal/60"}`}>{o.show_banner ? "On" : "Off"}</button>
                                            </td>
                                            <td className="px-5 py-3"><button onClick={() => deleteOffer(o.id)} className="text-xs uppercase tracking-[0.24em] text-destructive hover:underline">Delete</button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </TabsContent>

                    {/* SITE EDITOR */}
                    <TabsContent value="content" className="mt-6">
                        <SiteEditor content={content} onContentChange={() => { load(); refreshContent(); }} />
                    </TabsContent>

                    {/* SETTINGS */}
                    <TabsContent value="settings" className="mt-6">
                        <div className="card-luxury p-7 space-y-5 max-w-3xl">
                            <div>
                                <h3 className="font-serif text-2xl">Email (SMTP)</h3>
                                <p className="text-charcoal/60 text-sm mt-1">Gmail (or any SMTP) for booking confirmations. With Gmail, use an App Password (16 chars).</p>
                            </div>
                            <div className="grid sm:grid-cols-2 gap-4">
                                <Field label="SMTP host" value={smtp.host} onChange={(v) => setSmtp({ ...smtp, host: v })} />
                                <Field label="Port" value={String(smtp.port || "")} onChange={(v) => setSmtp({ ...smtp, port: Number(v) || 587 })} />
                                <Field label="Username (sender Gmail)" value={smtp.username} onChange={(v) => setSmtp({ ...smtp, username: v })} />
                                <Field label="From email" value={smtp.from_email} onChange={(v) => setSmtp({ ...smtp, from_email: v })} />
                                <Field label="From name" value={smtp.from_name} onChange={(v) => setSmtp({ ...smtp, from_name: v })} />
                                <Field label={`App password ${smtpInfo.app_password_set ? "(set — blank to keep)" : ""}`} type="password" value={smtp.app_password} onChange={(v) => setSmtp({ ...smtp, app_password: v })} />
                                <div className="sm:col-span-2">
                                    <Field label="Notification recipients (comma-separated)" value={Array.isArray(smtp.recipients) ? smtp.recipients.join(", ") : smtp.recipients} onChange={(v) => setSmtp({ ...smtp, recipients: v })} />
                                </div>
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={!!smtp.enabled} onChange={(e) => setSmtp({ ...smtp, enabled: e.target.checked })} className="w-4 h-4 accent-gold" />
                                <span className="text-sm">Enabled (send emails on new booking)</span>
                            </label>
                            <div className="flex gap-3 pt-2">
                                <button onClick={saveSmtp} className="btn-gold rounded-full px-6 py-2.5 text-xs uppercase tracking-widest">Save</button>
                                <button onClick={testSmtp} className="btn-ghost-charcoal rounded-full px-6 py-2.5 text-xs uppercase tracking-widest">Send test email</button>
                            </div>
                        </div>
                        <div className="card-luxury p-7 max-w-3xl mt-6">
                            <h3 className="font-serif text-2xl mb-1">Change password</h3>
                            <p className="text-charcoal/60 text-sm mb-4">Update the admin login password. You&apos;ll stay signed in on this device.</p>
                            <ChangePasswordForm />
                        </div>

                        <div className="card-luxury p-7 max-w-3xl mt-6">
                            <h3 className="font-serif text-2xl mb-1">Payments</h3>
                            <p className="text-charcoal/60 text-sm">Currently running in <span className="text-gold-dark font-medium">Stripe test mode</span> using the platform key. Real card payments go live once you connect your own Stripe account.</p>
                            <p className="text-[11px] uppercase tracking-widest text-charcoal/45 mt-3">Test card: 4242 4242 4242 4242 · any future date · any CVC.</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}

function Tab({ v, icon: Icon, children }) {
    return (
        <TabsTrigger value={v} className="rounded-full px-3 py-2 text-[10px] uppercase tracking-widest data-[state=active]:bg-gold data-[state=active]:text-charcoal whitespace-nowrap">
            {Icon && <Icon className="w-3.5 h-3.5 inline mr-1.5" />}
            {children}
        </TabsTrigger>
    );
}

function Stat({ label, value, sub, highlight }) {
    return (
        <div className={`rounded-2xl px-4 py-3 border ${highlight ? "bg-charcoal text-ivory border-gold/40" : "card-luxury"}`}>
            <p className={`text-[10px] uppercase tracking-widest ${highlight ? "text-gold-light" : "text-charcoal/55"}`}>{label}</p>
            <p className={`font-serif text-2xl ${highlight ? "text-gold-light" : "text-charcoal"}`}>{value}</p>
            <p className={`text-[10px] ${highlight ? "text-ivory/60" : "text-charcoal/45"}`}>{sub}</p>
        </div>
    );
}

function RevCard({ label, total, count, highlight }) {
    return (
        <div className={`rounded-3xl p-5 ${highlight ? "bg-charcoal text-ivory border border-gold/40" : "card-luxury"}`}>
            <p className={`text-[11px] uppercase tracking-[0.3em] ${highlight ? "text-gold-light" : "text-gold-dark"} flex items-center gap-2`}><DollarSign className="w-3.5 h-3.5" /> {label}</p>
            <p className={`font-serif text-4xl mt-2 ${highlight ? "text-gold-light" : "text-charcoal"}`}>${total.toFixed(2)}</p>
            <p className={`text-xs mt-1 ${highlight ? "text-ivory/60" : "text-charcoal/55"}`}>{count} transactions</p>
        </div>
    );
}

function Field({ label, value, onChange, type = "text" }) {
    return (
        <div>
            <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">{label}</label>
            <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent border-b border-charcoal/20 focus:border-gold-dark py-2 outline-none font-serif text-base" />
        </div>
    );
}

function MField({ label, value, onChange, type = "text" }) {
    return (
        <div>
            <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">{label}</label>
            <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full bg-transparent border-b border-charcoal/20 focus:border-gold-dark py-2 outline-none font-serif text-base" />
        </div>
    );
}


function ChangePasswordForm() {
    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!current || !next) {
            toast.error("Please fill in both fields.");
            return;
        }
        if (next.length < 6) {
            toast.error("New password must be at least 6 characters.");
            return;
        }
        if (next !== confirm) {
            toast.error("New password and confirmation don't match.");
            return;
        }
        setBusy(true);
        try {
            await api.put("/auth/password", { current_password: current, new_password: next });
            toast.success("Password updated.");
            setCurrent(""); setNext(""); setConfirm("");
        } catch (err) {
            const msg = err?.response?.data?.detail || "Could not update password.";
            toast.error(typeof msg === "string" ? msg : "Could not update password.");
        } finally {
            setBusy(false);
        }
    };

    return (
        <form onSubmit={submit} className="space-y-4" data-testid="change-password-form">
            <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Current password" type="password" value={current} onChange={setCurrent} />
                <div />
                <Field label="New password (min 6 chars)" type="password" value={next} onChange={setNext} />
                <Field label="Confirm new password" type="password" value={confirm} onChange={setConfirm} />
            </div>
            <button
                type="submit"
                data-testid="change-password-submit"
                disabled={busy}
                className="btn-gold rounded-full px-6 py-2.5 text-xs uppercase tracking-widest disabled:opacity-50"
            >
                {busy ? "Updating…" : "Update password"}
            </button>
        </form>
    );
}
