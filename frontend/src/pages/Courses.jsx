import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { ArrowRight, Clock, IndianRupee, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";

export default function Courses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get("/courses").then(r => setCourses(r.data)).finally(() => setLoading(false));
    }, []);

    return (
        <div data-testid="courses-page">
            <section className="bg-primary text-white py-24 lg:py-32">
                <div className="container-x">
                    <p className="text-secondary uppercase tracking-[0.3em] text-sm font-bold mb-3">Programs</p>
                    <h1 className="font-outfit font-black text-5xl lg:text-7xl">Choose your <span className="text-secondary">path</span>.</h1>
                    <p className="mt-6 text-white/80 max-w-2xl text-lg">Industry-aligned undergraduate programs designed for the careers of tomorrow.</p>
                </div>
            </section>

            <section className="section">
                <div className="container-x">
                    {loading ? (
                        <div className="grid md:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => <div key={i} className="h-96 rounded-2xl bg-muted animate-pulse" />)}
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-3 gap-8">
                            {courses.map((c, i) => (
                                <motion.div key={c.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                    className="bg-white rounded-2xl border border-border overflow-hidden lift" data-testid={`course-${c.code}`}>
                                    <div className="aspect-[16/10] overflow-hidden">
                                        <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-7">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xs uppercase tracking-[0.25em] font-bold text-secondary">{c.code}</span>
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                            <span className="text-xs text-muted-foreground">{c.duration}</span>
                                        </div>
                                        <h3 className="font-outfit font-bold text-2xl text-primary leading-tight">{c.name}</h3>
                                        <p className="mt-3 text-muted-foreground text-sm leading-relaxed line-clamp-3">{c.description}</p>
                                        <div className="mt-5 flex items-center gap-5 text-sm">
                                            <span className="flex items-center gap-1.5 text-foreground"><Clock className="w-4 h-4 text-secondary" /> {c.duration}</span>
                                            <span className="flex items-center gap-1.5 text-foreground"><IndianRupee className="w-4 h-4 text-secondary" /> {c.fees.toLocaleString()}/yr</span>
                                        </div>
                                        <Link to={`/courses/${c.code}`} className="mt-6 inline-flex items-center gap-2 font-semibold text-primary hover:text-secondary" data-testid={`view-course-${c.code}`}>
                                            View details <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
