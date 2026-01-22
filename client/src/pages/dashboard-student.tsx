import { useAuth } from "@/hooks/use-auth";
import { useEvents } from "@/hooks/use-events";
import { useRegistrations } from "@/hooks/use-registrations";
import { EventCard } from "@/components/event-card";
import { StatusBadge } from "@/components/status-badge";
import { Loader2, ArrowRight, ClipboardList } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { events, isLoading: eventsLoading } = useEvents();
  const { data: registrations, isLoading: regsLoading } = useRegistrations();

  if (eventsLoading || regsLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  // Filter registrations for current user (though API should handle this ideally for security, client filtering for now based on API contract)
  const myRegistrations = registrations?.filter(r => r.userId === user?.id) || [];
  const upcomingEvents = events?.filter(e => new Date(e.date) > new Date()).slice(0, 3) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
           <h2 className="text-3xl font-display font-bold text-primary">Welcome, {user?.fullName.split(" ")[0]}!</h2>
           <p className="text-muted-foreground mt-1">Here's what's happening at Army's Angels.</p>
        </div>
        <Link href="/events">
           <Button variant="outline" className="hidden md:flex">Browse All Events</Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg shadow-primary/20">
          <div className="flex justify-between items-start">
             <div>
               <p className="text-primary-foreground/80 font-medium text-sm">Active Registrations</p>
               <h3 className="text-4xl font-display font-bold mt-2">
                 {myRegistrations.filter(r => r.status === 'Pending' || r.status === 'Approved').length}
               </h3>
             </div>
             <div className="bg-white/20 p-2 rounded-lg">
               <ClipboardList className="w-6 h-6" />
             </div>
          </div>
        </div>
        
        {/* Placeholder stats */}
         <div className="bg-white rounded-2xl p-6 border border-border shadow-sm">
           <p className="text-muted-foreground font-medium text-sm">Approved Events</p>
           <h3 className="text-4xl font-display font-bold mt-2 text-foreground">
             {myRegistrations.filter(r => r.status === 'Approved').length}
           </h3>
         </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Upcoming Events Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold font-display">Upcoming Events</h3>
            <Link href="/events" className="text-sm text-primary hover:underline md:hidden">View All</Link>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))
            ) : (
              <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-dashed">
                <p className="text-muted-foreground">No upcoming events right now.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Registrations Column */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold font-display">My Registrations</h3>
            <Link href="/registrations" className="text-sm text-primary hover:underline">View All</Link>
          </div>

          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
             {myRegistrations.length > 0 ? (
               <div className="divide-y divide-border/50">
                 {myRegistrations.slice(0, 5).map(reg => (
                   <Link key={reg.id} href={`/registrations/${reg.id}`}>
                     <div className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group">
                       <div className="flex justify-between items-start mb-1">
                         <h4 className="font-semibold text-sm group-hover:text-primary transition-colors">{reg.event?.title || "Unknown Event"}</h4>
                         <StatusBadge status={reg.status} />
                       </div>
                       <p className="text-xs text-muted-foreground mb-2">
                         Ref: <span className="font-mono">{reg.referenceNumber}</span>
                       </p>
                       <div className="text-xs text-muted-foreground flex items-center justify-between">
                         <span>Submitted {format(new Date(reg.createdAt), 'MMM d')}</span>
                         <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1" />
                       </div>
                     </div>
                   </Link>
                 ))}
               </div>
             ) : (
               <div className="p-8 text-center">
                 <p className="text-sm text-muted-foreground">You haven't registered for any events yet.</p>
                 <Link href="/events">
                   <Button variant="link" className="mt-2 text-secondary-foreground">Browse Events</Button>
                 </Link>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
