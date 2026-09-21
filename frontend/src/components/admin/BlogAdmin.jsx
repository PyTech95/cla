import React, { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, ExternalLink, X } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { PageHeader, Card, Btn, Field, TextArea, Toggle, MediaField, Empty, Pill, MediaPreview } from "@/components/admin/ui";

const EMPTY = { title: "", slug: "", tag: "Blog", excerpt: "", cover_image_url: "", body: "", published: true };

function Editor({ initial, onClose, onSaved }) {
    const [f, setF] = useState({ ...EMPTY, ...initial });
    const [busy, setBusy] = useState(false);
    const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

    const save = async () => {
        if (!f.title.trim()) return toast.error("Title is required.");
        setBusy(true);
        try {
            if (f.id) await api.put(`/admin/blog/${f.id}`, f); else await api.post("/admin/blog", f);
            toast.success(f.id ? "Post updated." : "Post published.");
            onSaved();
        } catch (e) { toast.error(e.response?.data?.detail || "Could not save post."); }
        finally { setBusy(false); }
    };

    return (
        <Card className="p-6 space-y-5" data-testid="blog-editor">
            <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl">{f.id ? "Edit post" : "New post"}</h2>
                <button onClick={onClose} aria-label="Close" className="text-bone/50 hover:text-bone"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Title" value={f.title} onChange={set("title")} testId="blog-title" className="sm:col-span-2" />
                <Field label="Tag (e.g. Skincare, News)" value={f.tag} onChange={set("tag")} testId="blog-tag" />
                <Field label="URL slug (auto if blank)" value={f.slug} onChange={set("slug")} placeholder="my-post-title" testId="blog-slug" />
            </div>
            <TextArea label="Excerpt (shown on cards)" value={f.excerpt} onChange={set("excerpt")} rows={2} testId="blog-excerpt" />
            <MediaField label="Cover image" value={f.cover_image_url} onChange={set("cover_image_url")} allowVideo={false} testId="blog-cover" />
            <TextArea label="Content — Markdown supported: ## Heading, **bold**, *italic*, - list, [link](url), ![image](url)" value={f.body} onChange={set("body")} rows={14} testId="blog-body" />
            <div className="flex items-center justify-between pt-2">
                <Toggle label="Published (visible on website)" checked={f.published} onChange={set("published")} testId="blog-published" />
                <div className="flex gap-2">
                    <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
                    <Btn onClick={save} disabled={busy} data-testid="blog-save">{busy ? "Saving…" : "Save post"}</Btn>
                </div>
            </div>
        </Card>
    );
}

export default function BlogAdmin() {
    const [posts, setPosts] = useState([]);
    const [editing, setEditing] = useState(null);

    const load = () => api.get("/admin/blog").then(({ data }) => setPosts(data.items || [])).catch(() => toast.error("Could not load posts."));
    useEffect(() => { load(); }, []);

    const remove = async (p) => {
        if (!window.confirm(`Delete "${p.title}"?`)) return;
        try { await api.delete(`/admin/blog/${p.id}`); toast.success("Deleted."); load(); } catch { toast.error("Could not delete."); }
    };
    const togglePublish = async (p) => {
        try { await api.put(`/admin/blog/${p.id}`, { ...p, published: !p.published }); load(); } catch { toast.error("Could not update."); }
    };

    return (
        <div data-testid="admin-blog">
            <PageHeader title="Blog" sub="Write articles that appear in the Journal section and on their own pages.">
                {!editing && <Btn onClick={() => setEditing({})} data-testid="blog-new"><Plus className="w-3.5 h-3.5" /> New post</Btn>}
            </PageHeader>

            {editing && <div className="mb-8"><Editor initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} /></div>}

            {posts.length === 0 ? <Card><Empty>No posts yet. Click “New post” to write your first article.</Empty></Card> : (
                <div className="space-y-3">
                    {posts.map((p) => (
                        <Card key={p.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4" data-testid={`blog-row-${p.id}`}>
                            <div className="w-full sm:w-28 h-20 rounded-xl overflow-hidden bg-noir-3 shrink-0"><MediaPreview src={p.cover_image_url} className="w-full h-full" /></div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    {p.tag && <Pill tone="gold">{p.tag}</Pill>}
                                    <Pill tone={p.published ? "green" : "muted"}>{p.published ? "Published" : "Draft"}</Pill>
                                    <span className="text-bone/40 text-xs">{new Date(p.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="font-serif text-xl text-bone truncate">{p.title}</p>
                                <p className="text-bone/45 text-xs font-mono truncate">/blog/{p.slug}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="btn-ghost rounded-full w-9 h-9 flex items-center justify-center" aria-label="Open"><ExternalLink className="w-3.5 h-3.5" /></a>
                                <Btn variant="ghost" onClick={() => togglePublish(p)} data-testid={`blog-toggle-${p.id}`}>{p.published ? "Unpublish" : "Publish"}</Btn>
                                <Btn variant="ghost" onClick={() => { setEditing(p); window.scrollTo({ top: 0, behavior: "smooth" }); }} data-testid={`blog-edit-${p.id}`}><Pencil className="w-3.5 h-3.5" /> Edit</Btn>
                                <button onClick={() => remove(p)} data-testid={`blog-delete-${p.id}`} aria-label="Delete" className="w-9 h-9 rounded-full border border-red-500/40 text-red-300 flex items-center justify-center hover:bg-red-500/10"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
