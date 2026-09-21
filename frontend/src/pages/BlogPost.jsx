import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { toAbs } from "@/lib/media";
import { SubpageHeader } from "@/pages/LegalPage";
import { fmtDate } from "@/components/sections/Blog";
import Footer from "@/components/sections/Footer";

// Minimal, safe markdown → React (headings, bold, italics, links, lists, images, paragraphs)
function inline(text, key) {
    const out = [];
    const re = /(\*\*[^*]+\*\*|\*[^*]+\*|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\))/g;
    let last = 0, m, i = 0;
    while ((m = re.exec(text)) !== null) {
        if (m.index > last) out.push(text.slice(last, m.index));
        const tok = m[0];
        if (tok.startsWith("**")) out.push(<strong key={`${key}-${i++}`}>{tok.slice(2, -2)}</strong>);
        else if (tok.startsWith("![")) { const [, alt, src] = tok.match(/!\[([^\]]*)\]\(([^)]+)\)/); out.push(<img key={`${key}-${i++}`} src={toAbs(src)} alt={alt} />); }
        else if (tok.startsWith("[")) { const [, label, href] = tok.match(/\[([^\]]+)\]\(([^)]+)\)/); out.push(<a key={`${key}-${i++}`} href={href} target="_blank" rel="noreferrer">{label}</a>); }
        else out.push(<em key={`${key}-${i++}`}>{tok.slice(1, -1)}</em>);
        last = m.index + tok.length;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
}

export function renderMarkdown(md) {
    const blocks = String(md || "").split(/\n\s*\n/);
    return blocks.map((block, bi) => {
        const lines = block.split("\n");
        if (/^#{1,3}\s/.test(lines[0])) {
            const level = lines[0].match(/^(#{1,3})/)[1].length;
            const Tag = level === 1 ? "h2" : level === 2 ? "h2" : "h3";
            return <Tag key={bi}>{inline(lines[0].replace(/^#{1,3}\s/, ""), bi)}</Tag>;
        }
        if (lines.every((l) => /^\s*[-*•]\s/.test(l))) {
            return <ul key={bi}>{lines.map((l, li) => <li key={li}>{inline(l.replace(/^\s*[-*•]\s/, ""), `${bi}-${li}`)}</li>)}</ul>;
        }
        return <p key={bi}>{lines.map((l, li) => <React.Fragment key={li}>{inline(l, `${bi}-${li}`)}{li < lines.length - 1 && <br />}</React.Fragment>)}</p>;
    });
}

export default function BlogPost() {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [more, setMore] = useState([]);
    const [missing, setMissing] = useState(false);

    useEffect(() => {
        setPost(null); setMissing(false);
        api.get(`/blog/${slug}`).then(({ data }) => setPost(data)).catch(() => setMissing(true));
        api.get("/blog").then(({ data }) => setMore((data.items || []).filter((x) => x.slug !== slug).slice(0, 3))).catch(() => {});
        window.scrollTo({ top: 0 });
    }, [slug]);

    return (
        <div className="min-h-screen bg-noir text-bone">
            <SubpageHeader title="Journal" />
            <main className="wrap max-w-3xl py-12 sm:py-16" data-testid="blog-post-page">
                {missing && (
                    <div className="text-center py-20">
                        <p className="font-serif text-3xl">Post not found.</p>
                        <Link to="/" className="btn-ghost rounded-full px-6 py-3 text-xs uppercase tracking-widest inline-flex items-center gap-2 mt-6"><ArrowLeft className="w-4 h-4" /> Back home</Link>
                    </div>
                )}
                {post && (
                    <article>
                        <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] mb-4">
                            {post.tag && <span className="text-gold border border-gold/40 rounded-full px-2.5 py-0.5">{post.tag}</span>}
                            <span className="text-bone/45">{fmtDate(post.created_at)}</span>
                        </div>
                        <h1 data-testid="blog-post-title" className="font-serif text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">{post.title}</h1>
                        {post.excerpt && <p className="text-bone/65 text-lg mt-5 font-light leading-relaxed">{post.excerpt}</p>}
                        {post.cover_image_url && <img src={toAbs(post.cover_image_url)} alt={post.title} className="w-full max-h-[520px] object-cover rounded-[22px] border border-white/10 mt-8" />}
                        <div className="gold-divider my-10" />
                        <div className="prose-dark text-[16px]" data-testid="blog-post-body">{renderMarkdown(post.body)}</div>
                    </article>
                )}
                {more.length > 0 && (
                    <div className="mt-20 pt-10 border-t border-white/10">
                        <p className="eyebrow mb-6">More from the journal</p>
                        <div className="grid sm:grid-cols-3 gap-4">
                            {more.map((n) => (
                                <Link key={n.id} to={`/blog/${n.slug}`} className="card-dark p-5 group">
                                    <p className="font-serif text-lg leading-snug group-hover:text-gold-light transition-colors">{n.title}</p>
                                    <span className="mt-3 text-[10px] uppercase tracking-[0.24em] text-gold inline-flex items-center gap-1">Read <ArrowRight className="w-3 h-3" /></span>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
