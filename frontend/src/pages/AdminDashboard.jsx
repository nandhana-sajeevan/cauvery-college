import { useEffect, useState } from "react";
import { LayoutDashboard, Users, BookOpen, Calendar, Bell, FileText, IndianRupee, Mail, GraduationCap } from "lucide-react";
import { Routes, Route } from "react-router-dom";
import api from "@/lib/api";
import DashboardShell from "@/components/DashboardShell";

const NAV = [
    { to: "/admin", label: "Overview", icon: LayoutDashboard },
    { to: "/admin/students", label: "Users", icon: Users },
    { to: "/admin/courses", label: "Courses", icon: BookOpen },
    { to: "/admin/events", label: "Events", icon: Calendar },
    { to: "/admin/admissions", label: "Admissions", icon: GraduationCap },
    { to: "/admin/notifications", label: "Notifications", icon: Bell },
    { to: "/admin/fees", label: "Fees", icon: IndianRupee },
    { to: "/admin/contact", label: "Messages", icon: Mail },
];

export default function AdminDashboard() {
    return (
        <Routes>
            <Route element={<DashboardShell title="Admin Console" navItems={NAV} />}>
                <Route index element={<Overview />} />
                <Route path="students" element={<UsersTab />} />
                <Route path="courses" element={<CoursesTab />} />
                <Route path="events" element={<EventsTab />} />
                <Route path="admissions" element={<AdmissionsTab />} />
                <Route path="notifications" element={<NotificationsTab />} />
                <Route path="fees" element={<FeesTab />} />
                <Route path="contact" element={<ContactTab />} />
            </Route>
        </Routes>
    );
}

