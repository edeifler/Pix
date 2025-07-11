import { ProcessingResult, UploadedFile } from "@shared/schema";

export interface ReconciliationMatch {
  id: string;
  pixReceipt: ProcessingResult & { file: UploadedFile };
  bankTransaction: ProcessingResult & { file: UploadedFile };
  matchConfidence: number;
  status: 'auto_matched' | 'manual_review' | 'no_match';
  matchedAt: string;
  matchReasons: string[];
}

export interface ReconciliationSummary {
  totalPixReceipts: number;
  totalBankTransactions: number;
  autoMatched: number;
  manualReview: number;
  unmatched: number;
  matches: ReconciliationMatch[];
}

// Parse Brazilian currency format (R$ 1.234,56)
function parseAmount(amount: string | null): number {
  if (!amount) return 0;
  return parseFloat(amount.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.') || '0');
}

// Parse Brazilian CPF/CNPJ format
function parseDocument(document: string | null): string {
  if (!document) return '';
  return document.replace(/[^\d]/g, '');
}

// Normalize names for comparison
function normalizeName(name: string | null): string {
  if (!name) return '';
  return name.toUpperCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate name similarity score
function calculateNameSimilarity(name1: string, name2: string): number {
  const n1 = normalizeName(name1);
  const n2 = normalizeName(name2);
  
  if (n1 === n2) return 100;
  if (!n1 || !n2) return 0;
  
  // Check if names contain each other
  if (n1.includes(n2) || n2.includes(n1)) return 90;
  
  // Split into words and check for matches
  const words1 = n1.split(' ').filter(w => w.length > 2);
  const words2 = n2.split(' ').filter(w => w.length > 2);
  
  let matchingWords = 0;
  let partialMatches = 0;
  
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1 === word2) {
        matchingWords++;
        break;
      } else if (word1.includes(word2) || word2.includes(word1)) {
        partialMatches++;
        break;
      }
    }
  }
  
  const totalWords = Math.max(words1.length, words2.length);
  if (totalWords === 0) return 0;
  
  const exactScore = (matchingWords / totalWords) * 100;
  const partialScore = (partialMatches / totalWords) * 70;
  
  return Math.min(100, exactScore + partialScore);
}

// Calculate date difference in hours
function getDateDifferenceHours(date1: Date, date2: Date): number {
  return Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60);
}

// Extract PIX transaction data from processing result
function extractPixData(result: ProcessingResult) {
  const data = result.extractedData as any;
  return {
    amount: result.amount || data?.amount,
    payerName: result.payerName || data?.payerName,
    payerDocument: result.payerDocument || data?.payerDocument,
    transactionDate: result.transactionDate || data?.transactionDate,
    transactionId: result.transactionId || data?.transactionId
  };
}

// Extract bank transaction data from processing result
function extractBankData(result: ProcessingResult) {
  const data = result.extractedData as any;
  console.log('Extracting bank data from result:', result.id, 'with extracted data:', data);
  
  // Handle both single transaction and multiple transactions
  if (data?.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
    console.log(`Found ${data.transactions.length} transactions in bank statement`);
    return data.transactions.map((tx: any) => ({
      amount: tx.amount,
      payerName: tx.payerName || tx.description?.replace(/PIX\s+RECEBIDO\s*-?\s*/gi, '').trim(),
      payerDocument: tx.payerDocument,
      transactionDate: new Date(tx.transactionDate),
      transactionId: tx.transactionId,
      originalResult: result
    }));
  }
  
  // Check if we have stored bank statement data with transactions
  if (result.payerName || result.amount) {
    console.log('Found single transaction in bank statement result');
    return [{
      amount: result.amount,
      payerName: result.payerName,
      payerDocument: result.payerDocument,
      transactionDate: result.transactionDate,
      transactionId: result.transactionId,
      originalResult: result
    }];
  }
  
  console.log('No transactions found in bank statement result');
  return [];
}

