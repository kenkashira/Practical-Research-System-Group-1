import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";

const loginSchema = z.object({
  username: z.string().regex(/^\d+$/, "LRN must be numbers only"),
  password: z.string().min(1, "Password is required"),
});

export default function AuthPage() {
  const { user, login, register, isLoggingIn, isRegistering } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<z.infer<typeof insertUserSchema>>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
      fullName: "",
      role: "student",
      email: "",
      contactNumber: "",
      grade: "",
      section: "",
      strand: "",
    },
  });

  const onRegister = async (data: z.infer<typeof insertUserSchema>) => {
    await register(data);
    // Automatic login is handled by the hook if it updates state, 
    // but the user wants to be moved to login area or gone.
    // The redirect happens automatically because 'user' state changes.
  };

  if (user) {
    return <Redirect href={user.role === "admin" ? "/admin" : "/dashboard"} />;
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-slate-50">
      {/* Left: Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1541339907198-e08756dedf3f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-2xl">
            <span className="font-display font-bold text-3xl">A</span>
          </div>
          <h1 className="font-display text-5xl font-bold leading-tight mb-6">
            Army's Angels <br />
            <span className="text-secondary uppercase">INTEGRATED SCHOOL</span>
          </h1>
          <p className="text-lg text-primary-foreground/80 max-w-md">
            Welcome to the official event portal. Register for upcoming events, submit requirements, and track your applications.
          </p>
        </div>
        
        <div className="relative z-10 flex gap-4 text-sm text-primary-foreground/60">
          <span>© 2024 ARMY'S ANGELS</span>
          <span>•</span>
          <span>PRIVACY POLICY</span>
        </div>
      </div>

      {/* Right: Forms */}
      <div className="flex items-center justify-center p-6 lg:p-12">
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5 }}
           className="w-full max-w-md"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-12 bg-muted/50 p-1">
              <TabsTrigger value="login" className="rounded-md font-medium text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all uppercase">
                LOGIN
              </TabsTrigger>
              <TabsTrigger value="register" className="rounded-md font-medium text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all uppercase">
                REGISTER
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="font-display text-2xl uppercase">WELCOME BACK</CardTitle>
                  <CardDescription>Enter your LRN to continue</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit((d) => login(d))} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase">LRN</FormLabel>
                            <FormControl>
                              <Input placeholder="12345678" {...field} className="bg-muted/30" type="number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase">PASSWORD</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input type={showPassword ? "text" : "password"} {...field} className="bg-muted/30 pr-10" />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                  onClick={() => setShowPassword(!showPassword)}
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className="w-full py-6 font-semibold shadow-lg shadow-primary/20 uppercase" disabled={isLoggingIn}>
                        {isLoggingIn ? <Loader2 className="animate-spin" /> : "SIGN IN"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="register">
              <Card className="border-none shadow-xl">
                <CardHeader>
                  <CardTitle className="font-display text-2xl uppercase">CREATE ACCOUNT</CardTitle>
                  <CardDescription>Enter your details to get started</CardDescription>
                </CardHeader>
                <CardContent>
                   <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase">LRN</FormLabel>
                            <FormControl>
                              <Input placeholder="12345678" {...field} type="number" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={registerForm.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="uppercase">FULL NAME</FormLabel>
                            <FormControl>
                              <Input placeholder="JOHN DOE" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={registerForm.control}
                            name="grade"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="uppercase">GRADE</FormLabel>
                                <FormControl>
                                <Input placeholder="11" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={registerForm.control}
                            name="section"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel className="uppercase">SECTION</FormLabel>
                                <FormControl>
                                <Input placeholder="RIZAL" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                      </div>
                      <FormField
                          control={registerForm.control}
                          name="strand"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel className="uppercase">STRAND (OPTIONAL)</FormLabel>
                              <FormControl>
                              <Input placeholder="STEM" {...field} />
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                          <FormItem>
                              <FormLabel className="uppercase">PASSWORD</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <Input type={showPassword ? "text" : "password"} {...field} className="pr-10" />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                  >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                          </FormItem>
                          )}
                      />
                      <Button type="submit" className="w-full py-6 font-semibold shadow-lg shadow-primary/20 uppercase" disabled={isRegistering}>
                        {isRegistering ? <Loader2 className="animate-spin" /> : "CREATE ACCOUNT"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
}
