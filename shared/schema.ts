import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // 'user' or 'ai'
  originalPrompt: text("original_prompt"), // Store original prompt before enhancement
  enhancedPrompt: text("enhanced_prompt"), // Store enhanced prompt
  isEnhanced: boolean("is_enhanced").default(false),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const promptTemplates = pgTable("prompt_templates", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  template: text("template").notNull(),
  icon: text("icon").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  sender: true,
  originalPrompt: true,
  enhancedPrompt: true,
  isEnhanced: true,
});

export const insertPromptTemplateSchema = createInsertSchema(promptTemplates).pick({
  category: true,
  title: true,
  template: true,
  icon: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertPromptTemplate = z.infer<typeof insertPromptTemplateSchema>;
export type PromptTemplate = typeof promptTemplates.$inferSelect;
