import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "@/lib/api";
import { ArrowRight, Clock, IndianRupee, BookOpen, Briefcase, CheckCircle2, GraduationCap } from "lucide-react";

export default function CourseDetail() {
    const { code } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/courses/${code}`).then(r => setCourse(r.data)).finally(() => setLoading(false));
    }, [code]);

    if (loading) return <div className="container-x section"><div className="h-96 rounded-2xl bg-muted animate-pulse" /></div>;
    if (!course) return <div className="container-x section text-center"><h2 className="text-3xl font-bold text-primary">Course not found</h2></div>;

    return (
        <div data-testid={`course-detail-${course.code}`}>
            <section className="relative h-[55vh] overflow-hidden flex items-end">
                <img src={course.image} alt={course.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 hero-overlay" />
                <div className="relative container-x pb-16 text-white">
                    <p className="text-secondary uppercase tracking-[0.3em] text-sm font-bold mb-3">{course.code}</p>
                    <h1 className="font-outfit font-black text-5xl lg:text-7xl leading-tight max-w-4xl">{course.name}</h1>
                </div>
            </section>

            <section className="section">
                <div className="container-x grid lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8 space-y-12">
                        <div>
                            <h2 className="font-outfit font-black text-3xl text-primary mb-4">Programme overview</h2>
                            <p className="text-foreground/80 leading-relaxed text-lg">{course.description}</p>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <BookOpen className="w-6 h-6 text-secondary" />
                                <h2 className="font-outfit font-black text-3xl text-primary">Syllabus highlights</h2>
                            </div>
                            <ul className="grid md:grid-cols-2 gap-3">
                                {course.syllabus.map((s, i) => (
                                    <li key={i} className="flex items-start gap-3 bg-white border border-border rounded-xl p-4">
                                        <CheckCircle2 className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                                        <span className="text-foreground/90">{s}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <div className="flex items-center gap-3 mb-5">
                                <Briefcase className="w-6 h-6 text-secondary" />
                                <h2 className="font-outfit font-black text-3xl text-primary">Career pathways</h2>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                {course.careers.map((c, i) => (
                                    <span key={i} className="px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary font-medium text-sm">{c}</span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <aside className="lg:col-span-4">
                        <div className="sticky top-28 bg-primary text-white rounded-2xl p-7 space-y-5">
                            <div>
                                <div className="text-secondary text-xs uppercase tracking-[0.25em] font-bold">At a glance</div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Stat icon={Clock} label="Duration" value={course.duration} />
                                <Stat icon={IndianRupee} label="Fees" value={`${course.fees.toLocaleString()}/yr`} />
                            </div>
                            <div>
                                <div className="text-secondary text-xs uppercase tracking-[0.25em] font-bold mb-2">Eligibility</div>
                                <p className="text-white/85 text-sm leading-relaxed">{course.eligibility}</p>
                            </div>
                            <Link to="/admissions" className="btn-gold w-full text-center px-6 py-3.5 rounded-full inline-flex items-center justify-center gap-2" data-testid="course-apply-btn">
                                Apply for {course.code} <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
}

function Stat({ icon: Icon, label, value }) {
    return (
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <Icon className="w-4 h-4 text-secondary mb-2" />
            <div className="text-xs text-white/60 uppercase tracking-widest">{label}</div>
            <div className="font-outfit font-bold text-lg">{value}</div>
        </div>
    );
}
