#!/usr/bin/env python3
"""
CLA Aesthetics Backend API Test Suite
Tests all backend endpoints after booking feature removal.
"""

import requests
import json
import uuid
from datetime import datetime

# Base URL from frontend/.env
BASE_URL = "https://cla-fullstack.preview.emergentagent.com/api"

# Test credentials
ADMIN_EMAIL = "admin@claaesthetics.com"
ADMIN_PASSWORD = "admin123"

# Color codes for output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
BLUE = "\033[94m"
RESET = "\033[0m"

def log_test(name, passed, details=""):
    """Log test result with color coding."""
    status = f"{GREEN}✓ PASS{RESET}" if passed else f"{RED}✗ FAIL{RESET}"
    print(f"{status} | {name}")
    if details:
        print(f"       {details}")
    return passed

def test_health():
    """Test 1: Health check endpoint."""
    print(f"\n{BLUE}=== Test 1: Health Check ==={RESET}")
    try:
        resp = requests.get(f"{BASE_URL}/", timeout=10)
        passed = resp.status_code == 200 and "message" in resp.json()
        details = f"Status: {resp.status_code}, Response: {resp.json()}"
        return log_test("GET /api/", passed, details)
    except Exception as e:
        return log_test("GET /api/", False, f"Error: {e}")

def test_public_content():
    """Test 2: Public content & catalog endpoints."""
    print(f"\n{BLUE}=== Test 2: Public Content & Catalog ==={RESET}")
    results = []
    
    # Test /api/content
    try:
        resp = requests.get(f"{BASE_URL}/content", timeout=10)
        data = resp.json()
        has_founder = "brand.founder_image_url" in data
        has_facility = "brand.hero_facility_image_url" in data
        passed = resp.status_code == 200 and has_founder and has_facility
        details = f"Status: {resp.status_code}, Has founder_image: {has_founder}, Has facility_image: {has_facility}"
        results.append(log_test("GET /api/content", passed, details))
    except Exception as e:
        results.append(log_test("GET /api/content", False, f"Error: {e}"))
    
    # Test /api/services
    try:
        resp = requests.get(f"{BASE_URL}/services", timeout=10)
        data = resp.json()
        has_services = "services" in data and len(data["services"]) > 0
        passed = resp.status_code == 200 and has_services
        details = f"Status: {resp.status_code}, Services count: {len(data.get('services', []))}"
        results.append(log_test("GET /api/services", passed, details))
    except Exception as e:
        results.append(log_test("GET /api/services", False, f"Error: {e}"))
    
    # Test /api/testimonials
    try:
        resp = requests.get(f"{BASE_URL}/testimonials", timeout=10)
        data = resp.json()
        has_testimonials = "testimonials" in data
        passed = resp.status_code == 200 and has_testimonials
        details = f"Status: {resp.status_code}, Testimonials count: {len(data.get('testimonials', []))}"
        results.append(log_test("GET /api/testimonials", passed, details))
    except Exception as e:
        results.append(log_test("GET /api/testimonials", False, f"Error: {e}"))
    
    # Test /api/plans
    try:
        resp = requests.get(f"{BASE_URL}/plans", timeout=10)
        data = resp.json()
        has_plans = "plans" in data
        passed = resp.status_code == 200 and has_plans
        details = f"Status: {resp.status_code}, Plans count: {len(data.get('plans', []))}"
        results.append(log_test("GET /api/plans", passed, details))
    except Exception as e:
        results.append(log_test("GET /api/plans", False, f"Error: {e}"))
    
    # Test /api/gallery
    try:
        resp = requests.get(f"{BASE_URL}/gallery", timeout=10)
        data = resp.json()
        has_gallery = "gallery" in data
        passed = resp.status_code == 200 and has_gallery
        details = f"Status: {resp.status_code}, Gallery count: {len(data.get('gallery', []))}"
        results.append(log_test("GET /api/gallery", passed, details))
    except Exception as e:
        results.append(log_test("GET /api/gallery", False, f"Error: {e}"))
    
    # Test /api/treatments-menu
    try:
        resp = requests.get(f"{BASE_URL}/treatments-menu", timeout=10)
        data = resp.json()
        has_items = "items" in data
        passed = resp.status_code == 200 and has_items
        details = f"Status: {resp.status_code}, Items count: {len(data.get('items', []))}"
        results.append(log_test("GET /api/treatments-menu", passed, details))
    except Exception as e:
        results.append(log_test("GET /api/treatments-menu", False, f"Error: {e}"))
    
    # Test /api/hero-images - should return facility image
    try:
        resp = requests.get(f"{BASE_URL}/hero-images", timeout=10)
        data = resp.json()
        has_images = "images" in data and len(data["images"]) > 0
        if has_images:
            first_image_src = data["images"][0].get("src", "")
            has_facility_url = "job_cla-fullstack" in first_image_src and "8ca8321d" in first_image_src
        else:
            has_facility_url = False
        passed = resp.status_code == 200 and has_images and has_facility_url
        details = f"Status: {resp.status_code}, Images count: {len(data.get('images', []))}, Has facility URL: {has_facility_url}"
        if has_images:
            details += f"\n       First image src: {data['images'][0].get('src', '')[:80]}..."
        results.append(log_test("GET /api/hero-images", passed, details))
    except Exception as e:
        results.append(log_test("GET /api/hero-images", False, f"Error: {e}"))
    
    return all(results)

