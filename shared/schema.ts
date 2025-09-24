import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  category: text("category", { enum: ["genel", "turkce", "sosyal", "matematik", "fizik", "kimya", "biyoloji", "ayt-matematik", "ayt-fizik", "ayt-kimya", "ayt-biyoloji"] }).notNull().default("genel"),
  color: text("color").default("#8B5CF6"), // Default purple color
  completed: boolean("completed").notNull().default(false),
  completedAt: text("completed_at"),
  dueDate: text("due_date"),
  recurrenceType: text("recurrence_type", { enum: ["none", "weekly", "monthly"] }).notNull().default("none"),
  recurrenceEndDate: text("recurrence_end_date"), // Optional - when to stop creating recurring tasks
  createdAt: timestamp("created_at").defaultNow(),
});

export const moods = pgTable("moods", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mood: text("mood").notNull(), // Unlimited emoji support
  moodBg: text("mood_bg"), // Background color
  note: text("note"), // Renamed from lyrics for better clarity
  createdAt: timestamp("created_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  targetValue: text("target_value").notNull(), // e.g., "75", "10000"
  currentValue: text("current_value").notNull().default("0"),
  unit: text("unit").notNull(), // e.g., "net", "sıralama"
  category: text("category", { enum: ["tyt", "ayt", "siralama", "genel"] }).notNull().default("genel"),
  timeframe: text("timeframe", { enum: ["günlük", "haftalık", "aylık", "yıllık"] }).notNull().default("aylık"),
  targetDate: text("target_date"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const questionLogs = pgTable("question_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exam_type: text("exam_type", { enum: ["TYT", "AYT"] }).notNull(),
  subject: text("subject").notNull(), // Türkçe, Matematik, Fizik etc.
  topic: text("topic"), // Optional - specific topic within subject for detailed analysis
  correct_count: text("correct_count").notNull(),
  wrong_count: text("wrong_count").notNull(),
  blank_count: text("blank_count").notNull().default("0"),
  wrong_topics: text("wrong_topics").array().default([]), // Array of topics where mistakes were made
  time_spent_minutes: integer("time_spent_minutes"), // Optional - time spent solving questions in minutes
  study_date: text("study_date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const examResults = pgTable("exam_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exam_name: text("exam_name").notNull(),
  exam_date: text("exam_date").notNull(),
  tyt_net: text("tyt_net").notNull().default("0"),
  ayt_net: text("ayt_net").notNull().default("0"),
  subjects_data: text("subjects_data"), // JSON string containing detailed subject breakdown
  ranking: text("ranking"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// New table for detailed subject-level net scores per exam
export const examSubjectNets = pgTable("exam_subject_nets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exam_id: varchar("exam_id").notNull(), // References examResults.id
  exam_type: text("exam_type", { enum: ["TYT", "AYT"] }).notNull(),
  subject: text("subject").notNull(), // Türkçe, Matematik, Fizik, Kimya, Biyoloji, etc.
  net_score: text("net_score").notNull(), // Subject-specific net score
  correct_count: text("correct_count").notNull().default("0"),
  wrong_count: text("wrong_count").notNull().default("0"),
  blank_count: text("blank_count").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const flashcards = pgTable("flashcards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  examType: text("exam_type", { enum: ["TYT", "AYT"] }).notNull().default("TYT"),
  subject: text("subject", { enum: ["turkce", "matematik", "fizik", "kimya", "biyoloji", "tarih", "cografya", "felsefe", "genel"] }).notNull().default("genel"),
  topic: text("topic"), // Konular için alan eklendi
  difficulty: text("difficulty", { enum: ["easy", "medium", "hard"] }).notNull().default("medium"),
  lastReviewed: timestamp("last_reviewed"),
  nextReview: timestamp("next_review").defaultNow(),
  reviewCount: text("review_count").notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertMoodSchema = createInsertSchema(moods).omit({
  id: true,
  createdAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionLogSchema = createInsertSchema(questionLogs).omit({
  id: true,
  createdAt: true,
});

export const insertExamResultSchema = createInsertSchema(examResults).omit({
  id: true,
  createdAt: true,
});

export const insertFlashcardSchema = createInsertSchema(flashcards).omit({
  id: true,
  createdAt: true,
  reviewCount: true,
});

export const insertExamSubjectNetSchema = createInsertSchema(examSubjectNets).omit({
  id: true,
  createdAt: true,
});

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertMood = z.infer<typeof insertMoodSchema>;
export type Mood = typeof moods.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertQuestionLog = z.infer<typeof insertQuestionLogSchema>;
export type QuestionLog = typeof questionLogs.$inferSelect;
export type InsertExamResult = z.infer<typeof insertExamResultSchema>;
export type ExamResult = typeof examResults.$inferSelect;
export type InsertFlashcard = z.infer<typeof insertFlashcardSchema>;
export type Flashcard = typeof flashcards.$inferSelect;
export type InsertExamSubjectNet = z.infer<typeof insertExamSubjectNetSchema>;
export type ExamSubjectNet = typeof examSubjectNets.$inferSelect;
