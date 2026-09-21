from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import re
import uuid
import logging
import smtplib
import requests
from datetime import datetime, timezone, timedelta, date as date_cls
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import List, Optional

import bcrypt
import jwt
from fastapi import BackgroundTasks, FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query, UploadFile, File
from fastapi.responses import JSONResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ---------------- Logging ----------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("cla")

# ---------------- DB ----------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---------------- JWT ----------------
JWT_ALGORITHM = "HS256"
ACCESS_MIN = 15
REFRESH_DAYS = 7


def get_jwt_secret() -> str:
    return os.environ["JWT_SECRET"]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_MIN),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_DAYS),
        "type": "refresh",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str):
    common = {"httponly": True, "secure": True, "samesite": "none", "path": "/"}
    response.set_cookie("access_token", access, max_age=ACCESS_MIN * 60, **common)
    response.set_cookie("refresh_token", refresh, max_age=REFRESH_DAYS * 24 * 60 * 60, **common)


def clear_auth_cookies(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")


# ---------------- Models ----------------
class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=200)


class UserOut(BaseModel):
    id: str
    name: str
    email: EmailStr
    role: str
    phone: Optional[str] = None


class LeadIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    phone: str = Field(min_length=3, max_length=40)
    email: Optional[str] = ""
    interest: Optional[str] = ""
    contact_via: Optional[str] = "call"
    message: Optional[str] = ""
    source: Optional[str] = "website"


class SmtpSettings(BaseModel):
    host: str = "smtp.gmail.com"
    port: int = 587
    username: str = ""
    app_password: str = ""
    from_name: str = "CLA Aesthetics & Wellness"
    from_email: str = ""
    recipients: List[str] = []
    enabled: bool = False


