import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageHeader, Card, Btn, Field, TextArea, Toggle, MediaField, Empty, Pill, MediaPreview } from "@/components/admin/ui";

const EMPTY = { title: "", description: "", cta_label: "Inquire now", cta_url: "", banner_image_url: "", accent_color: "#D4AF37", starts_at: "", ends_at: "", active: true, show_banner: true };
const toLocal = (iso) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

function Editor({ initial, onClose, onSaved }) {
    const [f, setF] = useState({ ...EMPTY, ...initial, starts_at: toLocal(initial.starts_at), ends_at: toLocal(initial.ends_at) });
    const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));
    const save = async () => {
        if (!f.title.trim()) return toast.error("Title is required.");
        const payload = { ...f, starts_at: f.starts_at ? new Date(f.starts_at).toISOString() : null, ends_at: f.ends_at ? new Date(f.ends_at).toISOString() : null };
        try {
            if (f.id) await api.put(`/admin/offers/${f.id}`, payload); else await api.post("/admin/offers", payload);
            toast.success("Offer saved."); onSaved();
        } catch { toast.error("Could not save offer."); }
    };
    return (
        <Card className="p-6 space-y-5" data-testid="offer-editor">
            <div className="flex items-center justify-between"><h2 className="font-serif text-2xl">{f.id ? "Edit offer" : "New offer"}</h2><button onClick={onClose} aria-label="Close" className="text-bone/50 hover:text-bone"><X className="w-5 h-5" /></button></div>
            <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Title" value={f.title} onChange={set("title")} testId="offer-title" className="sm:col-span-2" />
                <TextArea label="Description" value={f.description} onChange={set("description")} rows={2} className="sm:col-span-2" testId="offer-description" />
                <Field label="Button label" value={f.cta_label} onChange={set("cta_label")} />
                <Field label="Button link (blank = inquiry form)" value={f.cta_url} onChange={set("cta_url")} placeholder="https://…" />
                <Field label="Starts" type="datetime-local" value={f.starts_at} onChange={set("starts_at")} />
                <Field label="Ends" type="datetime-local" value={f.ends_at} onChange={set("ends_at")} />
            </div>
            <MediaField label="Banner image (optional)" value={f.banner_image_url} onChange={set("banner_image_url")} allowVideo={false} />
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex gap-6"><Toggle label="Active" checked={f.active} onChange={set("active")} /><Toggle label="Show top banner" checked={f.show_banner} onChange={set("show_banner")} /></div>
                <div className="flex gap-2"><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={save} data-testid="offer-save">Save offer</Btn></div>
            </div>
        </Card>
    );
}

export default function OffersAdmin() {
    const [offers, setOffers] = useState([]);
    const [editing, setEditing] = useState(null);
    const load = () => api.get("/admin/offers").then(({ data }) => setOffers(data.items || [])).catch(() => toast.error("Could not load offers."));
    useEffect(() => { load(); }, []);

    const remove = async (o) => {
        if (!window.confirm(`Delete "${o.title}"?`)) return;
        try { await api.delete(`/admin/offers/${o.id}`); load(); } catch { toast.error("Could not delete."); }
    };
    const toggle = async (o, k) => {
        try { await api.put(`/admin/offers/${o.id}`, { ...o, [k]: !o[k] }); load(); } catch { toast.error("Could not update."); }
    };

    return (
        <div data-testid="admin-offers">
            <PageHeader title="Offers" sub="Time-limited promotions shown on the homepage and optionally as a top banner.">
                {!editing && <Btn onClick={() => setEditing({})} data-testid="offer-new"><Plus className="w-3.5 h-3.5" /> New offer</Btn>}
            </PageHeader>
            {editing && <div className="mb-8"><Editor initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} /></div>}
            {offers.length === 0 ? <Card><Empty>No offers yet.</Empty></Card> : (
                <div className="space-y-3">
                    {offers.map((o) => (
                        <Card key={o.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4" data-testid={`offer-row-${o.id}`}>
                            <div className="w-full sm:w-24 h-16 rounded-xl overflow-hidden bg-noir-3 shrink-0"><MediaPreview src={o.banner_image_url} className="w-full h-full" /></div>
                            <div className="flex-1 min-w-0">
                                <p className="font-serif text-xl text-bone truncate">{o.title}</p>
                                <p className="text-bone/45 text-xs">{o.starts_at ? new Date(o.starts_at).toLocaleDateString() : "—"} → {o.ends_at ? new Date(o.ends_at).toLocaleDateString() : "no end"}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <Toggle label="Active" checked={o.active} onChange={() => toggle(o, "active")} />
                                <Toggle label="Banner" checked={o.show_banner} onChange={() => toggle(o, "show_banner")} />
                                <Btn variant="ghost" onClick={() => setEditing(o)}><Pencil className="w-3.5 h-3.5" /> Edit</Btn>
                                <button onClick={() => remove(o)} aria-label="Delete" className="w-9 h-9 rounded-full border border-red-500/40 text-red-300 flex items-center justify-center hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
