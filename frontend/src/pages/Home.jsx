import React from "react";
import PageShell from "@/components/PageShell";
import Hero from "@/components/sections/Hero";
import Marquee from "@/components/sections/Marquee";
import About from "@/components/sections/About";
import Services from "@/components/sections/Services";
import Gallery from "@/components/sections/Gallery";
import Blog from "@/components/sections/Blog";
import Testimonials from "@/components/sections/Testimonials";
import Offers from "@/components/sections/Offers";
import CtaBand from "@/components/sections/CtaBand";

export default function Home() {
    return (
        <PageShell slug="home" banner={false}>
            <Hero />
            <Marquee />
            <About linkTo="/about" />
            <Services linkTo="/services" compact />
            <Offers />
            <Gallery linkTo="/portfolio" />
            <Blog linkTo="/blog" limit={3} />
            <Testimonials linkTo="/reviews" />
            <CtaBand />
        </PageShell>
    );
}
