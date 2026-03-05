import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import pgSession from "connect-pg-simple";
import { pool } from "./db";
import { upload } from "./index";

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

  /* ---------------- SESSION ---------------- */

  const PgStore = pgSession(session);

  app.use(
    session({
      store: new PgStore({ pool, tableName: "session" }),
      secret: process.env.SESSION_SECRET || "secret",
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  /* ---------------- AUTH ---------------- */

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);

        if (!user || user.password !== password) {
          return done(null, false, { message: "Invalid credentials" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user: any, done) => done(null, user.id));

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || null);
    } catch (err) {
      done(err);
    }
  });

  /* ---------------- FILE UPLOAD ---------------- */

  app.post("/api/upload", upload.single("file"), (req, res) => {

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    res.json({
      message: "File uploaded successfully",
      filename: req.file.filename,
      url: `/uploads/${req.file.filename}`,
    });

  });

  /* ---------------- AUTH ROUTES ---------------- */

  app.post(api.auth.login.path, passport.authenticate("local"), (req, res) => {
    res.json(req.user);
  });

  app.post(api.auth.logout.path, (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get(api.auth.me.path, (req, res) => {
    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    res.json(req.user);
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

  /* ---------------- USER PROFILE ---------------- */

  app.patch("/api/user/profile", async (req, res) => {

    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {

      const { email, contactNumber, password, grade, section, strand } =
        req.body;

      const updates: any = {};

      if (email !== undefined) updates.email = email;
      if (contactNumber !== undefined) updates.contactNumber = contactNumber;
      if (password !== undefined) updates.password = password;
      if (grade !== undefined) updates.grade = grade;
      if (section !== undefined) updates.section = section;
      if (strand !== undefined) updates.strand = strand;

      const updated = await storage.updateUserProfile(req.user!.id, updates);

      res.json(updated);

    } catch {

      res.status(500).json({ message: "Internal server error" });

    }
  });

  /* ---------------- EVENTS ---------------- */

  app.get(api.events.list.path, async (req, res) => {

    const events = await storage.getEvents();

    res.json(events);

  });

  app.get(api.events.get.path, async (req, res) => {

    const event = await storage.getEvent(Number(req.params.id));

    if (!event)
      return res.status(404).json({ message: "Event not found" });

    res.json(event);

  });

  app.post(api.events.create.path, async (req, res) => {

    if (!req.isAuthenticated() || req.user!.role !== "admin")
      return res.status(401).json({ message: "Unauthorized" });

    try {

      const input = api.events.create.input.parse(req.body);

      const event = await storage.createEvent(input);

      res.status(201).json(event);

    } catch (err) {

      if (err instanceof z.ZodError)
        res.status(400).json({ message: err.errors[0].message });

      else
        res.status(500).json({ message: "Internal server error" });

    }
  });

  app.delete(api.events.delete.path, async (req, res) => {

    if (!req.isAuthenticated() || req.user!.role !== "admin")
      return res.status(401).json({ message: "Unauthorized" });

    await storage.deleteEvent(Number(req.params.id));

    res.sendStatus(204);

  });

  /* ---------------- REGISTRATIONS ---------------- */

  app.get(api.registrations.list.path, async (req, res) => {

    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    if (req.user!.role === "admin") {

      const regs = await storage.getRegistrations();

      res.json(regs);

    } else {

      const regs = await storage.getRegistrationsByUser(req.user!.id);

      res.json(regs);

    }

  });

  app.post(api.registrations.create.path, async (req, res) => {

    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    try {

      const input = api.registrations.create.input.parse(req.body);

      const regData = {
        ...input,
        userId: req.user!.id,
      };

      const registration = await storage.createRegistration(regData);

      console.log(
        `[EMAIL SIMULATION] Student ${req.user!.id} submitted registration`
      );

      res.status(201).json(registration);

    } catch (err) {

      if (err instanceof z.ZodError)
        res.status(400).json({ message: err.errors[0].message });

      else
        res.status(500).json({ message: "Internal server error" });

    }

  });

  app.get(api.registrations.get.path, async (req, res) => {

    if (!req.isAuthenticated())
      return res.status(401).json({ message: "Unauthorized" });

    const reg = await storage.getRegistration(Number(req.params.id));

    if (!reg)
      return res.status(404).json({ message: "Not found" });

    if (req.user!.role !== "admin" && reg.userId !== req.user!.id)
      return res.status(401).json({ message: "Unauthorized" });

    res.json(reg);

  });

  /* ---------------- ROLE ---------------- */

  app.patch("/api/user/role", async (req, res) => {

    if (!req.isAuthenticated()) return res.sendStatus(401);

    const { role } = req.body;

    if (role !== "student" && role !== "admin")
      return res.status(400).send("Invalid role");

    await storage.updateUserRole(req.user!.id, role);

    (req.user as any).role = role;

    res.json({ success: true });

  });

  return httpServer;
}
