import React, { useEffect, useRef } from "react";
import Nav from "@/components/Nav";
import ScrollProgress from "@/components/ScrollProgress";
import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import About from "@/components/sections/About";
import Team from "@/components/sections/Team";
import Services from "@/components/sections/Services";
import Gallery from "@/components/sections/Gallery";
import Offers from "@/components/sections/Offers";
import News from "@/components/sections/News";
import Testimonials from "@/components/sections/Testimonials";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";
import MobileBookBar from "@/components/MobileBookBar";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

export default function Home() {
    const mainRef = useRef(null);

    useEffect(() => {
        const root = mainRef.current;
        if (!root) return;
        const els = Array.from(root.querySelectorAll("section")).filter((s) => s.id !== "home");
        els.forEach((el) => el.classList.add("reveal"));
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add("reveal-in");
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    return (
        <main ref={mainRef} className="bg-ivory text-charcoal">
            <ScrollProgress />
            <Nav />
            <Hero />
            <Marquee />
            <About />
            <Team />
            <Services />
            <Offers />
            <Gallery />
            <News />
            <Testimonials />
            <Contact />
            <Footer />
            <div className="h-24 lg:hidden" aria-hidden />
            <MobileBookBar />
            <PWAInstallPrompt />
        </main>
    );
}
