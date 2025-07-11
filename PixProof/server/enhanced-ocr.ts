// Enhanced OCR extraction specifically for Brazilian PIX receipts
export function extractEnhancedPIXData(ocrText: string) {
  const text = ocrText.toUpperCase();
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  console.log('Enhanced PIX extraction from lines:', lines.slice(0, 20));
  
  let payerName = undefined;
  let amount = undefined;
  let bankName = undefined;
  let cpf = undefined;
  let transactionDate = undefined;
  
  // Extract amount
  const amountMatch = text.match(/R\$?\s?(\d{1,3}(?:\.\d{3})*,\d{2})/);
  if (amountMatch) {
    amount = `R$ ${amountMatch[1]}`;
  }
  
  // Extract bank names
  if (text.includes('BRADESCO')) {
    bankName = 'BRADESCO';
  } else if (text.includes('INTER')) {
    bankName = 'BANCO INTER';
  } else if (text.includes('PICPAY')) {
    bankName = 'PICPAY';
  } else if (text.includes('NUBANK')) {
    bankName = 'NUBANK';
  } else if (text.includes('SANTANDER')) {
    bankName = 'SANTANDER';
  }
  
  // Extract CPF
  const cpfMatch = text.match(/(\*{0,3}\d{3}\.?\d{3}\.?\d{3}-?\d{2}\*{0,3})/);
  if (cpfMatch) {
    cpf = cpfMatch[1].replace(/\*/g, '');
  }
  
  // Extract date
  const dateMatch = text.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/);
  if (dateMatch) {
    try {
      const dateStr = dateMatch[1];
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length === 3) {
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        
        if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2020) {
          transactionDate = new Date(year, month - 1, day);
        }
      }
    } catch (error) {
      console.warn('Error parsing date:', dateMatch[1]);
    }
  }
  
  // Enhanced name extraction based on your comprovante patterns
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Pattern 1: Bradesco format - "Nome: LUCIMAR WACHHOLZ"
    if (line.startsWith('NOME:')) {
      const nameMatch = line.match(/^NOME:\s*([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+)/);
      if (nameMatch) {
        payerName = nameMatch[1].trim();
        console.log('Found payer name (Bradesco pattern):', payerName);
        break;
      }
    }
    
    // Pattern 2: PicPay format - Look for "De" section
    if (line === 'DE' && i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      // Check if next line is a name (not CPF, not other data)
      if (nextLine.match(/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+$/) && 
          nextLine.length > 3 && 
          !nextLine.includes('CPF') && 
          !nextLine.includes('CNPJ') &&
          !nextLine.includes('PICPAY')) {
        payerName = nextLine.trim();
        console.log('Found payer name (PicPay De pattern):', payerName);
        break;
      }
    }
    
    // Pattern 3: Inter format - Look for "Dados do pagador" section
    if (line.includes('DADOS DO PAGADOR')) {
      // Look ahead for the name in the next few lines
      for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        const candidateLine = lines[j];
        if (candidateLine.match(/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]+$/) && 
            candidateLine.length > 5 && 
            !candidateLine.includes('CPF') &&
            !candidateLine.includes('BANCO') &&
            !candidateLine.includes('NOME') &&
            candidateLine !== 'NOME') {
          payerName = candidateLine.trim();
          console.log('Found payer name (Inter pattern):', payerName);
          break;
        }
      }
      if (payerName) break;
    }
  }
  
  // Final fallback: look for any reasonable name candidate
  if (!payerName) {
    console.log('Using fallback name extraction...');
    for (const line of lines) {
      if (line.match(/^[A-ZÁÀÂÃÉÊÍÓÔÕÚÇ\s]{5,50}$/) && 
          !line.includes('PIX') && 
          !line.includes('BANCO') && 
          !line.includes('BRADESCO') &&
          !line.includes('INTER') &&
          !line.includes('PICPAY') &&
          !line.includes('R$') && 
          !line.includes('CPF') && 
          !line.includes('CNPJ') &&
          !line.includes('COMPROVANTE') &&
          !line.includes('CONCLUÍDO') &&
          !line.includes('OPERAÇÃO') &&
          !line.includes('VALOR') &&
          !line.includes('DATA') &&
          !line.includes('HORA') &&
          !line.includes('NUMERO') &&
          line.length > 8) {
        payerName = line.trim();
        console.log('Found payer name (fallback pattern):', payerName);
        break;
      }
    }
  }
  
  console.log('Enhanced extraction results:', {
    amount,
    payerName,
    bankName,
    cpf,
    transactionDate
  });
  
  return {
    amount,
    payerName,
    payerDocument: cpf,
    bankName,
    transactionDate,
    confidence: payerName ? 85 : 50
  };
}