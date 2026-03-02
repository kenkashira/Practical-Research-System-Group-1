import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(), // LRN (Numbers only enforced in frontend)
  password: text("password").notNull(),
  role: text("role", { enum: ["student", "admin"] }).default("student").notNull(),
  fullName: text("full_name").notNull(),
  grade: text("grade"),
  section: text("section"),
  strand: text("strand"),
  email: text("email"),
  contactNumber: text("contact_number"),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  venue: text("venue").notNull(),
  fee: integer("fee").default(0).notNull(),
  deadline: timestamp("deadline").notNull(),
  appointmentDeadline: timestamp("appointment_deadline"),
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
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().length(12, "LRN must be exactly 12 digits").regex(/^\d+$/, "LRN must be numbers only"),
  fullName: z.string().min(1, "Full name is required").transform(val => val.toUpperCase()),
  section: z.string().min(1, "Section is required").transform(val => val.toUpperCase()),
  grade: z.string().min(1, "Grade is required"),
  strand: z.string().optional().default("N/A"),
}).omit({ id: true }).refine((data) => {
  const gradeNum = parseInt(data.grade);
  if (gradeNum >= 11 && (!data.strand || data.strand === "N/A" || data.strand === "")) {
    return false;
  }
  return true;
}, {
  message: "Strand is required for Grade 11 and 12",
  path: ["strand"]
});
export const insertEventSchema = createInsertSchema(events, {
  date: z.coerce.date(),
  deadline: z.coerce.date(),
  appointmentDeadline: z.coerce.date().nullable(),
}).omit({ id: true });
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
