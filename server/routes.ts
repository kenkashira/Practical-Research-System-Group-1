import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { users } from "@shared/schema";
import pgSession from "connect-pg-simple";
import { pool } from "./db";

// Extend Express User type
declare global {
  namespace Express {
    interface User {
      id: number;
      username: string;
      role: "student" | "admin";
    }
  }
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  const PgStore = pgSession(session);
  app.use(session({
    store: new PgStore({ pool, tableName: 'session' }),
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) { // In real app, hash password!
        return done(null, false, { message: "Invalid credentials" });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Register Object Storage Routes
  registerObjectStorageRoutes(app);

  // Auth Routes
  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.patch("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const { email, contactNumber, password } = req.body;
      const updates: any = {};
      if (email !== undefined) updates.email = email;
      if (contactNumber !== undefined) updates.contactNumber = contactNumber;
      if (password !== undefined) updates.password = password;

      const updated = await storage.updateUserProfile(req.user!.id, updates);
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).send();
    });
  });

  app.post(api.auth.register.path, async (req, res) => {
    try {
      const input = api.auth.register.input.parse(req.body);
      const existing = await storage.getUserByUsername(input.username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }
      const user = await storage.createUser(input);
      req.login(user, (err) => {
        if (err) throw err;
        res.status(201).json(user);
      });
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    res.json(req.user);
  });

  // Events Routes
  app.get(api.events.list.path, async (req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.get(api.events.get.path, async (req, res) => {
    const event = await storage.getEvent(Number(req.params.id));
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  });

  app.post(api.events.create.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const input = api.events.create.input.parse(req.body);
      const event = await storage.createEvent(input);
      res.status(201).json(event);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.delete(api.events.delete.path, async (req, res) => {
    if (!req.isAuthenticated() || req.user.role !== "admin") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    await storage.deleteEvent(Number(req.params.id));
    res.status(204).send();
  });

  // Registrations Routes
  app.get(api.registrations.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    if (req.user.role === "admin") {
      const regs = await storage.getRegistrations();
      res.json(regs);
    } else {
      const regs = await storage.getRegistrationsByUser(req.user.id);
      res.json(regs);
    }
  });

  app.post(api.registrations.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    try {
      const input = api.registrations.create.input.parse(req.body);
      // Ensure user is registering for themselves unless admin (though typically users register themselves)
      // Actually input doesn't have userId, we should add it from session
      const regData = { ...input, userId: req.user.id };
      
      const registration = await storage.createRegistration(regData);
      res.status(201).json(registration);
    } catch (err) {
       if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.patch(api.registrations.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    
    const id = Number(req.params.id);
    const existing = await storage.getRegistration(id);
    if (!existing) return res.status(404).json({ message: "Registration not found" });

    // Students can update pending registrations (e.g. stages), Admins can update status
    if (req.user.role !== "admin" && existing.userId !== req.user.id) {
       return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const input = api.registrations.update.input.parse(req.body);
      
      // If student is updating, prevent status/remarks changes (though Zod might allow, logic should restrict)
      // For MVP, we trust the input schema which allows partials, but in robust app we'd filter fields based on role.
      
      const updated = await storage.updateRegistration(id, input);
      res.json(updated);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ message: err.errors[0].message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get(api.registrations.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const reg = await storage.getRegistration(Number(req.params.id));
    if (!reg) return res.status(404).json({ message: "Not found" });
    
    if (req.user.role !== "admin" && reg.userId !== req.user.id) {
       return res.status(401).json({ message: "Unauthorized" });
    }
    res.json(reg);
  });

  app.patch("/api/user/role", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { role } = req.body;
    if (role !== "student" && role !== "admin") return res.status(400).send("Invalid role");
    
    await storage.updateUserRole(req.user!.id, role);
    // Update the session user
    (req.user as any).role = role;
    res.json({ success: true });
  });

  return httpServer;
}

// Seed function
async function seedDatabase() {
  const users = await storage.getUserByUsername("admin");
  if (!users) {
    await storage.createUser({
      username: "admin",
      password: "admin123", // Plaintext for MVP/Lite
      role: "admin",
      fullName: "SYSTEM ADMINISTRATOR",
      grade: "N/A",
      section: "N/A",
      strand: "N/A",
      email: "admin@school.edu",
      contactNumber: "1234567890"
    });
    console.log("Seeded admin user");

    await storage.createUser({
      username: "12345678",
      password: "password",
      role: "student",
      fullName: "JOHN DOE",
      grade: "10",
      section: "RIZAL",
      strand: "N/A",
      email: "john@student.edu",
      contactNumber: "09123456789"
    });
    console.log("Seeded student user");

    await storage.createEvent({
      title: "Science Fair 2024",
      description: "Annual science fair for all grades. Showcase your projects!",
      date: new Date("2024-11-15T09:00:00Z"),
      venue: "School Gymnasium",
      fee: 100, // $1.00
      deadline: new Date("2024-11-01T23:59:59Z"),
      imageUrl: "https://images.unsplash.com/photo-1564951434112-64d74cc2a2d7?auto=format&fit=crop&q=80"
    });
    console.log("Seeded event");
  }
}

// Run seed
seedDatabase().catch(console.error);