// Calculate match score between PIX receipt and bank transaction
function calculateMatchScore(pixData: any, bankData: any): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let totalScore = 0;
  
  // Dynamic weight calculation based on available data
  const hasDate = pixData.transactionDate && bankData.transactionDate;
  const amountWeight = hasDate ? 0.4 : 0.6; // Increase amount weight if no date
  const dateWeight = hasDate ? 0.3 : 0;
  const nameWeight = hasDate ? 0.2 : 0.3; // Increase name weight if no date
  
  // Amount matching
  const pixAmount = parseAmount(pixData.amount);
  const bankAmount = parseAmount(bankData.amount);
  
  if (pixAmount > 0 && bankAmount > 0) {
    const amountDiff = Math.abs(pixAmount - bankAmount);
    let amountScore = 0;
    
    if (amountDiff < 0.01) {
      amountScore = 100;
      reasons.push(`Valor exato: R$ ${pixAmount.toFixed(2)}`);
    } else if (amountDiff < 1.0) {
      amountScore = 90;
      reasons.push(`Valor próximo: diferença de R$ ${amountDiff.toFixed(2)}`);
    } else if (amountDiff < pixAmount * 0.02) {
      amountScore = 75;
      reasons.push(`Valor similar: diferença de ${((amountDiff/pixAmount)*100).toFixed(1)}%`);
    }
    
    totalScore += amountScore * amountWeight;
  }
  
  // Date matching (30% weight)
  if (pixData.transactionDate && bankData.transactionDate) {
    const pixDate = new Date(pixData.transactionDate);
    const bankDate = new Date(bankData.transactionDate);
    
    if (!isNaN(pixDate.getTime()) && !isNaN(bankDate.getTime())) {
      const hoursDiff = getDateDifferenceHours(pixDate, bankDate);
      let dateScore = 0;
      
      if (hoursDiff < 1) {
        dateScore = 100;
        reasons.push('Data/hora exata');
      } else if (hoursDiff < 24) {
        dateScore = 90;
        reasons.push(`Mesmo dia: diferença de ${hoursDiff.toFixed(1)}h`);
      } else if (hoursDiff < 72) {
        dateScore = 70;
        reasons.push(`Diferença de ${Math.round(hoursDiff/24)} dias`);
      }
      
      totalScore += dateScore * dateWeight;
    }
  } else {
    // If dates are missing, reduce weight but don't penalize heavily
    reasons.push('Data não disponível - baseado em valor e nome');
  }
  
  // Name matching
  const pixName = normalizeName(pixData.payerName);
  const bankName = normalizeName(bankData.payerName);
  
  if (pixName && bankName) {
    // Remove common PIX prefixes from bank description
    const cleanBankName = bankName
      .replace(/PIX\s+RECEBIDO\s*-?\s*/g, '')
      .replace(/CP?:?\d*-?\s*/g, '')
      .trim();
    
    const nameScore = calculateNameSimilarity(pixName, cleanBankName);
    
    if (nameScore >= 95) {
      reasons.push('Nome exato');
    } else if (nameScore >= 85) {
      reasons.push('Nome muito similar');
    } else if (nameScore >= 70) {
      reasons.push('Nome parcialmente similar');
    } else if (nameScore >= 50) {
      reasons.push('Nome possível correspondência');
    }
    
    totalScore += nameScore * nameWeight;
  }
  
  // Document matching (10% weight)
  const pixDoc = parseDocument(pixData.payerDocument);
  const bankDoc = parseDocument(bankData.payerDocument);
  
  if (pixDoc && bankDoc && pixDoc === bankDoc) {
    totalScore += 100 * 0.1;
    reasons.push(`CPF/CNPJ confirmado: ${pixDoc}`);
  }
  
  return { score: Math.round(totalScore), reasons };
}

// Main reconciliation function
export function performReconciliation(
  pixReceipts: (ProcessingResult & { file: UploadedFile })[],
  bankStatements: (ProcessingResult & { file: UploadedFile })[]
): ReconciliationSummary {
  const matches: ReconciliationMatch[] = [];
  const usedBankTransactions = new Set<string>();
  
  // Extract all bank transactions from statements
  const allBankTransactions: any[] = [];
  for (const statement of bankStatements) {
    const transactions = extractBankData(statement);
    console.log(`Extracted ${transactions.length} transactions from bank statement ${statement.id}`);
    allBankTransactions.push(...transactions);
  }
  
  console.log(`Total bank transactions available for reconciliation: ${allBankTransactions.length}`);
  
  // Match each PIX receipt with bank transactions
  for (const pixReceipt of pixReceipts) {
    const pixData = extractPixData(pixReceipt);
    let bestMatch = null;
    let bestScore = 0;
    let bestReasons: string[] = [];
    
    for (const bankTransaction of allBankTransactions) {
      const transactionKey = `${bankTransaction.originalResult.id}-${bankTransaction.transactionId}`;
      if (usedBankTransactions.has(transactionKey)) continue;
      
      const { score, reasons } = calculateMatchScore(pixData, bankTransaction);
      
      console.log(`Matching PIX (${pixData.payerName}, ${pixData.amount}) with Bank (${bankTransaction.payerName}, ${bankTransaction.amount}): Score ${score}%, Reasons: ${reasons.join(', ')}`);
      
      if (score > bestScore && score > 15) { // Minimum 15% confidence
        bestMatch = bankTransaction;
        bestScore = score;
        bestReasons = reasons;
      }
    }
    
    if (bestMatch && bestScore > 15) {
      const transactionKey = `${bestMatch.originalResult.id}-${bestMatch.transactionId}`;
      usedBankTransactions.add(transactionKey);
      
      console.log(`Creating match: PIX ${pixReceipt.id} with Bank ${bestMatch.originalResult.id}, Score: ${bestScore}%`);
      
      matches.push({
        id: `match_${pixReceipt.id}_${bestMatch.originalResult.id}_${Date.now()}`,
        pixReceipt,
        bankTransaction: bestMatch.originalResult,
        matchConfidence: bestScore,
        status: bestScore >= 70 ? 'auto_matched' : 'manual_review',
        matchedAt: new Date().toISOString(),
        matchReasons: bestReasons
      });
    }
  }
  
  return {
    totalPixReceipts: pixReceipts.length,
    totalBankTransactions: allBankTransactions.length,
    autoMatched: matches.filter(m => m.status === 'auto_matched').length,
    manualReview: matches.filter(m => m.status === 'manual_review').length,
    unmatched: pixReceipts.length - matches.length,
    matches
  };
}