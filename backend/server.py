from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import jwt
import bcrypt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

# =============================================================================
# CONFIG
# =============================================================================
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'admin@ccauvery.edu')
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'Admin@123')

app = FastAPI(title="CCAUVERY API")
api = APIRouter(prefix="/api")

# =============================================================================
# AUTH HELPERS
# =============================================================================
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id, "email": email, "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth[7:] if auth.startswith("Bearer ") else request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def require_role(*roles: str):
    async def checker(user: dict = Depends(get_current_user)):
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return checker

# =============================================================================
# MODELS
# =============================================================================
class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: datetime

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=2)
    role: Literal["student", "faculty"] = "student"

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class CourseIn(BaseModel):
    code: str
    name: str
    duration: str
    description: str
    eligibility: str
    syllabus: List[str] = []
    careers: List[str] = []
    fees: float = 0
    image: Optional[str] = None

class Course(CourseIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FacultyIn(BaseModel):
    name: str
    designation: str
    qualification: str
    department: str
    email: Optional[str] = None
    bio: Optional[str] = None
    photo: Optional[str] = None

class Faculty(FacultyIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class EventIn(BaseModel):
    title: str
    description: str
    date: str  # ISO date
    location: str
    image: Optional[str] = None
    category: str = "general"

class Event(EventIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AlumniIn(BaseModel):
    name: str
    batch: str
    role: str  # current job title
    company: str
    story: str
    photo: Optional[str] = None

class Alumni(AlumniIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class AdmissionIn(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    dob: str
    gender: str
    address: str
    course_code: str
    qualification: str
    marks: float

class Admission(AdmissionIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "pending"  # pending / accepted / rejected
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ContactIn(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class ContactMsg(ContactIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MaterialIn(BaseModel):
    title: str
    course_code: str
    description: str
    file_url: str
    uploaded_by: Optional[str] = None

class Material(MaterialIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AttendanceIn(BaseModel):
    student_email: str
    course_code: str
    date: str
    status: Literal["present", "absent"]

class Attendance(AttendanceIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    marked_by: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class NotificationIn(BaseModel):
    title: str
    message: str
    audience: Literal["all", "students", "faculty"] = "all"

class Notification(NotificationIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeeIn(BaseModel):
    student_email: str
    course_code: str
    amount: float
    semester: str

class Fee(FeeIn):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: Literal["pending", "paid"] = "pending"
    paid_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# =============================================================================
# AUTH ROUTES
# =============================================================================
@api.post("/auth/register", response_model=AuthOut)
async def register(data: RegisterIn):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": data.name,
        "role": data.role,
        "password_hash": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_doc["id"], email, data.role)
    user_doc.pop("password_hash")
    user_doc.pop("_id", None)
    user_doc["created_at"] = datetime.fromisoformat(user_doc["created_at"])
    return AuthOut(access_token=token, user=UserOut(**user_doc))

@api.post("/auth/login", response_model=AuthOut)
async def login(data: LoginIn):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email, user["role"])
    created_at = user["created_at"]
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    return AuthOut(
        access_token=token,
        user=UserOut(id=user["id"], email=user["email"], name=user["name"], role=user["role"], created_at=created_at),
    )

@api.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    created_at = user["created_at"]
    if isinstance(created_at, str):
        created_at = datetime.fromisoformat(created_at)
    return UserOut(id=user["id"], email=user["email"], name=user["name"], role=user["role"], created_at=created_at)

# =============================================================================
# COURSES
# =============================================================================
@api.get("/courses", response_model=List[Course])
async def list_courses():
    docs = await db.courses.find({}, {"_id": 0}).to_list(100)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs

@api.get("/courses/{code}", response_model=Course)
async def get_course(code: str):
    doc = await db.courses.find_one({"code": code.upper()}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Course not found")
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return doc

@api.post("/courses", response_model=Course)
async def create_course(data: CourseIn, _: dict = Depends(require_role("admin"))):
    payload = data.model_dump()
    payload["code"] = payload["code"].upper()
    course = Course(**payload)
    doc = course.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.courses.insert_one(doc)
    return course

@api.delete("/courses/{course_id}")
async def delete_course(course_id: str, _: dict = Depends(require_role("admin"))):
    await db.courses.delete_one({"id": course_id})
    return {"ok": True}

# =============================================================================
# FACULTY
# =============================================================================
@api.get("/faculty", response_model=List[Faculty])
async def list_faculty():
    docs = await db.faculty.find({}, {"_id": 0}).to_list(200)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs

@api.post("/faculty", response_model=Faculty)
async def create_faculty(data: FacultyIn, _: dict = Depends(require_role("admin"))):
    f = Faculty(**data.model_dump())
    doc = f.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.faculty.insert_one(doc)
    return f

@api.delete("/faculty/{faculty_id}")
async def delete_faculty(faculty_id: str, _: dict = Depends(require_role("admin"))):
    await db.faculty.delete_one({"id": faculty_id})
    return {"ok": True}

# =============================================================================
# EVENTS
# =============================================================================
@api.get("/events", response_model=List[Event])
async def list_events():
    docs = await db.events.find({}, {"_id": 0}).sort("date", -1).to_list(200)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs

@api.get("/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    doc = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Event not found")
    if isinstance(doc.get("created_at"), str):
        doc["created_at"] = datetime.fromisoformat(doc["created_at"])
    return doc

@api.post("/events", response_model=Event)
async def create_event(data: EventIn, _: dict = Depends(require_role("admin"))):
    e = Event(**data.model_dump())
    doc = e.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.events.insert_one(doc)
    return e

@api.delete("/events/{event_id}")
async def delete_event(event_id: str, _: dict = Depends(require_role("admin"))):
    await db.events.delete_one({"id": event_id})
    return {"ok": True}

# =============================================================================
# ALUMNI
# =============================================================================
@api.get("/alumni", response_model=List[Alumni])
async def list_alumni():
    return await db.alumni.find({}, {"_id": 0}).to_list(200)

@api.post("/alumni", response_model=Alumni)
async def create_alumni(data: AlumniIn, _: dict = Depends(require_role("admin"))):
    a = Alumni(**data.model_dump())
    await db.alumni.insert_one(a.model_dump())
    return a

# =============================================================================
# ADMISSIONS
# =============================================================================
@api.post("/admissions", response_model=Admission)
async def submit_admission(data: AdmissionIn):
    a = Admission(**data.model_dump())
    doc = a.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.admissions.insert_one(doc)
    return a

@api.get("/admissions", response_model=List[Admission])
async def list_admissions(_: dict = Depends(require_role("admin"))):
    docs = await db.admissions.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs

@api.patch("/admissions/{admission_id}")
async def update_admission(admission_id: str, status_value: str, _: dict = Depends(require_role("admin"))):
    if status_value not in ("pending", "accepted", "rejected"):
        raise HTTPException(400, "Invalid status")
    await db.admissions.update_one({"id": admission_id}, {"$set": {"status": status_value}})
    return {"ok": True}

# =============================================================================
# CONTACT
# =============================================================================
@api.post("/contact", response_model=ContactMsg)
async def post_contact(data: ContactIn):
    m = ContactMsg(**data.model_dump())
    doc = m.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.contact.insert_one(doc)
    return m

@api.get("/contact", response_model=List[ContactMsg])
async def list_contact(_: dict = Depends(require_role("admin"))):
    docs = await db.contact.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs

# =============================================================================
# MATERIALS
# =============================================================================
@api.get("/materials", response_model=List[Material])
async def list_materials(course_code: Optional[str] = None):
    q = {"course_code": course_code.upper()} if course_code else {}
    docs = await db.materials.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs

@api.post("/materials", response_model=Material)
async def create_material(data: MaterialIn, user: dict = Depends(require_role("admin", "faculty"))):
    payload = data.model_dump(exclude={"uploaded_by"})
    payload["uploaded_by"] = user["email"]
    m = Material(**payload)
    doc = m.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["course_code"] = doc["course_code"].upper()
    await db.materials.insert_one(doc)
    return m

@api.delete("/materials/{material_id}")
async def delete_material(material_id: str, _: dict = Depends(require_role("admin", "faculty"))):
    await db.materials.delete_one({"id": material_id})
    return {"ok": True}

# =============================================================================
# ATTENDANCE
# =============================================================================
@api.post("/attendance", response_model=Attendance)
async def mark_attendance(data: AttendanceIn, user: dict = Depends(require_role("admin", "faculty"))):
    a = Attendance(**data.model_dump(), marked_by=user["email"])
    doc = a.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.attendance.insert_one(doc)
    return a

@api.get("/attendance", response_model=List[Attendance])
async def list_attendance(student_email: Optional[str] = None, user: dict = Depends(get_current_user)):
    if user["role"] == "student":
        student_email = user["email"]
    q = {"student_email": student_email.lower()} if student_email else {}
    docs = await db.attendance.find(q, {"_id": 0}).sort("date", -1).to_list(500)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs

# =============================================================================
# NOTIFICATIONS
# =============================================================================
@api.get("/notifications", response_model=List[Notification])
async def list_notifications(user: dict = Depends(get_current_user)):
    role_filter = {"audience": {"$in": ["all", user["role"] + "s"]}}
    docs = await db.notifications.find(role_filter, {"_id": 0}).sort("created_at", -1).to_list(100)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs

@api.post("/notifications", response_model=Notification)
async def create_notification(data: NotificationIn, _: dict = Depends(require_role("admin"))):
    n = Notification(**data.model_dump())
    doc = n.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.notifications.insert_one(doc)
    return n

# =============================================================================
# FEES
# =============================================================================
@api.get("/fees", response_model=List[Fee])
async def list_fees(student_email: Optional[str] = None, user: dict = Depends(get_current_user)):
    if user["role"] == "student":
        student_email = user["email"]
    q = {"student_email": student_email.lower()} if student_email else {}
    docs = await db.fees.find(q, {"_id": 0}).sort("created_at", -1).to_list(500)
    for d in docs:
        for k in ("created_at", "paid_at"):
            if isinstance(d.get(k), str):
                d[k] = datetime.fromisoformat(d[k])
    return docs

@api.post("/fees", response_model=Fee)
async def create_fee(data: FeeIn, _: dict = Depends(require_role("admin"))):
    f = Fee(**data.model_dump())
    doc = f.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    if doc.get("paid_at"):
        doc["paid_at"] = doc["paid_at"].isoformat()
    await db.fees.insert_one(doc)
    return f

@api.post("/fees/{fee_id}/pay")
async def pay_fee(fee_id: str, user: dict = Depends(get_current_user)):
    fee = await db.fees.find_one({"id": fee_id}, {"_id": 0})
    if not fee:
        raise HTTPException(404, "Fee not found")
    if user["role"] == "student" and fee["student_email"].lower() != user["email"].lower():
        raise HTTPException(403, "Forbidden")
    await db.fees.update_one(
        {"id": fee_id},
        {"$set": {"status": "paid", "paid_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"ok": True, "message": "Payment recorded (mock)."}

# =============================================================================
# ADMIN: USERS
# =============================================================================
@api.get("/users")
async def list_users(_: dict = Depends(require_role("admin"))):
    docs = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    for d in docs:
        if isinstance(d.get("created_at"), str):
            d["created_at"] = datetime.fromisoformat(d["created_at"])
    return docs

@api.delete("/users/{user_id}")
async def delete_user(user_id: str, _: dict = Depends(require_role("admin"))):
    await db.users.delete_one({"id": user_id})
    return {"ok": True}

# =============================================================================
# STATS (analytics)
# =============================================================================
@api.get("/stats")
async def stats():
    return {
        "students": await db.users.count_documents({"role": "student"}),
        "faculty": await db.faculty.count_documents({}),
        "courses": await db.courses.count_documents({}),
        "events": await db.events.count_documents({}),
        "alumni": await db.alumni.count_documents({}),
        "admissions": await db.admissions.count_documents({}),
    }

# =============================================================================
# HEALTH
# =============================================================================
@api.get("/")
async def root():
    return {"name": "CCAUVERY API", "status": "ok"}

# =============================================================================
# SEED DATA
# =============================================================================
async def seed_admin():
    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": ADMIN_EMAIL,
            "name": "CCAUVERY Admin",
            "role": "admin",
            "password_hash": hash_password(ADMIN_PASSWORD),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(ADMIN_PASSWORD, existing["password_hash"]):
        await db.users.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}},
        )

async def seed_demo_users():
    demos = [
        {"email": "faculty@ccauvery.edu", "name": "Dr. Anjali Rao", "role": "faculty", "password": "Faculty@123"},
        {"email": "student@ccauvery.edu", "name": "Rohan Kumar", "role": "student", "password": "Student@123"},
    ]
    for d in demos:
        if not await db.users.find_one({"email": d["email"]}):
            await db.users.insert_one({
                "id": str(uuid.uuid4()),
                "email": d["email"],
                "name": d["name"],
                "role": d["role"],
                "password_hash": hash_password(d["password"]),
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

async def seed_courses():
    if await db.courses.count_documents({}) > 0:
        return
    courses_data = [
        {
            "code": "BCA", "name": "Bachelor of Computer Applications",
            "duration": "3 Years", "fees": 45000,
            "description": "A comprehensive programme that develops expertise in software development, data structures, web technologies, AI fundamentals, and IT systems — preparing graduates for the booming digital economy.",
            "eligibility": "10+2 in any stream with Mathematics or Computer Science (min 50%).",
            "syllabus": ["Programming in C/C++", "Data Structures & Algorithms", "Database Management Systems", "Web Development (MERN)", "Operating Systems", "Software Engineering", "AI & Machine Learning Basics", "Cloud Computing"],
            "careers": ["Software Engineer", "Full-Stack Developer", "Data Analyst", "Cloud Engineer", "AI/ML Associate"],
            "image": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=900&q=80",
        },
        {
            "code": "BBA", "name": "Bachelor of Business Administration",
            "duration": "3 Years", "fees": 42000,
            "description": "An industry-aligned management programme covering finance, marketing, HR, entrepreneurship, and digital strategy — building tomorrow's leaders and changemakers.",
            "eligibility": "10+2 in any stream (min 45%).",
            "syllabus": ["Principles of Management", "Financial Accounting", "Marketing Management", "Human Resource Management", "Business Analytics", "Entrepreneurship", "Digital Marketing", "Strategic Management"],
            "careers": ["Business Analyst", "Marketing Executive", "HR Associate", "Entrepreneur", "Operations Manager"],
            "image": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
        },
        {
            "code": "BCOM", "name": "Bachelor of Commerce",
            "duration": "3 Years", "fees": 38000,
            "description": "A rigorous foundation in accounting, taxation, finance, economics, and corporate law — designed for careers in CA, banking, finance, and the global commerce ecosystem.",
            "eligibility": "10+2 in Commerce / any stream (min 45%).",
            "syllabus": ["Financial Accounting", "Corporate Accounting", "Cost & Management Accounting", "Income Tax & GST", "Business Law", "Auditing", "Banking & Insurance", "International Business"],
            "careers": ["Chartered Accountant", "Banking Officer", "Tax Consultant", "Financial Analyst", "Auditor"],
            "image": "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=900&q=80",
        },
    ]
    for c in courses_data:
        course = Course(**c)
        doc = course.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.courses.insert_one(doc)

async def seed_faculty():
    if await db.faculty.count_documents({}) > 0:
        return
    fac = [
        {"name": "Dr. Anjali Rao", "designation": "Principal", "qualification": "Ph.D. in Education", "department": "Administration",
         "email": "principal@ccauvery.edu", "bio": "20+ years driving academic excellence in higher education.",
         "photo": "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=600&q=80"},
        {"name": "Prof. Suresh Nair", "designation": "HOD - Computer Applications", "qualification": "M.Tech, Ph.D. (CS)", "department": "BCA",
         "email": "suresh.nair@ccauvery.edu", "bio": "Researcher in AI and distributed systems.",
         "photo": "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=600&q=80"},
        {"name": "Dr. Meera Iyer", "designation": "HOD - Management", "qualification": "MBA, Ph.D. (Marketing)", "department": "BBA",
         "email": "meera.iyer@ccauvery.edu", "bio": "Author and consultant in strategic marketing.",
         "photo": "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=600&q=80"},
        {"name": "Prof. Karthik Bhat", "designation": "HOD - Commerce", "qualification": "M.Com, Ph.D. (Finance)", "department": "BCOM",
         "email": "karthik.bhat@ccauvery.edu", "bio": "Specialises in corporate finance and taxation.",
         "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80"},
        {"name": "Ms. Priya Menon", "designation": "Asst. Professor", "qualification": "M.C.A., NET", "department": "BCA",
         "email": "priya.menon@ccauvery.edu", "bio": "Full-stack developer turned educator.",
         "photo": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80"},
        {"name": "Mr. Arjun Pillai", "designation": "Asst. Professor", "qualification": "MBA, UGC-NET", "department": "BBA",
         "email": "arjun.pillai@ccauvery.edu", "bio": "Industry mentor with 12+ years in consulting.",
         "photo": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=600&q=80"},
    ]
    for f in fac:
        obj = Faculty(**f)
        doc = obj.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.faculty.insert_one(doc)

async def seed_events():
    if await db.events.count_documents({}) > 0:
        return
    events = [
        {"title": "TechFest 2026 — Innovate. Create. Inspire.", "date": "2026-03-12",
         "location": "Main Auditorium", "category": "Technology",
         "description": "Annual flagship technology festival featuring hackathons, robotics, AI workshops and expert talks from industry leaders.",
         "image": "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80"},
        {"title": "Cauvery Cultural Carnival", "date": "2026-02-20",
         "location": "Open Grounds", "category": "Cultural",
         "description": "Three days of music, dance, drama and culinary celebration showcasing the diverse talents of our students.",
         "image": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=80"},
        {"title": "Annual Sports Meet", "date": "2026-01-25",
         "location": "Sports Complex", "category": "Sports",
         "description": "Inter-departmental sports competition with athletics, football, cricket, basketball and indoor games.",
         "image": "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80"},
        {"title": "Industry Conclave 2026", "date": "2026-04-08",
         "location": "Seminar Hall", "category": "Conclave",
         "description": "CXOs and founders share insights on the future of work, entrepreneurship, and emerging careers.",
         "image": "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80"},
        {"title": "National Commerce Symposium", "date": "2025-11-15",
         "location": "Conference Room A", "category": "Academic",
         "description": "Past event — students presented research papers on GST reforms, fintech disruption, and ESG investing.",
         "image": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=900&q=80"},
    ]
    for e in events:
        obj = Event(**e)
        doc = obj.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        await db.events.insert_one(doc)

async def seed_alumni():
    if await db.alumni.count_documents({}) > 0:
        return
    alumni = [
        {"name": "Aarav Shenoy", "batch": "BCA 2018", "role": "Senior Software Engineer", "company": "Google",
         "story": "CCAUVERY taught me to think first-principles. The hackathons and faculty mentorship shaped me into the engineer I am today.",
         "photo": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80"},
        {"name": "Divya Krishnan", "batch": "BBA 2019", "role": "Product Manager", "company": "Flipkart",
         "story": "From classroom case studies to launching products that millions use — Cauvery gave me the grounding and confidence.",
         "photo": "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80"},
        {"name": "Rajeev Bopanna", "batch": "BCOM 2017", "role": "Chartered Accountant & Founder", "company": "Bopanna & Associates",
         "story": "The discipline I developed at CCAUVERY helped me clear CA and start my own firm by 26.",
         "photo": "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=600&q=80"},
        {"name": "Sneha Kamath", "batch": "BCA 2020", "role": "Data Scientist", "company": "Microsoft",
         "story": "Hands-on AI labs and supportive professors gave me the springboard I needed to enter top tech.",
         "photo": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"},
    ]
    for a in alumni:
        obj = Alumni(**a)
        await db.alumni.insert_one(obj.model_dump())

async def seed_demo_data():
    # demo materials, attendance, fees, notifications for student@ccauvery.edu
    if await db.materials.count_documents({}) == 0:
        mats = [
            {"title": "Data Structures - Lecture Notes (Unit 1)", "course_code": "BCA", "description": "Arrays, Linked Lists, Stacks & Queues.", "file_url": "https://example.com/ds-unit1.pdf", "uploaded_by": "faculty@ccauvery.edu"},
            {"title": "DBMS Lab Manual", "course_code": "BCA", "description": "SQL exercises and ER modelling.", "file_url": "https://example.com/dbms-lab.pdf", "uploaded_by": "faculty@ccauvery.edu"},
            {"title": "Marketing Management Casebook", "course_code": "BBA", "description": "10 case studies for semester 4.", "file_url": "https://example.com/mm-cases.pdf", "uploaded_by": "faculty@ccauvery.edu"},
            {"title": "Income Tax Reckoner 2026", "course_code": "BCOM", "description": "Updated rates & deductions.", "file_url": "https://example.com/tax-2026.pdf", "uploaded_by": "faculty@ccauvery.edu"},
        ]
        for m in mats:
            obj = Material(**m)
            doc = obj.model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.materials.insert_one(doc)

    if await db.fees.count_documents({}) == 0:
        await db.fees.insert_one({
            **Fee(student_email="student@ccauvery.edu", course_code="BCA", amount=22500, semester="Sem 4").model_dump(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await db.fees.insert_one({
            "id": str(uuid.uuid4()), "student_email": "student@ccauvery.edu", "course_code": "BCA",
            "amount": 22500, "semester": "Sem 3", "status": "paid",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    if await db.attendance.count_documents({}) == 0:
        from random import choice
        days = 20
        for i in range(days):
            d = (datetime.now(timezone.utc) - timedelta(days=i)).date().isoformat()
            await db.attendance.insert_one({
                "id": str(uuid.uuid4()), "student_email": "student@ccauvery.edu",
                "course_code": "BCA", "date": d,
                "status": choice(["present", "present", "present", "absent"]),
                "marked_by": "faculty@ccauvery.edu",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

    if await db.notifications.count_documents({}) == 0:
        notifs = [
            {"title": "Mid-Sem Exams Begin Mar 2", "message": "Hall tickets to be downloaded by Feb 25.", "audience": "students"},
            {"title": "Faculty Meeting - Friday 4pm", "message": "Agenda: TechFest planning.", "audience": "faculty"},
            {"title": "Library Hours Extended", "message": "Library now open till 9 PM during exams.", "audience": "all"},
        ]
        for n in notifs:
            obj = Notification(**n)
            doc = obj.model_dump()
            doc["created_at"] = doc["created_at"].isoformat()
            await db.notifications.insert_one(doc)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.courses.create_index("code", unique=True)
    await seed_admin()
    await seed_demo_users()
    await seed_courses()
    await seed_faculty()
    await seed_events()
    await seed_alumni()
    await seed_demo_data()

@app.on_event("shutdown")
async def shutdown():
    client.close()

# Mount router
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
