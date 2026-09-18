import React from "react";
import { Link } from "react-router-dom";
import { useContent, t } from "@/context/ContentContext";

const LOGO = "https://customer-assets.emergentagent.com/job_cinthia-spa/artifacts/9tpekrrz_image.png";

const TITLES = {
    privacy: "Privacy Policy",
    terms: "Terms of Service",
    refund: "Refund & Cancellation Policy",
    cookies: "Cookie Policy",
    medical_disclaimer: "Medical Disclaimer",
    accessibility: "Accessibility Statement",
    contact: "Contact",
};

const EYEBROWS = {
    privacy: "Legal",
    terms: "Legal",
    refund: "Legal",
    cookies: "Legal",
    medical_disclaimer: "Important",
    accessibility: "Commitment",
    contact: "Reach us",
};

// Tiny safe formatter: handles **bold** + preserves newlines, NO HTML injection.
function renderBody(text) {
    if (!text) return null;
    const today = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    const filled = String(text).replaceAll("{today}", today);
    // Split into paragraphs by blank lines, then within each paragraph parse **bold**.
    return filled.split(/\n\n+/).map((para, pi) => {
        // Split each line; if it starts with a bullet "•" we keep as is
        const lines = para.split("\n");
        const parsedLines = lines.map((line, li) => {
            const parts = [];
            const re = /\*\*([^*]+)\*\*/g;
            let last = 0;
            let m;
            while ((m = re.exec(line)) !== null) {
                if (m.index > last) parts.push(<span key={`t-${li}-${last}`}>{line.slice(last, m.index)}</span>);
                parts.push(<strong key={`b-${li}-${m.index}`} className="text-charcoal font-serif">{m[1]}</strong>);
                last = m.index + m[0].length;
            }
            if (last < line.length) parts.push(<span key={`t-${li}-${last}-end`}>{line.slice(last)}</span>);
            return (
                <React.Fragment key={li}>
                    {parts}
                    {li < lines.length - 1 && <br />}
                </React.Fragment>
            );
        });
        return (
            <p key={pi} className="mb-5 leading-relaxed">
                {parsedLines}
            </p>
        );
    });
}

const OTHER_LINKS = [
    ["/privacy", "Privacy"],
    ["/terms", "Terms"],
    ["/refund-policy", "Refund Policy"],
    ["/cookies", "Cookies"],
    ["/medical-disclaimer", "Medical Disclaimer"],
    ["/accessibility", "Accessibility"],
    ["/contact", "Contact"],
];

export default function LegalPage({ kind }) {
    const { content } = useContent();
    const title = TITLES[kind] || "Policy";
    const eyebrow = EYEBROWS[kind] || "Legal";
    const body = t(content, `${kind}.body`, "");

    return (
        <div className="min-h-screen bg-ivory">
            <header className="border-b border-charcoal/10 bg-ivory/90 backdrop-blur">
                <div className="max-w-4xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <img src={LOGO} alt="CLA" className="w-12 h-12 object-contain" />
                        <span className="text-[10px] uppercase tracking-[0.3em] text-charcoal/55">{title}</span>
                    </Link>
                    <Link to="/" className="text-xs uppercase tracking-widest text-charcoal/70 hover:text-charcoal">← Back home</Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-5 sm:px-8 py-14 sm:py-20">
                <p className="text-[11px] uppercase tracking-[0.32em] text-gold-dark mb-3">{eyebrow}</p>
                <h1 data-testid={`legal-title-${kind}`} className="font-serif text-5xl sm:text-6xl tracking-tight leading-[1.05]">{title}</h1>
                <div className="gold-divider my-8" />
                <div className="text-charcoal/80 font-light text-[15px]">
                    {body ? renderBody(body) : <p className="italic text-charcoal/55">Content coming soon.</p>}
                </div>

                <div className="mt-16 pt-8 border-t border-charcoal/10">
                    <p className="text-[11px] uppercase tracking-[0.3em] text-charcoal/55 mb-4">Other policies</p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        {OTHER_LINKS.filter(([href]) => !href.includes(kind === "medical_disclaimer" ? "medical-disclaimer" : kind)).map(([href, label]) => (
                            <Link key={href} to={href} className="text-charcoal/65 hover:text-gold-dark transition-colors">
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>

                <p className="text-xs text-charcoal/45 mt-10">Last updated: {new Date().toLocaleDateString()}</p>
            </main>
        </div>
    );
}
