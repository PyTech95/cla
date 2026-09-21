import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import api from "@/lib/api";
import { AuthProvider } from "@/context/AuthContext";
import { ContentProvider } from "@/context/ContentContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import OfferBanner from "@/components/OfferBanner";
import Analytics from "@/components/Analytics";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import LegalPage from "@/pages/LegalPage";
import BlogPost from "@/pages/BlogPost";
import { AboutPage, ServicesPage, PortfolioPage, BlogPage, ReviewsPage, ContactPage } from "@/pages/SitePages";

function ThemeSync() {
    useEffect(() => {
        api.get("/settings/appearance").then(({ data }) => {
            document.documentElement.classList.toggle("theme-light", data?.theme === "light");
        }).catch(() => {});
    }, []);
    return null;
}

function App() {
    return (
        <ContentProvider>
            <AuthProvider>
                <div className="App">
                    <ThemeSync />
                    <BrowserRouter>
                        <Analytics />
                        <OfferBanner />
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/about" element={<AboutPage />} />
                            <Route path="/services" element={<ServicesPage />} />
                            <Route path="/portfolio" element={<PortfolioPage />} />
                            <Route path="/blog" element={<BlogPage />} />
                            <Route path="/reviews" element={<ReviewsPage />} />
                            <Route path="/contact" element={<ContactPage />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/blog/:slug" element={<BlogPost />} />
                            <Route path="/privacy" element={<LegalPage kind="privacy" />} />
                            <Route path="/terms" element={<LegalPage kind="terms" />} />
                            <Route path="/refund-policy" element={<LegalPage kind="refund" />} />
                            <Route path="/cookies" element={<LegalPage kind="cookies" />} />
                            <Route path="/medical-disclaimer" element={<LegalPage kind="medical_disclaimer" />} />
                            <Route path="/accessibility" element={<LegalPage kind="accessibility" />} />
                            <Route
                                path="/admin/*"
                                element={
                                    <ProtectedRoute requireRole="admin">
                                        <Admin />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </BrowserRouter>
                    <Toaster richColors position="top-center" theme="dark" />
                </div>
            </AuthProvider>
        </ContentProvider>
    );
}

export default App;
