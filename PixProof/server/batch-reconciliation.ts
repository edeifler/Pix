import { AdvancedReconciliationEngine, ReconciliationSettings } from './reconciliation-rules';
import { ProcessingResult, UploadedFile } from '../shared/schema';
import { ReconciliationMatch, ReconciliationSummary } from './reconciliation';

export interface BatchReconciliationJob {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  pixFiles: (ProcessingResult & { file: UploadedFile })[];
  bankFiles: (ProcessingResult & { file: UploadedFile })[];
  results?: ReconciliationSummary;
  progress: {
    current: number;
    total: number;
    stage: string;
  };
  settings: ReconciliationSettings;
  errorMessage?: string;
}

export interface BatchReconciliationStats {
  totalJobs: number;
  completedJobs: number;
  averageProcessingTime: number;
  totalPixReceipts: number;
  totalBankTransactions: number;
  totalMatches: number;
  averageMatchRate: number;
  topMatchingRules: Array<{ ruleName: string; usage: number }>;
}

export class BatchReconciliationManager {
  private jobs: Map<string, BatchReconciliationJob> = new Map();
  private reconciliationEngine: AdvancedReconciliationEngine;

  constructor() {
    this.reconciliationEngine = new AdvancedReconciliationEngine();
  }

  async createBatchJob(
    userId: string,
    pixFiles: (ProcessingResult & { file: UploadedFile })[],
    bankFiles: (ProcessingResult & { file: UploadedFile })[],
    settings?: Partial<ReconciliationSettings>
  ): Promise<string> {
    const jobId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (settings) {
      this.reconciliationEngine.updateSettings(settings);
    }

    const job: BatchReconciliationJob = {
      id: jobId,
      userId,
      status: 'pending',
      createdAt: new Date(),
      pixFiles,
      bankFiles,
      progress: {
        current: 0,
        total: pixFiles.length + bankFiles.length,
        stage: 'Iniciando processamento em lote'
      },
      settings: this.reconciliationEngine['settings']
    };

    this.jobs.set(jobId, job);
    
    // Start processing asynchronously
    this.processBatchJob(jobId).catch(error => {
      console.error(`Batch job ${jobId} failed:`, error);
      const failedJob = this.jobs.get(jobId);
      if (failedJob) {
        failedJob.status = 'failed';
        failedJob.errorMessage = error.message;
        failedJob.completedAt = new Date();
      }
    });

    return jobId;
  }