# ---------------- Services Catalog ----------------
SERVICES = [
    {"id": "botox", "category": "Injectables", "name": "Botox", "description": "Smooth fine lines & wrinkles with precision-placed neurotoxin. Results last 3–4 months.", "duration": "30 min", "price": "From $12/unit", "image": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=1200&q=80"},
    {"id": "fillers", "category": "Injectables", "name": "Dermal Fillers", "description": "Enhance contours and add natural volume to lips, cheeks and jawline.", "duration": "45 min", "price": "From $650/syringe", "image": "https://images.unsplash.com/photo-1597931752949-98c74b5b159f?auto=format&fit=crop&w=1200&q=80"},
    {"id": "pdo", "category": "Lifts", "name": "PDO Thread Lift", "description": "Non-surgical lift using absorbable threads for natural contours.", "duration": "60 min", "price": "From $800", "image": "https://images.unsplash.com/photo-1559599101-f09722fb4948?auto=format&fit=crop&w=900&q=80"},
    {"id": "prp-facial", "category": "Facials", "name": "PRP Facial", "description": "Collagen-boosting plasma therapy for radiant rejuvenation.", "duration": "60 min", "price": "From $450", "image": "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1200&q=80"},
    {"id": "prf", "category": "Facials", "name": "PRF Treatment", "description": "Advanced healing with platelet-rich fibrin for a natural glow.", "duration": "60 min", "price": "From $500", "image": "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1200&q=80"},
    {"id": "hydrofacial", "category": "Facials", "name": "Hydrofacial", "description": "Deep cleansing, hydration boost and instant glow in one ritual.", "duration": "60 min", "price": "From $250", "image": "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1200&q=80"},
    {"id": "laser", "category": "Skin", "name": "Laser Therapy", "description": "Target imperfections for smoother, clearer skin.", "duration": "45 min", "price": "From $295", "image": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80"},
    {"id": "microneedling-prp", "category": "Skin", "name": "Microneedling + PRP", "description": "Skin renewal and even tone using collagen induction with PRP.", "duration": "75 min", "price": "From $400/session", "image": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80"},
    {"id": "skin-rejuvenation", "category": "Skin", "name": "Skin Rejuvenation", "description": "A complete transformation for radiant, glass-skin results.", "duration": "90 min", "price": "From $350", "image": "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80"},
    {"id": "hair-restoration", "category": "Hair", "name": "Hair Restoration", "description": "Stimulate new growth for fuller, thicker hair.", "duration": "60 min", "price": "From $500 · 3-pack $1,350", "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80"},
    {"id": "iv-nutrition", "category": "Wellness", "name": "IV Nutrition Therapy", "description": "Boost immunity, energy and rapid hydration with custom IV blends.", "duration": "45 min", "price": "From $185", "image": "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=900&q=80"},
    {"id": "weight-loss", "category": "Wellness", "name": "Weight Loss Program", "description": "Customized plans under medical supervision.", "duration": "Consultation", "price": "From $299", "image": "https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=900&q=80"},
    {"id": "body-spa", "category": "Body Spa", "name": "Body Spa", "description": "A serene full-body spa experience — massage, body rituals and signature finishing touches. Launching soon at CLA.", "duration": "Coming soon", "price": "Coming soon", "image": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80", "comingSoon": True},
]

DEFAULT_SLOTS = [
    "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM",
    "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM",
    "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM",
]


# ---------------- Auth Dependency ----------------
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_optional_user(request: Request) -> Optional[dict]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ---------------- App ----------------
app = FastAPI(title="CLA Aesthetics API")
api_router = APIRouter(prefix="/api")


# ---------------- Brute Force ----------------
def get_ip(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for", "")
    if xff:
        return xff.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


async def check_lock(ip: str, email: str) -> Optional[int]:
    """Returns remaining lock seconds if locked, else None."""
    key = f"{ip}:{email.lower()}"
    rec = await db.login_attempts.find_one({"key": key}, {"_id": 0})
    if rec and rec.get("locked_until"):
        locked_until = datetime.fromisoformat(rec["locked_until"])
        now = datetime.now(timezone.utc)
        if locked_until > now:
            return int((locked_until - now).total_seconds())
    return None


async def record_failed(ip: str, email: str):
    key = f"{ip}:{email.lower()}"
    rec = await db.login_attempts.find_one({"key": key}, {"_id": 0}) or {"key": key, "count": 0}
    rec["count"] = int(rec.get("count", 0)) + 1
    if rec["count"] >= 5:
        rec["locked_until"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        rec["count"] = 0
    await db.login_attempts.update_one({"key": key}, {"$set": rec}, upsert=True)


async def reset_attempts(ip: str, email: str):
    key = f"{ip}:{email.lower()}"
    await db.login_attempts.delete_one({"key": key})


# ---------------- Public Endpoints ----------------
@api_router.get("/")
async def root():
    return {"message": "CLA Aesthetics & Wellness API"}


@api_router.get("/services")
async def list_services():
    cur = db.services.find({}, {"_id": 0}).sort("order", 1)
    items = [s async for s in cur]
    if not items:
        items = SERVICES
    return {"services": items}


@api_router.post("/leads")
async def create_lead(payload: LeadIn, background: BackgroundTasks):
    lead = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip(),
        "phone": payload.phone.strip(),
        "email": (payload.email or "").strip(),
        "interest": payload.interest or "",
        "contact_via": payload.contact_via or "call",
        "message": payload.message or "",
        "source": payload.source or "website",
        "status": "new",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.leads.insert_one(lead.copy())
    lead.pop("_id", None)
    background.add_task(notify_new_lead, lead)
    return {"ok": True, "lead": lead}


async def notify_new_lead(lead: dict):
    smtp = await load_smtp_config()
    if not smtp or not smtp.get("enabled"):
        return
    to = smtp.get("recipients") or [smtp.get("from_email") or smtp.get("username")]
    html = (
        f"<h2>New inquiry from {lead['name']}</h2>"
        f"<p><b>Phone:</b> {lead['phone']}<br><b>Email:</b> {lead.get('email') or '-'}<br>"
        f"<b>Service:</b> {lead.get('interest') or '-'}<br><b>Prefers:</b> {lead.get('contact_via')}</p>"
        f"<p>{lead.get('message') or ''}</p>"
    )
    try:
        send_email_sync(smtp, to=[x for x in to if x], subject=f"New inquiry — {lead['name']}", html_body=html)
    except Exception as e:
        logger.error(f"Lead email failed: {e}")


@api_router.delete("/leads/{lead_id}")
async def delete_lead(lead_id: str, _: dict = Depends(require_admin)):
    await db.leads.delete_one({"id": lead_id})
    return {"ok": True}


@api_router.get("/leads")
async def list_leads(_: dict = Depends(require_admin)):
    cur = db.leads.find({}, {"_id": 0}).sort("created_at", -1)
    return {"leads": [x async for x in cur]}


@api_router.patch("/leads/{lead_id}")
async def update_lead(lead_id: str, status: str = Query(...), _: dict = Depends(require_admin)):
    if status not in {"new", "contacted", "converted", "archived"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    await db.leads.update_one({"id": lead_id}, {"$set": {"status": status}})
    return {"ok": True}


# ---------------- Auth Endpoints ----------------
@api_router.post("/auth/login")
async def login(payload: LoginIn, request: Request, response: Response):
    email = payload.email.lower()
    ip = get_ip(request)
    locked = await check_lock(ip, email)
    if locked:
        raise HTTPException(status_code=429, detail=f"Too many attempts. Try again in {locked // 60 + 1} min.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await record_failed(ip, email)
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await reset_attempts(ip, email)
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"], "phone": user.get("phone", ""), "access_token": access, "refresh_token": refresh}


@api_router.post("/auth/logout")
async def logout(response: Response):
    clear_auth_cookies(response)
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"], "phone": user.get("phone", "")}


@api_router.put("/auth/password")
async def change_password(payload: ChangePasswordIn, response: Response, user: dict = Depends(get_current_user)):
    # Fetch full user to access password_hash (get_current_user strips it)
    full = await db.users.find_one({"id": user["id"]})
    if not full or not verify_password(payload.current_password, full.get("password_hash", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if payload.current_password == payload.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password.")
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password_hash": hash_password(payload.new_password)}},
    )
    # Rotate tokens so any old session on other devices is invalidated when they attempt refresh
    access = create_access_token(user["id"], user["email"], user["role"])
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {"ok": True, "access_token": access, "refresh_token": refresh}


@api_router.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    # Try cookie first, then Authorization header / JSON body for header-based clients
    token = request.cookies.get("refresh_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        try:
            body = await request.json()
            token = body.get("refresh_token") if isinstance(body, dict) else None
        except Exception:
            token = None
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(user["id"], user["email"], user["role"])
        set_auth_cookies(response, access, token)
        return {"ok": True, "access_token": access, "refresh_token": token}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Refresh expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh")


# ---------------- Admin Settings (SMTP) ----------------
@api_router.get("/admin/settings/smtp")
async def get_smtp(_: dict = Depends(require_admin)):
    doc = await db.settings.find_one({"key": "smtp"}, {"_id": 0}) or {}
    smtp = doc.get("value", {})
    # Mask password
    if smtp.get("app_password"):
        smtp["app_password_set"] = True
        smtp["app_password"] = ""
    else:
        smtp["app_password_set"] = False
    return smtp


@api_router.put("/admin/settings/smtp")
async def save_smtp(payload: SmtpSettings, _: dict = Depends(require_admin)):
    # If empty app_password sent, keep existing
    existing = await db.settings.find_one({"key": "smtp"}, {"_id": 0}) or {}
    existing_val = existing.get("value", {})
    new_val = payload.model_dump()
    if not new_val.get("app_password") and existing_val.get("app_password"):
        new_val["app_password"] = existing_val["app_password"]
    await db.settings.update_one({"key": "smtp"}, {"$set": {"key": "smtp", "value": new_val}}, upsert=True)
    return {"ok": True}


@api_router.post("/admin/settings/smtp/test")
async def test_smtp(_: dict = Depends(require_admin)):
    smtp = await load_smtp_config()
    if not smtp or not smtp.get("enabled"):
        raise HTTPException(status_code=400, detail="SMTP is not enabled.")
    try:
        send_email_sync(
            smtp,
            to=[smtp.get("from_email") or smtp.get("username")],
            subject="CLA Aesthetics — SMTP Test",
            html_body="<p>This is a test email from your CLA Aesthetics admin panel. If you received this, your SMTP configuration is working.</p>",
        )
        return {"ok": True}
    except Exception as e:
        logger.error(f"SMTP test failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed: {e}")


# ---------------- Email Helpers ----------------
async def load_smtp_config() -> Optional[dict]:
    doc = await db.settings.find_one({"key": "smtp"}, {"_id": 0})
    if not doc:
        return None
    return doc.get("value")


def send_email_sync(smtp: dict, to: List[str], subject: str, html_body: str):
    msg = MIMEMultipart("alternative")
    from_email = smtp.get("from_email") or smtp["username"]
    from_name = smtp.get("from_name") or "CLA Aesthetics & Wellness"
    msg["From"] = f"{from_name} <{from_email}>"
    msg["To"] = ", ".join(to)
    msg["Subject"] = subject
    msg.attach(MIMEText(html_body, "html"))

    server = smtplib.SMTP(smtp["host"], int(smtp["port"]))
    server.starttls()
    server.login(smtp["username"], smtp["app_password"])
    server.sendmail(from_email, to, msg.as_string())
    server.quit()





class ContentBlockIn(BaseModel):
    key: str
    value: str


# ============================================================
# ============ NEWS & OFFERS MANAGER ==========================
# ============================================================
class BlogIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    slug: Optional[str] = ""
    excerpt: Optional[str] = ""
    body: Optional[str] = ""
    cover_image_url: Optional[str] = ""
    tag: Optional[str] = "Blog"
    published: bool = True


def slugify(text: str) -> str:
    text = re.sub(r"[^a-zA-Z0-9]+", "-", (text or "").lower()).strip("-")
    return text or str(uuid.uuid4())[:8]


class OfferIn(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = ""
    cta_label: Optional[str] = "Learn more"
    cta_url: Optional[str] = ""
    banner_image_url: Optional[str] = ""
    accent_color: Optional[str] = "#D4AF37"
    starts_at: Optional[str] = None  # ISO date/time
    ends_at: Optional[str] = None    # ISO date/time
    active: bool = True
    show_banner: bool = True  # If true, appears as top-of-site banner


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _is_within(offer: dict) -> bool:
    if not offer.get("active"):
        return False
    now = datetime.now(timezone.utc)
    try:
        if offer.get("starts_at"):
            if datetime.fromisoformat(offer["starts_at"].replace("Z", "+00:00")) > now:
                return False
        if offer.get("ends_at"):
            if datetime.fromisoformat(offer["ends_at"].replace("Z", "+00:00")) < now:
                return False
    except Exception:
        return offer.get("active", False)
    return True


# ---- Public: blog ----
@api_router.get("/blog")
async def list_blog():
    cur = db.blog.find({"published": True}, {"_id": 0, "body": 0}).sort("created_at", -1).limit(60)
    return {"items": [n async for n in cur]}


@api_router.get("/blog/{slug}")
async def get_blog_post(slug: str):
    post = await db.blog.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    return post


# ---- Public: offers ----
@api_router.get("/offers")
async def list_offers():
    cur = db.offers.find({}, {"_id": 0}).sort("created_at", -1)
    all_offers = [o async for o in cur]
    live = [o for o in all_offers if _is_within(o)]
    return {"items": live}


@api_router.get("/offers/banner")
async def active_banner():
    cur = db.offers.find({"show_banner": True}, {"_id": 0}).sort("created_at", -1)
    all_offers = [o async for o in cur]
    live = [o for o in all_offers if _is_within(o)]
    return {"offer": live[0] if live else None}


# ---- Admin: blog CRUD ----
@api_router.get("/admin/blog")
async def admin_list_blog(_: dict = Depends(require_admin)):
    cur = db.blog.find({}, {"_id": 0}).sort("created_at", -1)
    return {"items": [n async for n in cur]}


async def _unique_slug(base: str, exclude_id: Optional[str] = None) -> str:
    slug, n = base, 2
    while await db.blog.find_one({"slug": slug, "id": {"$ne": exclude_id}}):
        slug = f"{base}-{n}"
        n += 1
    return slug


@api_router.post("/admin/blog")
async def admin_create_blog(payload: BlogIn, _: dict = Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["slug"] = await _unique_slug(slugify(doc.get("slug") or doc["title"]))
    doc["created_at"] = _now_iso()
    doc["updated_at"] = doc["created_at"]
    await db.blog.insert_one(doc.copy())
    doc.pop("_id", None)
    return {"ok": True, "item": doc}


@api_router.put("/admin/blog/{post_id}")
async def admin_update_blog(post_id: str, payload: BlogIn, _: dict = Depends(require_admin)):
    update = payload.model_dump()
    update["slug"] = await _unique_slug(slugify(update.get("slug") or update["title"]), exclude_id=post_id)
    update["updated_at"] = _now_iso()
    res = await db.blog.update_one({"id": post_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found.")
    return {"ok": True, "slug": update["slug"]}


@api_router.delete("/admin/blog/{post_id}")
async def admin_delete_blog(post_id: str, _: dict = Depends(require_admin)):
    res = await db.blog.delete_one({"id": post_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found.")
    return {"ok": True}


# ---- Admin: offers CRUD ----
@api_router.get("/admin/offers")
async def admin_list_offers(_: dict = Depends(require_admin)):
    cur = db.offers.find({}, {"_id": 0}).sort("created_at", -1)
    return {"items": [o async for o in cur]}


@api_router.post("/admin/offers")
async def admin_create_offer(payload: OfferIn, _: dict = Depends(require_admin)):
    doc = payload.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = _now_iso()
    doc["updated_at"] = doc["created_at"]
    await db.offers.insert_one(doc.copy())
    doc.pop("_id", None)
    return {"ok": True, "item": doc}


@api_router.put("/admin/offers/{offer_id}")
async def admin_update_offer(offer_id: str, payload: OfferIn, _: dict = Depends(require_admin)):
    update = payload.model_dump()
    update["updated_at"] = _now_iso()
    res = await db.offers.update_one({"id": offer_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Offer not found.")
    return {"ok": True}


@api_router.delete("/admin/offers/{offer_id}")
async def admin_delete_offer(offer_id: str, _: dict = Depends(require_admin)):
    res = await db.offers.delete_one({"id": offer_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Offer not found.")
    return {"ok": True}



# ---------------- Content CMS ----------------
DEFAULT_CONTENT = {
    # Branding / global images
    "brand.logo_url": "https://customer-assets.emergentagent.com/job_cinthia-spa/artifacts/9tpekrrz_image.png",
    "brand.hero_bg_url": "https://customer-assets-jai6qajn.emergentagent.net/job_beauty-reserve-155/artifacts/qdhwfadp_8ca8321d-6caa-402f-9a3c-637e3e897444.png",
    "brand.founder_image_url": "https://images.unsplash.com/photo-1733685372441-c3a2a6e3222c?crop=entropy&cs=srgb&fm=jpg&q=85",
    "brand.about_image_url": "https://customer-assets-jai6qajn.emergentagent.net/job_beauty-reserve-155/artifacts/gge0hg88_WhatsApp%20Image%202026-06-02%20at%205.01.50%20AM.jpeg",
    "brand.qr_url": "https://customer-assets.emergentagent.com/job_luxury-spa-preview-1/artifacts/uh5zkul7_qr-code.png",
    "brand.studio_name": "CLA Aesthetics & Wellness",
    "brand.tagline_short": "Enhancing your natural beauty",
    "brand.phone": "516-620-9158",
    "brand.phone_link": "+15166209158",
    "brand.email": "cinthia@claaesthetics.com",
    "brand.address": "1078 Grand Avenue, South Hempstead, NY 11550",
    "brand.instagram": "https://instagram.com/CLAAesthetics",
    "brand.facebook": "https://facebook.com/",
    "brand.whatsapp": "https://wa.me/15166209158",
    "brand.maps_query": "1078 Grand Avenue, South Hempstead, NY 11550",
    "brand.booking_url": "https://mdwareonline.com/claaestheticsandwellness",
    "brand.booking_label": "Book Now",

    # Hero
    "hero.eyebrow": "South Hempstead, NY",
    "hero.title_part1": "Elevate your",
    "hero.title_part1_italic": "glow.",
    "hero.title_part2": "Restore your",
    "hero.title_part2_italic": "calm.",
    "hero.subtitle": "A boutique medical-aesthetics studio led by Cinthia Lariviere Alexandre. Bespoke rituals, advanced injectables and quiet luxury — minutes from Long Island.",
    "hero.cta_primary": "Book a consultation",
    "hero.cta_secondary": "View services",
    "hero.counter_to": "200",
    "hero.counter_label": "5-star clients",
    "hero.founder_signature": "With care,",
    "hero.founder_name": "Cinthia",
    "hero.founder_role": "Founder & CEO",

    # Hero facility card (the image overlay on the right of the hero)
    "hero.facility_signature": "Step inside.",
    "hero.facility_title": "The CLA Studio",
    "hero.facility_subtitle": "South Hempstead, NY",
    "brand.hero_facility_image_url": "",

    # Team / staff section
    "team.eyebrow": "The team",
    "team.title": "Meet the hands behind your glow.",
    "team.title_italic": "hands",
    "team.lede": "A small, dedicated team of specialists — each chosen for their craft, warmth and precision.",

    # Contact — opening hours (one row per line, format: Label|Value)
    "contact.hours_title": "Hours",
    "contact.hours": "Monday – Friday|10:00 AM – 8:00 PM\nSaturday|9:00 AM – 6:00 PM\nSunday|By appointment",

    # About
    "about.eyebrow": "Our story",
    "about.title": "Quiet luxury, remarkable results.",
    "about.title_italic": "remarkable",
    "about.body": "CLA Aesthetics & Wellness was built on a simple belief: refinement should feel personal. Each visit begins with listening — to your goals, your skin, your story — before any treatment touches your skin.",
    "about.body2": "From precision injectables to restorative wellness, every ritual is curated by Cinthia herself in a private, calming studio just minutes from Long Island.",
    "about.highlight1_title": "Certified Esthetician",
    "about.highlight1_body": "Trained in advanced injectable and skin rejuvenation protocols.",
    "about.highlight2_title": "10+ years of care",
    "about.highlight2_body": "A trusted hand and an attentive eye for every face we touch.",
    "about.highlight3_title": "Bespoke results",
    "about.highlight3_body": "Every plan is tailored — never templated. Subtle, refined, you.",

    # Treatments header
    "treatments.eyebrow": "Treatments",
    "treatments.title": "Signature rituals, artfully performed.",
    "treatments.title_italic": "artfully",
    "treatments.lede": "A curated menu of medical-aesthetic and wellness treatments, every one calibrated to your face, your goals and your day.",
    "treatments.menu_header": "LUXURY TREATMENT AND WELLNESS",
    "treatments.col_luxury_title": "Luxury",
    "treatments.col_wellness_title": "Wellness",
    "treatments.subtitle": "Modern Luxury, Refined Results",
    "treatments.closing": "Enhancing Your Natural Beauty",
    "treatments.tagline": "with precision & care",
    "treatments.cta": "Book your appointment today",

    # Gallery
    "gallery.eyebrow": "Portfolio",
    "gallery.title": "Moments of light & texture.",
    "gallery.title_italic": "light",

    # Testimonials header
    "testimonials.eyebrow": "Voices",

    # Per-page settings (banner + typography). Scales are percentages.
    "page.home.heading_scale": "100", "page.home.text_scale": "100",
    "page.about.eyebrow": "Our story", "page.about.title": "About CLA", "page.about.subtitle": "A boutique medical-aesthetics studio built on listening first.", "page.about.banner_url": "", "page.about.heading_scale": "100", "page.about.text_scale": "100",
    "page.services.eyebrow": "Treatments", "page.services.title": "Services & Pricing", "page.services.subtitle": "Precision injectables, restorative skin rituals and medical wellness — every treatment calibrated to you.", "page.services.banner_url": "", "page.services.heading_scale": "100", "page.services.text_scale": "100",
    "page.portfolio.eyebrow": "Portfolio", "page.portfolio.title": "Gallery", "page.portfolio.subtitle": "Moments of light, texture and transformation inside the CLA studio.", "page.portfolio.banner_url": "", "page.portfolio.heading_scale": "100", "page.portfolio.text_scale": "100",
    "page.blog.eyebrow": "Journal", "page.blog.title": "Blog", "page.blog.subtitle": "Notes on skin, science and self-care from Cinthia and the CLA team.", "page.blog.banner_url": "", "page.blog.heading_scale": "100", "page.blog.text_scale": "100",
    "page.reviews.eyebrow": "Voices", "page.reviews.title": "Client Reviews", "page.reviews.subtitle": "Real words from the people who trust us with their glow.", "page.reviews.banner_url": "", "page.reviews.heading_scale": "100", "page.reviews.text_scale": "100",
    "page.contact.eyebrow": "Book your visit", "page.contact.title": "Contact", "page.contact.subtitle": "Send an inquiry, call, or drop by the studio in South Hempstead.", "page.contact.banner_url": "", "page.contact.heading_scale": "100", "page.contact.text_scale": "100",

    # CTA band
    "cta.eyebrow": "Ready when you are",
    "cta.title": "Your consultation begins with a conversation.",
    "cta.body": "Tell us your goals — we'll design a treatment plan that feels unmistakably you.",

    # Blog / journal
    "blog.eyebrow": "Journal",
    "blog.title": "Notes on skin, science & self-care.",
    "blog.title_italic": "self-care",

    # Offers
    "offers.eyebrow": "Offers",
    "offers.title": "Thoughtfully curated rituals.",
    "offers.title_italic": "curated",

    # Booking section
    "booking.eyebrow": "Book your visit",
    "booking.title": "We've been waiting for you.",
    "booking.title_italic": "waiting",
    "booking.lede": "Reserve a private consultation or treatment. We'll confirm and send all the gentle reminders.",
    "booking.qr_eyebrow": "Scan to book",
    "booking.qr_title": "From phone to glow.",
    "booking.qr_title_italic": "glow.",
    "booking.qr_subtitle": "Point your camera here.",

    # Footer
    "footer.tagline": "Enhancing your natural beauty",
    "footer.body": "A boutique studio in South Hempstead, NY led by Cinthia Lariviere Alexandre — combining advanced aesthetics with quiet, considered hospitality.",
    "footer.hours_block": "Mon–Fri 10am–8pm\nSat 9am–6pm\nSun by appointment",
    "footer.copyright": "CLA Aesthetics & Wellness. All rights reserved.",

    # Legal & policy long-form pages
    "privacy.body": (
        "**Effective date:** {today}\n\n"
        "CLA Aesthetics & Wellness (\"CLA\", \"we\", \"us\", \"our\") operates https://cla-wellness.com and the connected booking/portal experience. "
        "This Privacy Policy explains what information we collect, how we use it, and the choices you have. "
        "We comply with applicable U.S. privacy laws including, where relevant, HIPAA standards for medical information and New York State consumer-privacy protections.\n\n"
        "**1. Information we collect**\n"
        "• Identity & contact details — name, email, phone, address.\n"
        "• Booking details — service, date, time, notes you share with us.\n"
        "• Medical intake — date of birth, medications, allergies, pregnancy status, skin concerns and consent (used only to deliver safe treatments).\n"
        "• Payment details — handled by our PCI-compliant processor (Stripe). We never see or store your full card number or CVC.\n"
        "• Usage data — pages visited, device and approximate location (for security and product analytics).\n\n"
        "**2. How we use your information**\n"
        "• To schedule, confirm and deliver your treatments.\n"
        "• To contact you about appointments, follow-ups, recalls and aftercare.\n"
        "• To process payments and issue refunds where applicable.\n"
        "• To comply with legal, tax and medical record-keeping obligations.\n"
        "• To send marketing communications you have opted into — you may unsubscribe at any time.\n\n"
        "**3. Sharing & disclosure**\n"
        "We never sell your personal information. We share it only with:\n"
        "• Service providers acting on our behalf (e.g. Stripe for payments, our SMTP provider for confirmations, our cloud hosting).\n"
        "• Health-care professionals involved in your care.\n"
        "• Authorities when required by law (subpoena, court order or as needed to protect rights and safety).\n\n"
        "**4. Data retention**\n"
        "Medical records are kept for the minimum period required by applicable law. Booking and account data is retained while your account is active and for a reasonable period after closure for legal and accounting purposes.\n\n"
        "**5. Security**\n"
        "We use TLS in transit, encrypted databases at rest, role-based access and httpOnly secure cookies for authentication. No system is 100% secure — please use a unique password and notify us promptly of suspicious activity.\n\n"
        "**6. Your rights**\n"
        "You may request: access to your data, correction of inaccuracies, deletion (subject to medical retention laws), restriction of processing, data portability, and to opt out of marketing. Submit any request to cinthia@claaesthetics.com.\n\n"
        "**7. Cookies**\n"
        "We use strictly-necessary cookies for sign-in and booking, and limited analytics cookies. See our Cookie Policy for details.\n\n"
        "**8. Children**\n"
        "Our services are not directed to children under 18. We do not knowingly collect personal information from minors without parental consent.\n\n"
        "**9. Changes to this policy**\n"
        "We may update this policy as our practice evolves. The \"Effective date\" above reflects the latest version. Material changes will be highlighted on this page.\n\n"
        "**10. Contact**\n"
        "Questions or requests? Reach Cinthia Lariviere Alexandre at cinthia@claaesthetics.com · 516-620-9158 · 1078 Grand Avenue, South Hempstead, NY 11550."
    ),
    "terms.body": (
        "**Effective date:** {today}\n\n"
        "These Terms govern your use of https://cla-wellness.com and any treatment booked with CLA Aesthetics & Wellness. By creating an account, booking, or paying a deposit you agree to these Terms.\n\n"
        "**1. Treatments & consultation**\n"
        "All medical-aesthetic treatments require a pre-treatment consultation. We reserve the right to decline or postpone any treatment that is not medically appropriate. Results vary by individual; no specific outcome is guaranteed.\n\n"
        "**2. Deposits & payments**\n"
        "A non-refundable deposit is required to reserve every appointment. The deposit is applied to your service total. Remaining balances are settled in-studio by card or contactless payment.\n\n"
        "**3. Cancellation, rescheduling & no-shows**\n"
        "• 24+ hours before your appointment — reschedule with no charge.\n"
        "• Less than 24 hours — deposit is forfeited.\n"
        "• No-shows — deposit forfeited and may affect future booking eligibility.\n"
        "See our Refund & Cancellation Policy for full detail.\n\n"
        "**4. Memberships**\n"
        "Memberships renew automatically on your renewal date until cancelled. Cancel anytime from your portal or by contacting us — no early-termination fee. Cancellations take effect at the end of the current billing period.\n\n"
        "**5. Account responsibility**\n"
        "You are responsible for keeping your login credentials confidential and for activity that occurs under your account. Notify us immediately of any unauthorised access.\n\n"
        "**6. Acceptable use**\n"
        "You agree not to misuse the website, attempt to disrupt our services, or submit false health information that could endanger your or others' safety.\n\n"
        "**7. Intellectual property**\n"
        "All site content, logos, text, images and treatment protocols are the property of CLA Aesthetics & Wellness or our licensors and are protected by U.S. and international IP laws.\n\n"
        "**8. Limitation of liability**\n"
        "To the maximum extent permitted by law, our aggregate liability for any claim arising out of your use of the website or services is limited to the amount you paid us in the preceding twelve (12) months. We are not liable for indirect, incidental or consequential damages.\n\n"
        "**9. Governing law**\n"
        "These Terms are governed by the laws of the State of New York, without regard to its conflicts-of-law principles. Any disputes will be resolved in courts located in Nassau County, NY.\n\n"
        "**10. Contact**\n"
        "cinthia@claaesthetics.com · 516-620-9158 · 1078 Grand Avenue, South Hempstead, NY 11550."
    ),
    "refund.body": (
        "**Effective date:** {today}\n\n"
        "We want every visit to feel intentional. Our refund and cancellation policy is designed to be fair to you and to the practitioners reserving the time.\n\n"
        "**Deposits**\n"
        "All bookings require a non-refundable deposit, which is applied to the cost of your service on the day of treatment.\n\n"
        "**Cancellations & rescheduling**\n"
        "• More than 24 hours before your appointment — reschedule freely, no charge.\n"
        "• Within 24 hours — your deposit is forfeited; you may rebook by placing a new deposit.\n"
        "• No-shows — deposit is forfeited and we may require pre-payment in full for future bookings.\n\n"
        "**Memberships**\n"
        "Glow Membership renews monthly until cancelled. You can cancel anytime from your portal — your membership stays active until the end of the current billing period. No partial-month refunds.\n\n"
        "**Refunds**\n"
        "Refunds on completed treatments are generally not provided, as results vary by individual. If something went wrong, please contact Cinthia within 7 days — we will assess on a case-by-case basis and may offer a complimentary touch-up where clinically appropriate.\n\n"
        "**Packages**\n"
        "Pre-paid packages (e.g. 3-session hair restoration) are non-refundable but are transferable to immediate family members with prior approval.\n\n"
        "**How to request**\n"
        "Email cinthia@claaesthetics.com with your booking ID and concern. We respond within 2 business days."
    ),
    "cookies.body": (
        "**Effective date:** {today}\n\n"
        "https://cla-wellness.com uses a small number of cookies to make the experience secure and pleasant.\n\n"
        "**Strictly necessary**\n"
        "• Authentication cookies (`access_token`, `refresh_token`) — keep you signed in. We cannot offer the portal or booking without these.\n"
        "• CSRF / session cookies — protect form submissions from abuse.\n\n"
        "**Functional**\n"
        "• `cla_prefill`, `cla_service` — remember the slot or service you've selected so you don't have to re-enter on the booking form.\n"
        "• `cla_camille_seen` — ensures the Camille concierge greeting only opens once per session.\n\n"
        "**Analytics**\n"
        "We may use anonymised analytics (e.g. PostHog) to understand how the site is used and to improve it. No personally identifying data is sold or shared with advertisers.\n\n"
        "**Payments**\n"
        "Stripe sets its own cookies during checkout to detect and prevent fraud. See Stripe's privacy policy for details.\n\n"
        "**Your choices**\n"
        "You can clear cookies in your browser at any time. Disabling strictly-necessary cookies will prevent sign-in and bookings from working. Contact cinthia@claaesthetics.com with any questions."
    ),
    "medical_disclaimer.body": (
        "**Effective date:** {today}\n\n"
        "The content on https://cla-wellness.com is for informational purposes only. It is not medical advice and is not a substitute for in-person consultation with a licensed health-care professional.\n\n"
        "**Treatment results vary.** Every individual responds differently. Photographs, testimonials and descriptions are illustrative — they do not guarantee identical outcomes for you.\n\n"
        "**Always disclose** medications, allergies, prior treatments, pregnancy and major medical conditions during your intake. We may decline or postpone any treatment that is not medically appropriate for your circumstances.\n\n"
        "**Aftercare matters.** Following the post-treatment instructions provided to you protects results and reduces risk of complication. Contact us promptly if anything feels unusual.\n\n"
        "**In an emergency** — do not contact us first. Call 911 or attend your nearest emergency department.\n\n"
        "For non-urgent clinical questions: cinthia@claaesthetics.com · 516-620-9158."
    ),
    "accessibility.body": (
        "**Effective date:** {today}\n\n"
        "CLA Aesthetics & Wellness is committed to digital and physical accessibility for guests of all abilities.\n\n"
        "**Digital**\n"
        "https://cla-wellness.com is designed to align with WCAG 2.1 AA where possible. We continuously test for keyboard navigation, screen-reader landmarks, sufficient colour contrast and reduced-motion preferences.\n\n"
        "**At the studio**\n"
        "Our South Hempstead studio offers level entry and a quiet, calming environment. If you have specific accessibility needs (mobility, hearing, sensory or otherwise) please tell us in advance and we will adapt your visit.\n\n"
        "**Feedback**\n"
        "If you encounter a barrier on this site or at the studio, please email cinthia@claaesthetics.com or call 516-620-9158. We aim to respond within 2 business days and to remediate promptly.\n\n"
        "Last accessibility review: ongoing — quarterly internal audits and on-demand fixes."
    ),
    "contact.body": (
        "**Visit us**\n"
        "1078 Grand Avenue, South Hempstead, NY 11550\n\n"
        "**Hours**\n"
        "Monday–Friday · 10:00 AM – 8:00 PM\n"
        "Saturday · 9:00 AM – 6:00 PM\n"
        "Sunday · by appointment\n\n"
        "**Reach Cinthia**\n"
        "Phone · 516-620-9158\n"
        "Email · cinthia@claaesthetics.com\n"
        "Instagram · @CLAAesthetics\n\n"
        "For booking and rescheduling, the fastest route is our online booking. For anything that needs a human, just call or message — we read everything."
    ),
}


@api_router.get("/content")
async def get_content():
    docs = await db.content.find({}, {"_id": 0}).to_list(500)
    result = dict(DEFAULT_CONTENT)
    for d in docs:
        result[d["key"]] = d["value"]
    return result


@api_router.put("/admin/content")
async def update_content(payload: ContentBlockIn, _: dict = Depends(require_admin)):
    await db.content.update_one(
        {"key": payload.key},
        {"$set": {"key": payload.key, "value": payload.value, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    return {"ok": True}


@api_router.post("/admin/content/reset")
async def reset_content(_: dict = Depends(require_admin)):
    await db.content.delete_many({})
    return {"ok": True}


# ============================================================
# ============ SITE EDITOR — CMS COLLECTIONS ==================
# ============================================================

# Default seeds — loaded into Mongo on first startup if collections are empty.
DEFAULT_TESTIMONIALS = [
    {"id": "t1", "order": 1, "name": "Sophia M.", "text": "Walking into CLA is like exhaling. My skin has never looked this radiant — Cinthia genuinely listens and customizes everything.", "rating": 5},
    {"id": "t2", "order": 2, "name": "Marisa L.", "text": "The most thoughtful, calming experience. The signature facial gave me a glow that lasted weeks. I cannot recommend it enough.", "rating": 5},
    {"id": "t3", "order": 3, "name": "Eliana R.", "text": "Refined, elegant, attentive. Every detail is intentional. This is now my monthly ritual and a true gift to myself.", "rating": 5},
    {"id": "t4", "order": 4, "name": "Camille S.", "text": "From the moment I sat down to the goodbye at the door — pure luxury. The deep tissue massage melted months of tension.", "rating": 5},
]

DEFAULT_GALLERY = [
    {"id": "g1", "order": 1, "src": "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=80", "span": "lg:col-span-2 lg:row-span-2 h-[420px] lg:h-auto", "alt": "Treatment ritual"},
    {"id": "g2", "order": 2, "src": "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80", "span": "h-[260px]", "alt": "Warm candles"},
    {"id": "g3", "order": 3, "src": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80", "span": "h-[260px]", "alt": "Botanical apothecary"},
    {"id": "g4", "order": 4, "src": "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=900&q=80", "span": "h-[260px]", "alt": "Hands-on care"},
    {"id": "g5", "order": 5, "src": "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80", "span": "lg:col-span-2 h-[260px]", "alt": "Restorative massage"},
    {"id": "g6", "order": 6, "src": "https://images.unsplash.com/photo-1583416750470-965b2707b355?auto=format&fit=crop&w=900&q=80", "span": "h-[260px]", "alt": "Glow result"},
]

DEFAULT_TREATMENTS_MENU = [
    {"id": "m1", "order": 1, "category": "luxury", "name": "Botox", "price": "From $12 / unit", "bullets": ["Smooth fine lines", "Results last 3–4 months"]},
    {"id": "m2", "order": 2, "category": "luxury", "name": "Dermal Fillers", "price": "From $650 / syringe", "bullets": ["Enhance contours", "Natural volume"]},
    {"id": "m3", "order": 3, "category": "luxury", "name": "PDO Thread Lift", "price": "From $800 / session", "bullets": ["Non-surgical lift", "Natural contours"]},
    {"id": "m4", "order": 4, "category": "wellness", "name": "IV Nutrition Therapy", "price": "From $185", "bullets": ["Boost immunity", "Enhance energy", "Rapid hydration"]},
    {"id": "m5", "order": 5, "category": "luxury", "name": "PRP Facial", "price": "From $450", "bullets": ["Collagen boost", "Radiant rejuvenation"]},
    {"id": "m6", "order": 6, "category": "luxury", "name": "Laser Therapy", "price": "From $295", "bullets": ["Target imperfections", "Smoother, clearer skin"]},
    {"id": "m7", "order": 7, "category": "luxury", "name": "PRF Treatment", "price": "From $500", "bullets": ["Advanced healing", "Natural glow"]},
    {"id": "m8", "order": 8, "category": "luxury", "name": "Hydrofacial", "price": "From $250", "bullets": ["Deep cleansing", "Hydration boost", "Instant glow"]},
    {"id": "m9", "order": 9, "category": "wellness", "name": "Hair Restoration", "price": "From $500 / session · 3-pack $1,350", "bullets": ["Fuller, thicker hair"]},
    {"id": "m10", "order": 10, "category": "wellness", "name": "Weight Loss Program", "price": "From $299", "bullets": ["Customized plans", "Medical supervision"]},
    {"id": "m11", "order": 11, "category": "luxury", "name": "Microneedling + PRP", "price": "From $400 / session", "bullets": ["Skin renewal", "Even tone"]},
    {"id": "m12", "order": 12, "category": "luxury", "name": "Skin Rejuvenation", "price": "From $350", "bullets": ["Complete transformation", "Radiant results"]},
]

DEFAULT_HERO_IMAGES = [
    {"id": "h1", "order": 1, "src": "https://images.unsplash.com/photo-1733685372441-c3a2a6e3222c?crop=entropy&cs=srgb&fm=jpg&q=85", "alt": "Cinthia, Founder & CEO"},
]

DEFAULT_TEAM = [
    {"id": "tm1", "order": 1, "name": "Cinthia Lariviere Alexandre", "role": "Founder & Lead Aesthetician", "image": "https://images.unsplash.com/photo-1733685372441-c3a2a6e3222c?crop=entropy&cs=srgb&fm=jpg&q=85", "bio": "Cinthia founded CLA on a simple belief: refinement should feel personal. With over a decade of experience in advanced injectables and skin rejuvenation, she curates every ritual herself."},
]


# ---------------- Public collection GETs ----------------
@api_router.get("/testimonials")
async def get_testimonials():
    items = await db.testimonials.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return {"testimonials": items or DEFAULT_TESTIMONIALS}


@api_router.get("/gallery")
async def get_gallery():
    items = await db.gallery.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return {"gallery": items or DEFAULT_GALLERY}


@api_router.get("/treatments-menu")
async def get_treatments_menu():
    items = await db.treatments_menu.find({}, {"_id": 0}).sort("order", 1).to_list(200)
    return {"items": items or DEFAULT_TREATMENTS_MENU}


@api_router.get("/hero-images")
async def get_hero_images():
    items = await db.hero_images.find({}, {"_id": 0}).sort("order", 1).to_list(50)
    if items:
        return {"images": items}
    # Fallback: prefer the admin-managed facility image; if none, use static default
    doc = await db.content.find_one({"key": "brand.hero_facility_image_url"}, {"_id": 0})
    facility_url = (doc or {}).get("value") if doc else None
    if facility_url:
        return {"images": [{"id": "facility", "order": 1, "src": facility_url, "alt": "Inside the CLA Aesthetics studio"}]}
    return {"images": DEFAULT_HERO_IMAGES}


@api_router.get("/team")
async def get_team():
    items = await db.team.find({}, {"_id": 0}).sort("order", 1).to_list(100)
    return {"team": items or DEFAULT_TEAM}


# ---------------- Admin CRUD: generic helper ----------------
def _coll_for(kind: str):
    mapping = {
        "services": db.services,
        "testimonials": db.testimonials,
        "gallery": db.gallery,
        "treatments_menu": db.treatments_menu,
        "hero_images": db.hero_images,
        "team": db.team,
    }
    if kind not in mapping:
        raise HTTPException(status_code=404, detail=f"Unknown collection: {kind}")
    return mapping[kind]


@api_router.get("/admin/cms/{kind}")
async def admin_cms_list(kind: str, _: dict = Depends(require_admin)):
    coll = _coll_for(kind)
    items = await coll.find({}, {"_id": 0}).sort("order", 1).to_list(500)
    # If empty, auto-persist defaults so admin CRUD (edit / delete / reorder) works immediately
    if not items:
        defaults = {
            "services": SERVICES,
            "testimonials": DEFAULT_TESTIMONIALS,
            "gallery": DEFAULT_GALLERY,
            "treatments_menu": DEFAULT_TREATMENTS_MENU,
            "hero_images": DEFAULT_HERO_IMAGES,
            "team": DEFAULT_TEAM,
        }
        seed = defaults.get(kind, [])
        if seed:
            # Deep-copy so we don't mutate the module-level DEFAULT_* lists
            import copy as _copy
            seed_copy = _copy.deepcopy(seed)
            for i, item in enumerate(seed_copy):
                item.setdefault("id", str(uuid.uuid4()))
                item.setdefault("order", i + 1)
            await coll.insert_many([dict(x) for x in seed_copy])
            items = await coll.find({}, {"_id": 0}).sort("order", 1).to_list(500)
    return {"items": items}


@api_router.post("/admin/cms/{kind}/seed")
async def admin_cms_seed(kind: str, _: dict = Depends(require_admin)):
    """Force-reseed defaults into the collection (clears existing entries)."""
    coll = _coll_for(kind)
    defaults = {
        "services": SERVICES,
        "testimonials": DEFAULT_TESTIMONIALS,
        "gallery": DEFAULT_GALLERY,
        "treatments_menu": DEFAULT_TREATMENTS_MENU,
        "hero_images": DEFAULT_HERO_IMAGES,
        "team": DEFAULT_TEAM,
    }
    seed = defaults.get(kind, [])
    await coll.delete_many({})
    if seed:
        # Ensure each item has an id and order
        for i, item in enumerate(seed):
            item.setdefault("id", str(uuid.uuid4()))
            item.setdefault("order", i + 1)
        await coll.insert_many([dict(x) for x in seed])
    return {"ok": True, "count": len(seed)}


@api_router.post("/admin/cms/{kind}")
async def admin_cms_create(kind: str, item: dict, _: dict = Depends(require_admin)):
    coll = _coll_for(kind)
    item["id"] = item.get("id") or str(uuid.uuid4())
    # Place at the end by default
    count = await coll.count_documents({})
    item.setdefault("order", count + 1)
    await coll.insert_one(dict(item))
    item.pop("_id", None)
    return {"ok": True, "item": item}


@api_router.put("/admin/cms/{kind}/{item_id}")
async def admin_cms_update(kind: str, item_id: str, item: dict, _: dict = Depends(require_admin)):
    coll = _coll_for(kind)
    item.pop("_id", None)
    item["id"] = item_id
    res = await coll.update_one({"id": item_id}, {"$set": item}, upsert=True)
    return {"ok": True, "matched": res.matched_count}


@api_router.delete("/admin/cms/{kind}/{item_id}")
async def admin_cms_delete(kind: str, item_id: str, _: dict = Depends(require_admin)):
    coll = _coll_for(kind)
    res = await coll.delete_one({"id": item_id})
    return {"ok": True, "deleted": res.deleted_count}


@api_router.post("/admin/cms/{kind}/reorder")
async def admin_cms_reorder(kind: str, payload: dict, _: dict = Depends(require_admin)):
    """payload = { ordered_ids: [id1, id2, ...] }"""
    coll = _coll_for(kind)
    ids = payload.get("ordered_ids") or []
    for i, _id in enumerate(ids):
        await coll.update_one({"id": _id}, {"$set": {"order": i + 1}})
    return {"ok": True}


# ============================================================
# ============ OBJECT STORAGE (IMAGE UPLOADS) =================
# ============================================================
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "cla-aesthetics"
storage_key: Optional[str] = None
ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_MIME = {"video/mp4", "video/webm", "video/quicktime", "video/ogg"}
ALLOWED_UPLOAD_MIME = ALLOWED_IMAGE_MIME | ALLOWED_VIDEO_MIME
MAX_UPLOAD_BYTES = 50 * 1024 * 1024
MAX_VIDEO_BYTES = 50 * 1024 * 1024


def init_storage() -> Optional[str]:
    """Initialize once. Returns reusable storage_key, or None if unavailable."""
    global storage_key
    if storage_key:
        return storage_key
    key = os.environ.get("EMERGENT_LLM_KEY")
    if not key:
        logger.warning("EMERGENT_LLM_KEY not set — image uploads disabled.")
        return None
    try:
        resp = requests.post(f"{STORAGE_URL}/init", json={"emergent_key": key}, timeout=30)
        resp.raise_for_status()
        storage_key = resp.json().get("storage_key")
        logger.info("Object storage initialized.")
        return storage_key
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
        return None


def put_object(path: str, data: bytes, content_type: str) -> dict:
    key = init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Image storage is not available.")
    resp = requests.put(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key, "Content-Type": content_type},
        data=data,
        timeout=120,
    )
    if resp.status_code == 403:
        # Refresh storage_key once and retry
        global storage_key
        storage_key = None
        key = init_storage()
        resp = requests.put(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key, "Content-Type": content_type},
            data=data,
            timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def get_object(path: str):
    key = init_storage()
    if not key:
        raise HTTPException(status_code=503, detail="Image storage is not available.")
    resp = requests.get(
        f"{STORAGE_URL}/objects/{path}",
        headers={"X-Storage-Key": key},
        timeout=60,
    )
    if resp.status_code == 403:
        global storage_key
        storage_key = None
        key = init_storage()
        resp = requests.get(
            f"{STORAGE_URL}/objects/{path}",
            headers={"X-Storage-Key": key},
            timeout=60,
        )
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="File not found.")
    resp.raise_for_status()
    return resp.content, resp.headers.get("Content-Type", "application/octet-stream")


@api_router.post("/admin/upload")
async def admin_upload(file: UploadFile = File(...), admin: dict = Depends(require_admin)):
    if file.content_type not in ALLOWED_UPLOAD_MIME:
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Allowed: {sorted(ALLOWED_UPLOAD_MIME)}")
    is_video = file.content_type in ALLOWED_VIDEO_MIME
    data = await file.read()
    limit = MAX_VIDEO_BYTES if is_video else MAX_UPLOAD_BYTES
    if len(data) > limit:
        raise HTTPException(status_code=400, detail=f"File too large. Max {limit // (1024*1024)} MB.")
    if not data:
        raise HTTPException(status_code=400, detail="Empty file.")
    ext_map = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov", "video/ogg": "ogv"}
    ext = ext_map.get(file.content_type, "bin")
    path = f"{APP_NAME}/uploads/{admin['id']}/{uuid.uuid4()}.{ext}"
    result = put_object(path, data, file.content_type)
    final_path = result.get("path") or path

    # Persist a reference
    await db.files.insert_one({
        "id": str(uuid.uuid4()),
        "storage_path": final_path,
        "original_filename": file.filename,
        "content_type": file.content_type,
        "size": result.get("size", len(data)),
        "uploaded_by": admin["id"],
        "is_deleted": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Public URL the frontend can drop into any image field
    url = f"/api/uploads/{final_path}"
    return {"ok": True, "url": url, "path": final_path, "content_type": file.content_type, "size": result.get("size", len(data))}


@api_router.get("/uploads/{path:path}")
async def serve_upload(path: str):
    record = await db.files.find_one({"storage_path": path, "is_deleted": False}, {"_id": 0})
    if not record:
        raise HTTPException(status_code=404, detail="File not found.")
    data, ct = get_object(path)
    return Response(
        content=data,
        media_type=record.get("content_type") or ct,
        headers={"Cache-Control": "public, max-age=2592000, immutable"},
    )


@api_router.get("/admin/uploads")
async def list_uploads(admin: dict = Depends(require_admin)):
    cur = db.files.find({"is_deleted": False}, {"_id": 0}).sort("created_at", -1).limit(200)
    items = [f async for f in cur]
    for it in items:
        it["url"] = f"/api/uploads/{it['storage_path']}"
    return {"items": items}


@api_router.delete("/admin/uploads/{file_id}")
async def delete_upload(file_id: str, _: dict = Depends(require_admin)):
    res = await db.files.update_one({"id": file_id}, {"$set": {"is_deleted": True}})
    return {"ok": True, "deleted": res.modified_count}


# ---------------- Analytics ----------------
class TrackIn(BaseModel):
    path: str = "/"
    visitor_id: str = Field(min_length=4, max_length=80)
    referrer: Optional[str] = ""


@api_router.post("/track")
async def track_view(payload: TrackIn, request: Request):
    now = datetime.now(timezone.utc)
    await db.page_views.insert_one({
        "id": str(uuid.uuid4()),
        "path": payload.path[:200],
        "visitor_id": payload.visitor_id,
        "referrer": (payload.referrer or "")[:300],
        "ua": request.headers.get("user-agent", "")[:200],
        "day": now.strftime("%Y-%m-%d"),
        "created_at": now.isoformat(),
    })
    return {"ok": True}


@api_router.get("/admin/stats")
async def admin_stats(days: int = 30, _: dict = Depends(require_admin)):
    days = max(7, min(days, 90))
    now = datetime.now(timezone.utc)
    start = now - timedelta(days=days - 1)
    start_day = start.strftime("%Y-%m-%d")
    day_keys = [(start + timedelta(days=i)).strftime("%Y-%m-%d") for i in range(days)]

    views_agg = await db.page_views.aggregate([
        {"$match": {"day": {"$gte": start_day}}},
        {"$group": {"_id": "$day", "views": {"$sum": 1}, "visitors": {"$addToSet": "$visitor_id"}}},
    ]).to_list(200)
    views_map = {x["_id"]: {"views": x["views"], "visitors": len(x["visitors"])} for x in views_agg}

    leads_agg = await db.leads.aggregate([
        {"$match": {"created_at": {"$gte": start.isoformat()}}},
        {"$group": {"_id": {"$substr": ["$created_at", 0, 10]}, "count": {"$sum": 1}}},
    ]).to_list(200)
    leads_map = {x["_id"]: x["count"] for x in leads_agg}

    series = [{"day": d, "views": views_map.get(d, {}).get("views", 0), "visitors": views_map.get(d, {}).get("visitors", 0), "inquiries": leads_map.get(d, 0)} for d in day_keys]

    status_agg = await db.leads.aggregate([{"$group": {"_id": "$status", "count": {"$sum": 1}}}]).to_list(20)
    top_pages = await db.page_views.aggregate([
        {"$match": {"day": {"$gte": start_day}}},
        {"$group": {"_id": "$path", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}, {"$limit": 6},
    ]).to_list(6)
    interest_agg = await db.leads.aggregate([
        {"$match": {"interest": {"$nin": ["", None]}}},
        {"$group": {"_id": "$interest", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}, {"$limit": 6},
    ]).to_list(6)

    today = now.strftime("%Y-%m-%d")
    total_views = sum(x["views"] for x in series)
    unique_visitors = len(await db.page_views.distinct("visitor_id", {"day": {"$gte": start_day}}))
    return {
        "days": days,
        "series": series,
        "totals": {
            "views": total_views,
            "visitors": unique_visitors,
            "views_today": views_map.get(today, {}).get("views", 0),
            "inquiries": await db.leads.count_documents({}),
            "inquiries_new": await db.leads.count_documents({"status": "new"}),
            "inquiries_period": sum(leads_map.values()),
            "gallery": await db.gallery.count_documents({}),
            "blog_posts": await db.blog.count_documents({"published": True}),
            "uploads": await db.files.count_documents({"is_deleted": False}),
            "offers": await db.offers.count_documents({"active": True}),
        },
        "lead_status": [{"status": x["_id"] or "new", "count": x["count"]} for x in status_agg],
        "top_pages": [{"path": x["_id"], "count": x["count"]} for x in top_pages],
        "top_interests": [{"interest": x["_id"], "count": x["count"]} for x in interest_agg],
        "recent_leads": await db.leads.find({}, {"_id": 0}).sort("created_at", -1).limit(6).to_list(6),
    }


# ---------------- Startup ----------------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("key")
    await db.chat_messages.create_index([("session_id", 1), ("created_at", 1)])
    await db.page_views.create_index([("day", 1), ("visitor_id", 1)])
    await db.blog.create_index("slug", unique=True)
    await db.leads.create_index("created_at")
    await db.content.create_index("key", unique=True)
    await db.files.create_index("storage_path", unique=True)
    # Initialize object storage (non-fatal if it fails — uploads will return 503)
    try:
        init_storage()
    except Exception as e:
        logger.warning(f"Storage init failed (uploads disabled): {e}")

    # Seed admin idempotently
    admin_email = os.environ.get("ADMIN_EMAIL", "").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if admin_email and admin_password:
        existing = await db.users.find_one({"email": admin_email})
        if not existing:
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "email": admin_email,
                "name": "Cinthia Lariviere Alexandre",
                "phone": "+15166209158",
                "role": "admin",
                "password_hash": hash_password(admin_password),
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
            logger.info(f"Seeded admin: {admin_email}")
        else:
            # If env password differs from current hash, update it
            if not verify_password(admin_password, existing.get("password_hash", "")):
                await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password), "role": "admin"}})
                logger.info(f"Updated admin password: {admin_email}")


@app.on_event("shutdown")
async def shutdown():
    client.close()


# ---------------- Mount ----------------
app.include_router(api_router)

origins = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]

# When credentials=True, browsers reject wildcard origins. Use regex to echo any origin back.
# This allows the app to work on the Emergent preview URL, the deployed *.emergent.host URL,
# and any custom domain (e.g., cla-bangladesh.com, cla-wellness.com) the admin maps later.
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else [],
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
