import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import { Calendar, MapPin, ArrowLeft } from "lucide-react";

export default function EventDetail() {
    const { id } = useParams();
    const [event, setEvent] = useState(null);

    useEffect(() => { api.get(`/events/${id}`).then(r => setEvent(r.data)); }, [id]);

    if (!event) return <div className="container-x section"><div className="h-96 rounded-2xl bg-muted animate-pulse" /></div>;

    return (
        <div data-testid={`event-detail-${event.id}`}>
            <section className="relative h-[60vh] overflow-hidden flex items-end">
                <img src={event.image} alt={event.title} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 hero-overlay" />
                <div className="relative container-x pb-16 text-white">
                    <Link to="/events" className="inline-flex items-center gap-2 text-secondary hover:text-white mb-4 text-sm">
                        <ArrowLeft className="w-4 h-4" /> All events
                    </Link>
                    <span className="text-secondary uppercase tracking-[0.3em] text-xs font-bold">{event.category}</span>
                    <h1 className="font-outfit font-black text-4xl lg:text-6xl mt-3 leading-tight max-w-4xl">{event.title}</h1>
                </div>
            </section>

            <section className="section">
                <div className="container-x grid lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-8">
                        <p className="text-foreground/85 leading-relaxed text-lg">{event.description}</p>
                    </div>
                    <aside className="lg:col-span-4 bg-primary text-white rounded-2xl p-7 h-fit space-y-4">
                        <div className="flex items-start gap-3">
                            <Calendar className="w-5 h-5 text-secondary mt-0.5" />
                            <div>
                                <div className="text-xs uppercase tracking-widest text-white/60">Date</div>
                                <div className="font-bold">{new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
                            </div>
                        </div>
                        <div className="flex items-start gap-3">
                            <MapPin className="w-5 h-5 text-secondary mt-0.5" />
                            <div>
                                <div className="text-xs uppercase tracking-widest text-white/60">Venue</div>
                                <div className="font-bold">{event.location}</div>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    );
}
