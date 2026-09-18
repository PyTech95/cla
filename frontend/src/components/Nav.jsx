import React, { useEffect, useState } from "react";
import { useNavigate, Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useContent, t } from "@/context/ContentContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/services", label: "Services" },
    { href: "/portfolio", label: "Portfolio" },
    { href: "/blog", label: "Blog" },
    { href: "/reviews", label: "Reviews" },
    { href: "/contact", label: "Contact" },
];

export default function Nav() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const { content } = useContent();
    const LOGO = t(content, "brand.logo_url", "");
    const BOOK = t(content, "brand.booking_url", "/contact");
    const BOOK_LABEL = t(content, "brand.booking_label", "Book Now");
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const solid = scrolled || pathname !== "/";

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 18);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            data-testid="main-nav"
            className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${solid ? "bg-noir/85 backdrop-blur-xl border-b border-white/10" : "bg-transparent"}`}
        >
            <div className="wrap flex items-center justify-between py-3">
                <Link to="/" data-testid="nav-logo" className="flex items-center gap-3 shrink-0">
                    {LOGO && <img src={LOGO} alt="CLA Aesthetics & Wellness" className="w-14 h-14 sm:w-16 sm:h-16 lg:w-[72px] lg:h-[72px] object-contain" />}
                </Link>

                <nav className="hidden lg:flex items-center gap-8">
                    {links.map((l) => (
                        <NavLink key={l.href} to={l.href} end={l.href === "/"} data-testid={`nav-link-${l.label.toLowerCase()}`} className={({ isActive }) => `link-sweep text-[12px] tracking-[0.22em] uppercase transition-colors ${isActive ? "text-gold" : "text-bone/75 hover:text-gold-light"}`}>
                            {l.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    {user?.role === "admin" && (
                        <button onClick={() => navigate("/admin")} data-testid="nav-admin-btn" className="hidden sm:inline-flex text-[12px] tracking-[0.22em] uppercase text-gold hover:text-gold-light">
                            Admin
                        </button>
                    )}
                    <a href={BOOK} target="_blank" rel="noreferrer" data-testid="nav-book-btn" className="btn-gold hidden sm:inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] tracking-[0.2em] uppercase">
                        {BOOK_LABEL} <ChevronRight className="w-4 h-4" />
                    </a>

                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <button data-testid="nav-mobile-toggle" className="lg:hidden p-2.5 rounded-full border border-white/15 text-bone" aria-label="Open menu">
                                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </SheetTrigger>
                        <SheetContent side="right" className="bg-noir-2 border-white/10 text-bone w-[86vw] max-w-sm p-0">
                            <div className="flex flex-col h-full">
                                <div className="px-6 pt-8 pb-6 border-b border-white/10">
                                    <p className="font-serif text-2xl">CLA <span className="text-gold">Aesthetics</span></p>
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-bone/50 mt-1">Menu</p>
                                </div>
                                <nav className="flex-1 px-3 py-4 overflow-y-auto">
                                    {links.map((l, i) => (
                                        <NavLink key={l.href} to={l.href} end={l.href === "/"} data-testid={`mnav-link-${l.label.toLowerCase()}`} onClick={() => setOpen(false)} style={{ animationDelay: `${i * 55}ms` }} className={({ isActive }) => `menu-item flex items-center justify-between px-4 py-4 rounded-2xl text-lg font-serif hover:bg-white/5 active:scale-[.98] transition-transform ${isActive ? "text-gold" : ""}`}>
                                            {l.label} <ChevronRight className="w-4 h-4 text-gold" />
                                        </NavLink>
                                    ))}
                                </nav>
                                <div className="px-6 py-6 border-t border-white/10 space-y-3 pb-safe">
                                    <a href={BOOK} target="_blank" rel="noreferrer" data-testid="mnav-book-btn" onClick={() => setOpen(false)} className="btn-gold w-full inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-xs uppercase tracking-[0.24em]">
                                        {BOOK_LABEL} <ChevronRight className="w-4 h-4" />
                                    </a>
                                    <Link to="/contact" onClick={() => setOpen(false)} className="btn-ghost w-full inline-flex items-center justify-center gap-2 rounded-full py-3 text-xs uppercase tracking-[0.24em]">Send an inquiry</Link>
                                    {user?.role === "admin" && (
                                        <button onClick={() => { setOpen(false); navigate("/admin"); }} className="w-full btn-ghost rounded-full py-3 text-xs uppercase tracking-widest">Admin panel</button>
                                    )}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
