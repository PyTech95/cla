import React, { useState } from "react";
import { Routes, Route, NavLink, Link, useNavigate, Navigate } from "react-router-dom";
import { LayoutDashboard, Inbox, Images, PenSquare, Tag, ListOrdered, Users, MessageSquareQuote, FileText, Settings, LogOut, ExternalLink, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useContent, t } from "@/context/ContentContext";
import Dashboard from "@/components/admin/Dashboard";
import Inquiries from "@/components/admin/Inquiries";
import Media from "@/components/admin/Media";
import BlogAdmin from "@/components/admin/BlogAdmin";
import OffersAdmin from "@/components/admin/OffersAdmin";
import CmsList from "@/components/admin/CmsList";
import ContentAdmin from "@/components/admin/ContentAdmin";
import SettingsAdmin from "@/components/admin/SettingsAdmin";

const MENU = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/inquiries", label: "Inquiries", icon: Inbox },
    { to: "/admin/media", label: "Gallery & Media", icon: Images },
    { to: "/admin/blog", label: "Blog", icon: PenSquare },
    { to: "/admin/offers", label: "Offers", icon: Tag },
    { to: "/admin/treatments", label: "Treatments & Prices", icon: ListOrdered },
    { to: "/admin/team", label: "Team", icon: Users },
    { to: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
    { to: "/admin/content", label: "Site Content", icon: FileText },
    { to: "/admin/settings", label: "Settings", icon: Settings },
];

const TREATMENT_FIELDS = [
    { key: "name", label: "Treatment name", type: "text" },
    { key: "category", label: "Column", type: "select", options: ["luxury", "wellness"] },
    { key: "price", label: "Price label", type: "text" },
    { key: "bullets", label: "Highlights (one per line)", type: "list" },
];
const TEAM_FIELDS = [
    { key: "name", label: "Name", type: "text" },
    { key: "role", label: "Role / title", type: "text" },
    { key: "image", label: "Photo", type: "image" },
    { key: "bio", label: "Short bio", type: "longtext" },
];
const TESTIMONIAL_FIELDS = [
    { key: "name", label: "Client name", type: "text" },
    { key: "rating", label: "Stars (1–5)", type: "number" },
    { key: "text", label: "Quote", type: "longtext" },
];

export default function Admin() {
    const { user, logout } = useAuth();
    const { content } = useContent();
    const nav = useNavigate();
    const [open, setOpen] = useState(false);
    const LOGO = t(content, "brand.logo_url", "");

    const sidebar = (
        <div className="flex flex-col h-full">
            <Link to="/admin" className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
                {LOGO && <img src={LOGO} alt="CLA" className="w-11 h-11 object-contain" />}
                <div>
                    <p className="font-serif text-lg leading-none text-bone">CLA Admin</p>
                    <p className="text-[10px] uppercase tracking-[0.25em] text-bone/45 mt-1 truncate max-w-[150px]">{user?.email}</p>
                </div>
            </Link>
            <nav className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-0.5" data-testid="admin-sidebar">
                {MENU.map((m) => (
                    <NavLink key={m.to} to={m.to} end={m.end} onClick={() => setOpen(false)} data-testid={`admin-nav-${m.label.toLowerCase().replace(/[^a-z]+/g, "-")}`}
                        className={({ isActive }) => `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-colors ${isActive ? "bg-gold/15 text-gold border border-gold/30" : "text-bone/70 hover:bg-white/5 hover:text-bone border border-transparent"}`}>
                        <m.icon className="w-4 h-4 shrink-0" /> {m.label}
                    </NavLink>
                ))}
            </nav>
            <div className="p-3 border-t border-white/10 space-y-1">
                <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-bone/60 hover:bg-white/5 hover:text-bone"><ExternalLink className="w-4 h-4" /> View website</a>
                <button data-testid="admin-logout" onClick={async () => { await logout(); nav("/"); }} className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-bone/60 hover:bg-white/5 hover:text-bone"><LogOut className="w-4 h-4" /> Sign out</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-noir text-bone lg:grid lg:grid-cols-[260px_1fr]" data-testid="admin-layout">
            <aside className="hidden lg:block sticky top-0 h-screen border-r border-white/10 bg-noir-2">{sidebar}</aside>

            <div className="lg:hidden sticky top-0 z-30 bg-noir-2/95 backdrop-blur border-b border-white/10 flex items-center justify-between px-4 py-3">
                <Link to="/admin" className="flex items-center gap-2">{LOGO && <img src={LOGO} alt="CLA" className="w-9 h-9 object-contain" />}<span className="font-serif">CLA Admin</span></Link>
                <button data-testid="admin-mobile-menu" onClick={() => setOpen((v) => !v)} className="p-2 rounded-full border border-white/15" aria-label="Menu">{open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}</button>
            </div>
            {open && <div className="lg:hidden fixed inset-0 z-40 flex"><div className="w-[280px] bg-noir-2 border-r border-white/10 h-full">{sidebar}</div><button aria-label="Close" className="flex-1 bg-black/60" onClick={() => setOpen(false)} /></div>}

            <main className="min-w-0 px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
                <Routes>
                    <Route index element={<Dashboard />} />
                    <Route path="inquiries" element={<Inquiries />} />
                    <Route path="media" element={<Media />} />
                    <Route path="blog" element={<BlogAdmin />} />
                    <Route path="offers" element={<OffersAdmin />} />
                    <Route path="treatments" element={<CmsList kind="treatments_menu" title="Treatments & Prices" sub="The price list shown in the Services section." fields={TREATMENT_FIELDS} />} />
                    <Route path="team" element={<CmsList kind="team" title="Team" sub="Staff members shown on the website." fields={TEAM_FIELDS} />} />
                    <Route path="testimonials" element={<CmsList kind="testimonials" title="Testimonials" sub="Client reviews rotating on the homepage." fields={TESTIMONIAL_FIELDS} />} />
                    <Route path="content" element={<ContentAdmin />} />
                    <Route path="settings" element={<SettingsAdmin />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
            </main>
        </div>
    );
}
