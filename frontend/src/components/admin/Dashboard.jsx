import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Users, Inbox, Images, PenSquare, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import api from "@/lib/api";
import { PageHeader, Card, Pill, Empty } from "@/components/admin/ui";

const GOLD = "#D4AF37";
const tipStyle = { contentStyle: { background: "#151515", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }, labelStyle: { color: "#EEDEA8" }, itemStyle: { color: "#F4EFE4" } };
const shortDay = (d) => { const x = new Date(d + "T00:00:00"); return `${x.getDate()}/${x.getMonth() + 1}`; };

function Stat({ icon: Icon, label, value, sub, to, testId }) {
    const inner = (
        <Card className="p-5 h-full hover:border-gold/40 transition-colors" data-testid={testId}>
            <div className="flex items-center justify-between">
                <span className="w-9 h-9 rounded-xl bg-gold/10 text-gold flex items-center justify-center"><Icon className="w-4 h-4" /></span>
                {to && <ArrowUpRight className="w-4 h-4 text-bone/30" />}
            </div>
            <p className="font-serif text-3xl mt-4 text-bone">{value}</p>
            <p className="text-[11px] uppercase tracking-[0.22em] text-bone/50 mt-1">{label}</p>
            {sub && <p className="text-xs text-bone/40 mt-1">{sub}</p>}
        </Card>
    );
    return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [days, setDays] = useState(30);
    const [err, setErr] = useState(false);

    useEffect(() => {
        api.get(`/admin/stats?days=${days}`).then(({ data }) => setStats(data)).catch(() => setErr(true));
    }, [days]);

    if (err) return <Empty>Could not load dashboard data.</Empty>;
    if (!stats) return <Empty>Loading…</Empty>;
    const T = stats.totals;

    return (
        <div data-testid="admin-dashboard">
            <PageHeader title="Dashboard" sub="Website traffic and inquiries at a glance.">
                <div className="flex rounded-full border border-white/10 p-1 bg-noir-2">
                    {[7, 30, 90].map((d) => (
                        <button key={d} data-testid={`range-${d}`} onClick={() => setDays(d)} className={`px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-widest ${days === d ? "bg-gold text-noir" : "text-bone/60 hover:text-bone"}`}>{d}d</button>
                    ))}
                </div>
            </PageHeader>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <Stat icon={Eye} label="Page views" value={T.views} sub={`${T.views_today} today`} testId="stat-views" />
                <Stat icon={Users} label="Unique visitors" value={T.visitors} sub={`last ${stats.days} days`} testId="stat-visitors" />
                <Stat icon={Inbox} label="Inquiries" value={T.inquiries} sub={`${T.inquiries_new} new · ${T.inquiries_period} this period`} to="/admin/inquiries" testId="stat-inquiries" />
                <Stat icon={Images} label="Gallery items" value={T.gallery} sub={`${T.uploads} uploaded files`} to="/admin/media" testId="stat-gallery" />
                <Stat icon={PenSquare} label="Blog posts" value={T.blog_posts} sub={`${T.offers} active offers`} to="/admin/blog" testId="stat-blog" />
            </div>

            <div className="grid lg:grid-cols-3 gap-4 mt-6">
                <Card className="p-5 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-bone/50">Website visits &amp; inquiries</p>
                        <div className="flex items-center gap-4 text-[11px] text-bone/50"><span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-gold inline-block" /> Views</span><span className="inline-flex items-center gap-1.5"><i className="w-2.5 h-2.5 rounded-full bg-bone/70 inline-block" /> Inquiries</span></div>
                    </div>
                    <div className="h-[280px]" data-testid="traffic-chart">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.series} margin={{ left: -20, right: 6, top: 6 }}>
                                <defs>
                                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={GOLD} stopOpacity={0.5} /><stop offset="100%" stopColor={GOLD} stopOpacity={0} /></linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="day" tickFormatter={shortDay} tick={{ fill: "rgba(244,239,228,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
                                <YAxis tick={{ fill: "rgba(244,239,228,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip {...tipStyle} labelFormatter={shortDay} />
                                <Area type="monotone" dataKey="views" name="Views" stroke={GOLD} strokeWidth={2} fill="url(#g1)" />
                                <Area type="monotone" dataKey="inquiries" name="Inquiries" stroke="rgba(244,239,228,0.8)" strokeWidth={2} fill="transparent" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="p-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-bone/50 mb-4">Inquiries by service</p>
                    {stats.top_interests.length === 0 ? <Empty>No inquiries yet.</Empty> : (
                        <div className="h-[280px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.top_interests} layout="vertical" margin={{ left: 0, right: 10 }}>
                                    <XAxis type="number" hide allowDecimals={false} />
                                    <YAxis type="category" dataKey="interest" width={110} tick={{ fill: "rgba(244,239,228,0.7)", fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip {...tipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                                    <Bar dataKey="count" name="Inquiries" fill={GOLD} radius={[0, 6, 6, 0]} barSize={14} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-4 mt-4">
                <Card className="p-5 lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[11px] uppercase tracking-[0.24em] text-bone/50">Latest inquiries</p>
                        <Link to="/admin/inquiries" className="text-[11px] uppercase tracking-widest text-gold hover:text-gold-light">View all</Link>
                    </div>
                    {stats.recent_leads.length === 0 ? <Empty>No inquiries yet — they will appear here as soon as someone fills the website form.</Empty> : (
                        <ul className="divide-y divide-white/[0.06]">
                            {stats.recent_leads.map((l) => (
                                <li key={l.id} className="py-3 flex items-center justify-between gap-4 text-sm">
                                    <div className="min-w-0">
                                        <p className="text-bone truncate">{l.name} <span className="text-bone/40">· {l.phone}</span></p>
                                        <p className="text-bone/45 text-xs truncate">{l.interest || "General"} · {new Date(l.created_at).toLocaleString()}</p>
                                    </div>
                                    <Pill tone={l.status === "new" ? "gold" : l.status === "converted" ? "green" : "muted"}>{l.status}</Pill>
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
                <Card className="p-5">
                    <p className="text-[11px] uppercase tracking-[0.24em] text-bone/50 mb-4">Top pages</p>
                    {stats.top_pages.length === 0 ? <Empty>No visits recorded yet.</Empty> : (
                        <ul className="space-y-3">
                            {stats.top_pages.map((p) => {
                                const max = stats.top_pages[0].count || 1;
                                return (
                                    <li key={p.path}>
                                        <div className="flex justify-between text-sm mb-1"><span className="text-bone/80 truncate">{p.path}</span><span className="text-bone/50">{p.count}</span></div>
                                        <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-gold" style={{ width: `${(p.count / max) * 100}%` }} /></div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </Card>
            </div>
        </div>
    );
}
