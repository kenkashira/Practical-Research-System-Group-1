import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // Student ID or LRN
  password: text("password").notNull(),
  role: text("role", { enum: ["student", "admin"] }).default("student").notNull(),
  fullName: text("full_name").notNull(),
  gradeSection: text("grade_section"),
  email: text("email"),
  contactNumber: text("contact_number"),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  venue: text("venue").notNull(),
  fee: integer("fee").default(0).notNull(), // In cents or base currency unit
  deadline: timestamp("deadline").notNull(),
  imageUrl: text("image_url"),
});

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  eventId: integer("event_id").references(() => events.id).notNull(),
  status: text("status", { enum: ["Pending", "Approved", "Rejected"] }).default("Pending").notNull(),
  referenceNumber: text("reference_number").notNull().unique(),
  stage: integer("stage").default(1).notNull(), // 1: Info, 2: Consent, 3: Payment, 4: Final
  
  // Stage 1 Data (Snapshot or specific fields if different from profile)
  studentInfo: jsonb("student_info"), 

  // Stage 2
  parentConsentUrl: text("parent_consent_url"),

  // Stage 3
  paymentProofUrl: text("payment_proof_url"),

  // Admin remarks
  remarks: text("remarks"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Session table for connect-pg-simple
export const session = pgTable("session", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire", { precision: 6 }).notNull(),
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertRegistrationSchema = createInsertSchema(registrations).omit({ 
  id: true, 
  referenceNumber: true, 
  createdAt: true,
  status: true,
  remarks: true 
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
