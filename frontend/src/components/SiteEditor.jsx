import React, { useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, Image as ImageIcon, RefreshCw, Save, Upload } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Convert "/api/uploads/..." paths to absolute URLs for previewing.
function absUrl(u) {
    if (!u) return "";
    if (u.startsWith("http://") || u.startsWith("https://")) return u;
    if (u.startsWith("/api/")) return `${BACKEND_URL}${u}`;
    return u;
}

function isVideoSrc(u) {
    return typeof u === "string" && /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|$)/i.test(u);
}

// --------------------- Image URL field with upload ---------------------
function ImageField({ value, onChange, dense, allowVideo, "data-testid": testId }) {
    const inputRef = useRef(null);
    const [busy, setBusy] = useState(false);

    const pick = () => inputRef.current?.click();

    const upload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const okType = allowVideo
            ? (file.type.startsWith("image/") || file.type.startsWith("video/"))
            : file.type.startsWith("image/");
        if (!okType) {
            toast.error(allowVideo ? "Please choose an image or video file." : "Please choose an image file.");
            return;
        }
        const maxMb = file.type.startsWith("video/") ? 64 : 8;
        if (file.size > maxMb * 1024 * 1024) {
            toast.error(`File must be under ${maxMb} MB.`);
            return;
        }
        setBusy(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            const { data } = await api.post("/admin/upload", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            onChange(data.url);
            toast.success("Image uploaded.");
        } catch (err) {
            const msg = err.response?.data?.detail || "Upload failed.";
            toast.error(typeof msg === "string" ? msg : "Upload failed.");
        } finally {
            setBusy(false);
            // Reset input so the same file can be selected again later
            if (inputRef.current) inputRef.current.value = "";
        }
    };

    return (
        <div className={`flex gap-3 items-start ${dense ? "" : ""}`}>
            <div className="w-20 h-20 rounded-xl border border-charcoal/15 bg-cream/40 overflow-hidden flex items-center justify-center shrink-0">
                {value ? (isVideoSrc(value)
                    ? <video src={absUrl(value)} className="w-full h-full object-cover" muted playsInline />
                    : <img src={absUrl(value)} alt="" className="w-full h-full object-cover" />
                ) : <ImageIcon className="w-5 h-5 text-charcoal/40" />}
            </div>
            <div className="flex-1 space-y-2">
                <input
                    data-testid={testId}
                    value={value || ""}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Paste image URL or click Upload"
                    className="w-full bg-ivory border border-charcoal/15 rounded-xl px-3 py-2 font-mono text-xs"
                />
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={pick}
                        disabled={busy}
                        className="btn-ghost-charcoal rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5"
                    >
                        <Upload className="w-3 h-3" /> {busy ? "Uploading…" : "Upload"}
                    </button>
                    {value && (
                        <button
                            type="button"
                            onClick={() => onChange("")}
                            className="text-[10px] uppercase tracking-widest text-charcoal/55 hover:text-destructive"
                        >
                            Clear
                        </button>
                    )}
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept={allowVideo ? "image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/ogg" : "image/png,image/jpeg,image/webp,image/gif"}
                    className="hidden"
                    onChange={upload}
                />
            </div>
        </div>
    );
}

