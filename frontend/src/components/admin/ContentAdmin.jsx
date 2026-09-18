import React, { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useContent } from "@/context/ContentContext";
import { PageHeader, Card, Btn, MediaField, Empty } from "@/components/admin/ui";

const GROUPS = [
    { id: "brand", label: "Brand & Contact", keys: ["brand.logo_url", "brand.studio_name", "brand.tagline_short", "brand.phone", "brand.phone_link", "brand.email", "brand.address", "brand.maps_query", "brand.instagram", "brand.facebook", "brand.whatsapp"] },
    { id: "hero", label: "Hero", keys: ["brand.hero_bg_url", "hero.eyebrow", "hero.title_part1", "hero.title_part1_italic", "hero.title_part2", "hero.title_part2_italic", "hero.subtitle", "hero.cta_primary", "hero.cta_secondary", "hero.counter_to", "hero.facility_signature", "hero.facility_title", "hero.facility_subtitle"] },
    { id: "about", label: "About", keys: ["brand.about_image_url", "about.eyebrow", "about.title", "about.title_italic", "about.body", "about.body2", "hero.founder_name", "hero.founder_role", "about.highlight1_title", "about.highlight1_body", "about.highlight2_title", "about.highlight2_body", "about.highlight3_title", "about.highlight3_body"] },
    { id: "team", label: "Team header", keys: ["team.eyebrow", "team.title", "team.title_italic", "team.lede"] },
    { id: "treatments", label: "Treatments header", keys: ["treatments.eyebrow", "treatments.title", "treatments.title_italic", "treatments.lede", "treatments.menu_header", "treatments.col_luxury_title", "treatments.col_wellness_title", "treatments.subtitle", "treatments.closing", "treatments.tagline", "treatments.cta"] },
    { id: "gallery", label: "Gallery / Blog / Offers headers", keys: ["gallery.eyebrow", "gallery.title", "gallery.title_italic", "blog.eyebrow", "blog.title", "blog.title_italic", "offers.eyebrow", "offers.title", "offers.title_italic", "testimonials.eyebrow"] },
    { id: "contact", label: "Contact & Hours", keys: ["booking.eyebrow", "booking.title", "booking.title_italic", "booking.lede", "contact.hours_title", "contact.hours"] },
    { id: "footer", label: "Footer", keys: ["footer.tagline", "footer.body", "footer.hours_block", "footer.copyright"] },
    { id: "legal", label: "Legal pages", keys: ["privacy.body", "terms.body", "refund.body", "cookies.body", "medical_disclaimer.body", "accessibility.body", "contact.body"] },
];

const HINTS = { "contact.hours": "One row per line — Label|Value", "blog.title": "Journal section heading", "blog.eyebrow": "Small label above the Journal heading" };
const isImg = (k) => k.endsWith("_url");
const isLong = (k, v) => k.endsWith(".body") || k.endsWith(".body2") || k.endsWith(".hours") || k.endsWith("_block") || k.endsWith(".lede") || k.endsWith(".subtitle") || (v || "").length > 90;
const pretty = (k) => k.split(".").pop().replaceAll("_", " ");

function Row({ k, value, onSaved }) {
    const [v, setV] = useState(value || "");
    useEffect(() => setV(value || ""), [value]);
    const dirty = v !== (value || "");
    const save = async () => {
        try { await api.put("/admin/content", { key: k, value: v }); toast.success("Saved."); onSaved(); }
        catch { toast.error("Could not save."); }
    };
    return (
        <div className="grid sm:grid-cols-12 gap-3 items-start py-4 border-b border-white/[0.06] last:border-b-0" data-testid={`content-row-${k}`}>
            <div className="sm:col-span-3 pt-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-gold capitalize">{pretty(k)}</p>
                <p className="text-[10px] text-bone/35 font-mono mt-0.5 break-all">{k}</p>
                {HINTS[k] && <p className="text-[11px] text-bone/45 mt-1">{HINTS[k]}</p>}
            </div>
            <div className="sm:col-span-7">
                {isImg(k) ? <MediaField value={v} onChange={setV} allowVideo={false} testId={`content-input-${k}`} />
                    : isLong(k, v) ? <textarea data-testid={`content-input-${k}`} value={v} onChange={(e) => setV(e.target.value)} rows={Math.min(14, Math.max(3, v.split("\n").length + 1))} className="field text-sm leading-relaxed" />
                        : <input data-testid={`content-input-${k}`} value={v} onChange={(e) => setV(e.target.value)} className="field text-sm" />}
            </div>
            <div className="sm:col-span-2"><Btn onClick={save} disabled={!dirty} className="w-full justify-center" data-testid={`content-save-${k}`}><Save className="w-3.5 h-3.5" /> Save</Btn></div>
        </div>
    );
}

export default function ContentAdmin() {
    const { refresh } = useContent();
    const [content, setContent] = useState(null);
    const [group, setGroup] = useState(GROUPS[0].id);

    const load = () => api.get("/content").then(({ data }) => setContent(data || {})).catch(() => toast.error("Could not load content."));
    useEffect(() => { load(); }, []);

    const g = GROUPS.find((x) => x.id === group);

    return (
        <div data-testid="admin-content">
            <PageHeader title="Site Content" sub="Every headline, paragraph, link and image on the website. Changes go live instantly." />
            <div className="grid lg:grid-cols-[220px_1fr] gap-6">
                <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar" data-testid="content-groups">
                    {GROUPS.map((x) => (
                        <button key={x.id} onClick={() => setGroup(x.id)} data-testid={`content-group-${x.id}`} className={`text-left whitespace-nowrap px-3.5 py-2.5 rounded-xl text-sm border transition-colors ${group === x.id ? "bg-gold/15 text-gold border-gold/30" : "text-bone/65 hover:bg-white/5 border-transparent"}`}>{x.label}</button>
                    ))}
                </div>
                <Card className="px-5">
                    {!content ? <Empty>Loading…</Empty> : g.keys.map((k) => <Row key={k} k={k} value={content[k]} onSaved={() => { load(); refresh(); }} />)}
                </Card>
            </div>
        </div>
    );
}
