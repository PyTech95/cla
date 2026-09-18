import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/context/AuthContext";
import { ContentProvider } from "@/context/ContentContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import OfferBanner from "@/components/OfferBanner";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Portal from "@/pages/Portal";
import Admin from "@/pages/Admin";
import Membership from "@/pages/Membership";
import CheckoutResult from "@/pages/CheckoutResult";
import LegalPage from "@/pages/LegalPage";
import Concierge from "@/components/Concierge";

function App() {
    return (
        <ContentProvider>
            <AuthProvider>
                <div className="App">
                    <BrowserRouter>
                        <OfferBanner />
                        <Routes>
                            <Route path="/" element={<Home />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/membership" element={<Membership />} />
                            <Route path="/membership/success" element={<CheckoutResult kind="membership" success />} />
                            <Route path="/membership/cancel" element={<CheckoutResult kind="membership" success={false} />} />
                            <Route path="/privacy" element={<LegalPage kind="privacy" />} />
                            <Route path="/terms" element={<LegalPage kind="terms" />} />
                            <Route path="/refund-policy" element={<LegalPage kind="refund" />} />
                            <Route path="/cookies" element={<LegalPage kind="cookies" />} />
                            <Route path="/medical-disclaimer" element={<LegalPage kind="medical_disclaimer" />} />
                            <Route path="/accessibility" element={<LegalPage kind="accessibility" />} />
                            <Route path="/contact" element={<LegalPage kind="contact" />} />
                            <Route
                                path="/portal"
                                element={
                                    <ProtectedRoute>
                                        <Portal />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/admin"
                                element={
                                    <ProtectedRoute requireRole="admin">
                                        <Admin />
                                    </ProtectedRoute>
                                }
                            />
                        </Routes>
                    </BrowserRouter>
                    <Toaster richColors position="top-center" />
                    <Concierge />
                </div>
            </AuthProvider>
        </ContentProvider>
    );
}

export default App;
