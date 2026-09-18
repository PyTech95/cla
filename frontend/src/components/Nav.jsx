import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useContent, t } from "@/context/ContentContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const links = [
    { href: "#home", label: "Home" },
    { href: "#about", label: "About" },
    { href: "#services", label: "Services" },
    { href: "#gallery", label: "Portfolio" },
    { href: "#testimonials", label: "Testimonials" },
    { href: "#contact", label: "Contact" },
];

export default function Nav() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const { user, logout } = useAuth();
    const { content } = useContent();
    const LOGO = t(content, "brand.logo_url", "");
    const bookingEnabled = t(content, "brand.booking_enabled", "false") === "true";
    const bookingUrl = t(content, "brand.booking_url", "");
    const phoneLink = t(content, "brand.phone_link", "+15166209158");
    const navigate = useNavigate();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 18);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            data-testid="main-nav"
            className={`fixed top-0 inset-x-0 z-40 transition-all duration-500 ${
                scrolled ? "bg-ivory/85 backdrop-blur-xl border-b border-charcoal/10" : "bg-transparent"
            }`}
        >
            <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between py-3">
                <a href="#home" data-testid="nav-logo" className="flex items-center gap-3">
                    {LOGO && (
                        <img
                            src={LOGO}
                            alt="CLA Aesthetics & Wellness"
                            className="w-[78px] h-[78px] sm:w-[90px] sm:h-[90px] lg:w-28 lg:h-28 object-contain"
                        />
                    )}
                </a>

                <nav className="hidden lg:flex items-center gap-7">
                    {links.map((l) => (
                        <a
                            key={l.href}
                            href={l.href}
                            data-testid={`nav-link-${l.label.toLowerCase()}`}
                            className="link-sweep text-sm tracking-wider uppercase text-charcoal/80 hover:text-gold-dark transition-colors"
                        >
                            {l.label}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-3">
                    {user && (
                        <>
                            <button
                                onClick={() => navigate(user.role === "admin" ? "/admin" : "/portal")}
                                data-testid="nav-portal-btn"
                                className="hidden sm:inline-flex text-sm tracking-wider uppercase text-charcoal/80 hover:text-gold-dark"
                            >
                                {user.role === "admin" ? "Admin" : "Portal"}
                            </button>
                            <button
                                onClick={async () => { await logout(); navigate("/"); }}
                                data-testid="nav-logout-btn"
                                className="hidden sm:inline-flex text-sm tracking-wider uppercase text-charcoal/60 hover:text-charcoal"
                            >
                                Sign out
                            </button>
                        </>
                    )}
                    {bookingEnabled && bookingUrl && (
                        <a
                            href={bookingUrl}
                            target="_blank"
                            rel="noreferrer"
                            data-testid="nav-book-btn"
                            className="btn-gold inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs sm:text-sm tracking-widest uppercase font-medium"
                        >
                            Book now <ChevronRight className="w-4 h-4" />
                        </a>
                    )}

                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <button
                                data-testid="nav-mobile-toggle"
                                className="lg:hidden p-2 rounded-full border border-charcoal/15"
                                aria-label="Open menu"
                            >
                                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </SheetTrigger>
                        <SheetContent side="right" className="bg-ivory border-charcoal/10 w-[86vw] max-w-sm p-0">
                            <div className="flex flex-col h-full">
                                <div className="px-6 pt-8 pb-6 border-b border-charcoal/10">
                                    <p className="font-serif text-2xl text-charcoal">CLA <span className="text-gold-dark">Aesthetics</span></p>
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal/50 mt-1">Menu</p>
                                </div>
                                <nav className="flex-1 px-3 py-4 overflow-y-auto">
                                    {links.map((l, i) => (
                                        <a
                                            key={l.href}
                                            href={l.href}
                                            data-testid={`mnav-link-${l.label.toLowerCase()}`}
                                            onClick={() => setOpen(false)}
                                            style={{ animationDelay: `${i * 55}ms` }}
                                            className="menu-item flex items-center justify-between px-4 py-4 rounded-2xl text-lg font-serif text-charcoal hover:bg-champagne/50 active:scale-[.98] transition-transform"
                                        >
                                            {l.label} <ChevronRight className="w-4 h-4 text-gold-dark" />
                                        </a>
                                    ))}
                                </nav>
                                <div className="px-6 py-6 border-t border-charcoal/10 space-y-3 pb-safe">
                                    {bookingEnabled && bookingUrl && (
                                        <a
                                            href={bookingUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            onClick={() => setOpen(false)}
                                            className="btn-gold w-full inline-flex items-center justify-center gap-2 rounded-full py-3.5 text-xs uppercase tracking-[0.24em]"
                                        >
                                            Book now <ChevronRight className="w-4 h-4" />
                                        </a>
                                    )}
                                    {user && (
                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => { setOpen(false); navigate(user.role === "admin" ? "/admin" : "/portal"); }}
                                                className="flex-1 btn-ghost-charcoal rounded-full py-3 text-xs uppercase tracking-widest"
                                            >
                                                {user.role === "admin" ? "Admin" : "Portal"}
                                            </button>
                                            <button
                                                onClick={async () => { setOpen(false); await logout(); navigate("/"); }}
                                                className="flex-1 btn-ghost-charcoal rounded-full py-3 text-xs uppercase tracking-widest"
                                            >
                                                Sign out
                                            </button>
                                        </div>
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