function Header({ title, subtitle, action }) {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
                <h1 className="font-outfit font-black text-3xl lg:text-4xl text-primary">{title}</h1>
                {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}

function Overview() {
    const [stats, setStats] = useState({});
    useEffect(() => { api.get("/stats").then(r => setStats(r.data)); }, []);
    const cards = [
        { label: "Students", val: stats.students, color: "from-blue-500 to-blue-700" },
        { label: "Faculty", val: stats.faculty, color: "from-amber-500 to-amber-700" },
        { label: "Courses", val: stats.courses, color: "from-emerald-500 to-emerald-700" },
        { label: "Events", val: stats.events, color: "from-violet-500 to-violet-700" },
        { label: "Alumni", val: stats.alumni, color: "from-rose-500 to-rose-700" },
        { label: "Admissions", val: stats.admissions, color: "from-sky-500 to-sky-700" },
    ];
    return (
        <div data-testid="admin-overview">
            <Header title="Welcome back, Admin" subtitle="Here's what's happening across CCAUVERY." />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:gap-6">
                {cards.map((c, i) => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-border lift">
                        <div className="text-sm uppercase tracking-widest text-muted-foreground mb-2">{c.label}</div>
                        <div className="font-outfit font-black text-4xl text-primary">{c.val ?? "-"}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function UsersTab() {
    const [list, setList] = useState([]);
    useEffect(() => { api.get("/users").then(r => setList(r.data)); }, []);
    return (
        <div data-testid="admin-users">
            <Header title="Users" subtitle="All registered admins, faculty, and students." />
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <Table cols={["Name", "Email", "Role"]} rows={list.map(u => [u.name, u.email, <span className="px-2 py-1 rounded-full bg-secondary/20 text-secondary text-xs font-bold uppercase">{u.role}</span>])} />
            </div>
        </div>
    );
}

function CoursesTab() {
    const [list, setList] = useState([]);
    const [form, setForm] = useState({ code: "", name: "", duration: "3 Years", description: "", eligibility: "", fees: 0 });
    const [error, setError] = useState("");
    const load = () => api.get("/courses").then(r => setList(r.data));
    useEffect(() => { load(); }, []);
    const submit = async (e) => {
        e.preventDefault();
        setError("");
        try {
            await api.post("/courses", { ...form, fees: parseFloat(form.fees), syllabus: [], careers: [] });
            setForm({ code: "", name: "", duration: "3 Years", description: "", eligibility: "", fees: 0 });
            load();
        } catch (err) {
            setError(err.response?.data?.detail || "Could not create course");
        }
    };
    const del = async (id) => { await api.delete(`/courses/${id}`); load(); };
    return (
        <div data-testid="admin-courses">
            <Header title="Courses" />
            <div className="grid lg:grid-cols-3 gap-6">
                <form onSubmit={submit} className="lg:col-span-1 bg-white p-6 rounded-2xl border border-border space-y-3">
                    <div className="font-bold text-primary">Add new course</div>
                    {error && <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-xs">{String(error)}</div>}
                    {["code", "name", "duration", "description", "eligibility"].map(k => (
                        <input key={k} placeholder={k} required value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border" data-testid={`new-course-${k}`} />
                    ))}
                    <input type="number" placeholder="fees" value={form.fees} onChange={e => setForm({ ...form, fees: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border" data-testid="new-course-fees" />
                    <button className="btn-gold w-full py-2 rounded-lg" data-testid="add-course-btn">Add</button>
                </form>
                <div className="lg:col-span-2 bg-white rounded-2xl border border-border overflow-hidden">
                    <Table cols={["Code", "Name", "Fees", ""]} rows={list.map(c => [c.code, c.name, `₹${c.fees.toLocaleString()}`,
                        <button onClick={() => del(c.id)} className="text-destructive text-sm hover:underline">Delete</button>])} />
                </div>
            </div>
        </div>
    );
}

function EventsTab() {
    const [list, setList] = useState([]);
    const [form, setForm] = useState({ title: "", description: "", date: "", location: "", category: "general", image: "" });
    const load = () => api.get("/events").then(r => setList(r.data));
    useEffect(() => { load(); }, []);
    const submit = async (e) => {
        e.preventDefault();
        await api.post("/events", form);
        setForm({ title: "", description: "", date: "", location: "", category: "general", image: "" });
        load();
    };
    const del = async (id) => { await api.delete(`/events/${id}`); load(); };
    return (
        <div data-testid="admin-events">
            <Header title="Events" />
            <div className="grid lg:grid-cols-3 gap-6">
                <form onSubmit={submit} className="lg:col-span-1 bg-white p-6 rounded-2xl border border-border space-y-3">
                    <div className="font-bold text-primary">Create event</div>
                    {["title", "category", "location", "image"].map(k => (
                        <input key={k} placeholder={k} required={k !== "image"} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border border-border" data-testid={`new-event-${k}`} />
                    ))}
                    <input type="date" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border" data-testid="new-event-date" />
                    <textarea placeholder="description" rows={3} required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-border" data-testid="new-event-description" />
                    <button className="btn-gold w-full py-2 rounded-lg" data-testid="add-event-btn">Add</button>
                </form>
                <div className="lg:col-span-2 bg-white rounded-2xl border border-border overflow-hidden">
                    <Table cols={["Title", "Date", "Location", ""]} rows={list.map(e => [e.title, e.date, e.location,
                        <button onClick={() => del(e.id)} className="text-destructive text-sm hover:underline">Delete</button>])} />
                </div>
            </div>
        </div>
    );
}

function AdmissionsTab() {
    const [list, setList] = useState([]);
    const load = () => api.get("/admissions").then(r => setList(r.data));
    useEffect(() => { load(); }, []);
    const updateStatus = async (id, status) => {
        await api.patch(`/admissions/${id}?status_value=${status}`);
        load();
    };
    const statusBadge = (status) => {
        const map = {
            accepted: "bg-emerald-100 text-emerald-700",
            rejected: "bg-red-100 text-red-700",
            pending: "bg-amber-100 text-amber-700",
        };
        return <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${map[status] || map.pending}`}>{status}</span>;
    };
    return (
        <div data-testid="admin-admissions">
            <Header title="Admission Applications" />
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <Table cols={["Applicant", "Course", "Marks", "Status", "Actions"]}
                    rows={list.map(a => [
                        <div><div className="font-medium">{a.full_name}</div><div className="text-xs text-muted-foreground">{a.email}</div></div>,
                        a.course_code, `${a.marks}%`,
                        statusBadge(a.status),
                        <div className="flex gap-2">
                            <button onClick={() => updateStatus(a.id, "accepted")} className="text-xs text-emerald-700 hover:underline">Accept</button>
                            <button onClick={() => updateStatus(a.id, "rejected")} className="text-xs text-red-700 hover:underline">Reject</button>
                        </div>
                    ])} />
            </div>
        </div>
    );
}

function NotificationsTab() {
    const [list, setList] = useState([]);
    const [form, setForm] = useState({ title: "", message: "", audience: "all" });
    const load = () => api.get("/notifications").then(r => setList(r.data));
    useEffect(() => { load(); }, []);
    const submit = async (e) => {
        e.preventDefault();
        await api.post("/notifications", form);
        setForm({ title: "", message: "", audience: "all" });
        load();
    };
    return (
        <div data-testid="admin-notifications">
            <Header title="Notifications" />
            <form onSubmit={submit} className="bg-white p-6 rounded-2xl border border-border space-y-3 max-w-2xl mb-8">
                <input placeholder="Title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border" />
                <textarea placeholder="Message" required rows={3} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border" />
                <select value={form.audience} onChange={e => setForm({ ...form, audience: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-border bg-white">
                    <option value="all">All</option>
                    <option value="students">Students</option>
                    <option value="faculty">Faculty</option>
                </select>
                <button className="btn-gold px-6 py-2 rounded-lg" data-testid="send-notification-btn">Send notification</button>
            </form>
            <div className="space-y-3">
                {list.map(n => (
                    <div key={n.id} className="bg-white p-5 rounded-xl border border-border">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <div className="font-bold text-primary">{n.title}</div>
                                <div className="text-sm text-muted-foreground mt-1">{n.message}</div>
                            </div>
                            <span className="text-xs uppercase tracking-widest text-secondary">{n.audience}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FeesTab() {
    const [list, setList] = useState([]);
    const [form, setForm] = useState({ student_email: "", course_code: "BCA", amount: 0, semester: "" });
    const load = () => api.get("/fees").then(r => setList(r.data));
    useEffect(() => { load(); }, []);
    const submit = async (e) => {
        e.preventDefault();
        await api.post("/fees", { ...form, amount: parseFloat(form.amount) });
        setForm({ student_email: "", course_code: "BCA", amount: 0, semester: "" });
        load();
    };
    return (
        <div data-testid="admin-fees">
            <Header title="Fee Management" />
            <form onSubmit={submit} className="bg-white p-6 rounded-2xl border border-border grid md:grid-cols-4 gap-3 mb-8">
                <input placeholder="Student email" required value={form.student_email} onChange={e => setForm({ ...form, student_email: e.target.value })} className="px-3 py-2 rounded-lg border border-border" />
                <input placeholder="Course code" required value={form.course_code} onChange={e => setForm({ ...form, course_code: e.target.value })} className="px-3 py-2 rounded-lg border border-border" />
                <input placeholder="Semester" required value={form.semester} onChange={e => setForm({ ...form, semester: e.target.value })} className="px-3 py-2 rounded-lg border border-border" />
                <input type="number" placeholder="Amount" required value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="px-3 py-2 rounded-lg border border-border" />
                <button className="btn-gold md:col-span-4 py-2 rounded-lg">Create fee invoice</button>
            </form>
            <div className="bg-white rounded-2xl border border-border overflow-hidden">
                <Table cols={["Student", "Course", "Sem", "Amount", "Status"]}
                    rows={list.map(f => [f.student_email, f.course_code, f.semester, `₹${f.amount}`,
                        <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${f.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{f.status}</span>])} />
            </div>
        </div>
    );
}

function ContactTab() {
    const [list, setList] = useState([]);
    useEffect(() => { api.get("/contact").then(r => setList(r.data)); }, []);
    return (
        <div data-testid="admin-contact">
            <Header title="Contact Messages" />
            <div className="space-y-4">
                {list.map(m => (
                    <div key={m.id} className="bg-white p-6 rounded-xl border border-border">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <div className="font-bold text-primary">{m.subject}</div>
                                <div className="text-sm text-muted-foreground">From: {m.name} ({m.email})</div>
                            </div>
                            <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()}</div>
                        </div>
                        <p className="mt-3 text-foreground/85 leading-relaxed">{m.message}</p>
                    </div>
                ))}
                {list.length === 0 && <p className="text-muted-foreground">No messages yet.</p>}
            </div>
        </div>
    );
}

function Table({ cols, rows }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-widest text-muted-foreground">
                    <tr>{cols.map((c, i) => <th key={i} className="px-5 py-3">{c}</th>)}</tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} className="border-t border-border hover:bg-muted/20">
                            {r.map((c, j) => <td key={j} className="px-5 py-4">{c}</td>)}
                        </tr>
                    ))}
                </tbody>
            </table>
            {rows.length === 0 && <div className="px-5 py-10 text-center text-muted-foreground">No records.</div>}
        </div>
    );
}
