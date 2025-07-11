import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Enhanced user table for Replit Auth + Stripe
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(), // Replit user ID
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  
  // Business information
  fullName: text("full_name"),
  cpf: text("cpf"),
  phone: text("phone"),
  
  // Stripe integration
  stripeCustomerId: varchar("stripe_customer_id").unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  cnpj: text("cnpj").notNull(),
  sector: text("sector").default("Geral"),
  userId: varchar("user_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Simplified subscription table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  
  // Plan details
  plan: text("plan").notNull(), // 'starter', 'professional', 'enterprise'
  status: text("status").notNull().default("active"), // 'active', 'cancelled', 'expired', 'past_due'
  
  // Usage limits and tracking
  monthlyLimit: integer("monthly_limit").notNull(),
  usedThisMonth: integer("used_this_month").notNull().default(0),
  
  // Timestamps
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const uploadedFiles = pgTable("uploaded_files", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  documentType: text("document_type").notNull(), // 'pix_receipt', 'bank_statement', 'other'
  status: text("status").notNull().default("processing"), // 'processing', 'completed', 'failed', 'pending_review'
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const processingResults = pgTable("processing_results", {
  id: serial("id").primaryKey(),
  fileId: integer("file_id").references(() => uploadedFiles.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  extractedData: jsonb("extracted_data"), // OCR extracted data
  amount: text("amount"),
  payerName: text("payer_name"),
  payerDocument: text("payer_document"),
  transactionDate: timestamp("transaction_date"),
  transactionId: text("transaction_id"),
  confidence: integer("confidence"), // 0-100
  reconciliationStatus: text("reconciliation_status").notNull().default("pending"), // 'reconciled', 'pending', 'multiple_matches', 'no_match'
  processedAt: timestamp("processed_at").defaultNow(),
});

// Billing and payment history
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  stripePaymentIntentId: varchar("stripe_payment_intent_id").unique(),
  amount: integer("amount").notNull(), // in cents
  currency: varchar("currency").notNull().default("brl"),
  status: text("status").notNull(), // 'pending', 'succeeded', 'failed', 'canceled'
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Usage tracking for billing
export const usageRecords = pgTable("usage_records", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  subscriptionId: integer("subscription_id").references(() => subscriptions.id),
  documentsProcessed: integer("documents_processed").notNull().default(0),
  period: varchar("period").notNull(), // YYYY-MM format
  createdAt: timestamp("created_at").defaultNow(),
});

// Update schemas for Replit Auth compatibility
export const upsertUserSchema = createInsertSchema(users);
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
}).required({
  id: true
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  createdAt: true,
  userId: true,
}).extend({
  sector: z.string().optional(),
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usedThisMonth: true,
});

export const insertFileSchema = createInsertSchema(uploadedFiles).omit({
  id: true,
  uploadedAt: true,
  status: true,
});

// Frontend registration schema that matches the form data
export const frontendRegistrationSchema = z.object({
  plan: z.enum(["starter", "professional", "enterprise"]),
  user: z.object({
    fullName: z.string().min(1, "Nome completo é obrigatório"),
    email: z.string().email("Email inválido"),
    cpf: z.string().min(11, "CPF inválido"),
    phone: z.string().min(10, "Telefone inválido"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  }),
  company: z.object({
    name: z.string().min(1, "Nome da empresa é obrigatório"),
    cnpj: z.string().min(14, "CNPJ inválido"),
    sector: z.string().optional(),
  }),
});

export const registrationFrontendSchema = z.object({
  user: z.object({
    fullName: z.string().min(1, "Nome completo é obrigatório"),
    email: z.string().email("Email inválido"),
    cpf: z.string().min(11, "CPF inválido"),
    phone: z.string().min(10, "Telefone inválido"),
  }),
  company: insertCompanySchema,
  plan: z.enum(["starter", "professional", "enterprise"]),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type ProcessingResult = typeof processingResults.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type UsageRecord = typeof usageRecords.$inferSelect;
export type RegistrationData = z.infer<typeof registrationFrontendSchema>;
export type FrontendRegistrationData = z.infer<typeof frontendRegistrationSchema>;

// Password reset tokens table
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
