import { useEvent } from "@/hooks/use-events";
import { useRegistrations, useCreateRegistration } from "@/hooks/use-registrations";
import { useAuth } from "@/hooks/use-auth";
import { useRoute, useLocation, Link } from "wouter";
import { Loader2, Calendar, MapPin, Clock, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { InsertRegistration } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import { useUpload } from "@/hooks/use-upload";

// This page implements the Registration Wizard
export default function EventDetailsPage() {
  const [, params] = useRoute("/events/:id");
  const eventId = parseInt(params?.id || "0");
  const { data: event, isLoading } = useEvent(eventId);
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { data: registrations } = useRegistrations();
  
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
      setLocation("/registrations");
    } catch (error) {
      console.error(error);
    }
  };

  const isStarted = existingRegistration && existingRegistration.stage < 4;

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

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
              <Badge className="bg-primary hover:bg-primary text-white border-none">Event</Badge>
              {event.fee === 0 ? (
                <Badge variant="secondary" className="text-secondary-foreground font-bold">Free</Badge>
              ) : (
                <Badge variant="secondary" className="text-secondary-foreground font-bold">PHP {event.fee}</Badge>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-2 shadow-sm">{event.title}</h1>
          </div>
        </div>

        <div className="p-8 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h3 className="text-lg font-bold font-display mb-2 text-primary">About this Event</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {event.description}
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-muted/30 p-6 rounded-2xl space-y-4 border border-border">
              <div className="flex items-start">
                <Calendar className="w-5 h-5 mr-3 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date</p>
                  <p className="font-semibold">{format(new Date(event.date), "MMMM d, yyyy")}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Clock className="w-5 h-5 mr-3 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Time</p>
                  <p className="font-semibold">{format(new Date(event.date), "h:mm a")}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Venue</p>
                  <p className="font-semibold">{event.venue}</p>
                </div>
              </div>
            </div>

            {existingRegistration && existingRegistration.stage === 4 ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                 <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
                 <p className="text-green-800 font-semibold">You are registered!</p>
                 <Link href={`/registrations/${existingRegistration.id}`}>
                    <Button variant="outline" className="text-green-700 mt-2">View Status</Button>
                 </Link>
              </div>
            ) : (
              <Button 
                size="lg" 
                className="w-full text-lg font-semibold shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all uppercase"
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
             <DialogTitle className="font-display text-2xl">Event Registration</DialogTitle>
             <DialogDescription>
               Step {step} of {event.fee > 0 ? 4 : 3}: {
                 step === 1 ? "Verify Information" :
                 step === 2 ? "Parent Consent" :
                 step === 3 && event.fee > 0 ? "Payment" : "Review"
               }
             </DialogDescription>
             
             {/* Progress Bar */}
             <div className="w-full bg-muted h-1.5 mt-4 rounded-full overflow-hidden">
               <div 
                 className="bg-primary h-full transition-all duration-300 ease-in-out" 
                 style={{ width: `${(step / (event.fee > 0 ? 4 : 3)) * 100}%` }}
               />
             </div>
           </DialogHeader>

           <div className="p-6 pt-2">
             {step === 1 && (
               <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
                 <div className="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-2">
                   <div className="grid grid-cols-2 gap-2 text-sm">
                     <span className="text-muted-foreground uppercase font-bold">Full Name:</span>
                     <span className="font-medium text-right">{user?.fullName}</span>
                     
                     <span className="text-muted-foreground uppercase font-bold">LRN:</span>
                     <span className="font-medium text-right">{user?.username}</span>
                     
                     <span className="text-muted-foreground uppercase font-bold">Grade/Section:</span>
                     <span className="font-medium text-right">{user?.grade} - {user?.section}</span>

                     {user?.strand && (
                       <>
                         <span className="text-muted-foreground uppercase font-bold">Strand:</span>
                         <span className="font-medium text-right">{user?.strand}</span>
                       </>
                     )}

                     <span className="text-muted-foreground uppercase font-bold">Contact:</span>
                     <span className="font-medium text-right">{user?.contactNumber || "N/A"}</span>
                   </div>
                 </div>
                 <p className="text-sm text-muted-foreground italic text-center">
                   Is this information correct? You can update it in your profile settings.
                 </p>
               </div>
             )}

             {step === 2 && (
                <div className="space-y-4 animate-in slide-in-from-right-8 duration-300 text-center">
                   <div className="border-2 border-dashed border-border rounded-xl p-8 hover:bg-muted/10 transition-colors">
                      <ObjectUploader 
                        onGetUploadParameters={getUploadParameters}
                        onComplete={(result) => {
                          const url = result.successful?.[0]?.uploadURL; 
                          if (url) setParentConsentUrl(url); 
                        }}
                      >
                         <div className="flex flex-col items-center gap-2 cursor-pointer">
                           <div className="bg-primary/10 p-3 rounded-full text-primary">
                             <ArrowLeft className="w-6 h-6 rotate-90" /> {/* Upload Icon placeholder */}
                           </div>
                           <p className="font-medium uppercase">Upload Parent Consent Form</p>
                           <p className="text-xs text-muted-foreground">PDF or Image (Max 5MB)</p>
                         </div>
                      </ObjectUploader>
                      {parentConsentUrl && <p className="text-green-600 text-sm mt-2 font-medium">File Uploaded!</p>}
                   </div>
                </div>
             )}

             {step === 3 && event.fee > 0 && (
                <div className="space-y-4 animate-in slide-in-from-right-8 duration-300 text-center">
                   <p className="text-sm text-muted-foreground">Please pay <span className="font-bold text-foreground">PHP {event.fee}</span> to GCash: 09123456789</p>
                   <div className="border-2 border-dashed border-border rounded-xl p-8 hover:bg-muted/10 transition-colors">
                      <ObjectUploader 
                        onGetUploadParameters={getUploadParameters}
                        onComplete={(result) => {
                          const url = result.successful?.[0]?.uploadURL; 
                          if (url) setPaymentProofUrl(url); 
                        }}
                      >
                         <div className="flex flex-col items-center gap-2 cursor-pointer">
                           <div className="bg-secondary/20 p-3 rounded-full text-secondary-foreground">
                             <ArrowLeft className="w-6 h-6 rotate-90" />
                           </div>
                           <p className="font-medium uppercase">Upload Payment Proof</p>
                           <p className="text-xs text-muted-foreground">Screenshot or Photo</p>
                         </div>
                      </ObjectUploader>
                      {paymentProofUrl && <p className="text-green-600 text-sm mt-2 font-medium">Proof Uploaded!</p>}
                   </div>
                </div>
             )}

             {(step === 4 || (step === 3 && event.fee === 0)) && (
               <div className="space-y-4 animate-in slide-in-from-right-8 duration-300 text-center py-4">
                 <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                   <CheckCircle2 className="w-8 h-8" />
                 </div>
                 <h3 className="text-xl font-bold uppercase">Ready to Submit!</h3>
                 <p className="text-muted-foreground">
                   By clicking submit, you confirm that all provided details and documents are authentic.
                 </p>
               </div>
             )}
           </div>

           <DialogFooter className="p-6 bg-muted/20 flex gap-2 justify-between sm:justify-between">
             <Button variant="outline" onClick={prevStep} disabled={step === 1} className="uppercase">
               Back
             </Button>
             
             {((step === 4 && event.fee > 0) || (step === 3 && event.fee === 0)) ? (
                <Button onClick={handleRegister} disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white uppercase">
                  {isPending ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : "Submit Registration"}
                </Button>
             ) : (
                <Button onClick={nextStep} disabled={
                    (step === 2 && !parentConsentUrl) || 
                    (step === 3 && event.fee > 0 && !paymentProofUrl)
                } className="uppercase">
                  Next Step
                </Button>
             )}
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