def test_lead_flow():
    """Test 3: Lead creation (public endpoint)."""
    print(f"\n{BLUE}=== Test 3: Lead Flow ==={RESET}")
    try:
        payload = {
            "name": "Test Lead",
            "phone": "555-1234",
            "interest": "Botox",
            "contact_via": "call",
            "message": "hello"
        }
        resp = requests.post(f"{BASE_URL}/leads", json=payload, timeout=10)
        data = resp.json()
        has_ok = data.get("ok") == True
        has_lead = "lead" in data
        passed = resp.status_code == 200 and has_ok and has_lead
        details = f"Status: {resp.status_code}, ok: {has_ok}, has lead: {has_lead}"
        return log_test("POST /api/leads", passed, details)
    except Exception as e:
        return log_test("POST /api/leads", False, f"Error: {e}")

def test_removed_booking_endpoints():
    """Test 4: Removed booking endpoints - must return 404 or 405."""
    print(f"\n{BLUE}=== Test 4: Removed Booking Endpoints ==={RESET}")
    results = []
    
    removed_endpoints = [
        ("POST", "/bookings"),
        ("GET", "/bookings"),
        ("GET", "/bookings/mine"),
        ("GET", "/availability?d=2025-08-15"),
        ("GET", "/admin/blocked-slots"),
        ("POST", "/admin/blocked-slots"),
        ("POST", "/admin/bookings"),
        ("POST", "/checkout/booking"),
    ]
    
    for method, endpoint in removed_endpoints:
        try:
            url = f"{BASE_URL}{endpoint}"
            if method == "GET":
                resp = requests.get(url, timeout=10)
            elif method == "POST":
                resp = requests.post(url, json={}, timeout=10)
            
            # Should be 404 or 405, NOT 200 or 500
            passed = resp.status_code in [404, 405]
            details = f"Status: {resp.status_code} (expected 404 or 405)"
            results.append(log_test(f"{method} /api{endpoint}", passed, details))
        except Exception as e:
            results.append(log_test(f"{method} /api{endpoint}", False, f"Error: {e}"))
    
    return all(results)

def test_auth_flow():
    """Test 5: Auth flow - login, /auth/me, admin endpoints."""
    print(f"\n{BLUE}=== Test 5: Auth Flow ==={RESET}")
    results = []
    
    # Test admin login
    try:
        payload = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        resp = requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=10)
        data = resp.json()
        has_token = "access_token" in data
        is_admin = data.get("role") == "admin"
        passed = resp.status_code == 200 and has_token and is_admin
        details = f"Status: {resp.status_code}, Has token: {has_token}, Role: {data.get('role')}"
        results.append(log_test("POST /api/auth/login (admin)", passed, details))
        
        if not passed:
            print(f"{RED}Cannot continue auth tests without valid admin token{RESET}")
            return False
        
        admin_token = data["access_token"]
        headers = {"Authorization": f"Bearer {admin_token}"}
        
    except Exception as e:
        results.append(log_test("POST /api/auth/login (admin)", False, f"Error: {e}"))
        return False
    
    # Test /auth/me
    try:
        resp = requests.get(f"{BASE_URL}/auth/me", headers=headers, timeout=10)
        data = resp.json()
        is_admin = data.get("role") == "admin"
        passed = resp.status_code == 200 and is_admin
        details = f"Status: {resp.status_code}, Role: {data.get('role')}"
        results.append(log_test("GET /api/auth/me", passed, details))
    except Exception as e:
        results.append(log_test("GET /api/auth/me", False, f"Error: {e}"))
    
    # Test admin endpoints
    admin_endpoints = [
        ("GET", "/leads", "leads"),
        ("GET", "/admin/clients", "clients"),
        ("GET", "/admin/revenue", None),  # Check for specific keys
        ("GET", "/payments", "payments"),
        ("GET", "/subscriptions", "subscriptions"),
    ]
    
    for method, endpoint, key in admin_endpoints:
        try:
            resp = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
            data = resp.json()
            if key:
                has_key = key in data
                passed = resp.status_code == 200 and has_key
                details = f"Status: {resp.status_code}, Has '{key}': {has_key}"
            else:
                # For revenue endpoint, check for specific keys
                has_keys = all(k in data for k in ["today", "week", "month", "all_time", "mrr"])
                passed = resp.status_code == 200 and has_keys
                details = f"Status: {resp.status_code}, Has revenue keys: {has_keys}"
            results.append(log_test(f"GET /api{endpoint}", passed, details))
        except Exception as e:
            results.append(log_test(f"GET /api{endpoint}", False, f"Error: {e}"))
    
    return all(results)

