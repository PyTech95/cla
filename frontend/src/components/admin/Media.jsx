import React, { useEffect, useRef, useState } from "react";
import { Upload, Link as LinkIcon, Trash2, ChevronUp, ChevronDown, Play, Check } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { mediaKind, MAX_UPLOAD_MB } from "@/lib/media";
import { PageHeader, Card, Btn, Empty, MediaPreview, uploadFile, Pill } from "@/components/admin/ui";

const KINDS = [
    { kind: "gallery", label: "Gallery", sub: "Images, videos (≤50 MB) or YouTube/Vimeo links shown in the Portfolio section.", allowVideo: true },
    { kind: "hero_images", label: "Hero slideshow", sub: "Images rotating in the hero card at the top of the homepage.", allowVideo: false },
];

function Item({ item, idx, total, onCaption, onMove, onDelete }) {
    const [caption, setCaption] = useState(item.alt || "");
    const kind = mediaKind(item);
    const dirty = caption !== (item.alt || "");
    return (
        <Card className="overflow-hidden group" data-testid={`media-item-${idx}`}>
            <div className="relative h-44 bg-noir-3">
                <MediaPreview src={item.src} className="w-full h-full" />
                <div className="absolute top-2 left-2 flex gap-1.5">
                    <Pill tone={kind === "image" ? "muted" : "gold"}>{kind}</Pill>
                </div>
                {kind !== "image" && <span className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-noir/70 text-gold border border-gold/40 flex items-center justify-center pointer-events-none"><Play className="w-4 h-4" /></span>}
                <div className="absolute top-2 right-2 flex gap-1">
                    <button onClick={() => onMove(-1)} disabled={idx === 0} aria-label="Move up" className="w-7 h-7 rounded-full bg-noir/80 border border-white/15 flex items-center justify-center disabled:opacity-30"><ChevronUp className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onMove(1)} disabled={idx === total - 1} aria-label="Move down" className="w-7 h-7 rounded-full bg-noir/80 border border-white/15 flex items-center justify-center disabled:opacity-30"><ChevronDown className="w-3.5 h-3.5" /></button>
                    <button onClick={onDelete} data-testid={`media-delete-${idx}`} aria-label="Delete" className="w-7 h-7 rounded-full bg-noir/80 border border-red-500/40 text-red-300 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            </div>
            <div className="p-3 flex gap-2">
                <input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption (optional)" className="field text-xs py-1.5" data-testid={`media-caption-${idx}`} />
                {dirty && <button onClick={() => onCaption(caption)} aria-label="Save caption" className="btn-gold rounded-full w-8 h-8 shrink-0 flex items-center justify-center"><Check className="w-3.5 h-3.5" /></button>}
            </div>
        </Card>
    );
}

