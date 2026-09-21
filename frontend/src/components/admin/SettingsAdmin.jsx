import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageHeader, Card, Btn, Field, Toggle } from "@/components/admin/ui";

function Smtp() {
    const [s, setS] = useState({ host: "smtp.gmail.com", port: 587, username: "", app_password: "", from_name: "CLA Aesthetics & Wellness", from_email: "", recipients: "", enabled: false });
    const [pwSet, setPwSet] = useState(false);
    const set = (k) => (v) => setS((x) => ({ ...x, [k]: v }));

    useEffect(() => {
        api.get("/admin/settings/smtp").then(({ data }) => {
            setS((x) => ({ ...x, ...data, app_password: "", recipients: (data.recipients || []).join(", ") }));
            setPwSet(!!data.app_password_set);
        }).catch(() => {});
    }, []);

    const save = async () => {
        try {
            await api.put("/admin/settings/smtp", { ...s, port: Number(s.port) || 587, recipients: String(s.recipients).split(",").map((x) => x.trim()).filter(Boolean) });
            toast.success("Email settings saved.");
            if (s.app_password) setPwSet(true);
            setS((x) => ({ ...x, app_password: "" }));
        } catch { toast.error("Could not save."); }
    };
    const test = async () => {
        try { await api.post("/admin/settings/smtp/test"); toast.success("Test email sent."); }
        catch (e) { toast.error(e.response?.data?.detail || "Test failed."); }
    };

    return (
        <Card className="p-6 space-y-5" data-testid="settings-smtp">
            <div><h2 className="font-serif text-2xl">Inquiry email notifications</h2><p className="text-bone/50 text-sm mt-1">Get an email every time someone sends an inquiry. With Gmail, create an App Password (16 characters).</p></div>
            <div className="grid sm:grid-cols-2 gap-4">
                <Field label="SMTP host" value={s.host} onChange={set("host")} />
                <Field label="Port" type="number" value={s.port} onChange={set("port")} />
                <Field label="Username (sender email)" value={s.username} onChange={set("username")} />
                <Field label={`App password ${pwSet ? "(saved — leave blank to keep)" : ""}`} type="password" value={s.app_password} onChange={set("app_password")} />
                <Field label="From name" value={s.from_name} onChange={set("from_name")} />
                <Field label="From email" value={s.from_email} onChange={set("from_email")} />
                <Field label="Send notifications to (comma-separated)" value={s.recipients} onChange={set("recipients")} className="sm:col-span-2" />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <Toggle label="Enabled" checked={s.enabled} onChange={set("enabled")} testId="smtp-enabled" />
                <div className="flex gap-2"><Btn variant="ghost" onClick={test}>Send test email</Btn><Btn onClick={save} data-testid="smtp-save">Save</Btn></div>
            </div>
        </Card>
    );
}

function Password() {
    const [f, setF] = useState({ current: "", next: "", confirm: "" });
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        if (f.next.length < 6) return toast.error("New password must be at least 6 characters.");
        if (f.next !== f.confirm) return toast.error("Passwords don't match.");
        setBusy(true);
        try { await api.put("/auth/password", { current_password: f.current, new_password: f.next }); toast.success("Password updated."); setF({ current: "", next: "", confirm: "" }); }
        catch (err) { toast.error(err.response?.data?.detail || "Could not update password."); }
        finally { setBusy(false); }
    };
    return (
        <Card className="p-6" data-testid="settings-password">
            <h2 className="font-serif text-2xl mb-1">Change admin password</h2>
            <p className="text-bone/50 text-sm mb-5">You'll stay signed in on this device.</p>
            <form onSubmit={submit} className="grid sm:grid-cols-3 gap-4" data-testid="change-password-form">
                <Field label="Current password" type="password" value={f.current} onChange={(v) => setF({ ...f, current: v })} testId="pw-current" />
                <Field label="New password" type="password" value={f.next} onChange={(v) => setF({ ...f, next: v })} testId="pw-next" />
                <Field label="Confirm new password" type="password" value={f.confirm} onChange={(v) => setF({ ...f, confirm: v })} testId="pw-confirm" />
                <div className="sm:col-span-3 flex justify-end"><Btn type="submit" disabled={busy} data-testid="change-password-submit">{busy ? "Updating…" : "Update password"}</Btn></div>
            </form>
        </Card>
    );
}

export default function SettingsAdmin() {
    return (
        <div data-testid="admin-settings" className="space-y-6 max-w-4xl">
            <PageHeader title="Settings" sub="Notifications and account security." />
            <Smtp />
            <Password />
        </div>
    );
}
