import { useAuth } from "@/hooks/use-auth";
import { useEvents, useCreateEvent } from "@/hooks/use-events";
import { useRegistrations, useUpdateRegistration } from "@/hooks/use-registrations";
import { Loader2, Plus, Calendar, Users, Filter, Check, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEventSchema } from "@shared/schema";
import { z } from "zod";
import { useState } from "react";
import { format } from "date-fns";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "wouter";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { events } = useEvents();
  const { data: registrations } = useRegistrations();
  const { mutateAsync: createEvent, isPending: isCreating } = useCreateEvent();
  const { mutateAsync: updateReg } = useUpdateRegistration();

  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("Pending");

  const eventForm = useForm<z.infer<typeof insertEventSchema>>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
       title: "",
       description: "",
       venue: "",
       fee: 0,
       imageUrl: "",
    }
  });

  const onSubmitEvent = async (data: z.infer<typeof insertEventSchema>) => {
    // Manually handle date strings for the demo or use date picker component
    // Assuming simple text input for dates for MVP speed
    // Ideally use a DatePicker component
    await createEvent({
        ...data,
        date: new Date(data.date), 
        deadline: new Date(data.deadline)
    });
    setIsEventDialogOpen(false);
    eventForm.reset();
  };

  const pendingRegs = registrations?.filter(r => r.status === "Pending") || [];
  const filteredRegs = registrations?.filter(r => filterStatus === "All" ? true : r.status === filterStatus) || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary uppercase">Admin Dashboard</h2>
          <p className="text-muted-foreground uppercase">Manage events and verify student registrations.</p>
        </div>
        <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shadow-lg shadow-primary/20 uppercase font-bold">
              <Plus className="w-4 h-4 mr-2" /> Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="uppercase font-display">Create New Event</DialogTitle>
            </DialogHeader>
            <Form {...eventForm}>
              <form onSubmit={eventForm.handleSubmit(onSubmitEvent)} className="space-y-4 py-4">
                <FormField
                  control={eventForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-bold text-xs">Event Title</FormLabel>
                      <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={eventForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-bold text-xs">Description</FormLabel>
                      <FormControl><Textarea {...field} className="rounded-xl resize-none" /></FormControl>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                   <FormField
                    control={eventForm.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="uppercase font-bold text-xs">Date & Time</FormLabel>
                        <FormControl><Input type="datetime-local" {...field} value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''} onChange={e => field.onChange(new Date(e.target.value))} className="rounded-xl" /></FormControl>
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={eventForm.control}
                    name="venue"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="uppercase font-bold text-xs">Venue</FormLabel>
                        <FormControl><Input {...field} className="rounded-xl" /></FormControl>
                        </FormItem>
                    )}
                    />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                   <FormField
                    control={eventForm.control}
                    name="fee"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="uppercase font-bold text-xs">Fee (PHP)</FormLabel>
                        <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="rounded-xl" /></FormControl>
                        </FormItem>
                    )}
                    />
                     <FormField
                    control={eventForm.control}
                    name="deadline"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="uppercase font-bold text-xs">Deadline</FormLabel>
                        <FormControl><Input type="datetime-local" {...field} value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ''} onChange={e => field.onChange(new Date(e.target.value))} className="rounded-xl" /></FormControl>
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                    control={eventForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="uppercase font-bold text-xs">Image URL (Optional)</FormLabel>
                        <FormControl><Input placeholder="https://..." {...field} value={field.value || ''} className="rounded-xl" /></FormControl>
                        </FormItem>
                    )}
                />
                <DialogFooter>
                   <Button type="submit" disabled={isCreating} className="w-full uppercase font-bold py-6 rounded-xl shadow-lg shadow-primary/20">
                     {isCreating ? <Loader2 className="animate-spin w-5 h-5" /> : "Publish Event"}
                   </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-none shadow-md bg-gradient-to-br from-blue-50 to-white">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Events</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="flex items-center">
               <Calendar className="w-8 h-8 text-primary mr-4" />
               <span className="text-4xl font-display font-bold text-primary">{events?.length || 0}</span>
             </div>
           </CardContent>
         </Card>
         <Card className="border-none shadow-md bg-gradient-to-br from-yellow-50 to-white">
           <CardHeader className="pb-2">
             <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Approvals</CardTitle>
           </CardHeader>
           <CardContent>
             <div className="flex items-center">
               <Users className="w-8 h-8 text-secondary-foreground mr-4" />
               <span className="text-4xl font-display font-bold text-secondary-foreground">{pendingRegs.length}</span>
             </div>
           </CardContent>
         </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold font-display uppercase">Registration Management</h3>
            <div className="flex gap-2">
               {["All", "Pending", "Approved", "Rejected"].map(s => (
                   <Button 
                      key={s} 
                      variant={filterStatus === s ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFilterStatus(s)}
                      className="uppercase font-bold text-[10px] px-3 h-8 rounded-lg"
                   >
                     {s}
                   </Button>
               ))}
            </div>
        </div>

        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
           <Table>
             <TableHeader className="bg-muted/50">
               <TableRow>
                 <TableHead className="uppercase font-bold text-[10px]">Ref No.</TableHead>
                 <TableHead className="uppercase font-bold text-[10px]">Student</TableHead>
                 <TableHead className="uppercase font-bold text-[10px]">Event</TableHead>
                 <TableHead className="uppercase font-bold text-[10px]">Date</TableHead>
                 <TableHead className="uppercase font-bold text-[10px]">Status</TableHead>
                 <TableHead className="text-right uppercase font-bold text-[10px]">Actions</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {filteredRegs.length > 0 ? (
                  filteredRegs.map(reg => (
                    <TableRow key={reg.id}>
                      <TableCell className="font-mono text-xs">{reg.referenceNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium uppercase">{reg.user?.fullName}</div>
                        <div className="text-xs text-muted-foreground uppercase">{reg.user?.grade} - {reg.user?.section} {reg.user?.strand ? `(${reg.user?.strand})` : ""}</div>
                      </TableCell>
                      <TableCell>{reg.event?.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(reg.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell><StatusBadge status={reg.status} /></TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                            {reg.status === "Pending" && (
                               <>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => updateReg({ id: reg.id, status: "Approved" })}>
                                    <Check className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => updateReg({ id: reg.id, status: "Rejected" })}>
                                    <X className="w-4 h-4" />
                                </Button>
                               </>
                            )}
                            <Link href={`/registrations/${reg.id}`}>
                              <Button size="sm" variant="ghost" className="h-8 text-xs">View</Button>
                            </Link>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
               ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No registrations found.
                    </TableCell>
                  </TableRow>
               )}
             </TableBody>
           </Table>
        </div>
      </div>
    </div>
  );
}
