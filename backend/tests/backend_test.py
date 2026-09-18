"""Backend API tests for Lumina Aesthetics & Wellness"""
import os
import pytest
import requests
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://beauty-reserve-155.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@luminaspa.com"
ADMIN_PASSWORD = "Lumina@2026"


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    return r.json()["access_token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---- Services ----
class TestServices:
    def test_list_services(self):
        r = requests.get(f"{API}/services")
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) >= 6
        assert all("slug" in s and "name" in s and "id" in s for s in data)

    def test_filter_by_category(self):
        r = requests.get(f"{API}/services", params={"category": "skin"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert all(s["category"] == "skin" for s in data)

    def test_filter_featured(self):
        r = requests.get(f"{API}/services", params={"featured": "true"})
        assert r.status_code == 200
        data = r.json()
        assert len(data) > 0
        assert all(s["featured"] is True for s in data)

    def test_get_service_by_slug(self):
        r = requests.get(f"{API}/services/signature-radiance-facial")
        assert r.status_code == 200
        assert r.json()["slug"] == "signature-radiance-facial"

    def test_get_service_bad_slug(self):
        r = requests.get(f"{API}/services/does-not-exist-xyz")
        assert r.status_code == 404


# ---- Bookings ----
class TestBookings:
    def test_create_booking(self):
        svc = requests.get(f"{API}/services").json()[0]
        payload = {
            "service_id": svc["id"],
            "name": "TEST_Booker",
            "email": "test_booker@example.com",
            "phone": "+15551234567",
            "date": "2026-02-15",
            "time": "10:30",
            "notes": "test",
        }
        r = requests.post(f"{API}/bookings", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "pending"
        assert data["service_name"] == svc["name"]
        assert "id" in data


# ---- Inquiries ----
class TestInquiries:
    def test_create_inquiry(self):
        payload = {"name": "TEST_Inq", "email": "test_inq@example.com", "phone": "555", "subject": "Hi", "message": "Hello"}
        r = requests.post(f"{API}/inquiries", json=payload)
        assert r.status_code == 200
        assert r.json()["status"] == "new"


# ---- Blog ----
class TestBlog:
    def test_list_blog(self):
        r = requests.get(f"{API}/blog")
        assert r.status_code == 200
        assert len(r.json()) >= 3

    def test_get_blog_by_slug(self):
        r = requests.get(f"{API}/blog/art-of-skincare-ritual")
        assert r.status_code == 200
        assert r.json()["slug"] == "art-of-skincare-ritual"

    def test_get_blog_bad_slug(self):
        r = requests.get(f"{API}/blog/nope-xyz")
        assert r.status_code == 404


# ---- Auth ----
class TestAuth:
    def test_login_success(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
        assert r.status_code == 200
        data = r.json()
        assert "access_token" in data
        assert data["user"]["email"] == ADMIN_EMAIL

    def test_login_wrong_password(self):
        r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
        assert r.status_code == 401

    def test_me_with_token(self, auth_headers):
        r = requests.get(f"{API}/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == ADMIN_EMAIL

    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401


# ---- Admin protection ----
class TestAdminProtection:
    @pytest.mark.parametrize("method,path", [
        ("get", "/admin/bookings"),
        ("get", "/admin/inquiries"),
        ("get", "/admin/stats"),
        ("post", "/admin/services"),
        ("put", "/admin/services/xyz"),
        ("delete", "/admin/services/xyz"),
        ("patch", "/admin/bookings/xyz"),
    ])
    def test_requires_auth(self, method, path):
        r = getattr(requests, method)(f"{API}{path}", json={})
        assert r.status_code == 401, f"{method.upper()} {path} should require auth, got {r.status_code}"


# ---- Admin CRUD ----
class TestAdminServicesCRUD:
    def test_full_crud(self, auth_headers):
        slug = f"test-service-{uuid.uuid4().hex[:8]}"
        payload = {"name": "TEST_Service", "slug": slug, "category": "skin", "tagline": "t", "description": "d", "duration_min": 30, "price": 50, "image": "", "benefits": ["a"], "featured": False}
        r = requests.post(f"{API}/admin/services", json=payload, headers=auth_headers)
        assert r.status_code == 200, r.text
        sid = r.json()["id"]

        # Update
        payload["name"] = "TEST_Service_Updated"
        r = requests.put(f"{API}/admin/services/{sid}", json=payload, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Service_Updated"

        # Verify persist via public GET
        r = requests.get(f"{API}/services/{slug}")
        assert r.status_code == 200
        assert r.json()["name"] == "TEST_Service_Updated"

        # Delete
        r = requests.delete(f"{API}/admin/services/{sid}", headers=auth_headers)
        assert r.status_code == 200

        # Verify gone
        r = requests.get(f"{API}/services/{slug}")
        assert r.status_code == 404


# ---- Admin booking status ----
class TestAdminBookingStatus:
    def test_update_status(self, auth_headers):
        svc = requests.get(f"{API}/services").json()[0]
        b = requests.post(f"{API}/bookings", json={
            "service_id": svc["id"], "name": "TEST_Status", "email": "s@test.com",
            "phone": "1", "date": "2026-02-20", "time": "12:00", "notes": ""
        }).json()
        bid = b["id"]

        r = requests.patch(f"{API}/admin/bookings/{bid}", json={"status": "confirmed"}, headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "confirmed"

        # Invalid status
        r = requests.patch(f"{API}/admin/bookings/{bid}", json={"status": "bogus"}, headers=auth_headers)
        assert r.status_code == 400

    def test_admin_stats(self, auth_headers):
        r = requests.get(f"{API}/admin/stats", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        for key in ["services", "bookings", "pending_bookings", "inquiries"]:
            assert key in data
