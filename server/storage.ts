import { screeningSessions, reports, type ScreeningSession, type InsertScreeningSession, type Report, type InsertReport } from "../shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  createSession(data: InsertScreeningSession): Promise<ScreeningSession>;
  getSession(id: number): Promise<ScreeningSession | undefined>;
  getSessionsByUser(userId: string): Promise<ScreeningSession[]>;
  updateSession(id: number, data: Partial<InsertScreeningSession>): Promise<ScreeningSession | undefined>;
  deleteSession(id: number): Promise<void>;
  
  createReport(data: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  getReportsBySession(sessionId: number): Promise<Report[]>;
  getReportBySessionAndPersona(sessionId: number, personaId: string): Promise<Report | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createSession(data: InsertScreeningSession): Promise<ScreeningSession> {
    const [session] = await db.insert(screeningSessions).values(data).returning();
    return session;
  }

  async getSession(id: number): Promise<ScreeningSession | undefined> {
    const [session] = await db.select().from(screeningSessions).where(eq(screeningSessions.id, id));
    return session || undefined;
  }

  async getSessionsByUser(userId: string): Promise<ScreeningSession[]> {
    return db.select().from(screeningSessions)
      .where(eq(screeningSessions.userId, userId))
      .orderBy(desc(screeningSessions.createdAt));
  }

  async updateSession(id: number, data: Partial<InsertScreeningSession>): Promise<ScreeningSession | undefined> {
    const [session] = await db
      .update(screeningSessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(screeningSessions.id, id))
      .returning();
    return session || undefined;
  }

  async deleteSession(id: number): Promise<void> {
    await db.delete(screeningSessions).where(eq(screeningSessions.id, id));
  }

  async createReport(data: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(data).returning();
    return report;
  }

  async getReport(id: number): Promise<Report | undefined> {
    const [report] = await db.select().from(reports).where(eq(reports.id, id));
    return report || undefined;
  }

  async getReportsBySession(sessionId: number): Promise<Report[]> {
    return db.select().from(reports).where(eq(reports.sessionId, sessionId)).orderBy(desc(reports.createdAt));
  }

  async getReportBySessionAndPersona(sessionId: number, personaId: string): Promise<Report | undefined> {
    const [report] = await db
      .select()
      .from(reports)
      .where(and(eq(reports.sessionId, sessionId), eq(reports.personaId, personaId)));
    return report || undefined;
  }
}

export const storage = new DatabaseStorage();
