import { db } from "./db";
import { 
  users, events, registrations,
  type User, type InsertUser,
  type Event, type InsertEvent,
  type Registration, type InsertRegistration
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  deleteEvent(id: number): Promise<void>;

  // Registrations
  getRegistrations(): Promise<(Registration & { event: Event, user: User })[]>;
  getRegistration(id: number): Promise<Registration | undefined>;
  getRegistrationsByUser(userId: number): Promise<(Registration & { event: Event })[]>;
  createRegistration(registration: InsertRegistration): Promise<Registration>;
  updateRegistration(id: number, updates: Partial<Registration>): Promise<Registration>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(events.date);
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async deleteEvent(id: number): Promise<void> {
    // First delete all registrations for this event to avoid foreign key constraints
    await db.delete(registrations).where(eq(registrations.eventId, id));
    // Then delete the event
    await db.delete(events).where(eq(events.id, id));
  }

  async getRegistrations(): Promise<(Registration & { event: Event, user: User })[]> {
    const results = await db.select().from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .innerJoin(users, eq(registrations.userId, users.id));
    
    return results.map(row => ({
      ...row.registrations,
      event: row.events,
      user: row.users
    }));
  }

  async getRegistration(id: number): Promise<(Registration & { event: Event, user: User }) | undefined> {
    const [result] = await db.select().from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .innerJoin(users, eq(registrations.userId, users.id))
      .where(eq(registrations.id, id));
    
    if (!result) return undefined;

    return {
      ...result.registrations,
      event: result.events,
      user: result.users
    };
  }

  async getRegistrationsByUser(userId: number): Promise<(Registration & { event: Event })[]> {
    const results = await db.select().from(registrations)
      .innerJoin(events, eq(registrations.eventId, events.id))
      .where(eq(registrations.userId, userId));
    
    return results.map(row => ({
      ...row.registrations,
      event: row.events
    }));
  }

  async createRegistration(registration: InsertRegistration): Promise<Registration> {
    // Prevent duplicate registrations for the same event by the same user
    const existing = await db.select().from(registrations)
      .where(
        and(
          eq(registrations.userId, registration.userId),
          eq(registrations.eventId, registration.eventId)
        )
      );

    if (existing.length > 0) {
      throw new Error("You are already registered for this event");
    }

    // Generate a uniform reference number: AAIS-YEAR-RANDOM
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    const referenceNumber = `AAIS-${year}-${random}`;
    
    const [newReg] = await db.insert(registrations).values({
      ...registration,
      referenceNumber,
    }).returning();
    return newReg;
  }

  async updateRegistration(id: number, updates: Partial<Registration>): Promise<Registration> {
    const [updated] = await db.update(registrations)
      .set(updates)
      .where(eq(registrations.id, id))
      .returning();
    return updated;
  }
  async updateUserRole(id: number, role: "student" | "admin"): Promise<User> {
    const [updated] = await db.update(users)
      .set({ role })
      .where(eq(users.id, id))
      .returning();
    return updated;
  }

  async updateUserProfile(id: number, updates: Partial<User>): Promise<User> {
    const [updated] = await db.update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
