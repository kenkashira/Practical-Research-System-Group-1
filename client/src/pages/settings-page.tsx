import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, User, Mail, Phone, Lock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const GRADES = ["GRADE 7", "GRADE 8", "GRADE 9", "GRADE 10", "GRADE 11", "GRADE 12"];
const STRANDS = ["STEM", "HUMSS", "ABM", "ICT", "GAS"];

const profileSchema = z.object({
  email: z.string().email("Invalid email address"),
  contactNumber: z.string().min(10, "Contact number too short"),
  grade: z.string().min(1, "Grade is required"),
  section: z.string().min(1, "Section is required"),
  strand: z.string().optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
}).superRefine((data, ctx) => {
  const gradeLevel = parseInt(data.grade.replace(/\D/g, ""));
  if (gradeLevel >= 11 && !data.strand) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Strand is required for Grade 11 and 12",
      path: ["strand"],
    });
  }
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      email: user?.email || "",
      contactNumber: user?.contactNumber || "",
      grade: user?.grade || "",
      section: user?.section || "",
      strand: user?.strand || "",
      password: "",
    },
  });

  const selectedGrade = form.watch("grade");
  const isSeniorHigh = selectedGrade && parseInt(selectedGrade.replace(/\D/g, "")) >= 11;

  const mutation = useMutation({
    mutationFn: async (values: ProfileForm) => {
      if (!confirm("Are you sure you want to update your profile information?")) {
        throw new Error("Update cancelled");
      }
      const payload = { ...values };
      if (!isSeniorHigh) payload.strand = "N/A";
      if (!payload.password) delete payload.password;
      const res = await apiRequest("PATCH", "/api/user/profile", payload);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Profile Updated",
        description: "Your information has been successfully saved.",
      });
      form.reset({ ...form.getValues(), password: "" });
    },
    onError: (error: Error) => {
      if (error.message === "Update cancelled") return;
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 bg-primary/10 rounded-2xl text-primary">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold uppercase">Personal Information</h1>
          <p className="text-muted-foreground uppercase">Manage your account details and security</p>
        </div>
      </div>

      <Card className="border-border/50 shadow-xl rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-6">
          <CardTitle className="uppercase font-display">Student Profile</CardTitle>
          <CardDescription className="uppercase">Update your contact information and password</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2 opacity-70">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Full Name</label>
                  <div className="p-3 bg-muted rounded-xl border border-border/50 font-medium">{user?.fullName}</div>
                </div>
                <div className="space-y-2 opacity-70">
                  <label className="text-xs font-bold uppercase text-muted-foreground">Student ID / LRN</label>
                  <div className="p-3 bg-muted rounded-xl border border-border/50 font-medium font-mono">{user?.username}</div>
                </div>
              </div>

              <div className="h-px bg-border/50 my-6" />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-bold text-xs">Grade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger className="rounded-xl bg-slate-50 border-border/50">
                            <SelectValue placeholder="Select Grade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADES.map((grade) => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-bold text-xs">Section</FormLabel>
                      <FormControl>
                        <Input {...field} className="rounded-xl bg-slate-50 border-border/50" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {isSeniorHigh && (
                  <FormField
                    control={form.control}
                    name="strand"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="uppercase font-bold text-xs">Strand</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl bg-slate-50 border-border/50">
                              <SelectValue placeholder="Select Strand" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STRANDS.map((strand) => (
                              <SelectItem key={strand} value={strand}>{strand}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-bold text-xs">Email Address</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input {...field} className="pl-10 rounded-xl bg-slate-50 border-border/50" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="uppercase font-bold text-xs">Contact Number</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input {...field} className="pl-10 rounded-xl bg-slate-50 border-border/50" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase font-bold text-xs">New Password (Leave blank to keep current)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="password" {...field} className="pl-10 rounded-xl bg-slate-50 border-border/50" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                className="w-full h-12 text-lg font-bold uppercase rounded-xl shadow-lg shadow-primary/20"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? <Loader2 className="animate-spin w-5 h-5 mr-2" /> : "Save Changes"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
