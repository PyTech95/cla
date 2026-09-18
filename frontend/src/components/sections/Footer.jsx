import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, Lock } from "lucide-react";
import { useContent, t } from "@/context/ContentContext";
import SparkleBurst from "@/components/Sparkle";

const Social = ({ href, label, children }) => (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-bone/70 hover:border-gold hover:text-gold transition-colors">{children}</a>
);

export default function Footer() {
    const { content } = useContent();
    const LOGO = t(content, "brand.logo_url", "");
    const hours = t(content, "footer.hours_block", "Mon–Fri 10am–8pm\nSat 9am–6pm\nSun by appointment");
    const addressLines = (t(content, "brand.address", "") || "").split(",");
    const name = t(content, "brand.studio_name", "CLA Aesthetics & Wellness");

    return (
        <footer data-testid="footer" className="bg-noir border-t border-white/10 pt-16 pb-8">
            <div className="wrap grid md:grid-cols-2 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-5 space-y-5">
                    <div className="flex items-center gap-4">
                        {LOGO && <img src={LOGO} alt="CLA" className="w-16 h-16 object-contain" />}
                        <div>
                            <p className="font-serif text-2xl text-bone">{name}</p>
                            <p className="text-bone/50 text-xs uppercase tracking-[0.3em] mt-1">{t(content, "footer.tagline", "Enhancing your natural beauty")}</p>
                        </div>
                    </div>
                    <p className="text-bone/60 leading-relaxed max-w-md font-light">{t(content, "footer.body", "")}</p>
                    <div className="flex items-center gap-3">
                        <Social href={t(content, "brand.instagram", "#")} label="Instagram"><Instagram className="w-4 h-4" /></Social>
                        <Social href={t(content, "brand.facebook", "#")} label="Facebook"><Facebook className="w-4 h-4" /></Social>
                        <a href={`mailto:${t(content, "brand.email", "")}`} aria-label="Email" className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-bone/70 hover:border-gold hover:text-gold transition-colors"><Mail className="w-4 h-4" /></a>
                        <a href={`tel:${t(content, "brand.phone_link", "")}`} aria-label="Phone" className="w-10 h-10 rounded-full border border-white/15 flex items-center justify-center text-bone/70 hover:border-gold hover:text-gold transition-colors"><Phone className="w-4 h-4" /></a>
                    </div>
                </div>
                <div className="lg:col-span-3 space-y-3">
                    <p className="eyebrow mb-2">Visit</p>
                    <p className="text-bone/75 text-sm leading-relaxed">{addressLines[0]}<br />{addressLines.slice(1).join(",").trim()}</p>
                    <p className="text-bone/75 text-sm leading-relaxed whitespace-pre-line">{hours}</p>
                </div>
                <div className="lg:col-span-2 space-y-3">
                    <p className="eyebrow mb-2">Explore</p>
                    <ul className="space-y-2 text-sm">
                        {[["#about", "About"], ["#services", "Services"], ["#gallery", "Portfolio"], ["#blog", "Blog"], ["#contact", "Contact"]].map(([h, l]) => (
                            <li key={h}><a href={h} className="text-bone/65 hover:text-gold transition-colors">{l}</a></li>
                        ))}
                    </ul>
                </div>
                <div className="lg:col-span-2 space-y-3">
                    <p className="eyebrow mb-2">Legal</p>
                    <ul className="space-y-2 text-sm">
                        {[["/privacy", "Privacy"], ["/terms", "Terms"], ["/cookies", "Cookies"], ["/medical-disclaimer", "Medical disclaimer"], ["/accessibility", "Accessibility"]].map(([h, l]) => (
                            <li key={h}><Link to={h} className="text-bone/65 hover:text-gold transition-colors">{l}</Link></li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="wrap mt-14">
                <div className="gold-divider mb-8" />
                <div className="relative inline-block">
                    <SparkleBurst color="#E8C877" points={[{ top: "-14%", left: "1%", size: 22, delay: 0 }, { top: "6%", right: "8%", size: 14, delay: 0.8 }, { bottom: "-10%", left: "34%", size: 16, delay: 1.6 }]} />
                    <p className="font-serif italic text-5xl md:text-7xl lg:text-8xl tracking-tight text-shimmer leading-none">{name.split(" ")[0]} <span className="not-italic">Aesthetics</span></p>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8 text-xs text-bone/45">
                    <p>© {new Date().getFullYear()} {t(content, "footer.copyright", "CLA Aesthetics & Wellness. All rights reserved.")}</p>
                    <div className="flex flex-wrap items-center gap-4">
                        <a href="https://pytechdigital.com" target="_blank" rel="noreferrer" data-testid="footer-credit-link" className="group inline-flex items-center gap-2 hover:text-gold-light transition-colors">
                            Designed &amp; developed by <span className="font-medium tracking-[0.22em] text-bone/80 group-hover:text-gold">PYTECH</span>
                        </a>
                        <Link to="/admin" data-testid="footer-admin-link" title="Admin access" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/12 text-bone/45 hover:text-gold hover:border-gold/50 transition-colors text-[10px] uppercase tracking-[0.28em]">
                            <Lock className="w-3 h-3" /> Admin
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