function Collection({ kind, label, sub, allowVideo }) {
    const [items, setItems] = useState([]);
    const [busy, setBusy] = useState(false);
    const [link, setLink] = useState("");
    const [showLink, setShowLink] = useState(false);
    const fileRef = useRef(null);

    const load = () => api.get(`/admin/cms/${kind}`).then(({ data }) => setItems(data.items || [])).catch(() => toast.error("Could not load media."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { load(); }, [kind]);

    const add = async (src, type) => {
        await api.post(`/admin/cms/${kind}`, { id: crypto.randomUUID(), src, alt: "", ...(type ? { type } : {}) });
        await load();
    };

    const onFiles = async (e) => {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;
        setBusy(true);
        let ok = 0;
        for (const f of files) {
            const isVid = f.type.startsWith("video/");
            if (!f.type.startsWith("image/") && !(allowVideo && isVid)) { toast.error(`${f.name}: unsupported type`); continue; }
            try { await add(await uploadFile(f), isVid ? "video" : undefined); ok++; }
            catch (err) { toast.error(`${f.name}: ${err.response?.data?.detail || err.message}`); }
        }
        if (ok) toast.success(`${ok} file${ok > 1 ? "s" : ""} added.`);
        setBusy(false);
        if (fileRef.current) fileRef.current.value = "";
    };

    const addLink = async () => {
        const url = link.trim();
        if (!/^https?:\/\//i.test(url)) return toast.error("Paste a full https:// link.");
        if (!allowVideo && mediaKind({ src: url }) !== "image") return toast.error("Only image links are allowed here.");
        try { await add(url); setLink(""); setShowLink(false); toast.success("Link added."); }
        catch { toast.error("Could not add link."); }
    };

    const remove = async (id) => {
        if (!window.confirm("Remove this item from the website?")) return;
        try { await api.delete(`/admin/cms/${kind}/${id}`); setItems((xs) => xs.filter((x) => x.id !== id)); }
        catch { toast.error("Could not delete."); }
    };
    const caption = async (item, alt) => {
        try { await api.put(`/admin/cms/${kind}/${item.id}`, { ...item, alt }); setItems((xs) => xs.map((x) => (x.id === item.id ? { ...x, alt } : x))); toast.success("Saved."); }
        catch { toast.error("Could not save."); }
    };
    const move = async (idx, dir) => {
        const next = [...items];
        const to = idx + dir;
        if (to < 0 || to >= next.length) return;
        [next[idx], next[to]] = [next[to], next[idx]];
        setItems(next);
        try { await api.post(`/admin/cms/${kind}/reorder`, { ordered_ids: next.map((x) => x.id) }); } catch { load(); }
    };

    return (
        <section className="mb-12" data-testid={`media-${kind}`}>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
                <div>
                    <h2 className="font-serif text-2xl text-bone">{label} <span className="text-bone/40 text-base">· {items.length}</span></h2>
                    <p className="text-bone/50 text-sm">{sub}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Btn onClick={() => fileRef.current?.click()} disabled={busy} data-testid={`${kind}-upload-btn`}><Upload className="w-3.5 h-3.5" /> {busy ? "Uploading…" : "Upload files"}</Btn>
                    <Btn variant="ghost" onClick={() => setShowLink((v) => !v)} data-testid={`${kind}-link-btn`}><LinkIcon className="w-3.5 h-3.5" /> Add link</Btn>
                    <input ref={fileRef} type="file" multiple className="hidden" accept={allowVideo ? "image/*,video/mp4,video/webm,video/quicktime,video/ogg" : "image/*"} onChange={onFiles} />
                </div>
            </div>
            {showLink && (
                <Card className="p-3 mb-4 flex gap-2">
                    <input data-testid={`${kind}-link-input`} value={link} onChange={(e) => setLink(e.target.value)} placeholder={allowVideo ? "https://youtube.com/watch?v=…  ·  https://…/video.mp4  ·  https://…/photo.jpg" : "https://…/photo.jpg"} className="field text-sm font-mono" onKeyDown={(e) => e.key === "Enter" && addLink()} />
                    <Btn onClick={addLink} data-testid={`${kind}-link-submit`}>Add</Btn>
                </Card>
            )}
            <p className="text-[11px] text-bone/35 mb-4">Upload limit {MAX_UPLOAD_MB} MB per file · {allowVideo ? "JPG, PNG, WEBP, GIF, MP4, WEBM, MOV, or YouTube / Vimeo link" : "JPG, PNG, WEBP, GIF"}</p>
            {items.length === 0 ? <Card><Empty>Nothing here yet. Upload files or add a link.</Empty></Card> : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                    {items.map((it, i) => <Item key={it.id} item={it} idx={i} total={items.length} onCaption={(alt) => caption(it, alt)} onMove={(d) => move(i, d)} onDelete={() => remove(it.id)} />)}
                </div>
            )}
        </section>
    );
}

export default function Media() {
    return (
        <div data-testid="admin-media">
            <PageHeader title="Gallery & Media" sub="Everything visual on the website, in one place. Drag order with the arrows." />
            {KINDS.map((k) => <Collection key={k.kind} {...k} />)}
        </div>
    );
}
