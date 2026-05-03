import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Quote } from "lucide-react";
import { motion } from "framer-motion";

export default function Alumni() {
    const [list, setList] = useState([]);
    useEffect(() => { api.get("/alumni").then(r => setList(r.data)); }, []);

    return (
        <div data-testid="alumni-page">
            <section className="bg-primary text-white py-24 lg:py-32">
                <div className="container-x">
                    <p className="text-secondary uppercase tracking-[0.3em] text-sm font-bold mb-3">Alumni</p>
                    <h1 className="font-outfit font-black text-5xl lg:text-7xl">Cauverians who are <span className="text-secondary">shaping the world</span>.</h1>
                </div>
            </section>

            <section className="section">
                <div className="container-x grid md:grid-cols-2 gap-8">
                    {list.map((a, i) => (
                        <motion.article key={a.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                            className="bg-white rounded-2xl border border-border p-7 lg:p-9 lift" data-testid={`alumni-card-${a.id}`}>
                            <Quote className="w-8 h-8 text-secondary mb-5" />
                            <p className="font-outfit text-xl lg:text-2xl text-primary leading-snug">"{a.story}"</p>
                            <div className="mt-6 flex items-center gap-4">
                                <img src={a.photo} alt={a.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-secondary/40" />
                                <div>
                                    <div className="font-bold text-primary">{a.name}</div>
                                    <div className="text-sm text-muted-foreground">{a.role} · {a.company}</div>
                                    <div className="text-xs uppercase tracking-widest text-secondary mt-1">{a.batch}</div>
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </section>
        </div>
    );
}
