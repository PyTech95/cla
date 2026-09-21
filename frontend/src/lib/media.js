const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

export function toAbs(u) {
    if (typeof u !== "string") return u;
    if (u.startsWith("/api/")) return `${BACKEND_URL}${u}`;
    return u;
}

export function isVideoFile(src) {
    return typeof src === "string" && /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|$)/i.test(src);
}

export function youtubeId(url) {
    if (typeof url !== "string") return null;
    const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return m ? m[1] : null;
}

export function vimeoId(url) {
    if (typeof url !== "string") return null;
    const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? m[1] : null;
}

// image | video | youtube | vimeo
export function mediaKind(item) {
    const src = typeof item === "string" ? item : item?.src || "";
    if (youtubeId(src)) return "youtube";
    if (vimeoId(src)) return "vimeo";
    if (item?.type === "video" || isVideoFile(src)) return "video";
    return "image";
}

export function isPlayable(item) {
    return mediaKind(item) !== "image";
}

export function embedUrl(item, autoplay = false) {
    const src = item?.src || "";
    const yt = youtubeId(src);
    if (yt) return `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1${autoplay ? "&autoplay=1&mute=1" : ""}`;
    const vm = vimeoId(src);
    if (vm) return `https://player.vimeo.com/video/${vm}?${autoplay ? "autoplay=1&muted=1" : ""}`;
    return null;
}

export function posterFor(item) {
    if (item?.poster) return toAbs(item.poster);
    const yt = youtubeId(item?.src || "");
    if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
    return null;
}

export const MAX_UPLOAD_MB = 50;
