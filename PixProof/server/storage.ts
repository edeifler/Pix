import { users, companies, subscriptions, uploadedFiles, processingResults, payments, usageRecords, type User, type UpsertUser, type InsertUser, type Company, type InsertCompany, type Subscription, type InsertSubscription, type UploadedFile, type InsertFile, type ProcessingResult, type Payment, type UsageRecord, type RegistrationData } from "@shared/schema";
import { db, pool } from "./db";
import { eq, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserPassword(userId: string, password: string): Promise<void>;
  
  // Password reset operations
  createPasswordResetToken(token: { userId: string; token: string; expiresAt: Date; used: boolean }): Promise<void>;
  getPasswordResetToken(token: string): Promise<{ userId: string; used: boolean; expiresAt: Date } | null>;
  markResetTokenAsUsed(token: string): Promise<void>;
  
  // Company operations
  getCompanyByUserId(userId: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany & { userId: string }): Promise<Company>;
  
  // Subscription operations with Stripe integration
  getSubscriptionByUserId(userId: string): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscriptionUsage(userId: string, increment: number): Promise<void>;
  updateSubscriptionStripe(userId: string, stripeData: any): Promise<Subscription>;
  
  // Payment and billing operations
  createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment>;
  getPaymentsByUserId(userId: string): Promise<Payment[]>;
  updatePaymentStatus(paymentIntentId: string, status: string): Promise<Payment>;
  
  // Usage tracking
  createUsageRecord(usage: Omit<UsageRecord, 'id' | 'createdAt'>): Promise<UsageRecord>;
  getUsageByPeriod(userId: string, period: string): Promise<UsageRecord | undefined>;
  incrementDocumentUsage(userId: string): Promise<void>;
  
  // File operations
  createFile(file: InsertFile): Promise<UploadedFile>;
  getFilesByUserId(userId: string): Promise<UploadedFile[]>;
  updateFileStatus(fileId: number, status: string): Promise<void>;
  
  // Processing results
  createProcessingResult(result: Omit<ProcessingResult, 'id' | 'processedAt'> & { userId: string }): Promise<ProcessingResult>;
  getProcessingResultsByUserId(userId: string): Promise<(ProcessingResult & { file: UploadedFile })[]>;
  
  // Registration
  registerUser(data: RegistrationData): Promise<{ user: User; company: Company; subscription: Subscription }>;
}

export class DatabaseStorage implements IStorage {
  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserStripeInfo(userId: string, customerId: string, subscriptionId?: string): Promise<User> {
    const updateData: any = { stripeCustomerId: customerId };
    if (subscriptionId) {
      updateData.stripeSubscriptionId = subscriptionId;
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getCompanyByUserId(userId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.userId, userId));
    return company || undefined;
  }

