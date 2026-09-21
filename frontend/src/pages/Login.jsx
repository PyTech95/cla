import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";
import { useAuth, formatApiErrorDetail } from "@/context/AuthContext";
import { useContent, t } from "@/context/ContentContext";
import { toast } from "sonner";

export default function Login() {
    const { login } = useAuth();
    const { content } = useContent();
    const nav = useNavigate();
    const loc = useLocation();
    const [form, setForm] = useState({ email: "", password: "" });
    const [err, setErr] = useState("");
    const [loading, setLoading] = useState(false);
    const LOGO = t(content, "brand.logo_url", "");

    const onSubmit = async (e) => {
        e.preventDefault();
        setErr("");
        setLoading(true);
        try {
            const user = await login(form.email, form.password);
            if (user.role !== "admin") {
                setErr("This account does not have admin access.");
                return;
            }
            toast.success("Welcome back.");
            nav(loc.state?.from?.startsWith("/admin") ? loc.state.from : "/admin");
        } catch (e2) {
            setErr(formatApiErrorDetail(e2.response?.data?.detail) || e2.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-noir text-bone flex items-center justify-center p-6 relative overflow-hidden">
            <div aria-hidden className="absolute -top-32 -right-32 w-[34rem] h-[34rem] rounded-full bg-gold/10 blur-[140px]" />
            <div aria-hidden className="absolute -bottom-40 -left-20 w-[28rem] h-[28rem] rounded-full bg-gold/5 blur-[120px]" />
            <form onSubmit={onSubmit} data-testid="login-form" className="relative w-full max-w-md card-dark p-8 sm:p-10 space-y-7">
                <Link to="/" className="inline-flex items-center gap-2 text-[11px] uppercase tracking-widest text-bone/50 hover:text-gold"><ArrowLeft className="w-3.5 h-3.5" /> Back to website</Link>
                <div className="flex items-center gap-4">
                    {LOGO && <img src={LOGO} alt="CLA" className="w-16 h-16 object-contain" />}
                    <div>
                        <p className="eyebrow">Admin panel</p>
                        <h1 className="font-serif text-3xl sm:text-4xl mt-1">Sign <span className="text-shimmer">in</span></h1>
                    </div>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.28em] text-bone/50 mb-2">Email</label>
                        <input type="email" data-testid="login-email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" required autoComplete="username" />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase tracking-[0.28em] text-bone/50 mb-2">Password</label>
                        <input type="password" data-testid="login-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="field" required autoComplete="current-password" />
                    </div>
                </div>
                {err && <p data-testid="login-error" className="text-destructive text-sm">{err}</p>}
                <button type="submit" data-testid="login-submit" disabled={loading} className="btn-gold w-full rounded-full py-3.5 text-xs uppercase tracking-[0.32em] inline-flex items-center justify-center gap-2 disabled:opacity-60">
                    <Lock className="w-3.5 h-3.5" /> {loading ? "Signing in…" : "Sign in"}
                </button>
            </form>
        </div>
    );
}
