import React, { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Link as LinkIcon, Image as ImageIcon, Play, X } from "lucide-react";
import api from "@/lib/api";
import { toAbs, mediaKind, posterFor, MAX_UPLOAD_MB } from "@/lib/media";

export function PageHeader({ title, sub, children }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
                <h1 className="font-serif text-3xl sm:text-4xl text-bone">{title}</h1>
                {sub && <p className="text-bone/50 text-sm mt-1">{sub}</p>}
            </div>
            {children && <div className="flex flex-wrap gap-2">{children}</div>}
        </div>
    );
}

export function Card({ className = "", children, ...rest }) {
    return <div className={`rounded-2xl border border-white/10 bg-noir-2 ${className}`} {...rest}>{children}</div>;
}

export function Pill({ children, tone = "muted" }) {
    const map = {
        gold: "bg-gold/15 text-gold border-gold/40",
        green: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40",
        red: "bg-red-500/15 text-red-300 border-red-500/40",
        muted: "bg-white/5 text-bone/60 border-white/10",
    };
    return <span className={`inline-flex px-2.5 py-0.5 rounded-full border text-[10px] uppercase tracking-[0.2em] ${map[tone]}`}>{children}</span>;
}

export function Field({ label, value, onChange, type = "text", placeholder, testId, className = "" }) {
    return (
        <label className={`block ${className}`}>
            {label && <span className="block text-[11px] uppercase tracking-[0.24em] text-bone/50 mb-1.5">{label}</span>}
            <input data-testid={testId} type={type} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)} className="field text-sm" />
        </label>
    );
}

export function TextArea({ label, value, onChange, rows = 4, placeholder, testId, className = "", mono }) {
    return (
        <label className={`block ${className}`}>
            {label && <span className="block text-[11px] uppercase tracking-[0.24em] text-bone/50 mb-1.5">{label}</span>}
            <textarea data-testid={testId} value={value ?? ""} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={`field text-sm leading-relaxed ${mono ? "font-mono text-xs" : ""}`} />
        </label>
    );
}

export function Toggle({ label, checked, onChange, testId }) {
    return (
        <label className="inline-flex items-center gap-2.5 cursor-pointer text-sm text-bone/80 select-none">
            <button type="button" role="switch" aria-checked={!!checked} data-testid={testId} onClick={() => onChange(!checked)} className={`relative w-10 h-6 rounded-full transition-colors ${checked ? "bg-gold" : "bg-white/15"}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-noir transition-transform ${checked ? "translate-x-5" : "translate-x-1"}`} />
            </button>
            {label}
        </label>
    );
}

export function Btn({ children, variant = "gold", className = "", ...rest }) {
    const base = "rounded-full px-4 py-2 text-[11px] uppercase tracking-[0.2em] inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed";
    const v = variant === "gold" ? "btn-gold" : variant === "danger" ? "border border-red-500/40 text-red-300 hover:bg-red-500/10" : "btn-ghost";
    return <button className={`${base} ${v} ${className}`} {...rest}>{children}</button>;
}

export async function uploadFile(file) {
    if (file.size > MAX_UPLOAD_MB * 1024 * 1024) throw new Error(`File must be under ${MAX_UPLOAD_MB} MB.`);
    const fd = new FormData();
    fd.append("file", file);
    const { data } = await api.post("/admin/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
    return data.url;
}

export function MediaPreview({ src, className = "" }) {
    const kind = mediaKind({ src });
    if (!src) return <div className={`flex items-center justify-center text-bone/30 ${className}`}><ImageIcon className="w-5 h-5" /></div>;
    if (kind === "video") return <video src={toAbs(src)} className={`object-cover ${className}`} muted playsInline />;
    if (kind === "youtube" || kind === "vimeo") {
        const poster = posterFor({ src });
        return poster ? <img src={poster} alt="" className={`object-cover ${className}`} /> : <div className={`flex items-center justify-center text-gold ${className}`}><Play className="w-5 h-5" /></div>;
    }
    return <img src={toAbs(src)} alt="" className={`object-cover ${className}`} />;
}

// Upload (≤50MB) OR paste a link (image / mp4 / YouTube / Vimeo)
export function MediaField({ label, value, onChange, allowVideo = true, testId }) {
    const inputRef = useRef(null);
    const [busy, setBusy] = useState(false);
    const [linkMode, setLinkMode] = useState(false);

    const onFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const ok = file.type.startsWith("image/") || (allowVideo && file.type.startsWith("video/"));
        if (!ok) return toast.error(allowVideo ? "Choose an image or video file." : "Choose an image file.");
        setBusy(true);
        try {
            onChange(await uploadFile(file));
            toast.success("Uploaded.");
        } catch (err) {
            toast.error(err.response?.data?.detail || err.message || "Upload failed.");
        } finally {
            setBusy(false);
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    return (
        <div>
            {label && <span className="block text-[11px] uppercase tracking-[0.24em] text-bone/50 mb-1.5">{label}</span>}
            <div className="flex gap-3 items-start">
                <div className="w-20 h-20 rounded-xl border border-white/10 bg-noir-3 overflow-hidden shrink-0 relative">
                    <MediaPreview src={value} className="w-full h-full" />
                    {value && <button type="button" onClick={() => onChange("")} aria-label="Clear" className="absolute top-1 right-1 w-5 h-5 rounded-full bg-noir/80 text-bone flex items-center justify-center"><X className="w-3 h-3" /></button>}
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap gap-2">
                        <Btn type="button" variant="ghost" onClick={() => inputRef.current?.click()} disabled={busy} data-testid={testId ? `${testId}-upload` : undefined}><Upload className="w-3 h-3" /> {busy ? "Uploading…" : "Upload"}</Btn>
                        <Btn type="button" variant="ghost" onClick={() => setLinkMode((v) => !v)} data-testid={testId ? `${testId}-link` : undefined}><LinkIcon className="w-3 h-3" /> {linkMode ? "Hide link" : "Paste link"}</Btn>
                    </div>
                    {linkMode && <input data-testid={testId} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={allowVideo ? "https://… image, .mp4, YouTube or Vimeo link" : "https://… image link"} className="field font-mono text-xs" />}
                    <p className="text-[10px] text-bone/35">Max {MAX_UPLOAD_MB} MB · {allowVideo ? "JPG, PNG, WEBP, GIF, MP4, WEBM, MOV" : "JPG, PNG, WEBP, GIF"}</p>
                    <input ref={inputRef} type="file" accept={allowVideo ? "image/*,video/mp4,video/webm,video/quicktime,video/ogg" : "image/*"} className="hidden" onChange={onFile} />
                </div>
            </div>
        </div>
    );
}

export function Empty({ children }) {
    return <div className="py-14 text-center text-bone/40 text-sm">{children}</div>;
}
