import { useRegistration, useUpdateRegistration } from "@/hooks/use-registrations";
import { useRoute } from "wouter";
import { Loader2, ArrowLeft, FileText, CheckCircle, XCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { Textarea } from "@/components/ui/textarea";

export default function RegistrationDetailsPage() {
  const [, params] = useRoute("/registrations/:id");
  const id = parseInt(params?.id || "0");
  const { data: reg, isLoading } = useRegistration(id);
  const { user } = useAuth();
  const { mutate: updateReg } = useUpdateRegistration();

  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  if (!reg) return <div>Registration not found</div>;

  const isAdmin = user?.role === "admin";
  const typedReg = reg as any;

  // Ensure data is stacked by checking both profile data and snapshot data
  const studentData = {
    fullName: typedReg.user?.fullName || typedReg.studentInfo?.fullName || "N/A",
    grade: typedReg.user?.grade || typedReg.studentInfo?.grade || "N/A",
    section: typedReg.user?.section || typedReg.studentInfo?.section || "N/A",
    strand: typedReg.user?.strand || typedReg.studentInfo?.strand || "N/A",
    contact: typedReg.user?.contactNumber || typedReg.studentInfo?.contact || "N/A",
    email: typedReg.user?.email || typedReg.studentInfo?.email || "N/A",
  };

  const eventData = {
    title: typedReg.event?.title || "N/A",
    date: typedReg.event?.date ? format(new Date(typedReg.event.date), "MMMM d, yyyy p") : "N/A",
    venue: typedReg.event?.venue || "N/A",
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary mb-4" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="flex justify-between items-start">
         <div>
            <h1 className="text-2xl font-display font-bold uppercase">Registration Details</h1>
            <p className="text-muted-foreground font-mono mt-1 uppercase">REF: {typedReg.referenceNumber}</p>
         </div>
         <StatusBadge status={typedReg.status} />
      </div>

      {typedReg.remarks && (
         <Card className="border-primary/50 bg-primary/5 shadow-md border-2">
            <CardContent className="p-6">
               <label className="text-xs font-bold uppercase text-primary mb-2 block">Admin Remarks / Feedback</label>
               <p className="text-lg font-bold text-primary uppercase leading-tight">{typedReg.remarks}</p>
            </CardContent>
         </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
         <Card>
            <CardHeader>
               <CardTitle className="text-lg uppercase font-display">Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold">Event</label>
                  <p className="font-medium uppercase">{eventData.title}</p>
               </div>
               <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold">Date</label>
                  <p className="font-medium uppercase">{eventData.date}</p>
               </div>
               <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold">Payment Deadline</label>
                  <p className="font-medium uppercase">{format(new Date(typedReg.event.deadline), "MMMM d, yyyy p")}</p>
               </div>
            </CardContent>
         </Card>

         <Card>
            <CardHeader>
               <CardTitle className="text-lg uppercase font-display">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold">Name</label>
                  <p className="font-medium uppercase">{studentData.fullName}</p>
               </div>
               <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold">Grade</label>
                  <p className="font-medium uppercase">{studentData.grade}</p>
               </div>
               {studentData.strand !== "N/A" && (
                 <div>
                    <label className="text-xs text-muted-foreground uppercase font-bold">Strand</label>
                    <p className="font-medium uppercase">{studentData.strand}</p>
                 </div>
               )}
               <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold">Section</label>
                  <p className="font-medium uppercase">{studentData.section}</p>
               </div>
               <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold">Contact</label>
                  <p className="font-medium uppercase">{studentData.contact}</p>
               </div>
            </CardContent>
         </Card>
      </div>

      <Card>
         <CardHeader>
            <CardTitle className="text-lg uppercase font-display">Attached Documents</CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
             {typedReg.parentConsentUrl ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                   <div className="flex items-center">
                      <FileText className="w-5 h-5 text-primary mr-3" />
                      <div>
                         <p className="font-medium text-sm uppercase">Parent Consent Form</p>
                         <p className="text-xs text-muted-foreground uppercase">Uploaded Document</p>
                      </div>
                   </div>
                   <Button variant="outline" size="sm" asChild className="uppercase text-[10px] font-bold">
                      <a href={typedReg.parentConsentUrl} target="_blank" rel="noopener noreferrer">View</a>
                   </Button>
                </div>
             ) : (
                <div className="text-sm text-muted-foreground italic p-4 border rounded-lg border-dashed text-center uppercase">No consent form attached</div>
             )}

             {typedReg.paymentProofUrl ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                   <div className="flex items-center">
                      <FileText className="w-5 h-5 text-secondary-foreground mr-3" />
                      <div>
                         <p className="font-medium text-sm uppercase">Payment Proof</p>
                         <p className="text-xs text-muted-foreground uppercase">Uploaded Document</p>
                      </div>
                   </div>
                   <Button variant="outline" size="sm" asChild className="uppercase text-[10px] font-bold">
                      <a href={typedReg.paymentProofUrl} target="_blank" rel="noopener noreferrer">View</a>
                   </Button>
                </div>
             ) : (
                <div className="text-sm text-muted-foreground italic p-4 border rounded-lg border-dashed text-center uppercase">No payment proof attached</div>
             )}
         </CardContent>
      </Card>

      {isAdmin && typedReg.status === "Pending" && (
         <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-6 space-y-4">
               <div className="flex items-center gap-2 text-primary">
                  <ShieldCheck className="w-5 h-5" />
                  <h4 className="font-bold uppercase text-sm">Review Registration</h4>
               </div>
               <p className="text-xs text-muted-foreground uppercase">Verify the uploaded documents and student information before taking action.</p>
               
               <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground">Admin Remarks</label>
                  <Textarea 
                     placeholder="ADD COMMENTS OR REMARKS HERE..." 
                     className="rounded-xl resize-none uppercase text-xs"
                     id="admin-remarks"
                  />
               </div>

               <div className="flex flex-col sm:flex-row gap-3 justify-end pt-2">
                  <Button 
                    variant="outline" 
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 uppercase font-bold text-xs h-11 px-6 rounded-xl" 
                    onClick={() => {
                       const remarks = (document.getElementById('admin-remarks') as HTMLTextAreaElement)?.value;
                       updateReg({ id: typedReg.id, status: "Rejected", remarks });
                    }}
                  >
                     <XCircle className="w-4 h-4 mr-2" /> Reject Registration
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white uppercase font-bold text-xs h-11 px-6 rounded-xl shadow-lg shadow-green-600/20" 
                    onClick={() => {
                       const remarks = (document.getElementById('admin-remarks') as HTMLTextAreaElement)?.value;
                       updateReg({ id: typedReg.id, status: "Approved", remarks });
                    }}
                  >
                     <CheckCircle className="w-4 h-4 mr-2" /> Approve Registration
                  </Button>
               </div>
            </CardContent>
         </Card>
      )}
    </div>
  );
}
