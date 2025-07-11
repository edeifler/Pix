import { ExtractedPIXData, ExtractedBankData } from './ocr';

export interface ReconciliationRule {
  id: string;
  name: string;
  enabled: boolean;
  weight: number;
  type: 'amount' | 'date' | 'name' | 'document' | 'custom';
  tolerance?: {
    amount?: number; // percentage tolerance for amount matching
    date?: number; // hours tolerance for date matching
  };
  customLogic?: (pixData: any, bankData: any) => { score: number; reason: string };
}

export interface ReconciliationSettings {
  autoMatchThreshold: number; // minimum score for auto-matching
  manualReviewThreshold: number; // minimum score for manual review
  rules: ReconciliationRule[];
  enableLearning: boolean;
  strictMode: boolean;
}

export const defaultReconciliationRules: ReconciliationRule[] = [
  {
    id: 'amount_exact',
    name: 'Valor Exato',
    enabled: true,
    weight: 40,
    type: 'amount',
    tolerance: { amount: 0 }
  },
  {
    id: 'amount_tolerance',
    name: 'Valor com Tolerância',
    enabled: true,
    weight: 35,
    type: 'amount',
    tolerance: { amount: 2 } // 2% tolerance
  },
  {
    id: 'date_exact',
    name: 'Data/Hora Exata',
    enabled: true,
    weight: 30,
    type: 'date',
    tolerance: { date: 0 }
  },
  {
    id: 'date_tolerance',
    name: 'Data com Tolerância',
    enabled: true,
    weight: 25,
    type: 'date',
    tolerance: { date: 48 } // 48 hours tolerance
  },
  {
    id: 'name_exact',
    name: 'Nome Exato',
    enabled: true,
    weight: 20,
    type: 'name'
  },
  {
    id: 'name_similarity',
    name: 'Nome Similar',
    enabled: true,
    weight: 15,
    type: 'name'
  },
  {
    id: 'document_exact',
    name: 'CPF/CNPJ Exato',
    enabled: true,
    weight: 10,
    type: 'document'
  }
];

export const defaultReconciliationSettings: ReconciliationSettings = {
  autoMatchThreshold: 70,
  manualReviewThreshold: 15,
  rules: defaultReconciliationRules,
  enableLearning: true,
  strictMode: false
};

export class AdvancedReconciliationEngine {
  private settings: ReconciliationSettings;
  private learningData: Map<string, number> = new Map();

  constructor(settings: ReconciliationSettings = defaultReconciliationSettings) {
    this.settings = settings;
  }

  updateSettings(newSettings: Partial<ReconciliationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
  }

  calculateAdvancedScore(pixData: any, bankData: any): { score: number; reasons: string[] } {
    let totalScore = 0;
    let totalWeight = 0;
    const reasons: string[] = [];
    const enabledRules = this.settings.rules.filter(rule => rule.enabled);

    for (const rule of enabledRules) {
      const ruleResult = this.applyRule(rule, pixData, bankData);
      totalScore += ruleResult.score * rule.weight;
      totalWeight += rule.weight;
      
      if (ruleResult.score > 0) {
        reasons.push(`${rule.name}: ${ruleResult.reason}`);
      }
    }

    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) : 0;
    
    // Apply learning adjustments if enabled
    if (this.settings.enableLearning) {
      const learningKey = this.generateLearningKey(pixData, bankData);
      const learningAdjustment = this.learningData.get(learningKey) || 0;
      const adjustedScore = Math.min(100, Math.max(0, finalScore + learningAdjustment));
      
      if (learningAdjustment !== 0) {
        reasons.push(`Ajuste por aprendizado: ${learningAdjustment > 0 ? '+' : ''}${learningAdjustment.toFixed(1)}%`);
      }
      
      return { score: adjustedScore, reasons };
    }

