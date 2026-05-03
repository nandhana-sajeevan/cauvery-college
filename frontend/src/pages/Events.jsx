import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import { Calendar, MapPin, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Events() {
    const [events, setEvents] = useState([]);

    useEffect(() => { api.get("/events").then(r => setEvents(r.data)); }, []);

    const today = new Date().toISOString().slice(0, 10);
    const upcoming = events.filter(e => e.date >= today);
    const past = events.filter(e => e.date < today);

    return (
        <div data-testid="events-page">
            <section className="bg-primary text-white py-24 lg:py-32">
                <div className="container-x">
                    <p className="text-secondary uppercase tracking-[0.3em] text-sm font-bold mb-3">Events</p>
                    <h1 className="font-outfit font-black text-5xl lg:text-7xl">Pulse of the <span className="text-secondary">campus</span>.</h1>
                </div>
            </section>

            <Section title="Upcoming events" items={upcoming} testId="upcoming-events" />
            <Section title="Past events" items={past} testId="past-events" muted />
        </div>
    );
}

function Section({ title, items, testId, muted }) {
    return (
        <section className={`section ${muted ? "bg-white border-y border-border" : ""}`}>
            <div className="container-x">
                <h2 className="font-outfit font-black text-3xl lg:text-4xl text-primary mb-10">{title}</h2>
                {items.length === 0 ? (
                    <p className="text-muted-foreground">No events to show.</p>
                ) : (
                    <div className="grid md:grid-cols-3 gap-6" data-testid={testId}>
                        {items.map((e, i) => (
                            <motion.div key={e.id} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                                <Link to={`/events/${e.id}`} className="block bg-white rounded-2xl overflow-hidden border border-border lift">
                                    <div className="aspect-[16/10] overflow-hidden">
                                        <img src={e.image} alt={e.title} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-6">
                                        <span className="text-xs uppercase tracking-widest text-secondary font-bold">{e.category}</span>
                                        <h3 className="font-outfit font-bold text-xl text-primary mt-2 mb-3 leading-snug">{e.title}</h3>
                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{e.location}</span>
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
