import React, { useEffect, useState } from "react";
import { Plus, Trash2, ChevronUp, ChevronDown, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageHeader, Card, Btn, Field, TextArea, Toggle, MediaField, Empty, MediaPreview } from "@/components/admin/ui";

function ItemField({ f, value, onChange }) {
    if (f.type === "image") return <MediaField label={f.label} value={value} onChange={onChange} allowVideo={false} />;
    if (f.type === "longtext") return <TextArea label={f.label} value={value} onChange={onChange} rows={3} className="sm:col-span-2" />;
    if (f.type === "list") return <TextArea label={f.label} value={(Array.isArray(value) ? value : []).join("\n")} onChange={(v) => onChange(v.split("\n").filter((l) => l.trim()))} rows={3} className="sm:col-span-2" />;
    if (f.type === "boolean") return <Toggle label={f.label} checked={!!value} onChange={onChange} />;
    if (f.type === "select") return (
        <label className="block"><span className="block text-[11px] uppercase tracking-[0.24em] text-bone/50 mb-1.5">{f.label}</span>
            <select value={value || f.options[0]} onChange={(e) => onChange(e.target.value)} className="field text-sm capitalize">{f.options.map((o) => <option key={o} value={o}>{o}</option>)}</select>
        </label>
    );
    return <Field label={f.label} type={f.type === "number" ? "number" : "text"} value={value} onChange={onChange} />;
}

function ItemCard({ item, fields, idx, total, onSave, onDelete, onMove }) {
    const [draft, setDraft] = useState(item);
    useEffect(() => setDraft(item), [item]);
    const dirty = JSON.stringify(draft) !== JSON.stringify(item);
    const thumb = fields.find((f) => f.type === "image");
    return (
        <Card className="p-5" data-testid={`cms-item-${idx}`}>
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 min-w-0">
                    {thumb && <div className="w-12 h-12 rounded-lg overflow-hidden bg-noir-3 shrink-0"><MediaPreview src={draft[thumb.key]} className="w-full h-full" /></div>}
                    <div className="min-w-0"><p className="font-serif text-lg text-bone truncate">{draft[fields[0].key] || "(untitled)"}</p><p className="text-[10px] uppercase tracking-widest text-bone/40">#{idx + 1}</p></div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onMove(-1)} disabled={idx === 0} aria-label="Move up" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onMove(1)} disabled={idx === total - 1} aria-label="Move down" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                    <button onClick={onDelete} data-testid={`cms-delete-${idx}`} aria-label="Delete" className="w-8 h-8 rounded-full border border-red-500/40 text-red-300 flex items-center justify-center hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                {fields.map((f) => <ItemField key={f.key} f={f} value={draft[f.key]} onChange={(v) => setDraft({ ...draft, [f.key]: v })} />)}
            </div>
            <div className="flex justify-end mt-4"><Btn onClick={() => onSave(draft)} disabled={!dirty} data-testid={`cms-save-${idx}`}><Save className="w-3.5 h-3.5" /> Save</Btn></div>
        </Card>
    );
}

export default function CmsList({ kind, title, sub, fields }) {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try { const { data } = await api.get(`/admin/cms/${kind}`); setItems(data.items || []); }
        catch { toast.error("Could not load."); }
        finally { setLoading(false); }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { load(); }, [kind]);

    const add = async () => {
        const item = { id: crypto.randomUUID() };
        fields.forEach((f) => { item[f.key] = f.type === "list" ? [] : f.type === "boolean" ? false : f.type === "number" ? 5 : f.type === "select" ? f.options[0] : ""; });
        try { await api.post(`/admin/cms/${kind}`, item); await load(); toast.success("Added — fill in the details below."); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); }
        catch { toast.error("Could not add."); }
    };
    const save = async (draft) => {
        try { await api.put(`/admin/cms/${kind}/${draft.id}`, draft); setItems((xs) => xs.map((x) => (x.id === draft.id ? draft : x))); toast.success("Saved."); }
        catch { toast.error("Could not save."); }
    };
    const remove = async (id) => {
        if (!window.confirm("Delete this item?")) return;
        try { await api.delete(`/admin/cms/${kind}/${id}`); setItems((xs) => xs.filter((x) => x.id !== id)); } catch { toast.error("Could not delete."); }
    };
    const move = async (idx, dir) => {
        const next = [...items]; const to = idx + dir;
        if (to < 0 || to >= next.length) return;
        [next[idx], next[to]] = [next[to], next[idx]];
        setItems(next);
        try { await api.post(`/admin/cms/${kind}/reorder`, { ordered_ids: next.map((x) => x.id) }); } catch { load(); }
    };
    const reset = async () => {
        if (!window.confirm("Reset this list to the original defaults? Your changes will be lost.")) return;
        try { await api.post(`/admin/cms/${kind}/seed`); load(); } catch { toast.error("Reset failed."); }
    };

    return (
        <div data-testid={`admin-cms-${kind}`}>
            <PageHeader title={title} sub={sub}>
                <Btn variant="ghost" onClick={reset}><RotateCcw className="w-3.5 h-3.5" /> Reset defaults</Btn>
                <Btn onClick={add} data-testid="cms-add"><Plus className="w-3.5 h-3.5" /> Add</Btn>
            </PageHeader>
            {loading ? <Empty>Loading…</Empty> : items.length === 0 ? <Card><Empty>No items yet. Click “Add”.</Empty></Card> : (
                <div className="grid lg:grid-cols-2 gap-4">
                    {items.map((it, i) => <ItemCard key={it.id} item={it} fields={fields} idx={i} total={items.length} onSave={save} onDelete={() => remove(it.id)} onMove={(d) => move(i, d)} />)}
                </div>
            )}
        </div>
    );
}
