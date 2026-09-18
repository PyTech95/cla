import React, { useEffect, useRef } from "react";
import Nav from "@/components/Nav";
import ScrollProgress from "@/components/ScrollProgress";
import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import About from "@/components/sections/About";
import Team from "@/components/sections/Team";
import Services from "@/components/sections/Services";
import Offers from "@/components/sections/Offers";
import Gallery from "@/components/sections/Gallery";
import Blog from "@/components/sections/Blog";
import Testimonials from "@/components/sections/Testimonials";
import Contact from "@/components/sections/Contact";
import Footer from "@/components/sections/Footer";
import MobileBookBar from "@/components/MobileBookBar";

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
            { threshold: 0.08, rootMargin: "0px 0px -6% 0px" }
        );
        els.forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    return (
        <main ref={mainRef} className="bg-noir text-bone" data-testid="home-page">
            <ScrollProgress />
            <Nav />
            <Hero />
            <Marquee />
            <About />
            <Team />
            <Services />
            <Offers />
            <Gallery />
            <Blog />
            <Testimonials />
            <Contact />
            <Footer />
            <div className="h-20 lg:hidden" aria-hidden />
            <MobileBookBar />
        </main>
    );
}
