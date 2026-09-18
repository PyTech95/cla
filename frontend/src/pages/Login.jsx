import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth, formatApiErrorDetail } from "@/context/AuthContext";
import { toast } from "sonner";

const LOGO = "https://customer-assets.emergentagent.com/job_cinthia-spa/artifacts/9tpekrrz_image.png";

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const loc = useLocation();
    const [form, setForm] = useState({ email: "", password: "" });
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            toast.success("Welcome back.");
            const dest = loc.state?.from || (user.role === "admin" ? "/admin" : "/portal");
            nav(dest);
        } catch (e2) {
            setErr(formatApiErrorDetail(e2.response?.data?.detail) || e2.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-ivory grid lg:grid-cols-2">
            <div className="hidden lg:block relative">
                <img src="https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1400&q=80" alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-br from-charcoal/40 via-transparent to-gold/10" />
                <div className="absolute bottom-10 left-10 text-ivory max-w-md">
                    <p className="font-script text-5xl text-gold-light">Welcome back,</p>
                    <p className="font-serif text-3xl mt-2">your ritual awaits.</p>
                </div>
            </div>
            <div className="flex items-center justify-center p-8 sm:p-14">
                <form onSubmit={onSubmit} data-testid="login-form" className="w-full max-w-md space-y-7">
                    <Link to="/" className="inline-flex items-center gap-3">
                        <img src={LOGO} alt="CLA" className="w-14 h-14 rounded-full" />
                        <div>
                            <p className="font-serif text-lg leading-none">CLA</p>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-charcoal/60 mt-1">Aesthetics &amp; Wellness</p>
                        </div>
                    </Link>
                    <div>
                        <h1 className="font-serif text-4xl sm:text-5xl text-charcoal">Sign <span className="text-shimmer">in</span></h1>
                        <p className="text-charcoal/65 mt-2 font-light">Manage bookings, history and your private notes.</p>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">Email</label>
                            <input
                                type="email"
                                data-testid="login-email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                className="w-full bg-transparent border-b border-charcoal/20 focus:border-gold-dark py-2 outline-none font-serif text-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-[11px] uppercase tracking-[0.28em] text-charcoal/55 mb-2">Password</label>
                            <input
                                type="password"
                                data-testid="login-password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                className="w-full bg-transparent border-b border-charcoal/20 focus:border-gold-dark py-2 outline-none font-serif text-lg"
                                required
                            />
                        </div>
                    </div>
                    {err && <p data-testid="login-error" className="text-destructive text-sm">{err}</p>}
                    <button type="submit" data-testid="login-submit" disabled={loading} className="btn-gold w-full rounded-full py-3.5 text-xs uppercase tracking-[0.32em] disabled:opacity-60">
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                    <p className="text-sm text-charcoal/65">
                        New here?{" "}
                        <Link to="/register" data-testid="link-register" className="text-gold-dark hover:underline">Create an account</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
