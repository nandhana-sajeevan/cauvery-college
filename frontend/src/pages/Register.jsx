import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { formatApiError } from "@/lib/api";
import { ArrowRight } from "lucide-react";

export default function Register() {
    const { register, user } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "student" });
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const navigate = useNavigate();

    if (user) return <Navigate to="/" replace />;

    const submit = async (e) => {
        e.preventDefault();
        setError(""); setBusy(true);
        try {
            const u = await register(form);
            navigate(u.role === "faculty" ? "/faculty-dashboard" : "/student-dashboard");
        } catch (err) {
            setError(formatApiError(err.response?.data?.detail) || "Registration failed");
        } finally { setBusy(false); }
    };

    return (
        <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-8" data-testid="register-page">
            <div className="w-full max-w-md bg-white rounded-2xl border border-border p-8 lg:p-10">
                <h1 className="font-outfit font-black text-3xl text-primary mb-2">Create your account</h1>
                <p className="text-muted-foreground mb-8">Join the Cauvery community.</p>

                {error && <div className="mb-6 p-4 rounded-xl bg-destructive/10 text-destructive text-sm" data-testid="register-error">{error}</div>}

                <form onSubmit={submit} className="space-y-5">
                    <Field label="Full name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} testId="reg-name" />
                    <Field label="Email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} testId="reg-email" />
                    <Field label="Password (min 6)" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} testId="reg-password" />
                    <div>
                        <label className="block text-sm font-medium mb-2">I am a</label>
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                            data-testid="reg-role">
                            <option value="student">Student</option>
                            <option value="faculty">Faculty</option>
                        </select>
                    </div>
                    <button type="submit" disabled={busy}
                        className="w-full btn-gold py-3.5 rounded-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
                        data-testid="register-submit">
                        {busy ? "Creating..." : <>Create account <ArrowRight className="w-4 h-4" /></>}
                    </button>
                </form>

                <p className="mt-6 text-sm text-muted-foreground text-center">
                    Already have an account? <Link to="/login" className="text-primary font-semibold hover:text-secondary">Sign in</Link>
                </p>
            </div>
        </div>
    );
}

function Field({ label, testId, ...rest }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-2">{label}</label>
            <input {...rest} data-testid={testId}
                className="w-full px-4 py-3 rounded-xl border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition" />
        </div>
    );
}