    return { score: finalScore, reasons };
  }

  private applyRule(rule: ReconciliationRule, pixData: any, bankData: any): { score: number; reason: string } {
    switch (rule.type) {
      case 'amount':
        return this.applyAmountRule(rule, pixData, bankData);
      case 'date':
        return this.applyDateRule(rule, pixData, bankData);
      case 'name':
        return this.applyNameRule(rule, pixData, bankData);
      case 'document':
        return this.applyDocumentRule(rule, pixData, bankData);
      case 'custom':
        return rule.customLogic ? rule.customLogic(pixData, bankData) : { score: 0, reason: '' };
      default:
        return { score: 0, reason: '' };
    }
  }

  private applyAmountRule(rule: ReconciliationRule, pixData: any, bankData: any): { score: number; reason: string } {
    const pixAmount = this.parseAmount(pixData.amount);
    const bankAmount = this.parseAmount(bankData.amount);
    
    if (pixAmount === 0 || bankAmount === 0) {
      return { score: 0, reason: 'Valor não disponível' };
    }

    const tolerance = rule.tolerance?.amount || 0;
    const difference = Math.abs(pixAmount - bankAmount);
    const percentageDiff = (difference / pixAmount) * 100;

    if (percentageDiff <= tolerance) {
      const score = tolerance === 0 ? 100 : Math.max(0, 100 - (percentageDiff / tolerance) * 50);
      return { 
        score, 
        reason: tolerance === 0 ? 'Valor exato' : `Valor dentro da tolerância (${percentageDiff.toFixed(1)}%)` 
      };
    }

    return { score: 0, reason: `Diferença de valor: ${percentageDiff.toFixed(1)}%` };
  }

  private applyDateRule(rule: ReconciliationRule, pixData: any, bankData: any): { score: number; reason: string } {
    if (!pixData.transactionDate || !bankData.transactionDate) {
      return { score: 0, reason: 'Data não disponível' };
    }

    const pixDate = new Date(pixData.transactionDate);
    const bankDate = new Date(bankData.transactionDate);
    const hoursDiff = Math.abs(pixDate.getTime() - bankDate.getTime()) / (1000 * 60 * 60);
    
    const tolerance = rule.tolerance?.date || 0;

    if (hoursDiff <= tolerance) {
      const score = tolerance === 0 ? 100 : Math.max(0, 100 - (hoursDiff / tolerance) * 50);
      return { 
        score, 
        reason: tolerance === 0 ? 'Data/hora exata' : `Data dentro da tolerância (${hoursDiff.toFixed(1)}h)` 
      };
    }

    return { score: 0, reason: `Diferença de ${Math.round(hoursDiff)}h` };
  }

  private applyNameRule(rule: ReconciliationRule, pixData: any, bankData: any): { score: number; reason: string } {
    const pixName = this.normalizeName(pixData.payerName);
    const bankName = this.normalizeName(bankData.description || bankData.payerName);

    if (!pixName || !bankName) {
      return { score: 0, reason: 'Nome não disponível' };
    }

    if (rule.id === 'name_exact') {
      const score = pixName === bankName ? 100 : 0;
      return { score, reason: score > 0 ? 'Nome exato' : 'Nome diferente' };
    } else {
      const similarity = this.calculateNameSimilarity(pixName, bankName);
      return { 
        score: similarity * 100, 
        reason: similarity > 0.7 ? 'Nome muito similar' : similarity > 0.3 ? 'Nome parcialmente similar' : 'Nome diferente' 
      };
    }
  }

  private applyDocumentRule(rule: ReconciliationRule, pixData: any, bankData: any): { score: number; reason: string } {
    const pixDoc = this.parseDocument(pixData.payerDocument);
    const bankDoc = this.parseDocument(bankData.payerDocument);

    if (!pixDoc || !bankDoc) {
      return { score: 0, reason: 'CPF/CNPJ não disponível' };
    }

    const score = pixDoc === bankDoc ? 100 : 0;
    return { score, reason: score > 0 ? 'CPF/CNPJ exato' : 'CPF/CNPJ diferente' };
  }

  private parseAmount(amount: string | null): number {
    if (!amount) return 0;
    return parseFloat(amount.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
  }

  private normalizeName(name: string | null): string {
    if (!name) return '';
    return name.toUpperCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();
  }

  private parseDocument(document: string | null): string {
    if (!document) return '';
    return document.replace(/[^\d]/g, '');
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const words1 = name1.split(/\s+/);
    const words2 = name2.split(/\s+/);
    
    let matches = 0;
    let totalWords = Math.max(words1.length, words2.length);

    for (const word1 of words1) {
      if (word1.length < 3) continue;
      for (const word2 of words2) {
        if (word2.length < 3) continue;
        if (word1.includes(word2) || word2.includes(word1)) {
          matches++;
          break;
        }
      }
    }

    return totalWords > 0 ? matches / totalWords : 0;
  }

  private generateLearningKey(pixData: any, bankData: any): string {
    const pixAmount = this.parseAmount(pixData.amount);
    const bankAmount = this.parseAmount(bankData.amount);
    const pixName = this.normalizeName(pixData.payerName);
    const bankName = this.normalizeName(bankData.description);
    
    return `${pixAmount}_${bankAmount}_${pixName}_${bankName}`;
  }

  // Learning methods
  confirmMatch(pixData: any, bankData: any, isCorrect: boolean) {
    if (!this.settings.enableLearning) return;

    const key = this.generateLearningKey(pixData, bankData);
    const currentAdjustment = this.learningData.get(key) || 0;
    const increment = isCorrect ? 5 : -5; // Adjust by 5% based on feedback
    
    this.learningData.set(key, Math.min(20, Math.max(-20, currentAdjustment + increment)));
  }

  exportLearningData(): Record<string, number> {
    return Object.fromEntries(this.learningData);
  }

  importLearningData(data: Record<string, number>) {
    this.learningData = new Map(Object.entries(data));
  }
}