  private async processBatchJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job ${jobId} not found`);

    try {
      job.status = 'processing';
      job.progress.stage = 'Processando comprovantes PIX';

      // Process PIX receipts
      const processedPixReceipts: any[] = [];
      for (let i = 0; i < job.pixFiles.length; i++) {
        const pixFile = job.pixFiles[i];
        processedPixReceipts.push(this.extractPixData(pixFile));
        job.progress.current = i + 1;
      }

      job.progress.stage = 'Processando extratos bancários';

      // Process bank statements
      const processedBankTransactions: any[] = [];
      for (let i = 0; i < job.bankFiles.length; i++) {
        const bankFile = job.bankFiles[i];
        const bankData = this.extractBankData(bankFile);
        if (bankData.transactions) {
          processedBankTransactions.push(...bankData.transactions.map(t => ({ ...t, file: bankFile })));
        }
        job.progress.current = job.pixFiles.length + i + 1;
      }

      job.progress.stage = 'Executando reconciliação inteligente';

      // Perform advanced reconciliation
      const matches: ReconciliationMatch[] = [];
      let processedMatches = 0;

      for (const pixReceipt of processedPixReceipts) {
        let bestMatch: ReconciliationMatch | null = null;
        let bestScore = 0;

        for (const bankTransaction of processedBankTransactions) {
          const matchResult = this.reconciliationEngine.calculateAdvancedScore(
            pixReceipt,
            bankTransaction
          );

          if (matchResult.score > bestScore && matchResult.score >= job.settings.manualReviewThreshold) {
            bestScore = matchResult.score;
            bestMatch = {
              id: `match_${matches.length + 1}`,
              pixReceipt,
              bankTransaction,
              matchConfidence: matchResult.score,
              status: matchResult.score >= job.settings.autoMatchThreshold ? 'auto_matched' : 'manual_review',
              matchedAt: new Date().toISOString(),
              matchReasons: matchResult.reasons
            };
          }
        }

        if (bestMatch) {
          matches.push(bestMatch);
          // Remove matched bank transaction to avoid duplicate matches
          const bankIndex = processedBankTransactions.findIndex(t => t === bestMatch!.bankTransaction);
          if (bankIndex !== -1) {
            processedBankTransactions.splice(bankIndex, 1);
          }
        }

        processedMatches++;
        job.progress.current = job.pixFiles.length + job.bankFiles.length + processedMatches;
      }

      // Calculate summary
      const autoMatched = matches.filter(m => m.status === 'auto_matched').length;
      const manualReview = matches.filter(m => m.status === 'manual_review').length;
      const unmatched = processedPixReceipts.length - matches.length;

      job.results = {
        totalPixReceipts: processedPixReceipts.length,
        totalBankTransactions: processedBankTransactions.length + matches.length,
        autoMatched,
        manualReview,
        unmatched,
        matches
      };

      job.status = 'completed';
      job.completedAt = new Date();
      job.progress.stage = 'Reconciliação concluída';

    } catch (error) {
      job.status = 'failed';
      job.errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      job.completedAt = new Date();
      throw error;
    }
  }

  getJobStatus(jobId: string): BatchReconciliationJob | null {
    return this.jobs.get(jobId) || null;
  }

  getUserJobs(userId: string): BatchReconciliationJob[] {
    return Array.from(this.jobs.values()).filter(job => job.userId === userId);
  }

  async confirmBatchMatch(jobId: string, matchId: string, isCorrect: boolean): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || !job.results) return;

    const match = job.results.matches.find(m => m.id === matchId);
    if (!match) return;

    // Update learning data
    this.reconciliationEngine.confirmMatch(
      match.pixReceipt,
      match.bankTransaction,
      isCorrect
    );

    // Update match status if confirmed as incorrect
    if (!isCorrect && match.status === 'auto_matched') {
      match.status = 'manual_review';
    }
  }

  getBatchStats(userId: string): BatchReconciliationStats {
    const userJobs = this.getUserJobs(userId);
    const completedJobs = userJobs.filter(job => job.status === 'completed');

    if (completedJobs.length === 0) {
      return {
        totalJobs: userJobs.length,
        completedJobs: 0,
        averageProcessingTime: 0,
        totalPixReceipts: 0,
        totalBankTransactions: 0,
        totalMatches: 0,
        averageMatchRate: 0,
        topMatchingRules: []
      };
    }

    const totalPixReceipts = completedJobs.reduce((sum, job) => sum + (job.results?.totalPixReceipts || 0), 0);
    const totalBankTransactions = completedJobs.reduce((sum, job) => sum + (job.results?.totalBankTransactions || 0), 0);
    const totalMatches = completedJobs.reduce((sum, job) => sum + (job.results?.autoMatched || 0) + (job.results?.manualReview || 0), 0);
    
    const avgProcessingTime = completedJobs.reduce((sum, job) => {
      if (job.completedAt && job.createdAt) {
        return sum + (job.completedAt.getTime() - job.createdAt.getTime());
      }
      return sum;
    }, 0) / completedJobs.length;

    const averageMatchRate = totalPixReceipts > 0 ? (totalMatches / totalPixReceipts) * 100 : 0;

    // Analyze rule usage (simplified)
    const ruleUsage = new Map<string, number>();
    completedJobs.forEach(job => {
      job.results?.matches.forEach(match => {
        match.matchReasons.forEach(reason => {
          const ruleName = reason.split(':')[0];
          ruleUsage.set(ruleName, (ruleUsage.get(ruleName) || 0) + 1);
        });
      });
    });

    const topMatchingRules = Array.from(ruleUsage.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ruleName, usage]) => ({ ruleName, usage }));

    return {
      totalJobs: userJobs.length,
      completedJobs: completedJobs.length,
      averageProcessingTime: avgProcessingTime,
      totalPixReceipts,
      totalBankTransactions,
      totalMatches,
      averageMatchRate,
      topMatchingRules
    };
  }

  private extractPixData(result: ProcessingResult & { file: UploadedFile }) {
    const data = result.extractedData as any;
    return {
      id: result.id,
      file: result.file,
      amount: data?.amount || '',
      payerName: data?.payerName || '',
      payerDocument: data?.payerDocument || '',
      transactionDate: data?.transactionDate ? new Date(data.transactionDate) : null,
      transactionId: data?.transactionId || '',
      confidence: data?.confidence || 0
    };
  }

  private extractBankData(result: ProcessingResult & { file: UploadedFile }) {
    const data = result.extractedData as any;
    return {
      id: result.id,
      file: result.file,
      transactions: data?.transactions || [],
      bankName: data?.bankName || '',
      confidence: data?.confidence || 0
    };
  }

  // Cleanup old jobs (call periodically)
  cleanupOldJobs(maxAgeHours: number = 24) {
    const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.createdAt < cutoffTime && job.status !== 'processing') {
        this.jobs.delete(jobId);
      }
    }
  }
}

// Singleton instance
export const batchReconciliationManager = new BatchReconciliationManager();