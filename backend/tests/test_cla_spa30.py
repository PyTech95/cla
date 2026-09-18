"""Backend API tests for CLA Aesthetics & Wellness (cla-spa30)."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@cla-wellness.com"
ADMIN_PASSWORD = "ClaAdmin2026!"


# ---- Fixtures ----
@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="session")
def client_user():
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    payload = {"name": "TEST User", "email": email, "password": "Passw0rd!", "phone": "555-0000"}
    r = requests.post(f"{API}/auth/register", json=payload, timeout=15)
    assert r.status_code == 200, f"Register failed: {r.status_code} {r.text}"
    data = r.json()
    return {"email": email, "password": "Passw0rd!", "token": data["access_token"], "role": data.get("role"), "user": data.get("user")}


@pytest.fixture(scope="session")
def client_headers(client_user):
    return {"Authorization": f"Bearer {client_user['token']}"}


# ---- Public content endpoints ----
class TestPublicContent:
    @pytest.mark.parametrize("path", [
        "/content", "/services", "/testimonials", "/offers", "/news",
        "/gallery", "/treatments-menu", "/hero-images", "/plans",
    ])
    def test_get_public(self, path):
        r = requests.get(f"{API}{path}", timeout=15)
        assert r.status_code == 200, f"{path} => {r.status_code} {r.text[:200]}"
        # Should be JSON
        assert r.headers.get("content-type", "").startswith("application/json")


# ---- Leads ----
class TestLeads:
    def test_create_lead(self):
        payload = {"name": "TEST_Lead", "phone": "555-1234", "interest": "Botox", "contact_via": "call", "message": "hi"}
        r = requests.post(f"{API}/leads", json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data.get("ok") is True
        assert "lead" in data

    def test_list_leads_requires_auth(self):
        r = requests.get(f"{API}/leads", timeout=15)
        assert r.status_code in (401, 403)


# ---- Auth ----
class TestAuth:
    def test_login_admin(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data.get("role") == "admin"

    def test_login_bad(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"}, timeout=15)
        assert r.status_code == 401

    def test_me(self, admin_headers):
        r = requests.get(f"{API}/auth/me", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        assert r.json().get("role") == "admin"

    def test_me_no_token(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code in (401, 403)

    def test_register_and_role(self, client_user):
        assert client_user["role"] == "client"


# ---- Portal / intake ----
class TestPortal:
    def test_intake_get_empty_or_ok(self, client_headers):
        r = requests.get(f"{API}/intake/mine", headers=client_headers, timeout=15)
        assert r.status_code == 200

    def test_intake_update(self, client_headers):
        payload = {"allergies": "none", "medications": "none", "notes": "TEST intake"}
        r = requests.put(f"{API}/intake/mine", json=payload, headers=client_headers, timeout=15)
        assert r.status_code == 200, r.text
        # verify
        r2 = requests.get(f"{API}/intake/mine", headers=client_headers, timeout=15)
        assert r2.status_code == 200
        body = r2.json()
        # persisted somewhere in returned object
        combined = str(body)
        assert "TEST intake" in combined or "none" in combined

    def test_change_password(self, client_user):
        headers = {"Authorization": f"Bearer {client_user['token']}"}
        r = requests.put(
            f"{API}/auth/password",
            json={"current_password": client_user["password"], "new_password": "NewPassw0rd!"},
            headers=headers,
            timeout=15,
        )
        assert r.status_code in (200, 204), r.text
        # login with new password
        r2 = requests.post(f"{API}/auth/login", json={"email": client_user["email"], "password": "NewPassw0rd!"}, timeout=15)
        assert r2.status_code == 200
        client_user["password"] = "NewPassw0rd!"
        client_user["token"] = r2.json()["access_token"]


# ---- Admin endpoints ----
class TestAdmin:
    def test_admin_clients(self, admin_headers):
        r = requests.get(f"{API}/admin/clients", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "clients" in data or isinstance(data, list)

    def test_admin_revenue(self, admin_headers):
        r = requests.get(f"{API}/admin/revenue", headers=admin_headers, timeout=15)
        assert r.status_code == 200
        data = r.json()
        for k in ("today", "week", "month"):
            assert k in data, f"missing {k}"

    def test_admin_payments(self, admin_headers):
        r = requests.get(f"{API}/admin/payments", headers=admin_headers, timeout=15)
        assert r.status_code == 200

    def test_admin_endpoints_require_auth(self):
        for path in ("/admin/clients", "/admin/revenue", "/admin/payments"):
            r = requests.get(f"{API}{path}", timeout=15)
            assert r.status_code in (401, 403), f"{path} => {r.status_code}"

    def test_non_admin_cannot_access_admin(self, client_headers):
        r = requests.get(f"{API}/admin/clients", headers=client_headers, timeout=15)
        assert r.status_code in (401, 403)


# ---- CMS CRUD (news, offers, generic kinds) ----
class TestCMS:
    def test_news_crud(self, admin_headers):
        payload = {"title": "TEST_News", "body": "hello", "published": True}
        r = requests.post(f"{API}/admin/news", json=payload, headers=admin_headers, timeout=15)
        assert r.status_code in (200, 201), r.text
        nid = r.json().get("item", {}).get("id") or r.json().get("id")
        assert nid, r.text
        # update
        r2 = requests.put(f"{API}/admin/news/{nid}", json={**payload, "title": "TEST_News_Upd"}, headers=admin_headers, timeout=15)
        assert r2.status_code == 200
        # delete
        r3 = requests.delete(f"{API}/admin/news/{nid}", headers=admin_headers, timeout=15)
        assert r3.status_code in (200, 204)

    def test_offers_crud(self, admin_headers):
        payload = {"title": "TEST_Offer", "description": "d", "active": True}
        r = requests.post(f"{API}/admin/offers", json=payload, headers=admin_headers, timeout=15)
        assert r.status_code in (200, 201), r.text
        oid = r.json().get("item", {}).get("id") or r.json().get("id")
        assert oid
        r3 = requests.delete(f"{API}/admin/offers/{oid}", headers=admin_headers, timeout=15)
        assert r3.status_code in (200, 204)

    def test_generic_cms_list(self, admin_headers):
        r = requests.get(f"{API}/admin/cms/testimonials", headers=admin_headers, timeout=15)
        assert r.status_code == 200


# ---- Concierge chat (Emergent LLM) ----
class TestChat:
    def test_chat_reply(self):
        r = requests.post(f"{API}/chat", json={"message": "Hello, what services do you offer?", "session_id": f"test-{uuid.uuid4().hex[:8]}"}, timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        # some response text should be present
        text = data.get("reply") or data.get("message") or data.get("response") or str(data)
        assert isinstance(text, str) and len(text) > 0


# ---- Stripe membership checkout ----
class TestCheckout:
    def test_membership_checkout_creates_session(self, client_headers):
        payload = {"plan_id": "glow", "origin_url": BASE_URL}
        r = requests.post(f"{API}/checkout/membership", json=payload, headers=client_headers, timeout=30)
        assert r.status_code == 200, f"{r.status_code} {r.text[:400]}"
        data = r.json()
        assert data.get("url") or data.get("checkout_url") or data.get("session_id"), f"missing session: {data}"


# ---- Team (new) ----
class TestTeam:
    def test_get_team_default(self):
        r = requests.get(f"{API}/team", timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert "team" in data and isinstance(data["team"], list)
        assert len(data["team"]) >= 1
        # Default seeded member
        names = [t.get("name", "") for t in data["team"]]
        assert any("Cinthia" in n for n in names)

    def test_team_cms_crud(self, admin_headers):
        payload = {"name": "TEST_Member", "role": "Test Role", "image": "https://example.com/x.jpg", "bio": "TEST bio"}
        r = requests.post(f"{API}/admin/cms/team", json=payload, headers=admin_headers, timeout=15)
        assert r.status_code in (200, 201), r.text
        item = r.json().get("item") or r.json()
        tid = item.get("id")
        assert tid
        # update
        r2 = requests.put(f"{API}/admin/cms/team/{tid}", json={**payload, "role": "Updated Role"}, headers=admin_headers, timeout=15)
        assert r2.status_code == 200
        # verify via public GET
        r3 = requests.get(f"{API}/team", timeout=15)
        team = r3.json().get("team", [])
        assert any(t.get("id") == tid and t.get("role") == "Updated Role" for t in team)
        # delete
        r4 = requests.delete(f"{API}/admin/cms/team/{tid}", headers=admin_headers, timeout=15)
        assert r4.status_code in (200, 204)


# ---- Content: hero.facility_* and contact.hours (new keys) ----
class TestContentKeys:
    @pytest.mark.parametrize("key,value", [
        ("hero.facility_signature", "TEST_Step inside."),
        ("hero.facility_title", "TEST_The CLA Studio"),
        ("hero.facility_subtitle", "TEST_South Hempstead"),
        ("contact.hours_title", "TEST_Hours"),
        ("contact.hours", "Mon|10-8\nTue|10-8"),
    ])
    def test_put_and_get_content(self, admin_headers, key, value):
        r = requests.put(f"{API}/admin/content", json={"key": key, "value": value}, headers=admin_headers, timeout=15)
        assert r.status_code == 200, r.text
        # verify via GET /content
        r2 = requests.get(f"{API}/content", timeout=15)
        assert r2.status_code == 200
        blocks = r2.json()
        # /content returns dict or list; handle both
        if isinstance(blocks, dict):
            content = blocks.get("content") or blocks
        else:
            content = blocks
        # search value
        found = False
        if isinstance(content, dict):
            found = content.get(key) == value
        elif isinstance(content, list):
            found = any(b.get("key") == key and b.get("value") == value for b in content)
        assert found, f"Key {key}={value!r} not found in GET /content response: {str(content)[:300]}"


# ---- Gallery CMS with video src ----
class TestGalleryCMS:
    def test_gallery_video_item(self, admin_headers):
        payload = {"src": "https://example.com/video.mp4", "alt": "TEST video", "type": "video", "span": "h-[260px]"}
        r = requests.post(f"{API}/admin/cms/gallery", json=payload, headers=admin_headers, timeout=15)
        assert r.status_code in (200, 201), r.text
        item = r.json().get("item") or r.json()
        gid = item.get("id")
        assert gid
        # public gallery reflects
        r2 = requests.get(f"{API}/gallery", timeout=15)
        assert r2.status_code == 200
        items = r2.json().get("gallery", [])
        assert any(g.get("id") == gid for g in items)
        # cleanup
        r3 = requests.delete(f"{API}/admin/cms/gallery/{gid}", headers=admin_headers, timeout=15)
        assert r3.status_code in (200, 204)


# ---- Upload endpoint: accepts video mime, rejects unsupported ----
class TestUpload:
    def test_upload_rejects_unsupported(self, admin_headers):
        files = {"file": ("test.txt", b"hello", "text/plain")}
        r = requests.post(f"{API}/admin/upload", files=files, headers=admin_headers, timeout=15)
        assert r.status_code == 400
        # Error should mention allowed types (not just image)
        detail = r.json().get("detail", "")
        assert "video" in detail.lower() or "image" in detail.lower() or "unsupported" in detail.lower()

    def test_upload_accepts_video_mp4(self, admin_headers):
        # Tiny fake mp4 bytes (just to pass content-type check)
        files = {"file": ("test.mp4", b"\x00\x00\x00\x18ftypmp42fake", "video/mp4")}
        r = requests.post(f"{API}/admin/upload", files=files, headers=admin_headers, timeout=30)
        # Should NOT return 400 with "Unsupported"
        assert r.status_code in (200, 201), f"Video upload failed: {r.status_code} {r.text[:300]}"
        data = r.json()
        assert data.get("url") or data.get("src") or data.get("path"), f"No URL in response: {data}"

