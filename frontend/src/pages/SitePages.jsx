import React from "react";
import PageShell from "@/components/PageShell";
import About from "@/components/sections/About";
import Team from "@/components/sections/Team";
import Services from "@/components/sections/Services";
import Offers from "@/components/sections/Offers";
import Gallery from "@/components/sections/Gallery";
import Blog from "@/components/sections/Blog";
import Testimonials from "@/components/sections/Testimonials";
import Contact from "@/components/sections/Contact";
import CtaBand from "@/components/sections/CtaBand";

export function AboutPage() {
    return <PageShell slug="about"><About /><Team /><CtaBand /></PageShell>;
}
export function ServicesPage() {
    return <PageShell slug="services"><Services /><Offers /><CtaBand /></PageShell>;
}
export function PortfolioPage() {
    return <PageShell slug="portfolio"><Gallery full /><CtaBand /></PageShell>;
}
export function BlogPage() {
    return <PageShell slug="blog"><Blog all /><CtaBand /></PageShell>;
}
export function ReviewsPage() {
    return <PageShell slug="reviews"><Testimonials all /><CtaBand /></PageShell>;
}
export function ContactPage() {
    return <PageShell slug="contact"><Contact /></PageShell>;
}
