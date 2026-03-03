import { Event } from "@shared/schema";
import { format } from "date-fns";
import { Calendar, MapPin, Tag } from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface EventCardProps {
  event: Event;
  isAdmin?: boolean;
}

export function EventCard({ event, isAdmin }: EventCardProps) {
  const isPast = new Date(event.date) < new Date();

  return (
    <Link href={isAdmin ? `/admin/events/${event.id}` : `/events/${event.id}`}>
      <div className="group bg-card hover:bg-accent/5 rounded-2xl border border-border/50 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col">
        <div className="relative h-48 bg-muted overflow-hidden">
          {/* Use Unsplash source if no specific image provided */}
          <img 
            src={event.imageUrl || "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=60"} 
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
          
          <div className="absolute top-4 right-4">
             <Badge variant={isPast ? "secondary" : "default"} className="shadow-lg">
                {isPast ? "Past Event" : "Upcoming"}
             </Badge>
          </div>
          
          <div className="absolute bottom-4 left-4 text-white">
             <div className="font-display font-bold text-3xl drop-shadow-md">
                {format(new Date(event.date), "dd")}
             </div>
             <div className="text-sm font-medium uppercase tracking-wider opacity-90 drop-shadow-sm">
                {format(new Date(event.date), "MMMM d, yyyy")}
             </div>
          </div>
        </div>

        <div className="p-6 flex-1 flex flex-col">
          <h3 className="font-display text-xl font-bold mb-2 line-clamp-1 group-hover:text-primary transition-colors">
            {event.title}
          </h3>
          <p className="text-muted-foreground text-sm line-clamp-2 mb-6 flex-1">
            {event.description}
          </p>

          <div className="space-y-2 mt-auto">
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2 text-primary" />
              {format(new Date(event.date), "MMMM d, yyyy p")}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2 text-secondary" />
              {event.venue}
            </div>
            {event.fee > 0 && (
               <div className="flex items-center text-sm font-semibold text-foreground">
                 <Tag className="w-4 h-4 mr-2 text-green-500" />
                 PHP {event.fee.toFixed(2)}
               </div>
            )}
            {event.fee === 0 && (
                <div className="flex items-center text-sm font-semibold text-green-600">
                  <Tag className="w-4 h-4 mr-2" />
                  Free
                </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
