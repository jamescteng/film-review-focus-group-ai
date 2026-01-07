import { pgTable, serial, text, timestamp, jsonb, varchar, integer, bigint } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  synopsis: text("synopsis").notNull(),
  questions: jsonb("questions").$type<string[]>().notNull().default([]),
  language: varchar("language", { length: 10 }).notNull().default("en"),
  fileUri: text("file_uri"),
  fileMimeType: text("file_mime_type"),
  fileName: text("file_name"),
  fileSize: bigint("file_size", { mode: "number" }),
  fileLastModified: bigint("file_last_modified", { mode: "number" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  personaId: varchar("persona_id", { length: 50 }).notNull(),
  executiveSummary: text("executive_summary").notNull(),
  highlights: jsonb("highlights").$type<any[]>().notNull().default([]),
  concerns: jsonb("concerns").$type<any[]>().notNull().default([]),
  answers: jsonb("answers").$type<any[]>().notNull().default([]),
  validationWarnings: jsonb("validation_warnings").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessionsRelations = relations(sessions, ({ many }) => ({
  reports: many(reports),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  session: one(sessions, {
    fields: [reports.sessionId],
    references: [sessions.id],
  }),
}));

export const voiceScripts = pgTable("voice_scripts", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => sessions.id, { onDelete: "cascade" }).notNull(),
  personaId: varchar("persona_id", { length: 50 }).notNull(),
  reportHash: varchar("report_hash", { length: 64 }).notNull(),
  language: varchar("language", { length: 10 }).notNull(),
  scriptJson: jsonb("script_json").$type<VoiceReportScript>().notNull(),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const voiceScriptsRelations = relations(voiceScripts, ({ one }) => ({
  session: one(sessions, {
    fields: [voiceScripts.sessionId],
    references: [sessions.id],
  }),
}));

export interface VoiceReportScript {
  version: "1.0";
  language: "en" | "zh-TW";
  persona: {
    personaId: string;
    name: string;
    role: string;
  };
  runtimeTargetSeconds: number;
  sections: Array<{
    sectionId: "OPEN" | "HIGHLIGHTS" | "CONCERNS" | "OBJECTIVES" | "CLOSE";
    lines: Array<{
      text: string;
      refs?: Array<{
        type: "highlight" | "concern" | "answer" | "summary";
        index?: number;
        timestamp?: string;
        seconds?: number;
      }>;
    }>;
  }>;
  coverage: {
    highlights: boolean[];
    concerns: boolean[];
    answers: boolean[];
    timestampsUsed: string[];
    wordCount: number;
  };
}

export type Session = typeof sessions.$inferSelect;
export type InsertSession = typeof sessions.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
export type VoiceScript = typeof voiceScripts.$inferSelect;
export type InsertVoiceScript = typeof voiceScripts.$inferInsert;
