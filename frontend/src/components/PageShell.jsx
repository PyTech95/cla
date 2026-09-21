import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import Nav from "@/components/Nav";
import ScrollProgress from "@/components/ScrollProgress";
import Footer from "@/components/sections/Footer";
import MobileBookBar from "@/components/MobileBookBar";
import { useContent, t } from "@/context/ContentContext";
import { toAbs } from "@/lib/media";

const clamp = (v) => Math.min(150, Math.max(70, parseInt(v, 10) || 100)) / 100;

export function PageBanner({ slug }) {
    const { content } = useContent();
    const img = toAbs(t(content, `page.${slug}.banner_url`, ""));
    return (
        <section data-testid={`page-banner-${slug}`} className="relative pt-32 pb-14 sm:pt-40 sm:pb-20 overflow-hidden border-b border-white/5">
            {img && <div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${img})`, filter: "brightness(0.35) grayscale(0.2)" }} />}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-noir/40 via-noir/60 to-noir" />
            <div aria-hidden className="pointer-events-none absolute -top-24 right-[5%] w-[26rem] h-[26rem] rounded-full bg-gold/10 blur-[120px]" />
            <div className="wrap relative">
                <p className="eyebrow mb-3">{t(content, `page.${slug}.eyebrow`, "")}</p>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] text-bone max-w-3xl">{t(content, `page.${slug}.title`, slug)}</h1>
                {t(content, `page.${slug}.subtitle`, "") && <p className="text-bone/65 text-base md:text-lg mt-5 max-w-2xl font-light leading-relaxed">{t(content, `page.${slug}.subtitle`, "")}</p>}
            </div>
        </section>
    );
}

export default function PageShell({ slug, banner = true, children }) {
    const { content } = useContent();
    const { pathname } = useLocation();
    const ref = useRef(null);
    const hs = clamp(t(content, `page.${slug}.heading_scale`, "100"));
    const ts = clamp(t(content, `page.${slug}.text_scale`, "100"));

    useEffect(() => { window.scrollTo({ top: 0 }); }, [pathname]);

    useEffect(() => {
        document.documentElement.style.fontSize = `${ts * 100}%`;
        return () => { document.documentElement.style.fontSize = ""; };
    }, [ts]);

    useEffect(() => {
        const root = ref.current;
        if (!root) return;
        const els = Array.from(root.querySelectorAll("section")).filter((s) => s.id !== "home" && !s.dataset.testid?.startsWith("page-banner"));
        els.forEach((el) => el.classList.add("reveal"));
        const io = new IntersectionObserver((entries) => {
            entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("reveal-in"); io.unobserve(e.target); } });
        }, { threshold: 0.06, rootMargin: "0px 0px -4% 0px" });
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, [slug]);

    return (
        <main ref={ref} className="pg bg-noir text-bone min-h-screen" style={{ "--hs": hs }} data-testid={`page-${slug}`}>
            <ScrollProgress />
            <Nav />
            {banner && <PageBanner slug={slug} />}
            {children}
            <Footer />
            <div className="h-20 lg:hidden" aria-hidden />
            <MobileBookBar />
        </main>
    );
}
