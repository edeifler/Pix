import { ReconciliationSummary, ReconciliationMatch } from './reconciliation';

export interface DetailedReconciliationReport {
  summary: {
    totalPixReceipts: number;
    totalBankTransactions: number;
    matchedTransactions: number;
    unmatchedTransactions: number;
    reconciliationRate: number;
    processedAt: Date;
  };
  matches: Array<{
    pixReceipt: {
      payerName: string;
      amount: string;
      date: string;
      confidence: number;
    };
    bankTransaction: {
      payerName: string;
      amount: string;
      date: string;
      description: string;
    };
    matchConfidence: number;
    status: string;
    reasons: string[];
  }>;
  unmatchedPix: Array<{
    payerName: string;
    amount: string;
    date: string;
    reason: string;
  }>;
  unmatchedBank: Array<{
    description: string;
    amount: string;
    date: string;
    reason: string;
  }>;
}

export function generateDetailedReport(reconciliationData: ReconciliationSummary): DetailedReconciliationReport {
  const { totalPixReceipts, totalBankTransactions, matches } = reconciliationData;
  const matchedCount = matches.length;
  const reconciliationRate = totalPixReceipts > 0 ? (matchedCount / totalPixReceipts) * 100 : 0;

  // Process matches
  const processedMatches = matches.map(match => ({
    pixReceipt: {
      payerName: match.pixReceipt.payerName || 'Nome não identificado',
      amount: match.pixReceipt.amount || 'R$ 0,00',
      date: match.pixReceipt.transactionDate 
        ? new Date(match.pixReceipt.transactionDate).toLocaleDateString('pt-BR')
        : 'Data não informada',
      confidence: match.pixReceipt.confidence || 0
    },
    bankTransaction: {
      payerName: extractPayerNameFromBank(match.bankTransaction),
      amount: formatAmount(extractAmountFromBank(match.bankTransaction)),
      date: extractDateFromBank(match.bankTransaction),
      description: extractDescriptionFromBank(match.bankTransaction)
    },
    matchConfidence: match.matchConfidence,
    status: match.status === 'auto_matched' ? 'Correspondência Automática' : 'Revisão Manual',
    reasons: match.matchReasons || []
  }));

  return {
    summary: {
      totalPixReceipts,
      totalBankTransactions,
      matchedTransactions: matchedCount,
      unmatchedTransactions: totalPixReceipts - matchedCount,
      reconciliationRate: Math.round(reconciliationRate),
      processedAt: new Date()
    },
    matches: processedMatches,
    unmatchedPix: [],
    unmatchedBank: []
  };
}

function extractPayerNameFromBank(bankTransaction: any): string {
  // Extract payer name from bank transaction data
  if (bankTransaction.extractedData?.transactions) {
    const transactions = bankTransaction.extractedData.transactions;
    if (Array.isArray(transactions) && transactions.length > 0) {
      // Find the first transaction with a payer name
      for (const tx of transactions) {
        if (tx.payerName) return tx.payerName;
        if (tx.description) {
          const match = tx.description.match(/PIX RECEBIDO - (.+)/);
          if (match) return match[1];
        }
      }
    }
  }
  return 'Nome não identificado';
}

function extractAmountFromBank(bankTransaction: any): number {
  if (bankTransaction.extractedData?.transactions) {
    const transactions = bankTransaction.extractedData.transactions;
    if (Array.isArray(transactions) && transactions.length > 0) {
      const amount = transactions[0].amount;
      return parseFloat(amount) || 0;
    }
  }
  return 0;
}

function extractDateFromBank(bankTransaction: any): string {
  if (bankTransaction.extractedData?.transactions) {
    const transactions = bankTransaction.extractedData.transactions;
    if (Array.isArray(transactions) && transactions.length > 0) {
      const date = transactions[0].transactionDate;
      if (date) {
        return new Date(date).toLocaleDateString('pt-BR');
      }
    }
  }
  return 'Data não informada';
}

function extractDescriptionFromBank(bankTransaction: any): string {
  if (bankTransaction.extractedData?.transactions) {
    const transactions = bankTransaction.extractedData.transactions;
    if (Array.isArray(transactions) && transactions.length > 0) {
      return transactions[0].description || 'Descrição não disponível';
    }
  }
  return 'Descrição não disponível';
}

function formatAmount(amount: number): string {
  return `R$ ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function generateTextReport(report: DetailedReconciliationReport): string {
  let textReport = '=== RELATÓRIO DE RECONCILIAÇÃO PIX ===\n\n';
  
  textReport += `Data do Processamento: ${report.summary.processedAt.toLocaleString('pt-BR')}\n\n`;
  
  textReport += '--- RESUMO ---\n';
  textReport += `Total de Comprovantes PIX: ${report.summary.totalPixReceipts}\n`;
  textReport += `Total de Transações Bancárias: ${report.summary.totalBankTransactions}\n`;
  textReport += `Correspondências Encontradas: ${report.summary.matchedTransactions}\n`;
  textReport += `Não Reconciliados: ${report.summary.unmatchedTransactions}\n`;
  textReport += `Taxa de Reconciliação: ${report.summary.reconciliationRate}%\n\n`;
  
  if (report.matches.length > 0) {
    textReport += '--- CORRESPONDÊNCIAS ENCONTRADAS ---\n';
    report.matches.forEach((match, index) => {
      textReport += `\n${index + 1}. CORRESPONDÊNCIA:\n`;
      textReport += `   PIX: ${match.pixReceipt.payerName} - ${match.pixReceipt.amount} (${match.pixReceipt.date})\n`;
      textReport += `   BANCO: ${match.bankTransaction.payerName} - ${match.bankTransaction.amount} (${match.bankTransaction.date})\n`;
      textReport += `   Confiança: ${match.matchConfidence}%\n`;
      textReport += `   Status: ${match.status}\n`;
      if (match.reasons.length > 0) {
        textReport += `   Motivos: ${match.reasons.join(', ')}\n`;
      }
    });
  }
  
  textReport += '\n=== FIM DO RELATÓRIO ===';
  return textReport;
}