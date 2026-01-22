import { useRegistration, useUpdateRegistration } from "@/hooks/use-registrations";
import { useRoute } from "wouter";
import { Loader2, ArrowLeft, FileText, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function RegistrationDetailsPage() {
  const [, params] = useRoute("/registrations/:id");
  const id = parseInt(params?.id || "0");
  const { data: reg, isLoading } = useRegistration(id);
  const { user } = useAuth();
  const { mutate: updateReg } = useUpdateRegistration();

  if (isLoading) return <div className="flex h-full items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;
  if (!reg) return <div>Registration not found</div>;

  const isAdmin = user?.role === "admin";
  const typedReg = reg as any; // Temporary fix for inferred types during transition

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary mb-4" onClick={() => window.history.back()}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="flex justify-between items-start">
         <div>
            <h1 className="text-2xl font-display font-bold">Registration Details</h1>
            <p className="text-muted-foreground font-mono mt-1">Ref: {typedReg.referenceNumber}</p>
         </div>
         <StatusBadge status={typedReg.status} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
         <Card>
            <CardHeader>
               <CardTitle className="text-lg">Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold">Event</label>
                  <p className="font-medium">{typedReg.event?.title}</p>
               </div>
               <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold">Date</label>
                  <p className="font-medium">{format(new Date(typedReg.event?.date), "MMMM d, yyyy h:mm a")}</p>
               </div>
               <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold">Venue</label>
                  <p className="font-medium">{typedReg.event?.venue}</p>
               </div>
            </CardContent>
         </Card>

         <Card>
            <CardHeader>
               <CardTitle className="text-lg">Student Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold">Name</label>
                  <p className="font-medium">{typedReg.user?.fullName}</p>
               </div>
               <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold">Grade / Section</label>
                  <p className="font-medium uppercase">{typedReg.user?.grade} - {typedReg.user?.section} {typedReg.user?.strand ? `(${typedReg.user?.strand})` : ""}</p>
               </div>
               <div>
                  <label className="text-xs text-muted-foreground uppercase font-bold">Contact</label>
                  <p className="font-medium">{typedReg.user?.contactNumber || "N/A"}</p>
               </div>
            </CardContent>
         </Card>
      </div>

      <Card>
         <CardHeader>
            <CardTitle className="text-lg">Attached Documents</CardTitle>
         </CardHeader>
         <CardContent className="space-y-4">
             {typedReg.parentConsentUrl ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                   <div className="flex items-center">
                      <FileText className="w-5 h-5 text-primary mr-3" />
                      <div>
                         <p className="font-medium text-sm">Parent Consent Form</p>
                         <p className="text-xs text-muted-foreground">Uploaded Document</p>
                      </div>
                   </div>
                   <Button variant="outline" size="sm" asChild>
                      <a href={typedReg.parentConsentUrl} target="_blank" rel="noopener noreferrer">View</a>
                   </Button>
                </div>
             ) : (
                <div className="text-sm text-muted-foreground italic p-4 border rounded-lg border-dashed text-center">No consent form attached</div>
             )}

             {typedReg.paymentProofUrl ? (
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                   <div className="flex items-center">
                      <FileText className="w-5 h-5 text-secondary-foreground mr-3" />
                      <div>
                         <p className="font-medium text-sm">Payment Proof</p>
                         <p className="text-xs text-muted-foreground">Uploaded Document</p>
                      </div>
                   </div>
                   <Button variant="outline" size="sm" asChild>
                      <a href={typedReg.paymentProofUrl} target="_blank" rel="noopener noreferrer">View</a>
                   </Button>
                </div>
             ) : (
                <div className="text-sm text-muted-foreground italic p-4 border rounded-lg border-dashed text-center">No payment proof attached</div>
             )}
         </CardContent>
      </Card>

      {isAdmin && typedReg.status === "Pending" && (
         <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row gap-4 justify-end items-center">
            <span className="text-sm text-muted-foreground mr-auto">Action required: Verify documents and approve registration.</span>
            <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => updateReg({ id: typedReg.id, status: "Rejected" })}>
               <XCircle className="w-4 h-4 mr-2" /> Reject
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => updateReg({ id: typedReg.id, status: "Approved" })}>
               <CheckCircle className="w-4 h-4 mr-2" /> Approve Registration
            </Button>
         </div>
      )}
    </div>
  );
}
