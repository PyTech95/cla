import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const ACCESS_KEY = "cla_access_token";
const REFRESH_KEY = "cla_refresh_token";

export function getAccessToken() {
    try { return localStorage.getItem(ACCESS_KEY); } catch { return null; }
}
export function getRefreshToken() {
    try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
}
export function setAuthTokens(access, refresh) {
    try {
        if (access) localStorage.setItem(ACCESS_KEY, access);
        if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    } catch { /* localStorage unavailable */ }
}
export function clearAuthTokens() {
    try {
        localStorage.removeItem(ACCESS_KEY);
        localStorage.removeItem(REFRESH_KEY);
    } catch { /* localStorage unavailable */ }
}

const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true, // keep cookie support as fallback for same-domain
});

// Attach Bearer token to every request (primary auth for Safari/Mac where 3P cookies are blocked)
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers = config.headers || {};
        if (!config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

// On 401, try refresh once then replay
let refreshing = null;
api.interceptors.response.use(
    (r) => r,
    async (error) => {
        const original = error.config || {};
        const status = error.response?.status;
        const url = original.url || "";
        const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/register") || url.includes("/auth/refresh") || url.includes("/auth/logout");
        if (status !== 401 || original._retried || isAuthEndpoint) {
            return Promise.reject(error);
        }
        const refresh = getRefreshToken();
        if (!refresh) return Promise.reject(error);

        try {
            if (!refreshing) {
                refreshing = axios.post(
                    `${API_BASE}/auth/refresh`,
                    { refresh_token: refresh },
                    { withCredentials: true, headers: { Authorization: `Bearer ${refresh}` } }
                ).finally(() => { /* keep promise until consumers handle */ });
            }
            const { data } = await refreshing;
            refreshing = null;
            if (data?.access_token) setAuthTokens(data.access_token, data.refresh_token || refresh);
            original._retried = true;
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${getAccessToken()}`;
            return api(original);
        } catch (e) {
            refreshing = null;
            clearAuthTokens();
            return Promise.reject(error);
        }
    }
);

export default api;

export function formatApiErrorDetail(detail) {
    if (detail == null) return "Something went wrong. Please try again.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail
            .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
            .filter(Boolean)
            .join(" ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
}