def test_content_editing():
    """Test 6: Content editing (admin)."""
    print(f"\n{BLUE}=== Test 6: Content Editing ==={RESET}")
    results = []
    
    # First login as admin
    try:
        payload = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        resp = requests.post(f"{BASE_URL}/auth/login", json=payload, timeout=10)
        admin_token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {admin_token}"}
    except Exception as e:
        return log_test("Content editing setup", False, f"Login failed: {e}")
    
    # Test PUT /admin/content
    try:
        payload = {"key": "test.key", "value": "hello world"}
        resp = requests.put(f"{BASE_URL}/admin/content", json=payload, headers=headers, timeout=10)
        data = resp.json()
        passed = resp.status_code == 200 and data.get("ok") == True
        details = f"Status: {resp.status_code}, ok: {data.get('ok')}"
        results.append(log_test("PUT /api/admin/content", passed, details))
    except Exception as e:
        results.append(log_test("PUT /api/admin/content", False, f"Error: {e}"))
    
    # Verify the content was saved
    try:
        resp = requests.get(f"{BASE_URL}/content", timeout=10)
        data = resp.json()
        has_test_key = data.get("test.key") == "hello world"
        passed = resp.status_code == 200 and has_test_key
        details = f"Status: {resp.status_code}, test.key value: {data.get('test.key')}"
        results.append(log_test("GET /api/content (verify test.key)", passed, details))
    except Exception as e:
        results.append(log_test("GET /api/content (verify test.key)", False, f"Error: {e}"))
    
    return all(results)

def test_register_client():
    """Test 7: Register a new client."""
    print(f"\n{BLUE}=== Test 7: Register New Client ==={RESET}")
    results = []
    
    # Generate random email
    random_email = f"testclient_{uuid.uuid4().hex[:8]}@example.com"
    
    # Test registration
    try:
        payload = {
            "name": "Test Client",
            "email": random_email,
            "password": "testpass123",
            "phone": "555-9999"
        }
        resp = requests.post(f"{BASE_URL}/auth/register", json=payload, timeout=10)
        data = resp.json()
        has_tokens = "access_token" in data and "refresh_token" in data
        is_client = data.get("role") == "client"
        passed = resp.status_code == 200 and has_tokens and is_client
        details = f"Status: {resp.status_code}, Has tokens: {has_tokens}, Role: {data.get('role')}"
        results.append(log_test("POST /api/auth/register", passed, details))
        
        if not passed:
            print(f"{RED}Cannot continue client tests without valid registration{RESET}")
            return False
        
        client_token = data["access_token"]
        headers = {"Authorization": f"Bearer {client_token}"}
        
    except Exception as e:
        results.append(log_test("POST /api/auth/register", False, f"Error: {e}"))
        return False
    
    # Test client endpoints
    client_endpoints = [
        ("GET", "/subscriptions/mine", "subscriptions"),
        ("GET", "/payments/mine", "payments"),
        ("GET", "/intake/mine", None),  # Returns empty dict or intake data
    ]
    
    for method, endpoint, key in client_endpoints:
        try:
            resp = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
            data = resp.json()
            if key:
                has_key = key in data
                passed = resp.status_code == 200 and has_key
                details = f"Status: {resp.status_code}, Has '{key}': {has_key}"
            else:
                # For intake, just check 200 status
                passed = resp.status_code == 200
                details = f"Status: {resp.status_code}"
            results.append(log_test(f"GET /api{endpoint}", passed, details))
        except Exception as e:
            results.append(log_test(f"GET /api{endpoint}", False, f"Error: {e}"))
    
    return all(results)

def main():
    """Run all tests."""
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}CLA Aesthetics Backend API Test Suite{RESET}")
    print(f"{BLUE}Base URL: {BASE_URL}{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    results = []
    
    # Run all tests
    results.append(("Health Check", test_health()))
    results.append(("Public Content & Catalog", test_public_content()))
    results.append(("Lead Flow", test_lead_flow()))
    results.append(("Removed Booking Endpoints", test_removed_booking_endpoints()))
    results.append(("Auth Flow", test_auth_flow()))
    results.append(("Content Editing", test_content_editing()))
    results.append(("Register Client", test_register_client()))
    
    # Summary
    print(f"\n{BLUE}{'='*60}{RESET}")
    print(f"{BLUE}Test Summary{RESET}")
    print(f"{BLUE}{'='*60}{RESET}")
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    for name, passed in results:
        status = f"{GREEN}✓ PASS{RESET}" if passed else f"{RED}✗ FAIL{RESET}"
        print(f"{status} | {name}")
    
    print(f"\n{BLUE}Total: {passed_count}/{total_count} test groups passed{RESET}")
    
    if passed_count == total_count:
        print(f"{GREEN}All tests passed!{RESET}")
        return 0
    else:
        print(f"{RED}Some tests failed.{RESET}")
        return 1

if __name__ == "__main__":
    exit(main())
