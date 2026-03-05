import { useAuth } from "@/hooks/use-auth";
import { useEvents, useCreateEvent, useDeleteEvent } from "@/hooks/use-events";
import { useRegistrations, useUpdateRegistration } from "@/hooks/use-registrations";
import { Loader2, Plus, Calendar, Users, Filter, Check, X, Search, Upload, Image as ImageIcon, Clock, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
import { apiRequest } from "@/lib/queryClient";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { events } = useEvents();
  const { data: registrations } = useRegistrations();
  const { mutateAsync: createEvent, isPending: isCreating } = useCreateEvent();
  const { mutateAsync: updateReg } = useUpdateRegistration();
  const { mutateAsync: deleteEvent } = useDeleteEvent();

  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [eventToDelete, setEventToDelete] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState("Pending");
  const [uploadingImage, setUploadingImage] = useState(false);

  const eventForm = useForm<z.infer<typeof insertEventSchema>>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: {
       title: "",
       description: "",
       venue: "",
       fee: 0,
       imageUrl: "",
       appointmentDeadline: null,
    }
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await apiRequest("POST", "/api/uploads/request-url", {
        filename: file.name,
        fileType: file.type,
      });
      const { uploadUrl, publicUrl } = await res.json();

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      eventForm.setValue("imageUrl", publicUrl);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmitEvent = async (data: z.infer<typeof insertEventSchema>) => {
    await createEvent({
        ...data,
        date: new Date(data.date), 
        deadline: new Date(data.deadline),
        appointmentDeadline: data.appointmentDeadline ? new Date(data.appointmentDeadline) : null
    });
    setIsEventDialogOpen(false);
    eventForm.reset();
  };

  const handleDeleteConfirm = async () => {
    if (deletePassword === "admin123") {
      if (eventToDelete) {
        await deleteEvent(eventToDelete);
        setIsDeleteDialogOpen(false);
        setDeletePassword("");
        setEventToDelete(null);
      }
    } else {
      alert("Incorrect password");
    }
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
                        <FormItem className="flex flex-col">
                        <FormLabel className="uppercase font-bold text-xs">Date & Time</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal rounded-xl",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "MM/dd/yyyy p")
                                ) : (
                                  <span>MM/DD/YYYY --:-- --</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                            <div className="p-3 border-t">
                              <Input 
                                type="time"
                                className="rounded-lg"
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value.split(':');
                                  const date = field.value ? new Date(field.value) : new Date();
                                  date.setHours(parseInt(hours), parseInt(minutes));
                                  field.onChange(new Date(date));
                                }}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
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
                        <FormMessage />
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
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-bold">₱</span>
                            <Input type="number" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} className="rounded-xl pl-7" />
                          </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={eventForm.control}
                    name="deadline"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel className="uppercase font-bold text-xs">Payment Deadline</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal rounded-xl",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "MM/dd/yyyy p")
                                ) : (
                                  <span>MM/DD/YYYY --:-- --</span>
                                )}
                                <Calendar className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <CalendarComponent
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                            <div className="p-3 border-t">
                              <Input 
                                type="time"
                                className="rounded-lg"
                                onChange={(e) => {
                                  const [hours, minutes] = e.target.value.split(':');
                                  const date = field.value ? new Date(field.value) : new Date();
                                  date.setHours(parseInt(hours), parseInt(minutes));
                                  field.onChange(new Date(date));
                                }}
                              />
                            </div>
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                <FormField
                  control={eventForm.control}
                  name="appointmentDeadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="uppercase font-bold text-xs">Appointment Deadline</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal rounded-xl",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "MM/dd/yyyy p")
                              ) : (
                                <span>MM/DD/YYYY --:-- --</span>
                              )}
                              <Clock className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={field.value || undefined}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                          <div className="p-3 border-t">
                            <Input 
                              type="time"
                              className="rounded-lg"
                              onChange={(e) => {
                                const [hours, minutes] = e.target.value.split(':');
                                const date = field.value ? new Date(field.value) : new Date();
                                date.setHours(parseInt(hours), parseInt(minutes));
                                field.onChange(new Date(date));
                              }}
                            />
                          </div>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={eventForm.control}
                    name="imageUrl"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="uppercase font-bold text-xs">Event Poster</FormLabel>
                        <FormControl>
                          <div className="space-y-4">
                            <div className="flex items-center gap-4">
                              <Button
                                type="button"
                                variant="outline"
                                className="w-full h-24 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
                                onClick={() => document.getElementById('event-image-upload')?.click()}
                                disabled={uploadingImage}
                              >
                                {uploadingImage ? (
                                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                ) : field.value ? (
                                  <div className="flex flex-col items-center gap-2">
                                    <ImageIcon className="w-6 h-6 text-primary" />
                                    <span className="text-[10px] uppercase font-bold text-primary">Change Poster</span>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-2">
                                    <Upload className="w-6 h-6 text-muted-foreground" />
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Upload Event Poster</span>
                                  </div>
                                )}
                              </Button>
                              <input
                                id="event-image-upload"
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageUpload}
                              />
                            </div>
                            {field.value && (
                              <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-border">
                                <img src={field.value} alt="Preview" className="w-full h-full object-cover" />
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="destructive"
                                  className="absolute top-2 right-2 h-6 w-6 rounded-full"
                                  onClick={() => field.onChange("")}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
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
        <h3 className="text-xl font-bold font-display uppercase">Events</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events?.map(event => (
            <Card key={event.id} className="overflow-hidden border border-border/50 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <Link href={`/events/${event.id}`}>
                <div className="h-32 bg-muted relative">
                  {event.imageUrl && <img src={event.imageUrl} alt="" className="w-full h-full object-cover" />}
                </div>
                <CardContent className="p-4">
                  <h4 className="font-bold truncate uppercase">{event.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1 mb-2 uppercase">{event.venue}</p>
                  <div className="flex justify-between items-center mt-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-tight">
                      {format(new Date(event.date), "MMMM d, yyyy p")}
                    </Badge>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="uppercase">Delete Event</DialogTitle>
            <DialogDescription className="uppercase font-bold text-red-600">This action cannot be undone. Please enter admin password to confirm.</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input 
              type="password" 
              placeholder="ENTER ADMIN PASSWORD" 
              value={deletePassword} 
              onChange={(e) => setDeletePassword(e.target.value)}
              className="uppercase rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="uppercase rounded-xl">Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="uppercase rounded-xl shadow-lg shadow-destructive/20">Confirm Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                        <div className="text-xs text-muted-foreground uppercase">{reg.user?.grade} - {reg.user?.strand ? `${reg.user?.strand} - ` : ""}{reg.user?.section}</div>
                      </TableCell>
                      <TableCell>{reg.event?.title}</TableCell>
                      <TableCell className="text-muted-foreground text-sm uppercase">
                        {format(new Date(reg.createdAt), "MMMM d, yyyy")}
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
