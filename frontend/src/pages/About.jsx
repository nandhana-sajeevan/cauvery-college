import { motion } from "framer-motion";
import { Target, Eye, BookHeart, Quote } from "lucide-react";

export default function About() {
    return (
        <div data-testid="about-page">
            {/* Hero */}
            <section className="relative h-[55vh] flex items-end overflow-hidden">
                <img src="https://images.unsplash.com/photo-1734184489462-e8c123f2797b?auto=format&fit=crop&w=1600&q=80" alt="Campus" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 hero-overlay" />
                <div className="relative container-x pb-16">
                    <p className="text-secondary uppercase tracking-[0.3em] text-sm font-bold mb-3">About</p>
                    <h1 className="font-outfit font-black text-white text-5xl lg:text-7xl leading-tight max-w-3xl">A legacy of learning since <span className="text-secondary">1992</span>.</h1>
                </div>
            </section>

            <section className="section">
                <div className="container-x grid lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-5">
                        <p className="text-secondary uppercase tracking-[0.25em] text-sm font-bold mb-3">Our Story</p>
                        <h2 className="font-outfit font-black text-4xl text-primary leading-tight">Rooted in Kodagu. Reaching the world.</h2>
                    </div>
                    <div className="lg:col-span-7 text-foreground/80 leading-relaxed text-lg space-y-5">
                        <p>Founded in 1992 in the lush highlands of Gonikoppal, Cauvery College has grown from a single-discipline institution into a multi-faculty hub that prepares students for a world that is constantly changing.</p>
                        <p>Affiliated to Mangalore University and accredited by NAAC, we balance academic rigour with a deeply personal mentorship culture — because we believe great education is as much about character as it is about credentials.</p>
                    </div>
                </div>
            </section>

            {/* Vision / Mission */}
            <section className="section bg-white border-y border-border">
                <div className="container-x grid md:grid-cols-3 gap-6">
                    {[
                        { icon: Target, title: "Mission", body: "Deliver industry-aligned, value-based education that creates competent professionals and conscientious citizens." },
                        { icon: Eye, title: "Vision", body: "To be a globally recognised institution known for academic excellence, ethical leadership and inclusive growth." },
                        { icon: BookHeart, title: "Values", body: "Integrity. Innovation. Inclusion. Impact. The four pillars that guide every Cauverian's journey." },
                    ].map((b, i) => (
                        <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="bg-background rounded-2xl p-8 border border-border lift" data-testid={`about-pillar-${i}`}>
                            <div className="w-12 h-12 rounded-xl bg-primary text-secondary flex items-center justify-center mb-5">
                                <b.icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-outfit font-bold text-2xl text-primary mb-3">{b.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{b.body}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Principal message */}
            <section className="section">
                <div className="container-x grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-5">
                        <div className="rounded-2xl overflow-hidden bg-primary p-2">
                            <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=900&q=80" alt="Principal"
                                className="w-full aspect-[4/5] object-cover rounded-xl" />
                        </div>
                    </div>
                    <div className="lg:col-span-7">
                        <Quote className="w-12 h-12 text-secondary mb-4" />
                        <p className="font-outfit font-light text-2xl lg:text-3xl text-primary leading-snug">
                            "At Cauvery, we don't just teach subjects — we cultivate the curiosity, courage and clarity that define lifelong learners. Every student here is part of a family that walks with them long after graduation."
                        </p>
                        <div className="mt-8">
                            <div className="font-bold text-primary text-lg">Dr. Anjali Rao</div>
                            <div className="text-muted-foreground">Principal, Cauvery College Gonikoppal</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Campus images */}
            <section className="section pt-0">
                <div className="container-x">
                    <p className="text-secondary uppercase tracking-[0.25em] text-sm font-bold mb-3">Our campus</p>
                    <h2 className="font-outfit font-black text-4xl lg:text-5xl text-primary mb-10">A space to learn, live, and lead.</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            "https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&w=800&q=80",
                            "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=800&q=80",
                            "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=800&q=80",
                            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80",
                        ].map((src, i) => (
                            <motion.img key={i} src={src} alt="campus" loading="lazy"
                                initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                                className="aspect-[4/5] w-full object-cover rounded-2xl lift" />
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
