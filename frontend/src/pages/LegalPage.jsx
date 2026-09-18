import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useContent, t } from "@/context/ContentContext";

const TITLES = {
    privacy: "Privacy Policy", terms: "Terms of Service", refund: "Refund & Cancellation Policy", cookies: "Cookie Policy",
    medical_disclaimer: "Medical Disclaimer", accessibility: "Accessibility Statement", contact: "Contact",
};

export function renderBody(text) {
    if (!text) return null;
    const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    const filled = String(text).replaceAll("{today}", today);
    return filled.split(/\n\n+/).map((para, pi) => {
        const lines = para.split("\n");
        return (
            <p key={pi} className="mb-5 leading-relaxed">
                {lines.map((line, li) => {
                    const parts = [];
                    const re = /\*\*([^*]+)\*\*/g;
                    let last = 0, m;
                    while ((m = re.exec(line)) !== null) {
                        if (m.index > last) parts.push(<span key={`t${li}-${last}`}>{line.slice(last, m.index)}</span>);
                        parts.push(<strong key={`b${li}-${m.index}`} className="text-gold-light font-serif font-normal">{m[1]}</strong>);
                        last = m.index + m[0].length;
                    }
                    if (last < line.length) parts.push(<span key={`e${li}`}>{line.slice(last)}</span>);
                    return <React.Fragment key={li}>{parts}{li < lines.length - 1 && <br />}</React.Fragment>;
                })}
            </p>
        );
    });
}

const OTHER_LINKS = [["/privacy", "Privacy"], ["/terms", "Terms"], ["/refund-policy", "Refund Policy"], ["/cookies", "Cookies"], ["/medical-disclaimer", "Medical Disclaimer"], ["/accessibility", "Accessibility"], ["/contact", "Contact"]];

export function SubpageHeader({ title }) {
    const { content } = useContent();
    const LOGO = t(content, "brand.logo_url", "");
    return (
        <header className="border-b border-white/10 bg-noir/90 backdrop-blur sticky top-0 z-20">
            <div className="wrap max-w-5xl py-3 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-3">
                    {LOGO && <img src={LOGO} alt="CLA" className="w-12 h-12 object-contain" />}
                    <span className="text-[10px] uppercase tracking-[0.3em] text-bone/55">{title}</span>
                </Link>
                <Link to="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-bone/60 hover:text-gold"><ArrowLeft className="w-3.5 h-3.5" /> Home</Link>
            </div>
        </header>
    );
}

export default function LegalPage({ kind }) {
    const { content } = useContent();
    const title = TITLES[kind] || "Policy";
    const body = t(content, `${kind}.body`, "");
    const current = kind === "medical_disclaimer" ? "medical-disclaimer" : kind === "refund" ? "refund-policy" : kind;

    return (
        <div className="min-h-screen bg-noir text-bone">
            <SubpageHeader title={title} />
            <main className="wrap max-w-3xl py-14 sm:py-20">
                <p className="eyebrow mb-3">Legal</p>
                <h1 data-testid={`legal-title-${kind}`} className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">{title}</h1>
                <div className="gold-divider my-8" />
                <div className="text-bone/75 font-light text-[15px]">{body ? renderBody(body) : <p className="italic text-bone/50">Content coming soon.</p>}</div>
                <div className="mt-16 pt-8 border-t border-white/10">
                    <p className="eyebrow mb-4">Other policies</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        {OTHER_LINKS.filter(([href]) => href !== `/${current}`).map(([href, label]) => <Link key={href} to={href} className="text-bone/60 hover:text-gold transition-colors">{label}</Link>)}
                    </div>
                </div>
            </main>
        </div>
    );
}
