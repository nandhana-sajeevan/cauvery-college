import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { LayoutDashboard, ClipboardCheck, FileText, Bell } from "lucide-react";
import api from "@/lib/api";
import DashboardShell from "@/components/DashboardShell";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
    { to: "/faculty-dashboard", label: "Overview", icon: LayoutDashboard },
    { to: "/faculty-dashboard/attendance", label: "Mark Attendance", icon: ClipboardCheck },
    { to: "/faculty-dashboard/materials", label: "Study Materials", icon: FileText },
    { to: "/faculty-dashboard/notifications", label: "Notifications", icon: Bell },
];

export default function FacultyDashboard() {
    return (
        <Routes>
            <Route element={<DashboardShell title="Faculty Portal" navItems={NAV} />}>
                <Route index element={<Overview />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="materials" element={<Materials />} />
                <Route path="notifications" element={<Notifications />} />
            </Route>
        </Routes>
    );
}

function Overview() {
    const { user } = useAuth();
    return (
        <div data-testid="faculty-overview">
            <h1 className="font-outfit font-black text-3xl lg:text-4xl text-primary mb-2">Hello, {user?.name}</h1>
            <p className="text-muted-foreground mb-8">Manage your classes, mark attendance and share materials with your students.</p>
            <div className="grid md:grid-cols-3 gap-6">
                {[
                    { label: "Mark today's attendance", desc: "Track student presence in real time.", to: "/faculty-dashboard/attendance" },
                    { label: "Upload study material", desc: "Share notes, PDFs and resources.", to: "/faculty-dashboard/materials" },
                    { label: "Class notifications", desc: "Read latest faculty announcements.", to: "/faculty-dashboard/notifications" },
                ].map((c, i) => (
                    <a key={i} href={c.to} className="block bg-white rounded-2xl p-6 border border-border lift">
                        <div className="font-outfit font-bold text-xl text-primary">{c.label}</div>
                        <div className="text-muted-foreground text-sm mt-2">{c.desc}</div>
                    </a>
                ))}
            </div>
        </div>
    );
}

function Attendance() {
    const [form, setForm] = useState({ student_email: "student@ccauvery.edu", course_code: "BCA", date: new Date().toISOString().slice(0, 10), status: "present" });
    const [recent, setRecent] = useState([]);
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState("");
    const load = () => api.get(`/attendance?student_email=${form.student_email}`).then(r => setRecent(r.data.slice(0, 10)));
    useEffect(() => { load(); }, [form.student_email]);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setMsg("");
        try {
            await api.post("/attendance", form);
            setMsg("Attendance marked successfully.");
            load();
        } catch { setMsg("Failed."); } finally { setBusy(false); }
    };
    return (
        <div data-testid="faculty-attendance">
            <h1 className="font-outfit font-black text-3xl text-primary mb-6">Mark Attendance</h1>
            <form onSubmit={submit} className="bg-white p-6 rounded-2xl border border-border grid md:grid-cols-4 gap-3 mb-6">
                <input value={form.student_email} onChange={e => setForm({ ...form, student_email: e.target.value })} placeholder="student email" required className="px-3 py-2 rounded-lg border border-border" data-testid="att-student" />
                <input value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })} placeholder="course" required className="px-3 py-2 rounded-lg border border-border" data-testid="att-course" />
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className="px-3 py-2 rounded-lg border border-border" data-testid="att-date" />
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="px-3 py-2 rounded-lg border border-border bg-white" data-testid="att-status">
                    <option value="present">Present</option>
                    <option value="absent">Absent</option>
                </select>
                <button disabled={busy} className="btn-gold md:col-span-4 py-2 rounded-lg disabled:opacity-50" data-testid="mark-attendance-btn">{busy ? "Saving..." : "Mark attendance"}</button>
                {msg && <div className="md:col-span-4 text-sm text-emerald-700">{msg}</div>}
            </form>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-widest text-muted-foreground"><tr><th className="px-5 py-3 text-left">Date</th><th className="px-5 py-3 text-left">Course</th><th className="px-5 py-3 text-left">Status</th></tr></thead>
                    <tbody>
                        {recent.map(a => (
                            <tr key={a.id} className="border-t border-border">
                                <td className="px-5 py-3">{a.date}</td>
                                <td className="px-5 py-3">{a.course_code}</td>
                                <td className="px-5 py-3"><span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${a.status === "present" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>{a.status}</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {recent.length === 0 && <div className="px-5 py-8 text-center text-muted-foreground text-sm">No attendance records yet.</div>}
            </div>
        </div>
    );
}

function Materials() {
    const [list, setList] = useState([]);
    const [form, setForm] = useState({ title: "", course_code: "BCA", description: "", file_url: "" });
    const [error, setError] = useState("");
    const load = () => api.get("/materials").then(r => setList(r.data));
    useEffect(() => { load(); }, []);
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await api.post("/materials", form);
            setForm({ title: "", course_code: "BCA", description: "", file_url: "" });
            load();
        } catch (err) {
            setError(err.response?.data?.detail || "Could not upload material");
        }
    };
    const del = async (id) => { await api.delete(`/materials/${id}`); load(); };
    return (
        <div data-testid="faculty-materials">
            <h1 className="font-outfit font-black text-3xl text-primary mb-6">Study Materials</h1>
            <form onSubmit={submit} className="bg-white p-6 rounded-2xl border border-border grid md:grid-cols-2 gap-3 mb-6">
                {error && <div className="md:col-span-2 p-3 rounded-lg bg-destructive/10 text-destructive text-xs">{String(error)}</div>}
                <input placeholder="Title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="px-3 py-2 rounded-lg border border-border" />
                <input placeholder="Course code (BCA/BBA/BCOM)" required value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })} className="px-3 py-2 rounded-lg border border-border" />
                <input placeholder="File URL" required value={form.file_url} onChange={e => setForm({ ...form, file_url: e.target.value })} className="md:col-span-2 px-3 py-2 rounded-lg border border-border" />
                <textarea placeholder="Description" rows={2} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="md:col-span-2 px-3 py-2 rounded-lg border border-border" />
                <button className="btn-gold md:col-span-2 py-2 rounded-lg" data-testid="upload-material-btn">Upload material</button>
            </form>
            <div className="space-y-3">
                {list.map(m => (
                    <div key={m.id} className="bg-white rounded-xl border border-border p-5 flex justify-between items-start gap-4">
                        <div>
                            <div className="font-bold text-primary">{m.title} <span className="text-xs uppercase text-secondary ml-2">{m.course_code}</span></div>
                            <div className="text-sm text-muted-foreground mt-1">{m.description}</div>
                            <a href={m.file_url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:text-secondary mt-2 inline-block">{m.file_url}</a>
                        </div>
                        <button onClick={() => del(m.id)} className="text-destructive text-sm hover:underline">Delete</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Notifications() {
    const [list, setList] = useState([]);
    useEffect(() => { api.get("/notifications").then(r => setList(r.data)); }, []);
    return (
        <div data-testid="faculty-notifications">
            <h1 className="font-outfit font-black text-3xl text-primary mb-6">Notifications</h1>
            <div className="space-y-3">
                {list.map(n => (
                    <div key={n.id} className="bg-white p-5 rounded-xl border border-border">
                        <div className="font-bold text-primary">{n.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">{n.message}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
