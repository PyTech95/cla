import React, { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

const DISMISS_KEY = "cla_pwa_dismissed";
const DISMISS_DAYS = 7;

export default function PWAInstallPrompt() {
    const [evt, setEvt] = useState(null);
    const [show, setShow] = useState(false);
    const [iosHint, setIosHint] = useState(false);

    useEffect(() => {
        try {
            const d = localStorage.getItem(DISMISS_KEY);
            if (d && Date.now() - Number(d) < DISMISS_DAYS * 86400000) return;
        } catch (e) { /* ignore */ }

        const standalone =
            (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
            window.navigator.standalone === true;
        if (standalone) return;

        const ua = window.navigator.userAgent || "";
        const isIOS = /iphone|ipad|ipod/i.test(ua);
        const isSafari = /safari/i.test(ua) && !/crios|fxios|android|edg/i.test(ua);

        const handler = (e) => {
            e.preventDefault();
            setEvt(e);
            setShow(true);
        };
        window.addEventListener("beforeinstallprompt", handler);

        let timer;
        if (isIOS && isSafari) {
            timer = setTimeout(() => { setIosHint(true); setShow(true); }, 4000);
        }
        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            if (timer) clearTimeout(timer);
        };
    }, []);

    const dismiss = () => {
        setShow(false);
        try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) { /* ignore */ }
    };

    const install = async () => {
        if (!evt) return;
        evt.prompt();
        try { await evt.userChoice; } catch (e) { /* ignore */ }
        dismiss();
    };

    if (!show) return null;

    return (
        <div
            data-testid="pwa-install-card"
            className="fixed z-[10001] left-3 right-3 bottom-28 sm:left-6 sm:right-auto sm:bottom-6 sm:max-w-sm bg-ivory border border-gold/40 rounded-2xl shadow-2xl p-4 flex items-center gap-3 animate-[menuIn_.5s_both]"
        >
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-gold to-gold-dark text-charcoal flex items-center justify-center font-serif text-lg shrink-0 shadow-inner">
                CLA
            </span>
            <div className="flex-1 min-w-0">
                <p className="font-serif text-lg text-charcoal leading-tight">Add CLA to your phone</p>
                <p className="text-xs text-charcoal/60 mt-0.5 leading-snug">
                    {iosHint ? (
                        <>Tap <Share className="inline w-3.5 h-3.5 -mt-0.5" /> then &ldquo;Add to Home Screen&rdquo;</>
                    ) : (
                        "Install our app for one-tap booking."
                    )}
                </p>
            </div>
            {!iosHint && (
                <button
                    data-testid="pwa-install"
                    onClick={install}
                    className="btn-gold rounded-full px-4 py-2 text-[11px] uppercase tracking-widest inline-flex items-center gap-1.5 shrink-0"
                >
                    <Download className="w-3.5 h-3.5" /> Install
                </button>
            )}
            <button
                data-testid="pwa-dismiss"
                onClick={dismiss}
                aria-label="Dismiss install prompt"
                className="text-charcoal/40 hover:text-charcoal transition-colors shrink-0"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
}
