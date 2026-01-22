import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import StudentDashboard from "@/pages/dashboard-student";
import AdminDashboard from "@/pages/admin-dashboard";
import EventsPage from "@/pages/events-page";
import EventDetailsPage from "@/pages/event-details";
import RegistrationDetailsPage from "@/pages/registration-details";
import Layout from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

// Protected Route Wrapper
function ProtectedRoute({ 
  component: Component, 
  adminOnly = false 
}: { 
  component: React.ComponentType, 
  adminOnly?: boolean 
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  if (adminOnly && user.role !== "admin") {
    return <Redirect href="/dashboard" />;
  }

  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={AuthPage} />
      
      {/* Student Routes */}
      <Route path="/dashboard">
        <ProtectedRoute component={StudentDashboard} />
      </Route>
      <Route path="/events">
        <ProtectedRoute component={EventsPage} />
      </Route>
      <Route path="/events/:id">
        <ProtectedRoute component={EventDetailsPage} />
      </Route>
      <Route path="/registrations">
        {/* Reuse student dashboard but focused on regs - simplified for now */}
        <ProtectedRoute component={StudentDashboard} />
      </Route>
      <Route path="/registrations/:id">
        <ProtectedRoute component={RegistrationDetailsPage} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin">
        <ProtectedRoute component={AdminDashboard} adminOnly />
      </Route>
      <Route path="/admin/events/:id">
        {/* Admin uses same detail page but might have different actions in future */}
        <ProtectedRoute component={EventDetailsPage} adminOnly />
      </Route>
      <Route path="/admin/registrations">
        <ProtectedRoute component={AdminDashboard} adminOnly />
      </Route>

      {/* Default Redirect */}
      <Route path="/">
        {(_params) => {
           // Simple redirect logic based on auth state (handled inside ProtectedRoute effectively if we redirect to /dashboard)
           // But since we can't call hook here easily without component, let's redirect to auth which handles "already logged in"
           return <Redirect href="/auth" />;
        }}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
