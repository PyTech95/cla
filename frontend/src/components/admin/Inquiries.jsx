import React, { useEffect, useState } from "react";
import { Phone, Mail, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageHeader, Card, Pill, Empty } from "@/components/admin/ui";

const STATUSES = ["new", "contacted", "converted", "archived"];
const tone = { new: "gold", contacted: "muted", converted: "green", archived: "muted" };

export default function Inquiries() {
    const [leads, setLeads] = useState([]);
    const [filter, setFilter] = useState("all");
    const [q, setQ] = useState("");

    const load = () => api.get("/leads").then(({ data }) => setLeads(data.leads || [])).catch(() => toast.error("Could not load inquiries."));
    useEffect(() => { load(); }, []);

    const setStatus = async (id, status) => {
        try { await api.patch(`/leads/${id}?status=${status}`); setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l))); toast.success("Updated."); }
        catch { toast.error("Could not update."); }
    };
    const remove = async (id) => {
        if (!window.confirm("Delete this inquiry permanently?")) return;
        try { await api.delete(`/leads/${id}`); setLeads((ls) => ls.filter((l) => l.id !== id)); toast.success("Deleted."); }
        catch { toast.error("Could not delete."); }
    };

    const shown = leads.filter((l) => (filter === "all" || l.status === filter) && (!q || `${l.name} ${l.phone} ${l.email} ${l.interest} ${l.message}`.toLowerCase().includes(q.toLowerCase())));
    const counts = STATUSES.reduce((a, s) => ({ ...a, [s]: leads.filter((l) => l.status === s).length }), {});

    return (
        <div data-testid="admin-inquiries">
            <PageHeader title="Inquiries" sub={`${leads.length} total · ${counts.new || 0} new`}>
                <input data-testid="inquiry-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, service…" className="field text-sm w-64" />
            </PageHeader>

            <div className="flex flex-wrap gap-2 mb-6">
                {["all", ...STATUSES].map((s) => (
                    <button key={s} data-testid={`filter-${s}`} onClick={() => setFilter(s)} className={`px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-widest border ${filter === s ? "bg-gold text-noir border-gold" : "border-white/10 text-bone/60 hover:text-bone"}`}>
                        {s} {s !== "all" && <span className="opacity-60">· {counts[s] || 0}</span>}
                    </button>
                ))}
            </div>

            {shown.length === 0 ? <Card><Empty>No inquiries match.</Empty></Card> : (
                <div className="grid md:grid-cols-2 gap-4">
                    {shown.map((l) => (
                        <Card key={l.id} className="p-5" data-testid={`inquiry-${l.id}`}>
                            <div className="flex justify-between items-start gap-3">
                                <div>
                                    <p className="font-serif text-xl text-bone">{l.name}</p>
                                    <p className="text-bone/45 text-xs mt-0.5">{new Date(l.created_at).toLocaleString()}</p>
                                </div>
                                <select value={l.status} onChange={(e) => setStatus(l.id, e.target.value)} data-testid={`inquiry-status-${l.id}`} className="field w-auto py-1.5 text-xs">
                                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="mt-4 space-y-1.5 text-sm text-bone/80">
                                <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gold" /> <a href={`tel:${l.phone}`} className="hover:text-gold">{l.phone}</a> <span className="text-bone/40 text-xs">· prefers {l.contact_via}</span></p>
                                {l.email && <p className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-gold" /> <a href={`mailto:${l.email}`} className="hover:text-gold">{l.email}</a></p>}
                                {l.interest && <p><Pill tone="gold">{l.interest}</Pill></p>}
                                {l.message && <p className="italic text-bone/60 border-l border-gold/30 pl-3 mt-2">&ldquo;{l.message}&rdquo;</p>}
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.06]">
                                <div className="flex gap-2">
                                    <a href={`tel:${l.phone}`} className="btn-ghost rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest inline-flex items-center gap-1"><Phone className="w-3 h-3" /> Call</a>
                                    <a href={`https://wa.me/${l.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn-ghost rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest inline-flex items-center gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp</a>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Pill tone={tone[l.status]}>{l.status}</Pill>
                                    <button onClick={() => remove(l.id)} data-testid={`inquiry-delete-${l.id}`} aria-label="Delete" className="text-bone/40 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
