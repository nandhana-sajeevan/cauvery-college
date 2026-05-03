"""CCAUVERY Backend API Tests - JWT Auth + CRUD + RBAC"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://learning-hub-593.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN = {"email": "admin@ccauvery.edu", "password": "Admin@123"}
FACULTY = {"email": "faculty@ccauvery.edu", "password": "Faculty@123"}
STUDENT = {"email": "student@ccauvery.edu", "password": "Student@123"}


def _login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=15)
    assert r.status_code == 200, f"Login failed for {creds['email']}: {r.status_code} {r.text}"
    return r.json()


@pytest.fixture(scope="module")
def admin_token():
    return _login(ADMIN)["access_token"]


@pytest.fixture(scope="module")
def faculty_token():
    return _login(FACULTY)["access_token"]


@pytest.fixture(scope="module")
def student_token():
    return _login(STUDENT)["access_token"]


def h(t):
    return {"Authorization": f"Bearer {t}"}


# ---------------- Health ----------------
def test_health_root():
    r = requests.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---------------- Auth ----------------
class TestAuth:
    def test_login_admin(self):
        d = _login(ADMIN)
        assert "access_token" in d and d["user"]["role"] == "admin"
        assert d["user"]["email"] == "admin@ccauvery.edu"

    def test_login_student(self):
        d = _login(STUDENT)
        assert d["user"]["role"] == "student"

    def test_login_faculty(self):
        d = _login(FACULTY)
        assert d["user"]["role"] == "faculty"

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": "x@x.com", "password": "bad"})
        assert r.status_code == 401

    def test_me_with_token(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=h(admin_token))
        assert r.status_code == 200
        assert r.json()["role"] == "admin"

    def test_me_no_token(self):
        r = requests.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_register_new_student(self):
        email = f"TEST_user_{uuid.uuid4().hex[:8]}@ccauvery.edu"
        r = requests.post(f"{API}/auth/register", json={
            "email": email, "password": "Test@1234", "name": "Test User", "role": "student"
        })
        assert r.status_code == 200, r.text
        d = r.json()
        assert "access_token" in d
        assert d["user"]["email"] == email.lower()
        assert d["user"]["role"] == "student"

    def test_register_duplicate(self):
        r = requests.post(f"{API}/auth/register", json={
            "email": ADMIN["email"], "password": "Test@1234", "name": "Dup", "role": "student"
        })
        assert r.status_code == 400


# ---------------- Public APIs ----------------
class TestPublic:
    def test_courses_list(self):
        r = requests.get(f"{API}/courses")
        assert r.status_code == 200
        data = r.json()
        assert len(data) >= 3
        codes = {c["code"] for c in data}
        assert {"BCA", "BBA", "BCOM"}.issubset(codes)

    def test_course_detail_bca(self):
        r = requests.get(f"{API}/courses/BCA")
        assert r.status_code == 200
        d = r.json()
        assert d["code"] == "BCA"
        assert len(d["syllabus"]) > 0

    def test_course_lowercase(self):
        r = requests.get(f"{API}/courses/bca")
        assert r.status_code == 200  # route upper-cases

    def test_course_not_found(self):
        r = requests.get(f"{API}/courses/XYZ")
        assert r.status_code == 404

    def test_faculty_list(self):
        r = requests.get(f"{API}/faculty")
        assert r.status_code == 200
        assert len(r.json()) >= 6

    def test_events_list(self):
        r = requests.get(f"{API}/events")
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_alumni_list(self):
        r = requests.get(f"{API}/alumni")
        assert r.status_code == 200
        assert len(r.json()) >= 4

    def test_stats(self):
        r = requests.get(f"{API}/stats")
        assert r.status_code == 200
        d = r.json()
        for k in ("students", "faculty", "courses", "events", "alumni", "admissions"):
            assert k in d


# ---------------- Admissions ----------------
class TestAdmissions:
    def test_submit(self):
        payload = {
            "full_name": "TEST Applicant", "email": "test_applicant@x.com",
            "phone": "9999999999", "dob": "2005-01-01", "gender": "Male",
            "address": "Gonikoppal", "course_code": "BCA",
            "qualification": "12th CBSE", "marks": 85.5,
        }
        r = requests.post(f"{API}/admissions", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["status"] == "pending"
        assert "id" in d

    def test_list_requires_admin(self):
        r = requests.get(f"{API}/admissions")
        assert r.status_code == 401

    def test_list_as_student_forbidden(self, student_token):
        r = requests.get(f"{API}/admissions", headers=h(student_token))
        assert r.status_code == 403

    def test_list_as_admin(self, admin_token):
        r = requests.get(f"{API}/admissions", headers=h(admin_token))
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# ---------------- Contact ----------------
class TestContact:
    def test_submit(self):
        r = requests.post(f"{API}/contact", json={
            "name": "TEST", "email": "test@x.com", "subject": "Hi", "message": "Hello"
        })
        assert r.status_code == 200
        assert "id" in r.json()

    def test_list_admin_only(self, admin_token):
        r = requests.get(f"{API}/contact", headers=h(admin_token))
        assert r.status_code == 200


# ---------------- RBAC ----------------
class TestRBAC:
    def test_create_course_no_auth_401(self):
        r = requests.post(f"{API}/courses", json={
            "code": "TEST", "name": "t", "duration": "1", "description": "d", "eligibility": "e"
        })
        assert r.status_code == 401

    def test_create_course_as_student_403(self, student_token):
        r = requests.post(f"{API}/courses", headers=h(student_token), json={
            "code": "TEST", "name": "t", "duration": "1", "description": "d", "eligibility": "e"
        })
        assert r.status_code == 403

    def test_create_event_as_student_403(self, student_token):
        r = requests.post(f"{API}/events", headers=h(student_token), json={
            "title": "x", "description": "y", "date": "2026-05-01", "location": "z"
        })
        assert r.status_code == 403


# ---------------- Materials ----------------
class TestMaterials:
    def test_list_public(self):
        r = requests.get(f"{API}/materials")
        assert r.status_code == 200

    def test_post_requires_faculty(self):
        r = requests.post(f"{API}/materials", json={
            "title": "x", "course_code": "BCA", "description": "d", "file_url": "https://x.com/a.pdf"
        })
        assert r.status_code == 401

    def test_post_as_faculty_ok(self, faculty_token):
        r = requests.post(f"{API}/materials", headers=h(faculty_token), json={
            "title": "TEST Material", "course_code": "BCA",
            "description": "d", "file_url": "https://x.com/a.pdf"
        })
        assert r.status_code == 200, r.text
        assert r.json()["course_code"] == "BCA"


# ---------------- Attendance ----------------
class TestAttendance:
    def test_mark_requires_faculty(self):
        r = requests.post(f"{API}/attendance", json={
            "student_email": "student@ccauvery.edu", "course_code": "BCA",
            "date": "2026-01-15", "status": "present"
        })
        assert r.status_code == 401

    def test_mark_as_faculty(self, faculty_token):
        r = requests.post(f"{API}/attendance", headers=h(faculty_token), json={
            "student_email": "student@ccauvery.edu", "course_code": "BCA",
            "date": "2026-01-15", "status": "present"
        })
        assert r.status_code == 200, r.text

    def test_student_sees_only_own(self, student_token):
        r = requests.get(f"{API}/attendance", headers=h(student_token))
        assert r.status_code == 200
        for rec in r.json():
            assert rec["student_email"].lower() == "student@ccauvery.edu"


# ---------------- Notifications ----------------
class TestNotifications:
    def test_list_requires_auth(self):
        r = requests.get(f"{API}/notifications")
        assert r.status_code == 401

    def test_student_filtered(self, student_token):
        r = requests.get(f"{API}/notifications", headers=h(student_token))
        assert r.status_code == 200
        for n in r.json():
            assert n["audience"] in ("all", "students")

    def test_create_requires_admin(self, student_token):
        r = requests.post(f"{API}/notifications", headers=h(student_token),
                          json={"title": "x", "message": "y", "audience": "all"})
        assert r.status_code == 403

    def test_create_as_admin(self, admin_token):
        r = requests.post(f"{API}/notifications", headers=h(admin_token),
                          json={"title": "TEST Notice", "message": "hello", "audience": "all"})
        assert r.status_code == 200


# ---------------- Fees ----------------
class TestFees:
    def test_student_sees_own(self, student_token):
        r = requests.get(f"{API}/fees", headers=h(student_token))
        assert r.status_code == 200
        for f in r.json():
            assert f["student_email"].lower() == "student@ccauvery.edu"

    def test_create_requires_admin(self, faculty_token):
        r = requests.post(f"{API}/fees", headers=h(faculty_token), json={
            "student_email": "student@ccauvery.edu", "course_code": "BCA",
            "amount": 5000, "semester": "Sem 5"
        })
        assert r.status_code == 403

    def test_full_fee_flow(self, admin_token, student_token):
        # Create a fee as admin
        r = requests.post(f"{API}/fees", headers=h(admin_token), json={
            "student_email": "student@ccauvery.edu", "course_code": "BCA",
            "amount": 1000, "semester": "TEST_Sem"
        })
        assert r.status_code == 200, r.text
        fee_id = r.json()["id"]
        # Student pays (mock)
        r2 = requests.post(f"{API}/fees/{fee_id}/pay", headers=h(student_token))
        assert r2.status_code == 200, r2.text
        # Verify status paid
        r3 = requests.get(f"{API}/fees", headers=h(student_token))
        paid = [f for f in r3.json() if f["id"] == fee_id]
        assert paid and paid[0]["status"] == "paid"


# ---------------- Courses CRUD as admin ----------------
class TestAdminCourseCRUD:
    def test_create_and_delete(self, admin_token):
        code = f"TST{uuid.uuid4().hex[:4].upper()}"
        r = requests.post(f"{API}/courses", headers=h(admin_token), json={
            "code": code, "name": "TEST Course", "duration": "1 Year",
            "description": "d", "eligibility": "e", "fees": 1000
        })
        assert r.status_code == 200, r.text
        cid = r.json()["id"]
        # verify GET
        g = requests.get(f"{API}/courses/{code}")
        assert g.status_code == 200
        # delete
        d = requests.delete(f"{API}/courses/{cid}", headers=h(admin_token))
        assert d.status_code == 200
        # verify gone
        g2 = requests.get(f"{API}/courses/{code}")
        assert g2.status_code == 404
