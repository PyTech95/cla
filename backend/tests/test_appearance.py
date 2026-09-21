"""Tests for the site appearance (theme) admin feature."""
import os
import pytest
import requests
from pathlib import Path

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    env_path = Path(__file__).resolve().parents[2] / "frontend" / ".env"
    for line in env_path.read_text().splitlines():
        if line.startswith("REACT_APP_BACKEND_URL="):
            BASE_URL = line.split("=", 1)[1].strip()
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@cla-aesthetics.com"
ADMIN_PASSWORD = "JAiXcb4UuHxSYinW"


@pytest.fixture(scope="module")
def admin_headers():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


class TestAppearance:
    def test_get_appearance_public(self):
        r = requests.get(f"{API}/settings/appearance")
        assert r.status_code == 200
        data = r.json()
        assert "theme" in data
        assert data["theme"] in ("dark", "light")

    def test_put_requires_auth(self):
        r = requests.put(f"{API}/admin/settings/appearance", json={"theme": "dark"})
        assert r.status_code in (401, 403)

    def test_put_dark_then_light_persists(self, admin_headers):
        # set dark
        r = requests.put(f"{API}/admin/settings/appearance", headers=admin_headers, json={"theme": "dark"})
        assert r.status_code == 200
        assert r.json()["theme"] == "dark"
        g = requests.get(f"{API}/settings/appearance")
        assert g.json()["theme"] == "dark"

        # set light (final state per user request)
        r = requests.put(f"{API}/admin/settings/appearance", headers=admin_headers, json={"theme": "light"})
        assert r.status_code == 200
        assert r.json()["theme"] == "light"
        g = requests.get(f"{API}/settings/appearance")
        assert g.json()["theme"] == "light"

    def test_invalid_theme_defaults_to_dark(self, admin_headers):
        r = requests.put(f"{API}/admin/settings/appearance", headers=admin_headers, json={"theme": "purple"})
        assert r.status_code == 200
        assert r.json()["theme"] == "dark"
        # restore to light as required final state
        r = requests.put(f"{API}/admin/settings/appearance", headers=admin_headers, json={"theme": "light"})
        assert r.status_code == 200
        assert r.json()["theme"] == "light"
