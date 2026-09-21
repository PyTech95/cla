import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Save, ExternalLink, Images, ListOrdered, Users, MessageSquareQuote, PenSquare, Tag } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { useContent } from "@/context/ContentContext";
import { PageHeader, Card, Btn, MediaField, Empty } from "@/components/admin/ui";

const SCALES = ["80", "90", "100", "110", "120", "130", "140"];
const pageKeys = (slug) => [`page.${slug}.eyebrow`, `page.${slug}.title`, `page.${slug}.subtitle`, `page.${slug}.banner_url`];

const PAGES = [
    { id: "home", label: "Home", path: "/", sections: [
        { title: "Hero", keys: ["brand.hero_bg_url", "hero.eyebrow", "hero.title_part1", "hero.title_part1_italic", "hero.title_part2", "hero.title_part2_italic", "hero.subtitle", "hero.cta_primary", "hero.cta_secondary", "hero.counter_to", "hero.facility_signature", "hero.facility_title", "hero.facility_subtitle"] },
        { title: "Call-to-action band", keys: ["cta.eyebrow", "cta.title", "cta.body"] },
    ], links: [{ to: "/admin/media", label: "Hero slideshow images", icon: Images }] },
    { id: "about", label: "About", path: "/about", sections: [
        { title: "Story", keys: ["brand.about_image_url", "about.eyebrow", "about.title", "about.title_italic", "about.body", "about.body2", "hero.founder_name", "hero.founder_role"] },
        { title: "Highlights", keys: ["about.highlight1_title", "about.highlight1_body", "about.highlight2_title", "about.highlight2_body", "about.highlight3_title", "about.highlight3_body"] },
        { title: "Team header", keys: ["team.eyebrow", "team.title", "team.title_italic", "team.lede"] },
    ], links: [{ to: "/admin/team", label: "Team members", icon: Users }] },
    { id: "services", label: "Services", path: "/services", sections: [
        { title: "Header & menu copy", keys: ["treatments.eyebrow", "treatments.title", "treatments.title_italic", "treatments.lede", "treatments.menu_header", "treatments.col_luxury_title", "treatments.col_wellness_title", "treatments.subtitle", "treatments.closing", "treatments.tagline", "treatments.cta"] },
        { title: "Offers header", keys: ["offers.eyebrow", "offers.title", "offers.title_italic"] },
    ], links: [{ to: "/admin/treatments", label: "Treatments & prices", icon: ListOrdered }, { to: "/admin/offers", label: "Offers", icon: Tag }] },
    { id: "portfolio", label: "Portfolio", path: "/portfolio", sections: [{ title: "Gallery header", keys: ["gallery.eyebrow", "gallery.title", "gallery.title_italic"] }], links: [{ to: "/admin/media", label: "Gallery images & videos", icon: Images }] },
    { id: "blog", label: "Blog", path: "/blog", sections: [{ title: "Journal header", keys: ["blog.eyebrow", "blog.title", "blog.title_italic"] }], links: [{ to: "/admin/blog", label: "Blog posts", icon: PenSquare }] },
    { id: "reviews", label: "Reviews", path: "/reviews", sections: [{ title: "Header", keys: ["testimonials.eyebrow"] }], links: [{ to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote }] },
    { id: "contact", label: "Contact", path: "/contact", sections: [{ title: "Copy & hours", keys: ["booking.eyebrow", "booking.title", "booking.title_italic", "booking.lede", "contact.hours_title", "contact.hours"] }], links: [] },
    { id: "brand", label: "Brand & Footer", global: true, sections: [
        { title: "Brand & contact details (used everywhere)", keys: ["brand.booking_url", "brand.booking_label", "brand.logo_url", "brand.studio_name", "brand.tagline_short", "brand.phone", "brand.phone_link", "brand.email", "brand.address", "brand.maps_query", "brand.instagram", "brand.facebook", "brand.whatsapp"] },
        { title: "Footer", keys: ["footer.tagline", "footer.body", "footer.hours_block", "footer.copyright"] },
    ], links: [] },
    { id: "legal", label: "Legal pages", global: true, sections: [{ title: "Policies (supports **bold** and blank-line paragraphs)", keys: ["privacy.body", "terms.body", "refund.body", "cookies.body", "medical_disclaimer.body", "accessibility.body", "contact.body"] }], links: [] },
];

const HINTS = { "brand.booking_url": "Online booking link used by every Book Now button (opens in a new tab)", "brand.booking_label": "Text shown on the booking buttons", "contact.hours": "One row per line — Label|Value", "hero.counter_to": "Number of Google reviews shown in the hero" };
const isImg = (k) => k.endsWith("_url") && !k.includes("booking");
const isLong = (k, v) => /(\.body2?|\.hours|_block|\.lede|\.subtitle)$/.test(k) || (v || "").length > 90;
const pretty = (k) => k.split(".").pop().replaceAll("_", " ");

