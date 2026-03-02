import { useEvent } from "@/hooks/use-events";
import { useRegistrations, useCreateRegistration } from "@/hooks/use-registrations";
import { useAuth } from "@/hooks/use-auth";
import { useRoute, useLocation, Link } from "wouter";
import { Loader2, Calendar, MapPin, Clock, ArrowLeft, CheckCircle2, FileUp, Mail, User, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { InsertRegistration } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useUpload } from "@/hooks/use-upload";
import { cn } from "@/lib/utils";

// This page implements the Registration Wizard
export default function EventDetailsPage() {
  const [, params] = useRoute("/events/:id");
  const eventId = parseInt(params?.id || "0");
  const { data: event, isLoading } = useEvent(eventId);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: registrations } = useRegistrations();
  const { toast } = useToast();
  
  // Registration Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const { mutateAsync: createRegistration, isPending } = useCreateRegistration();
  const { getUploadParameters } = useUpload(); // Using the hook from context

  // Form State
  const [parentConsentUrl, setParentConsentUrl] = useState<string | null>(null);
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  }

  if (!event) return <div>Event not found</div>;

  const existingRegistration = registrations?.find(r => r.eventId === eventId && r.userId === user?.id);

  const handleRegister = async () => {
    try {
      if (!user) return;

      // Double check for existing registration locally as well
      const alreadyRegistered = registrations?.some(r => r.eventId === eventId && r.userId === user?.id && r.stage === 4);
      if (alreadyRegistered) {
        toast({
          title: "Already Registered",
          description: "You have already submitted a registration for this event.",
          variant: "destructive"
        });
        setIsWizardOpen(false);
        return;
      }
      
      const payload: InsertRegistration = {
        userId: user.id,
        eventId: event.id,
        stage: 4, // Completed
        studentInfo: {
            fullName: user.fullName,
            grade: user.grade,
            section: user.section,
            strand: user.strand,
            contact: user.contactNumber,
            email: user.email
        },
        parentConsentUrl: parentConsentUrl,
        paymentProofUrl: paymentProofUrl,
      };

      await createRegistration(payload);
      setIsWizardOpen(false);
      
      toast({
        title: "Registration Submitted",
        description: "Your registration is now pending review.",
      });

      setLocation("/registrations");
    } catch (error) {
      console.error(error);
    }
  };

  const isStarted = existingRegistration && existingRegistration.stage < 4;

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const isPastAppointment = event.appointmentDeadline && new Date() > new Date(event.appointmentDeadline);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary mb-4" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Events
      </Button>

      <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-border/50">
        <div className="relative h-64 md:h-96">
          <img 
            src={event.imageUrl || "https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=1200&auto=format&fit=crop"} 
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 p-8 text-white">
            <div className="flex gap-2 mb-4">
              <Badge className="bg-primary hover:bg-primary text-white border-none uppercase font-bold">Event</Badge>
              {event.fee === 0 ? (
                <Badge variant="secondary" className="text-secondary-foreground font-bold uppercase">Free</Badge>
              ) : (
                <Badge variant="secondary" className="text-secondary-foreground font-bold uppercase">PHP {event.fee}</Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-2 shadow-sm uppercase">{event.title}</h1>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-bold font-display mb-2 text-primary uppercase">About this Event</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line uppercase">
                {event.description}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-muted/30 p-6 rounded-2xl space-y-4 border border-border">
              <div className="flex items-start">
                <Calendar className="w-5 h-5 mr-3 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Date</p>
                  <p className="font-bold uppercase">{format(new Date(event.date), "MMMM d, yyyy")}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="w-5 h-5 mr-3 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Payment Deadline</p>
                  <p className="font-bold uppercase">{format(new Date(event.deadline), "MMMM d, yyyy")}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-primary mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase">Venue</p>
                  <p className="font-bold uppercase">{event.venue}</p>
                </div>
              </div>
            </div>

            {existingRegistration && existingRegistration.stage === 4 ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                 <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                 <p className="text-green-800 font-bold uppercase text-sm">You are registered!</p>
                 <Link href={`/registrations/${existingRegistration.id}`}>
                    <Button variant="outline" className="text-green-700 mt-2 uppercase font-bold text-xs">View Status</Button>
                 </Link>
              </div>
            ) : isPastAppointment ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-red-800 font-bold uppercase text-xs">Registration Period Ended</p>
              </div>
            ) : (
              <Button 
                size="lg" 
                className="w-full text-lg font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all uppercase h-14 rounded-2xl"
                onClick={() => setIsWizardOpen(true)}
              >
                {isStarted ? "Continue Registration" : "Register Now"}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Registration Wizard Dialog */}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-card">
          <DialogHeader className="p-6 pb-2">
             <DialogTitle className="font-display text-2xl uppercase">Event Registration</DialogTitle>
             <div className="flex items-center gap-1 mt-2 mb-4">
                {[1, 2, 3, 4].map((i) => {
                  const totalSteps = event.fee > 0 ? 4 : 3;
                  if (i > totalSteps) return null;
                  const isActive = step >= i;
                  return (
                    <div key={i} className="flex-1 flex items-center gap-1">
                      <div className={cn(
                        "h-1.5 flex-1 rounded-full transition-all duration-300",
                        isActive ? "bg-primary" : "bg-muted"
                      )} />
                    </div>
                  );
                })}
             </div>
             <DialogDescription className="uppercase font-bold text-xs text-primary">
               Step {step} of {event.fee > 0 ? 4 : 3}: {
                 step === 1 ? "Student Information" :
                 step === 2 ? "Parent Consent" :
                 step === 3 && event.fee > 0 ? "Payment Submission" : "Final Review"
               }
             </DialogDescription>
          </DialogHeader>

          <div className="p-6 pt-2">
            {step === 1 && (
               <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Full Name</label>
                      <div className="p-2.5 bg-muted rounded-lg text-sm font-medium opacity-70 border border-border/50 uppercase">{user?.fullName}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Student ID / LRN</label>
                      <div className="p-2.5 bg-muted rounded-lg text-sm font-mono opacity-70 border border-border/50">{user?.username}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Grade</label>
                      <div className="p-2.5 bg-muted rounded-lg text-sm font-medium opacity-70 border border-border/50 uppercase">{user?.grade}</div>
                    </div>
                    {user?.strand && user?.strand !== "N/A" && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Strand</label>
                        <div className="p-2.5 bg-muted rounded-lg text-sm font-medium opacity-70 border border-border/50 uppercase">{user?.strand}</div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Section</label>
                      <div className="p-2.5 bg-muted rounded-lg text-sm font-medium opacity-70 border border-border/50 uppercase">{user?.section}</div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Email Address</label>
                      <div className="p-2.5 bg-white rounded-lg text-sm font-medium border border-border/50 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="truncate">{user?.email}</span>
                      </div>
                    </div>
                  </div>
                 <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-start gap-3">
                    <div className="p-1.5 bg-white rounded-md text-primary shadow-sm">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight uppercase font-medium">
                      Information is pulled from your profile. Update it in <Link href="/settings" className="text-primary hover:underline font-bold">Settings</Link> if incorrect.
                    </p>
                 </div>
               </div>
            )}

            {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                   <div className="text-center space-y-2 mb-4">
                     <h4 className="font-bold uppercase text-sm">Upload Consent Form</h4>
                     <p className="text-xs text-muted-foreground uppercase">Please upload a photo of your signed parental consent form.</p>
                   </div>
                   <div className="border-2 border-dashed border-border rounded-2xl p-8 hover:bg-muted/10 transition-colors">
                      <ObjectUploader 
                        onGetUploadParameters={getUploadParameters}
                        onComplete={(result) => {
                          const url = result.successful?.[0]?.uploadURL; 
                          if (url) setParentConsentUrl(url); 
                        }}
                      >
                         <div className="flex flex-col items-center gap-3 cursor-pointer">
                           {parentConsentUrl ? (
                             <div className="relative group">
                               <img src={parentConsentUrl} className="w-32 h-32 object-cover rounded-xl border border-border" alt="Preview" />
                               <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                 <p className="text-[10px] text-white font-bold uppercase">Change Image</p>
                               </div>
                             </div>
                           ) : (
                             <>
                               <div className="bg-primary/10 p-4 rounded-full text-primary">
                                 <FileUp className="w-6 h-6" />
                               </div>
                               <p className="font-bold text-sm uppercase">Tap to Upload Form</p>
                             </>
                           )}
                         </div>
                      </ObjectUploader>
                   </div>
                   {parentConsentUrl && (
                     <div className="bg-green-50 p-2.5 rounded-lg border border-green-100 flex items-center gap-2 justify-center">
                       <CheckCircle2 className="w-4 h-4 text-green-600" />
                       <span className="text-[11px] text-green-700 font-bold uppercase">Form successfully attached</span>
                     </div>
                   )}
                </div>
            )}

            {step === 3 && event.fee > 0 && (
                <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                   <div className="bg-secondary/10 p-4 rounded-xl border border-secondary/20 text-center space-y-1">
                     <p className="text-xs text-muted-foreground uppercase">Amount to Pay</p>
                     <p className="text-2xl font-display font-bold text-secondary-foreground">PHP {event.fee}</p>
                     <p className="text-[10px] text-muted-foreground uppercase mt-2">GCash: 0912 345 6789 (Army's Angels)</p>
                   </div>
                   
                   <div className="border-2 border-dashed border-border rounded-2xl p-8 hover:bg-muted/10 transition-colors">
                      <ObjectUploader 
                        onGetUploadParameters={getUploadParameters}
                        onComplete={(result) => {
                          const url = result.successful?.[0]?.uploadURL; 
                          if (url) setPaymentProofUrl(url); 
                        }}
                      >
                         <div className="flex flex-col items-center gap-3 cursor-pointer">
                           {paymentProofUrl ? (
                             <div className="relative group">
                               <img src={paymentProofUrl} className="w-32 h-32 object-cover rounded-xl border border-border" alt="Preview" />
                               <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                 <p className="text-[10px] text-white font-bold uppercase">Change Image</p>
                               </div>
                             </div>
                           ) : (
                             <>
                               <div className="bg-secondary/10 p-4 rounded-full text-secondary-foreground">
                                 <FileUp className="w-6 h-6" />
                               </div>
                               <p className="font-bold text-sm uppercase">Upload Payment Receipt</p>
                             </>
                           )}
                         </div>
                      </ObjectUploader>
                   </div>
                   {paymentProofUrl && (
                     <div className="bg-green-50 p-2.5 rounded-lg border border-green-100 flex items-center gap-2 justify-center">
                       <CheckCircle2 className="w-4 h-4 text-green-600" />
                       <span className="text-[11px] text-green-700 font-bold uppercase">Receipt successfully attached</span>
                     </div>
                   )}
                </div>
            )}

            {((step === 4 && event.fee > 0) || (step === 3 && event.fee === 0)) && (
               <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                 <div className="bg-muted/30 rounded-2xl border border-border/50 overflow-hidden">
                    <div className="p-4 bg-muted/50 border-b border-border/50">
                      <h4 className="font-bold uppercase text-xs">Registration Summary</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground uppercase font-medium">Event</span>
                        <span className="font-bold uppercase">{event.title}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground uppercase font-medium">Student</span>
                        <span className="font-bold uppercase">{user?.fullName}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground uppercase font-medium">Consent Form</span>
                        <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-100 uppercase">Attached</Badge>
                      </div>
                      {event.fee > 0 && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-muted-foreground uppercase font-medium">Payment Proof</span>
                          <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-100 uppercase">Attached</Badge>
                        </div>
                      )}
                    </div>
                 </div>
                 
                 <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-4">
                    <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0" />
                    <div>
                      <h4 className="text-amber-900 font-bold uppercase text-xs mb-1">Confirmation</h4>
                      <p className="text-amber-800 text-[10px] uppercase leading-tight">
                        By submitting, you agree that all information provided is accurate and true. 
                        Your registration will be reviewed by the school administration.
                      </p>
                    </div>
                 </div>
               </div>
            )}
          </div>

           <DialogFooter className="p-6 bg-muted/20 flex gap-2 justify-between sm:justify-between">
             <Button variant="outline" onClick={prevStep} disabled={step === 1} className="uppercase">
               Back
             </Button>
             
              {((step === 4 && event.fee > 0) || (step === 3 && event.fee === 0)) ? (
                <Button onClick={handleRegister} disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white uppercase min-w-[140px]">
                  {isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "Final Submit"}
                </Button>
             ) : (
                <Button onClick={nextStep} disabled={
                    (step === 2 && !parentConsentUrl) || 
                    (step === 3 && event.fee > 0 && !paymentProofUrl)
                } className="uppercase min-w-[140px]">
                  Next Step
                </Button>
             )}
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
