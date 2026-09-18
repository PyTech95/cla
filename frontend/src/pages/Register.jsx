import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, formatApiErrorDetail } from "@/context/AuthContext";
import { toast } from "sonner";

const LOGO = "https://customer-assets.emergentagent.com/job_cinthia-spa/artifacts/9tpekrrz_image.png";

export default function Register() {
    const { register } = useAuth();
    const nav = useNavigate();
    const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        try {
            await register(form);
            toast.success("Welcome to CLA.");
            nav("/portal");
        } catch (e2) {
            setErr(formatApiErrorDetail(e2.response?.data?.detail) || e2.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-ivory grid lg:grid-cols-2">
            <div className="flex items-center justify-center p-8 sm:p-14 order-2 lg:order-1">
                <form onSubmit={onSubmit} data-testid="register-form" className="w-full max-w-md space-y-6">
                    <Link to="/" className="inline-flex items-center gap-3">
                        <img src={LOGO} alt="CLA" className="w-14 h-14 rounded-full" />
                        <div>
                            <p className="font-serif text-lg leading-none">CLA</p>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal/60 mt-1">Aesthetics &amp; Wellness</p>
                        </div>
                    </Link>
                    <div>
                        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal">Begin your <span className="text-shimmer">ritual</span></h1>
                        <p className="text-charcoal/65 mt-2 font-light">Create your account to book and revisit your favourite treatments.</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">Name</label>
                            <input data-testid="reg-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full bg-transparent border-b border-charcoal/20 focus:border-gold-dark py-2 outline-none font-serif text-lg" required />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">Email</label>
                            <input type="email" data-testid="reg-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-transparent border-b border-charcoal/20 focus:border-gold-dark py-2 outline-none font-serif text-lg" required />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">Phone</label>
                            <input data-testid="reg-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-transparent border-b border-charcoal/20 focus:border-gold-dark py-2 outline-none font-serif text-lg" />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">Password</label>
                            <input type="password" data-testid="reg-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full bg-transparent border-b border-charcoal/20 focus:border-gold-dark py-2 outline-none font-serif text-lg" required minLength={6} />
                        </div>
                    </div>
                    {err && <p data-testid="reg-error" className="text-destructive text-sm">{err}</p>}
                    <button data-testid="reg-submit" type="submit" disabled={loading} className="btn-gold w-full rounded-full py-3.5 text-xs uppercase tracking-[0.32em] disabled:opacity-60">
                        {loading ? "Creating…" : "Create account"}
                    </button>
                    <p className="text-sm text-charcoal/65">
                        Already have an account?{" "}
                        <Link to="/login" data-testid="link-login" className="text-gold-dark hover:underline">Sign in</Link>
                    </p>
                </form>
            </div>
            <div className="hidden lg:block relative order-1 lg:order-2">
                <img src="https://images.unsplash.com/photo-1583416750470-965b2707b355?auto=format&fit=crop&w=1400&q=80" alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-bl from-charcoal/40 via-transparent to-gold/10" />
                <div className="absolute bottom-10 right-10 text-ivory max-w-md text-right">
                    <p className="font-script text-5xl text-gold-light">Quiet luxury,</p>
                    <p className="font-serif text-3xl mt-2">made personal.</p>
                </div>
            </div>
        </div>
    );
}
