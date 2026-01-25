import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  LogOut,
  Calendar,
  ClipboardList,
  LayoutDashboard,
  ShieldCheck,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return <>{children}</>;

  const isAdmin = user.role === "admin";

  const navItems = [
    {
      label: "Dashboard",
      href: isAdmin ? "/admin" : "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Events",
      href: "/events",
      icon: Calendar,
    },
    {
      label: "Settings",
      href: "/settings",
      icon: ShieldCheck,
    },
    ...(isAdmin
      ? [
          {
            label: "Registrations",
            href: "/admin/registrations",
            icon: ShieldCheck,
          },
        ]
      : [
          {
            label: "My Registrations",
            href: "/registrations",
            icon: ClipboardList,
          },
        ]),
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-primary text-primary-foreground p-4 flex justify-between items-center shadow-md z-50 relative">
        <span className="font-display font-bold text-lg uppercase">Portal</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "bg-white border-r border-border fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex flex-col",
          isMobileMenuOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-border/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold font-display text-xl shadow-lg shadow-primary/30">
            A
          </div>
          <div>
            <h1 className="font-display font-bold text-lg leading-tight text-primary uppercase">
              Event Portal
            </h1>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer group",
                    isActive
                      ? "bg-primary/5 text-primary font-medium shadow-sm ring-1 ring-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-secondary" : "text-muted-foreground group-hover:text-primary"
                    )}
                  />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 bg-muted/20">
          <div className="flex items-center gap-3 mb-4 px-2">
            <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
              <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">
                {user.fullName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden flex-1">
              <p className="text-sm font-medium truncate uppercase">{user.fullName}</p>
              <div className="flex items-center justify-between gap-1">
                <p className="text-[10px] text-muted-foreground uppercase">
                  {user.role}
                </p>
                <button 
                  onClick={async () => {
                    const newRole = user.role === 'admin' ? 'student' : 'admin';
                    try {
                      const res = await fetch('/api/user/role', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: newRole })
                      });
                      if (res.ok) window.location.reload();
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="text-[10px] text-primary hover:underline uppercase font-bold"
                >
                  Switch to {user.role === 'admin' ? 'student' : 'admin'}
                </button>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 uppercase"
            onClick={() => logout()}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 relative">
        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="container mx-auto px-4 py-8 md:px-8 max-w-6xl min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
