"""CLA Aesthetics backend regression tests (fresh redesign)."""
import io
import os
import time
import uuid

import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") if os.environ.get("REACT_APP_BACKEND_URL") else None
if not BASE_URL:
    # fallback to reading frontend .env directly
    from pathlib import Path
    env_path = Path(__file__).resolve().parents[2] / "frontend" / ".env"
    for line in env_path.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip().rstrip("/")

API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@cla-wellness.com"
ADMIN_PASSWORD = "ClaAdmin2026!"


# ---------- Fixtures ----------
@pytest.fixture(scope="session")
def s():
    return requests.Session()


@pytest.fixture(scope="session")
def admin_headers(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    assert "access_token" in data
    return {"Authorization": f"Bearer {data['access_token']}"}


# ---------- Auth ----------
class TestAuth:
    def test_login_success(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        d = r.json()
        assert d["role"] == "admin"
        assert d["access_token"]

    def test_login_bad(self, s):
        r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code in (401, 429)

    def test_me(self, s, admin_headers):
        r = s.get(f"{API}/auth/me", headers=admin_headers)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_register_removed(self, s):
        r = s.post(f"{API}/auth/register", json={"email": "x@y.com", "password": "abc12345"})
        assert r.status_code in (404, 405)


# ---------- Removed endpoints ----------
class TestRemovedEndpoints:
    @pytest.mark.parametrize("path", ["/chat", "/checkout/membership", "/plans", "/payments", "/subscriptions/mine"])
    def test_gone(self, s, path):
        r = s.get(f"{API}{path}")
        r2 = s.post(f"{API}{path}", json={})
        assert r.status_code in (404, 405) and r2.status_code in (404, 405), f"{path}: GET={r.status_code} POST={r2.status_code}"

    def test_plans_cms_kind_404(self, s, admin_headers):
        r = s.get(f"{API}/admin/cms/plans", headers=admin_headers)
        assert r.status_code == 404


# ---------- Leads ----------
class TestLeads:
    def test_lead_lifecycle(self, s, admin_headers):
        payload = {
            "name": "TEST_Playwright User",
            "phone": "+15550001111",
            "email": "test_playwright@example.com",
            "interest": "Botox",
            "contact_via": "call",
            "message": "Testing inquiry flow",
        }
        r = s.post(f"{API}/leads", json=payload)
        assert r.status_code == 200, r.text
        lead = r.json()["lead"]
        lead_id = lead["id"]
        assert lead["status"] == "new"
        assert lead["name"] == payload["name"]

        # list
        r = s.get(f"{API}/leads", headers=admin_headers)
        assert r.status_code == 200
        ids = [x["id"] for x in r.json()["leads"]]
        assert lead_id in ids

        # unauth listing (fresh session, no cookies)
        r = requests.get(f"{API}/leads")
        assert r.status_code == 401

        # patch
        r = s.patch(f"{API}/leads/{lead_id}?status=contacted", headers=admin_headers)
        assert r.status_code == 200

        r = s.patch(f"{API}/leads/{lead_id}?status=bogus", headers=admin_headers)
        assert r.status_code == 400

        # delete
        r = s.delete(f"{API}/leads/{lead_id}", headers=admin_headers)
        assert r.status_code == 200


# ---------- Track & Stats ----------
class TestAnalytics:
    def test_track_and_stats(self, s, admin_headers):
        vid = f"TEST_{uuid.uuid4().hex[:10]}"
        r = s.post(f"{API}/track", json={"path": "/test-path", "visitor_id": vid})
        assert r.status_code == 200

        r = s.get(f"{API}/admin/stats?days=7", headers=admin_headers)
        assert r.status_code == 200
        d = r.json()
        assert d["days"] == 7
        assert len(d["series"]) == 7
        for k in ("views", "visitors", "inquiries", "gallery", "blog_posts", "uploads"):
            assert k in d["totals"], k
        assert isinstance(d["lead_status"], list)
        assert isinstance(d["top_pages"], list)
        assert isinstance(d["top_interests"], list)
        assert isinstance(d["recent_leads"], list)


# ---------- Blog ----------
class TestBlog:
    def test_blog_crud(self, s, admin_headers):
        title = f"TEST_Blog_{uuid.uuid4().hex[:6]}"
        r = s.post(f"{API}/admin/blog", headers=admin_headers, json={
            "title": title, "excerpt": "e", "body": "## Hello\n**bold**\n- one", "tag": "Skin", "published": True
        })
        assert r.status_code == 200
        post = r.json()["item"]
        slug = post["slug"]
        pid = post["id"]

        # duplicate title -> unique slug
        r2 = s.post(f"{API}/admin/blog", headers=admin_headers, json={"title": title, "body": "b", "published": True})
        assert r2.status_code == 200
        assert r2.json()["item"]["slug"] != slug

        # public list (no body)
        r = s.get(f"{API}/blog")
        assert r.status_code == 200
        items = r.json()["items"]
        assert any(i["slug"] == slug for i in items)
        assert all("body" not in i for i in items)

        # public get
        r = s.get(f"{API}/blog/{slug}")
        assert r.status_code == 200
        assert r.json()["title"] == title

        # unpublish -> public 404
        r = s.put(f"{API}/admin/blog/{pid}", headers=admin_headers, json={
            "title": title, "excerpt": "e", "body": "b", "tag": "Skin", "published": False
        })
        assert r.status_code == 200
        new_slug = r.json()["slug"]
        r = s.get(f"{API}/blog/{new_slug}")
        assert r.status_code == 404

        # delete both
        s.delete(f"{API}/admin/blog/{pid}", headers=admin_headers)
        s.delete(f"{API}/admin/blog/{r2.json()['item']['id']}", headers=admin_headers)


# ---------- CMS ----------
class TestCms:
    @pytest.mark.parametrize("kind", ["gallery", "hero_images", "treatments_menu", "team", "testimonials"])
    def test_cms_crud(self, s, admin_headers, kind):
        r = s.get(f"{API}/admin/cms/{kind}", headers=admin_headers)
        assert r.status_code == 200
        # add
        new_item = {"name": f"TEST_{kind}", "order": 999, "src": "https://x/y.jpg", "alt": "a", "text": "t", "rating": 5, "role": "role", "image": "https://x/y.jpg", "category": "luxury", "price": "$1"}
        r = s.post(f"{API}/admin/cms/{kind}", headers=admin_headers, json=new_item)
        assert r.status_code == 200
        item_id = r.json()["item"]["id"]
        # update
        updated = dict(new_item); updated["name"] = f"TEST_{kind}_upd"
        r = s.put(f"{API}/admin/cms/{kind}/{item_id}", headers=admin_headers, json=updated)
        assert r.status_code == 200
        # reorder (single id)
        r = s.post(f"{API}/admin/cms/{kind}/reorder", headers=admin_headers, json={"ordered_ids": [item_id]})
        assert r.status_code == 200
        # delete
        r = s.delete(f"{API}/admin/cms/{kind}/{item_id}", headers=admin_headers)
        assert r.status_code == 200

    @pytest.mark.parametrize("path", ["/gallery", "/hero-images", "/treatments-menu", "/team", "/testimonials"])
    def test_public_cms(self, s, path):
        r = s.get(f"{API}{path}")
        assert r.status_code == 200


# ---------- Upload ----------
class TestUpload:
    def test_upload_and_serve(self, s, admin_headers):
        # Tiny PNG (1x1)
        png = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c626001000000050001a5f645400000000049454e44ae426082")
        files = {"file": ("t.png", png, "image/png")}
        r = s.post(f"{API}/admin/upload", headers=admin_headers, files=files)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["url"].startswith("/api/uploads/")
        # serve
        r = s.get(f"{BASE_URL}{d['url']}")
        assert r.status_code == 200
        # list & delete
        r = s.get(f"{API}/admin/uploads", headers=admin_headers)
        assert r.status_code == 200
        items = r.json()["items"]
        my = [x for x in items if x["storage_path"] == d["path"]]
        assert my
        fid = my[0]["id"]
        r = s.delete(f"{API}/admin/uploads/{fid}", headers=admin_headers)
        assert r.status_code == 200

    def test_upload_bad_type(self, s, admin_headers):
        files = {"file": ("t.txt", b"hello", "text/plain")}
        r = s.post(f"{API}/admin/upload", headers=admin_headers, files=files)
        assert r.status_code == 400


# ---------- Offers ----------
class TestOffers:
    def test_offer_crud_and_public(self, s, admin_headers):
        r = s.post(f"{API}/admin/offers", headers=admin_headers, json={
            "title": "TEST_Offer", "description": "d", "active": True, "show_banner": True
        })
        assert r.status_code == 200
        oid = r.json()["item"]["id"]
        r = s.get(f"{API}/offers")
        assert r.status_code == 200
        assert any(x["id"] == oid for x in r.json()["items"])
        r = s.get(f"{API}/offers/banner")
        assert r.status_code == 200
        r = s.delete(f"{API}/admin/offers/{oid}", headers=admin_headers)
        assert r.status_code == 200


# ---------- Content ----------
class TestContent:
    def test_content_keys(self, s, admin_headers):
        r = s.get(f"{API}/content")
        assert r.status_code == 200
        d = r.json()
        assert "blog.eyebrow" in d
        assert "blog.title" in d

        # upsert
        r = s.put(f"{API}/admin/content", headers=admin_headers, json={"key": "test.key", "value": "TEST_VALUE"})
        assert r.status_code == 200
        r = s.get(f"{API}/content")
        assert r.json().get("test.key") == "TEST_VALUE"


# ---------- SMTP ----------
class TestSmtp:
    def test_smtp_settings(self, s, admin_headers):
        r = s.get(f"{API}/admin/settings/smtp", headers=admin_headers)
        assert r.status_code == 200
        r = s.put(f"{API}/admin/settings/smtp", headers=admin_headers, json={
            "host": "smtp.gmail.com", "port": 587, "username": "", "app_password": "",
            "from_name": "CLA", "from_email": "", "recipients": [], "enabled": False
        })
        assert r.status_code == 200
        r = s.post(f"{API}/admin/settings/smtp/test", headers=admin_headers)
        assert r.status_code == 400  # not enabled