function Row({ k, value, onSaved }) {
    const [v, setV] = useState(value || "");
    useEffect(() => setV(value || ""), [value]);
    const dirty = v !== (value || "");
    const save = async () => {
        try { await api.put("/admin/content", { key: k, value: v }); toast.success("Saved — live on the website."); onSaved(); }
        catch { toast.error("Could not save."); }
    };
    return (
        <div className="grid sm:grid-cols-12 gap-3 items-start py-4 border-b border-white/[0.06] last:border-b-0" data-testid={`content-row-${k}`}>
            <div className="sm:col-span-3 pt-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-gold capitalize">{pretty(k)}</p>
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

function Typography({ slug, content, onSaved }) {
    const hk = `page.${slug}.heading_scale`, tk = `page.${slug}.text_scale`;
    const set = async (k, v) => {
        try { await api.put("/admin/content", { key: k, value: v }); toast.success("Font size updated."); onSaved(); }
        catch { toast.error("Could not save."); }
    };
    const Sel = ({ k, label, testId }) => (
        <label className="block">
            <span className="block text-[11px] uppercase tracking-[0.24em] text-bone/50 mb-1.5">{label}</span>
            <select data-testid={testId} value={content[k] || "100"} onChange={(e) => set(k, e.target.value)} className="field text-sm">
                {SCALES.map((s) => <option key={s} value={s}>{s}% {s === "100" ? "(default)" : ""}</option>)}
            </select>
        </label>
    );
    return (
        <Card className="p-5" data-testid={`typography-${slug}`}>
            <p className="text-[11px] uppercase tracking-[0.24em] text-bone/50 mb-4">Typography for this page</p>
            <div className="grid sm:grid-cols-2 gap-4">
                <Sel k={hk} label="Heading size" testId={`heading-scale-${slug}`} />
                <Sel k={tk} label="Body text size" testId={`text-scale-${slug}`} />
            </div>
        </Card>
    );
}

export default function ContentAdmin() {
    const { refresh } = useContent();
    const [content, setContent] = useState(null);
    const [pageId, setPageId] = useState("home");

    const load = () => api.get("/content").then(({ data }) => setContent(data || {})).catch(() => toast.error("Could not load content."));
    useEffect(() => { load(); }, []);
    const onSaved = () => { load(); refresh(); };
    const pg = PAGES.find((x) => x.id === pageId);

    return (
        <div data-testid="admin-content">
            <PageHeader title="Pages & Content" sub="Pick a page, then edit its banner, text, images and font sizes. Everything saves live." />
            <div className="grid lg:grid-cols-[230px_1fr] gap-6">
                <div className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar" data-testid="content-groups">
                    {PAGES.map((x) => (
                        <button key={x.id} onClick={() => setPageId(x.id)} data-testid={`content-group-${x.id}`} className={`text-left whitespace-nowrap px-3.5 py-2.5 rounded-xl text-sm border transition-colors ${pageId === x.id ? "bg-gold/15 text-gold border-gold/30" : "text-bone/65 hover:bg-white/5 border-transparent"}`}>
                            {x.label}{x.global && <span className="text-[10px] uppercase tracking-widest text-bone/35 ml-2">global</span>}
                        </button>
                    ))}
                </div>
                {!content ? <Card><Empty>Loading…</Empty></Card> : (
                    <div className="space-y-5 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2 className="font-serif text-2xl">{pg.label}</h2>
                            <div className="flex flex-wrap gap-2">
                                {pg.links.map((l) => <Link key={l.to} to={l.to} className="btn-ghost rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-widest inline-flex items-center gap-1.5"><l.icon className="w-3.5 h-3.5" /> {l.label}</Link>)}
                                {pg.path && <a href={pg.path} target="_blank" rel="noreferrer" className="btn-ghost rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-widest inline-flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> Preview</a>}
                            </div>
                        </div>
                        {!pg.global && <Typography slug={pg.id} content={content} onSaved={onSaved} />}
                        {!pg.global && pg.id !== "home" && (
                            <Card className="px-5">
                                <p className="text-[11px] uppercase tracking-[0.24em] text-bone/50 pt-5">Page banner</p>
                                {pageKeys(pg.id).map((k) => <Row key={k} k={k} value={content[k]} onSaved={onSaved} />)}
                            </Card>
                        )}
                        {pg.sections.map((sec) => (
                            <Card key={sec.title} className="px-5">
                                <p className="text-[11px] uppercase tracking-[0.24em] text-bone/50 pt-5">{sec.title}</p>
                                {sec.keys.map((k) => <Row key={k} k={k} value={content[k]} onSaved={onSaved} />)}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
