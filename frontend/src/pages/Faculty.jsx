import { useEffect, useState } from "react";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";

export default function Faculty() {
    const [list, setList] = useState([]);
    const [filter, setFilter] = useState("All");

    useEffect(() => { api.get("/faculty").then(r => setList(r.data)); }, []);
    const departments = ["All", ...Array.from(new Set(list.map(f => f.department)))];
    const filtered = filter === "All" ? list : list.filter(f => f.department === filter);

    return (
        <div data-testid="faculty-page">
            <section className="bg-primary text-white py-24 lg:py-32">
                <div className="container-x">
                    <p className="text-secondary uppercase tracking-[0.3em] text-sm font-bold mb-3">Faculty</p>
                    <h1 className="font-outfit font-black text-5xl lg:text-7xl max-w-3xl">Mentors who <span className="text-secondary">elevate</span>.</h1>
                </div>
            </section>

            <section className="section">
                <div className="container-x">
                    <div className="flex flex-wrap gap-2 mb-10">
                        {departments.map(d => (
                            <button key={d} onClick={() => setFilter(d)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition ${filter === d ? "bg-primary text-white" : "bg-white border border-border text-foreground hover:border-primary"}`}
                                data-testid={`faculty-filter-${d}`}>
                                {d}
                            </button>
                        ))}
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((f, i) => (
                            <motion.div key={f.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                                className="bg-white rounded-2xl overflow-hidden border border-border lift" data-testid={`faculty-card-${f.id}`}>
                                <div className="aspect-[4/5] overflow-hidden bg-muted">
                                    <img src={f.photo} alt={f.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="p-6">
                                    <span className="text-xs uppercase tracking-[0.25em] font-bold text-secondary">{f.department}</span>
                                    <h3 className="font-outfit font-bold text-xl text-primary mt-2">{f.name}</h3>
                                    <p className="text-foreground/80 text-sm mt-1">{f.designation}</p>
                                    <p className="text-muted-foreground text-xs mt-1">{f.qualification}</p>
                                    {f.bio && <p className="text-muted-foreground text-sm mt-3 leading-relaxed">{f.bio}</p>}
                                    {f.email && <a href={`mailto:${f.email}`} className="mt-4 inline-flex items-center gap-2 text-sm text-primary hover:text-secondary font-medium">
                                        <Mail className="w-4 h-4" /> {f.email}
                                    </a>}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