// --------------------- Content (key/value) editor ---------------------
function ContentSection({ title, eyebrow, keys, content, onSave }) {
    const [edits, setEdits] = useState({});
    const isLong = (k, v) => k.includes(".body") || k.endsWith(".hours") || (v || "").length > 100;
    return (
        <details className="card-luxury overflow-hidden group" open>
            <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between hover:bg-cream/30 transition-colors">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark">{eyebrow}</p>
                    <p className="font-serif text-2xl">{title}</p>
                </div>
                <span className="text-charcoal/50 group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="px-6 pb-6 space-y-4 border-t border-charcoal/10 pt-5">
                {keys.map((k) => {
                    const val = edits[k] !== undefined ? edits[k] : content[k] || "";
                    const dirty = edits[k] !== undefined && edits[k] !== (content[k] || "");
                    const isImage = (k.includes("_url") || k.endsWith("_image_url")) && !k.endsWith("booking_url");
                    return (
                        <div key={k} className="grid sm:grid-cols-12 gap-3 items-start">
                            <div className="sm:col-span-3 pt-2">
                                <code className="text-[11px] uppercase tracking-widest text-gold-dark">{k.split(".").pop().replaceAll("_", " ")}</code>
                                <div className="text-[10px] text-charcoal/40 mt-0.5 font-mono break-all">{k}</div>
                            </div>
                            <div className="sm:col-span-7">
                                {isImage ? (
                                    <ImageField
                                        value={val}
                                        onChange={(v) => setEdits({ ...edits, [k]: v })}
                                        data-testid={`content-input-${k}`}
                                    />
                                ) : isLong(k, val) ? (
                                    <textarea
                                        data-testid={`content-input-${k}`}
                                        value={val}
                                        onChange={(e) => setEdits({ ...edits, [k]: e.target.value })}
                                        rows={Math.min(12, Math.max(3, (val || "").split("\n").length))}
                                        className="w-full bg-ivory border border-charcoal/15 rounded-xl px-3 py-2 font-serif text-sm"
                                    />
                                ) : (
                                    <input
                                        data-testid={`content-input-${k}`}
                                        value={val}
                                        onChange={(e) => setEdits({ ...edits, [k]: e.target.value })}
                                        className="w-full bg-ivory border border-charcoal/15 rounded-xl px-3 py-2 font-serif text-sm"
                                    />
                                )}
                            </div>
                            <div className="sm:col-span-2">
                                <button
                                    data-testid={`content-save-${k}`}
                                    onClick={async () => {
                                        await onSave(k, edits[k]);
                                        setEdits({ ...edits, [k]: undefined });
                                    }}
                                    disabled={!dirty}
                                    className={`w-full rounded-full py-2 text-[10px] uppercase tracking-widest ${dirty ? "btn-gold" : "bg-cream text-charcoal/40 cursor-not-allowed"}`}
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </details>
    );
}

// --------------------- CMS list editor (services, testimonials, plans, gallery, treatments_menu) ---------------------
function CmsListSection({ title, eyebrow, kind, fields, onChanged }) {
    const [items, setItems] = useState([]);
    const [editing, setEditing] = useState({});
    const [loading, setLoading] = useState(true);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/cms/${kind}`);
            setItems(data.items || []);
        } finally { setLoading(false); }
    };

    useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

    const setField = (id, field, value) => {
        setEditing({ ...editing, [id]: { ...(editing[id] || {}), [field]: value } });
    };

    const save = async (item) => {
        const patch = editing[item.id] || {};
        const merged = { ...item, ...patch };
        try {
            await api.put(`/admin/cms/${kind}/${item.id}`, merged);
            toast.success("Saved.");
            setEditing({ ...editing, [item.id]: undefined });
            load();
            onChanged && onChanged();
        } catch { toast.error("Could not save."); }
    };

    const remove = async (id) => {
        if (!window.confirm("Delete this item?")) return;
        try { await api.delete(`/admin/cms/${kind}/${id}`); toast.success("Deleted."); load(); onChanged && onChanged(); }
        catch { toast.error("Could not delete."); }
    };

    const add = async () => {
        const newItem = { id: crypto.randomUUID() };
        fields.forEach((f) => {
            newItem[f.key] = f.type === "list" ? [] : f.type === "boolean" ? false : f.type === "number" ? 0 : "";
        });
        try { await api.post(`/admin/cms/${kind}`, newItem); toast.success("Added — scroll down to edit."); load(); onChanged && onChanged(); }
        catch { toast.error("Could not add."); }
    };

    const reseed = async () => {
        if (!window.confirm("This will reset ALL items in this section to the original defaults. Continue?")) return;
        try { await api.post(`/admin/cms/${kind}/seed`); toast.success("Reseeded."); load(); onChanged && onChanged(); }
        catch { toast.error("Reseed failed."); }
    };

    const moveItem = async (idx, dir) => {
        const newOrder = [...items];
        const target = idx + dir;
        if (target < 0 || target >= newOrder.length) return;
        [newOrder[idx], newOrder[target]] = [newOrder[target], newOrder[idx]];
        setItems(newOrder);
        try { await api.post(`/admin/cms/${kind}/reorder`, { ordered_ids: newOrder.map((x) => x.id) }); onChanged && onChanged(); }
        catch { load(); }
    };

    return (
        <details className="card-luxury overflow-hidden group" open>
            <summary className="cursor-pointer list-none px-6 py-5 flex items-center justify-between hover:bg-cream/30 transition-colors">
                <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-gold-dark">{eyebrow}</p>
                    <p className="font-serif text-2xl">{title} <span className="text-charcoal/40 text-base">· {items.length}</span></p>
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                    <button onClick={(e) => { e.preventDefault(); add(); }} className="btn-gold rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5"><Plus className="w-3 h-3" /> Add</button>
                    <button onClick={(e) => { e.preventDefault(); reseed(); }} className="btn-ghost-charcoal rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest inline-flex items-center gap-1.5"><RefreshCw className="w-3 h-3" /> Reset</button>
                    <span className="text-charcoal/50 group-open:rotate-180 transition-transform ml-1">▾</span>
                </div>
            </summary>
            <div className="border-t border-charcoal/10 p-5 space-y-5">
                {loading && <p className="text-charcoal/55 text-sm">Loading…</p>}
                {!loading && items.length === 0 && <p className="text-charcoal/55 text-sm">No items yet. Click + Add.</p>}
                {items.map((item, idx) => (
                    <CmsItemCard
                        key={item.id}
                        item={item}
                        editing={editing[item.id] || {}}
                        fields={fields}
                        idx={idx}
                        total={items.length}
                        onField={(f, v) => setField(item.id, f, v)}
                        onSave={() => save(item)}
                        onDelete={() => remove(item.id)}
                        onMove={(dir) => moveItem(idx, dir)}
                    />
                ))}
            </div>
        </details>
    );
}

function CmsItemCard({ item, editing, fields, idx, total, onField, onSave, onDelete, onMove }) {
    const cur = (key) => (editing[key] !== undefined ? editing[key] : item[key]);
    const dirty = Object.keys(editing).length > 0;
    const thumbField = fields.find((f) => f.type === "image" || f.type === "media");
    return (
        <div className="rounded-2xl border border-charcoal/10 bg-cream/30 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                    {thumbField && (
                        <div className="w-12 h-12 rounded-lg overflow-hidden border border-charcoal/15 bg-ivory shrink-0 flex items-center justify-center">
                            {cur(thumbField.key) ? (isVideoSrc(cur(thumbField.key))
                                ? <video src={absUrl(cur(thumbField.key))} className="w-full h-full object-cover" muted playsInline />
                                : <img src={absUrl(cur(thumbField.key))} alt="" className="w-full h-full object-cover" />
                            ) : <ImageIcon className="w-4 h-4 text-charcoal/40" />}
                        </div>
                    )}
                    <div>
                        <p className="font-serif text-lg">{cur(fields[0].key) || "(untitled)"}</p>
                        <p className="text-[10px] uppercase tracking-widest text-charcoal/40">#{idx + 1}</p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => onMove(-1)} disabled={idx === 0} className="p-1.5 rounded-full border border-charcoal/15 disabled:opacity-30" aria-label="Move up">↑</button>
                    <button onClick={() => onMove(1)} disabled={idx === total - 1} className="p-1.5 rounded-full border border-charcoal/15 disabled:opacity-30" aria-label="Move down">↓</button>
                    <button onClick={onDelete} className="p-1.5 rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10" aria-label="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                {fields.map((f) => (
                    <Field key={f.key} field={f} value={cur(f.key)} onChange={(v) => onField(f.key, v)} />
                ))}
            </div>
            <div className="flex justify-end mt-4">
                <button onClick={onSave} disabled={!dirty} className={`rounded-full px-5 py-2 text-[10px] uppercase tracking-widest inline-flex items-center gap-2 ${dirty ? "btn-gold" : "bg-cream text-charcoal/40 cursor-not-allowed"}`}>
                    <Save className="w-3 h-3" /> Save
                </button>
            </div>
        </div>
    );
}

function Field({ field, value, onChange }) {
    if (field.type === "media") {
        return (
            <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">{field.label}</label>
                <ImageField value={value} onChange={onChange} allowVideo />
            </div>
        );
    }
    if (field.type === "image") {
        return (
            <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">{field.label}</label>
                <ImageField value={value} onChange={onChange} />
            </div>
        );
    }
    if (field.type === "boolean") {
        return (
            <label className="flex items-center gap-2 text-sm sm:col-span-2 cursor-pointer">
                <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="w-4 h-4 accent-gold" />
                {field.label}
            </label>
        );
    }
    if (field.type === "list") {
        const arr = Array.isArray(value) ? value : [];
        return (
            <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">{field.label}</label>
                <textarea
                    value={arr.join("\n")}
                    onChange={(e) => onChange(e.target.value.split("\n").filter((l) => l.trim()))}
                    rows={Math.min(8, Math.max(3, arr.length + 1))}
                    placeholder="One per line"
                    className="w-full bg-ivory border border-charcoal/15 rounded-xl px-3 py-2 font-serif text-sm"
                />
            </div>
        );
    }
    if (field.type === "longtext") {
        return (
            <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">{field.label}</label>
                <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={3} className="w-full bg-ivory border border-charcoal/15 rounded-xl px-3 py-2 font-serif text-sm" />
            </div>
        );
    }
    if (field.type === "number") {
        return (
            <div>
                <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">{field.label}</label>
                <input type="number" value={value ?? ""} onChange={(e) => onChange(Number(e.target.value))} className="w-full bg-ivory border border-charcoal/15 rounded-xl px-3 py-2 font-serif text-sm" />
            </div>
        );
    }
    return (
        <div>
            <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">{field.label}</label>
            <input value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full bg-ivory border border-charcoal/15 rounded-xl px-3 py-2 font-serif text-sm" />
        </div>
    );
}

// --------------------- Main Site Editor ---------------------
export default function SiteEditor({ content, onContentChange }) {
    const saveKey = async (key, value) => {
        try {
            await api.put("/admin/content", { key, value });
            toast.success("Saved.");
            onContentChange && onContentChange();
        } catch { toast.error("Could not save."); }
    };

    return (
        <div className="space-y-4">
            <div className="card-luxury p-5">
                <p className="text-[11px] uppercase tracking-[0.3em] text-gold-dark mb-2">Site editor</p>
                <p className="text-charcoal/65 text-sm">Every section, image, text, price and link on your website is below. Changes save live and appear instantly on cla-wellness.com after deploy.</p>
            </div>

            <ContentSection
                eyebrow="Brand & global"
                title="Logo, contact details, images"
                content={content}
                onSave={saveKey}
                keys={[
                    "brand.logo_url",
                    "brand.studio_name",
                    "brand.tagline_short",
                    "brand.phone",
                    "brand.phone_link",
                    "brand.email",
                    "brand.address",
                    "brand.maps_query",
                    "brand.booking_url",
                    "brand.instagram",
                    "brand.facebook",
                    "brand.whatsapp",
                    "brand.hero_bg_url",
                    "brand.founder_image_url",
                    "brand.about_image_url",
                    "brand.hero_facility_image_url",
                    "brand.qr_url",
                ]}
            />

            <ContentSection
                eyebrow="Hero"
                title="Hero section copy"
                content={content}
                onSave={saveKey}
                keys={["hero.eyebrow","hero.title_part1","hero.title_part1_italic","hero.title_part2","hero.title_part2_italic","hero.subtitle","hero.cta_primary","hero.cta_secondary","hero.counter_to","hero.counter_label","hero.facility_signature","hero.facility_title","hero.facility_subtitle","hero.founder_signature","hero.founder_name","hero.founder_role"]}
            />

            <CmsListSection
                eyebrow="Hero carousel"
                title="Hero image carousel (auto-rotates every 4.5s)"
                kind="hero_images"
                fields={[
                    { key: "src", label: "Image URL", type: "image" },
                    { key: "alt", label: "Alt text (accessibility)", type: "text" },
                ]}
            />

            <ContentSection
                eyebrow="About"
                title="About section copy"
                content={content}
                onSave={saveKey}
                keys={["about.eyebrow","about.title","about.title_italic","about.body","about.body2","about.highlight1_title","about.highlight1_body","about.highlight2_title","about.highlight2_body","about.highlight3_title","about.highlight3_body"]}
            />

            <ContentSection
                eyebrow="Team"
                title="Team section header"
                content={content}
                onSave={saveKey}
                keys={["team.eyebrow","team.title","team.title_italic","team.lede"]}
            />

            <CmsListSection
                eyebrow="Team"
                title="Staff & team members"
                kind="team"
                fields={[
                    { key: "name", label: "Name", type: "text" },
                    { key: "role", label: "Role / title", type: "text" },
                    { key: "image", label: "Photo", type: "image" },
                    { key: "bio", label: "Description", type: "longtext" },
                ]}
            />

            <CmsListSection
                eyebrow="Services"
                title="Service catalog"
                kind="services"
                fields={[
                    { key: "name", label: "Name", type: "text" },
                    { key: "category", label: "Category", type: "text" },
                    { key: "duration", label: "Duration", type: "text" },
                    { key: "price", label: "Price label", type: "text" },
                    { key: "description", label: "Description", type: "longtext" },
                    { key: "image", label: "Image URL", type: "image" },
                    { key: "comingSoon", label: "Mark as 'Coming Soon'", type: "boolean" },
                ]}
            />

            <ContentSection
                eyebrow="Treatments"
                title="Treatments header & footer copy"
                content={content}
                onSave={saveKey}
                keys={["treatments.eyebrow","treatments.title","treatments.title_italic","treatments.lede","treatments.menu_header","treatments.col_luxury_title","treatments.col_wellness_title","treatments.subtitle","treatments.closing","treatments.tagline","treatments.cta"]}
            />

            <CmsListSection
                eyebrow="Treatments menu"
                title="Luxury Treatment & Wellness price list"
                kind="treatments_menu"
                fields={[
                    { key: "name", label: "Name", type: "text" },
                    { key: "category", label: "Column (luxury or wellness)", type: "text" },
                    { key: "price", label: "Price label", type: "text" },
                    { key: "bullets", label: "Bullets (one per line)", type: "list" },
                ]}
            />

            <ContentSection
                eyebrow="Gallery"
                title="Gallery section header"
                content={content}
                onSave={saveKey}
                keys={["gallery.eyebrow","gallery.title","gallery.title_italic"]}
            />

            <CmsListSection
                eyebrow="Gallery"
                title="Gallery images & videos"
                kind="gallery"
                fields={[
                    { key: "src", label: "Image or video", type: "media" },
                    { key: "alt", label: "Caption / alt text", type: "text" },
                ]}
            />

            <CmsListSection
                eyebrow="Testimonials"
                title="Testimonials"
                kind="testimonials"
                fields={[
                    { key: "name", label: "Client name", type: "text" },
                    { key: "rating", label: "Stars (1-5)", type: "number" },
                    { key: "text", label: "Quote", type: "longtext" },
                ]}
            />

            <ContentSection
                eyebrow="Offers / Membership header"
                title="Offers section header"
                content={content}
                onSave={saveKey}
                keys={["offers.eyebrow","offers.title","offers.title_italic"]}
            />

            <CmsListSection
                eyebrow="Plans"
                title="Offers & Membership plans"
                kind="plans"
                fields={[
                    { key: "title", label: "Plan title", type: "text" },
                    { key: "badge", label: "Badge", type: "text" },
                    { key: "price", label: "Price (display)", type: "text" },
                    { key: "unit", label: "Unit (e.g. /mo)", type: "text" },
                    { key: "subtitle", label: "Subtitle", type: "text" },
                    { key: "amount", label: "Amount (USD, charged)", type: "number" },
                    { key: "perks", label: "Perks (one per line)", type: "list" },
                    { key: "recurring", label: "Recurring subscription", type: "boolean" },
                    { key: "dark", label: "Featured dark card", type: "boolean" },
                ]}
            />

            <ContentSection
                eyebrow="Booking section"
                title="Booking page copy"
                content={content}
                onSave={saveKey}
                keys={["booking.eyebrow","booking.title","booking.title_italic","booking.lede","booking.qr_eyebrow","booking.qr_title","booking.qr_title_italic","booking.qr_subtitle"]}
            />

            <ContentSection
                eyebrow="Contact & hours"
                title="Opening hours"
                content={content}
                onSave={saveKey}
                keys={["contact.hours_title","contact.hours"]}
            />

            <ContentSection
                eyebrow="Footer"
                title="Footer copy"
                content={content}
                onSave={saveKey}
                keys={["footer.tagline","footer.body","footer.hours_block","footer.copyright"]}
            />

            <ContentSection
                eyebrow="Legal"
                title="Privacy, Terms, Refund, Cookies, Medical, Accessibility, Contact"
                content={content}
                onSave={saveKey}
                keys={["privacy.body","terms.body","refund.body","cookies.body","medical_disclaimer.body","accessibility.body","contact.body"]}
            />
        </div>
    );
}
