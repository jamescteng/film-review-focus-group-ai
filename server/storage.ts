import { sessions, reports, voiceScripts, type Session, type InsertSession, type Report, type InsertReport, type VoiceScript, type InsertVoiceScript } from "../shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  createSession(data: InsertSession): Promise<Session>;
  getSession(id: number): Promise<Session | undefined>;
  getSessions(): Promise<Session[]>;
  updateSession(id: number, data: Partial<InsertSession>): Promise<Session | undefined>;
  deleteSession(id: number): Promise<void>;
  
  createReport(data: InsertReport): Promise<Report>;
  getReport(id: number): Promise<Report | undefined>;
  getReportsBySession(sessionId: number): Promise<Report[]>;
  getReportBySessionAndPersona(sessionId: number, personaId: string): Promise<Report | undefined>;
  
  createVoiceScript(data: InsertVoiceScript): Promise<VoiceScript>;
  getVoiceScript(sessionId: number, personaId: string): Promise<VoiceScript | undefined>;
  updateVoiceScriptAudio(id: number, audioUrl: string): Promise<VoiceScript | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createSession(data: InsertSession): Promise<Session> {
    const [session] = await db.insert(sessions).values(data).returning();
    return session;
  }

  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select().from(sessions).where(eq(sessions.id, id));
    return session || undefined;
  }

  async getSessions(): Promise<Session[]> {
    return db.select().from(sessions).orderBy(desc(sessions.createdAt));
  }

  async updateSession(id: number, data: Partial<InsertSession>): Promise<Session | undefined> {
    const [session] = await db
      .update(sessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();
    return session || undefined;
  }

  async deleteSession(id: number): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
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

  async createVoiceScript(data: InsertVoiceScript): Promise<VoiceScript> {
    const [script] = await db.insert(voiceScripts).values(data).returning();
    return script;
  }

  async getVoiceScript(sessionId: number, personaId: string): Promise<VoiceScript | undefined> {
    const [script] = await db
      .select()
      .from(voiceScripts)
      .where(and(eq(voiceScripts.sessionId, sessionId), eq(voiceScripts.personaId, personaId)))
      .orderBy(desc(voiceScripts.createdAt))
      .limit(1);
    return script || undefined;
  }

  async updateVoiceScriptAudio(id: number, audioUrl: string): Promise<VoiceScript | undefined> {
    const [script] = await db
      .update(voiceScripts)
      .set({ audioUrl })
      .where(eq(voiceScripts.id, id))
      .returning();
    return script || undefined;
  }
}

export const storage = new DatabaseStorage();
