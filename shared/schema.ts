import { pgTable, serial, text, timestamp, jsonb, varchar, integer, bigint } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Re-export auth models (users and auth_sessions tables)
export * from "./models/auth";
import { users } from "./models/auth";

// Screening sessions table (user's video analysis sessions)
export const screeningSessions = pgTable("screening_sessions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
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
  sessionId: integer("session_id").references(() => screeningSessions.id, { onDelete: "cascade" }).notNull(),
  personaId: varchar("persona_id", { length: 50 }).notNull(),
  executiveSummary: text("executive_summary").notNull(),
  highlights: jsonb("highlights").$type<any[]>().notNull().default([]),
  concerns: jsonb("concerns").$type<any[]>().notNull().default([]),
  answers: jsonb("answers").$type<any[]>().notNull().default([]),
  validationWarnings: jsonb("validation_warnings").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const screeningSessionsRelations = relations(screeningSessions, ({ many }) => ({
  reports: many(reports),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  session: one(screeningSessions, {
    fields: [reports.sessionId],
    references: [screeningSessions.id],
  }),
}));

// Type aliases for backwards compatibility (renamed sessions -> screeningSessions)
export type ScreeningSession = typeof screeningSessions.$inferSelect;
export type InsertScreeningSession = typeof screeningSessions.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type InsertReport = typeof reports.$inferInsert;