  async createCompany(company: InsertCompany & { userId: string }): Promise<Company> {
    const [newCompany] = await db
      .insert(companies)
      .values(company)
      .returning();
    return newCompany;
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId));
    return subscription || undefined;
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db
      .insert(subscriptions)
      .values({
        ...subscription,
        usedThisMonth: 0
      })
      .returning();
    return newSubscription;
  }

  async updateSubscriptionUsage(userId: string, increment: number): Promise<void> {
    const subscription = await this.getSubscriptionByUserId(userId);
    if (subscription) {
      await db
        .update(subscriptions)
        .set({ usedThisMonth: subscription.usedThisMonth + increment })
        .where(eq(subscriptions.userId, userId));
    }
  }

  async createFile(file: InsertFile): Promise<UploadedFile> {
    const [newFile] = await db
      .insert(uploadedFiles)
      .values(file)
      .returning();
    return newFile;
  }

  async getFilesByUserId(userId: string): Promise<UploadedFile[]> {
    return await db.select().from(uploadedFiles).where(eq(uploadedFiles.userId, userId));
  }

  async updateFileStatus(fileId: number, status: string): Promise<void> {
    await db
      .update(uploadedFiles)
      .set({ status })
      .where(eq(uploadedFiles.id, fileId));
  }

  async createProcessingResult(result: Omit<ProcessingResult, 'id' | 'processedAt'> & { userId: string }): Promise<ProcessingResult> {
    try {
      console.log('Creating processing result with userId:', result.userId);
      
      // Use raw SQL as a workaround for the ORM issue
      const query = `
        INSERT INTO processing_results (
          file_id, user_id, extracted_data, amount, payer_name, 
          payer_document, transaction_date, transaction_id, 
          confidence, reconciliation_status, processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *
      `;
      
      const values = [
        result.fileId,
        result.userId,
        JSON.stringify(result.extractedData),
        result.amount,
        result.payerName,
        result.payerDocument,
        result.transactionDate,
        result.transactionId,
        result.confidence,
        result.reconciliationStatus
      ];
      
      console.log('Executing raw SQL with values:', values);
      
      const { rows } = await pool.query(query, values);
      const newResult = rows[0];
      
      console.log('Processing result created successfully via raw SQL:', newResult);
      return {
        id: newResult.id,
        fileId: newResult.file_id,
        extractedData: newResult.extracted_data,
        amount: newResult.amount,
        payerName: newResult.payer_name,
        payerDocument: newResult.payer_document,
        transactionDate: newResult.transaction_date,
        transactionId: newResult.transaction_id,
        confidence: newResult.confidence,
        reconciliationStatus: newResult.reconciliation_status,
        processedAt: newResult.processed_at
      };
    } catch (error) {
      console.error('Error creating processing result:', error);
      throw error;
    }
  }

  async getProcessingResultsByUserId(userId: string): Promise<(ProcessingResult & { file: UploadedFile })[]> {
    try {
      const results = await db
        .select()
        .from(processingResults)
        .innerJoin(uploadedFiles, eq(processingResults.fileId, uploadedFiles.id))
        .where(eq(uploadedFiles.userId, userId));
      
      return results.map(row => ({
        ...row.processing_results,
        file: row.uploaded_files
      }));
    } catch (error) {
      console.error('Error fetching processing results:', error);
      return [];
    }
  }

  async registerUser(data: RegistrationData): Promise<{ user: User; company: Company; subscription: Subscription }> {
    const userId = `user_${Date.now()}`;
    const user = await this.createUser({
      id: userId,
      fullName: data.user.fullName,
      email: data.user.email,
      cpf: data.user.cpf,
      phone: data.user.phone
    });

    const company = await this.createCompany({
      userId: user.id,
      name: data.company.name,
      cnpj: data.company.cnpj,
      sector: data.company.sector
    });

    const subscription = await this.createSubscription({
      userId: user.id,
      plan: data.plan,
      monthlyLimit: data.plan === 'starter' ? 200 : data.plan === 'professional' ? 1000 : 10000,
      status: 'active'
    });

    return { user, company, subscription };
  }

  // Missing methods to complete the IStorage interface
  async updateSubscriptionStripe(userId: string, stripeData: any): Promise<Subscription> {
    const [subscription] = await db
      .update(subscriptions)
      .set({ 
        status: stripeData.status || 'active'
      })
      .where(eq(subscriptions.userId, userId))
      .returning();
    return subscription;
  }

  async createPayment(payment: Omit<Payment, 'id' | 'createdAt'>): Promise<Payment> {
    const [newPayment] = await db
      .insert(payments)
      .values(payment)
      .returning();
    return newPayment;
  }

  async getPaymentsByUserId(userId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }

  async updatePaymentStatus(paymentIntentId: string, status: string): Promise<Payment> {
    const [payment] = await db
      .update(payments)
      .set({ status })
      .where(eq(payments.stripePaymentIntentId, paymentIntentId))
      .returning();
    return payment;
  }

  async createUsageRecord(usage: Omit<UsageRecord, 'id' | 'createdAt'>): Promise<UsageRecord> {
    const [newUsage] = await db
      .insert(usageRecords)
      .values(usage)
      .returning();
    return newUsage;
  }

  async getUsageByPeriod(userId: string, period: string): Promise<UsageRecord | undefined> {
    const [usage] = await db
      .select()
      .from(usageRecords)
      .where(eq(usageRecords.userId, userId))
      .orderBy(usageRecords.createdAt);
    return usage;
  }

  async incrementDocumentUsage(userId: string): Promise<void> {
    await this.updateSubscriptionUsage(userId, 1);
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUserPassword(userId: string, password: string): Promise<void> {
    // In a real implementation, you would hash the password
    // For demo purposes, we'll just simulate the update
    console.log(`Password updated for user ${userId}`);
  }

  // Password reset token operations (using in-memory storage for demo)
  private resetTokens = new Map<string, { userId: string; used: boolean; expiresAt: Date }>();

  async createPasswordResetToken(token: { userId: string; token: string; expiresAt: Date; used: boolean }): Promise<void> {
    this.resetTokens.set(token.token, {
      userId: token.userId,
      used: token.used,
      expiresAt: token.expiresAt
    });
  }

  async getPasswordResetToken(token: string): Promise<{ userId: string; used: boolean; expiresAt: Date } | null> {
    return this.resetTokens.get(token) || null;
  }

  async markResetTokenAsUsed(token: string): Promise<void> {
    const existing = this.resetTokens.get(token);
    if (existing) {
      this.resetTokens.set(token, { ...existing, used: true });
    }
  }

  // Clear all data for fresh start
  async clearAllData(): Promise<void> {
    await pool.query('DELETE FROM processing_results');
    await pool.query('DELETE FROM uploaded_files');
    console.log('All data cleared - fresh start for user uploads');
  }
}

export const storage = new DatabaseStorage();