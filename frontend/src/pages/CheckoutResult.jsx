import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import api from "@/lib/api";

const LOGO = "https://customer-assets.emergentagent.com/job_cinthia-spa/artifacts/9tpekrrz_image.png";

export default function CheckoutResult({ kind = "booking", success = true }) {
    const [params] = useSearchParams();
    const sessionId = params.get("session_id");
    const [status, setStatus] = useState({ payment_status: success ? "pending" : "cancelled", status: success ? "open" : "expired" });
    const [polling, setPolling] = useState(success);
    const [attempts, setAttempts] = useState(0);
    const nav = useNavigate();

    useEffect(() => {
        if (!success || !sessionId) return;
        let cancelled = false;
        const poll = async (n) => {
            if (cancelled) return;
            try {
                const { data } = await api.get(`/checkout/status/${sessionId}`);
                setStatus(data);
                if (data.payment_status === "paid" || data.status === "expired" || data.payment_status === "failed") {
                    setPolling(false);
                    return;
                }
            } catch (err) {
                console.error("Checkout status poll failed:", err);
            }
            if (n >= 10) {
                setPolling(false);
                return;
            }
            setAttempts(n + 1);
            setTimeout(() => poll(n + 1), 2000);
        };
        poll(0);
        return () => { cancelled = true; };
    }, [sessionId, success]);

    const paid = status.payment_status === "paid";
    const failed = !success || status.status === "expired" || status.payment_status === "failed";

    return (
        <div className="min-h-screen bg-ivory grid place-items-center px-5 py-16">
            <div className="card-luxury p-8 sm:p-12 max-w-xl w-full text-center space-y-5">
                <img src={LOGO} alt="CLA" className="w-16 h-16 mx-auto object-contain" />
                {polling && !paid && !failed && (
                    <>
                        <Loader2 className="w-12 h-12 mx-auto text-gold-dark animate-spin" />
                        <h1 className="font-serif text-3xl">Confirming your payment…</h1>
                        <p className="text-charcoal/60">Just a moment ({attempts}/10) — we're verifying with our processor.</p>
                    </>
                )}
                {paid && (
                    <>
                        <CheckCircle2 className="w-14 h-14 mx-auto text-gold-dark" />
                        <h1 className="font-serif text-4xl">Beautifully done.</h1>
                        <p className="text-charcoal/70">
                            {kind === "membership" ? "Your membership is active." : "Your booking is confirmed."}
                            {" "}Look out for an email confirmation shortly.
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Link to={kind === "membership" ? "/portal?tab=subscription" : "/portal"} className="btn-gold rounded-full px-6 py-3 text-xs uppercase tracking-widest">Go to my portal</Link>
                            <Link to="/" className="btn-ghost-charcoal rounded-full px-6 py-3 text-xs uppercase tracking-widest">Back home</Link>
                        </div>
                    </>
                )}
                {failed && (
                    <>
                        <XCircle className="w-14 h-14 mx-auto text-destructive" />
                        <h1 className="font-serif text-3xl">Payment not completed</h1>
                        <p className="text-charcoal/65">{success ? "We couldn't confirm your payment. Please try again or contact us." : "You cancelled the checkout — your slot wasn't reserved."}</p>
                        <div className="flex gap-3 justify-center">
                            <button onClick={() => nav(kind === "membership" ? "/membership" : "/book")} className="btn-gold rounded-full px-6 py-3 text-xs uppercase tracking-widest">Try again</button>
                            <Link to="/" className="btn-ghost-charcoal rounded-full px-6 py-3 text-xs uppercase tracking-widest">Back home</Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
