import crypto from 'crypto';
import fs from 'fs';

export interface CacheEntry {
  hash: string;
  result: any;
  timestamp: number;
  confidence: number;
}

export class OCRCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxAge: number = 24 * 60 * 60 * 1000; // 24 horas
  private maxSize: number = 1000; // máximo 1000 entradas

  constructor() {
    // Limpar cache expirado a cada hora
    setInterval(() => {
      this.cleanExpiredEntries();
    }, 60 * 60 * 1000);
  }

  private generateFileHash(filePath: string): string {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      return crypto.createHash('sha256').update(fileBuffer).digest('hex');
    } catch (error) {
      console.error('Error generating file hash:', error);
      return '';
    }
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.maxAge) {
        this.cache.delete(key);
        cleanedCount++;
      }
    }

    // Se ainda houver muitas entradas, remover as mais antigas
    if (this.cache.size > this.maxSize) {
      const sortedEntries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toDelete = sortedEntries.slice(0, this.cache.size - this.maxSize);
      toDelete.forEach(([key]) => this.cache.delete(key));
      cleanedCount += toDelete.length;
    }

    if (cleanedCount > 0) {
      console.log(`OCR Cache: Removed ${cleanedCount} expired entries`);
    }
  }

  isCached(filePath: string): boolean {
    const hash = this.generateFileHash(filePath);
    if (!hash) return false;

    const entry = this.cache.get(hash);
    if (!entry) return false;

    // Verificar se não expirou
    const isExpired = Date.now() - entry.timestamp > this.maxAge;
    if (isExpired) {
      this.cache.delete(hash);
      return false;
    }

    return true;
  }

  get(filePath: string): any | null {
    const hash = this.generateFileHash(filePath);
    if (!hash) return null;

    const entry = this.cache.get(hash);
    if (!entry) return null;

    // Verificar se não expirou
    const isExpired = Date.now() - entry.timestamp > this.maxAge;
    if (isExpired) {
      this.cache.delete(hash);
      return null;
    }

    console.log(`OCR Cache: HIT for file hash ${hash.substring(0, 8)}...`);
    return entry.result;
  }

  set(filePath: string, result: any, confidence: number = 0): void {
    const hash = this.generateFileHash(filePath);
    if (!hash) return;

    // Só fazer cache de resultados com confiança razoável
    if (confidence < 0.5) {
      console.log(`OCR Cache: Skipping cache for low confidence result (${confidence})`);
      return;
    }

    const entry: CacheEntry = {
      hash,
      result,
      timestamp: Date.now(),
      confidence
    };

    this.cache.set(hash, entry);
    console.log(`OCR Cache: STORED result for file hash ${hash.substring(0, 8)}... (confidence: ${confidence})`);

    // Limpar se necessário
    if (this.cache.size > this.maxSize) {
      this.cleanExpiredEntries();
    }
  }

  clear(): void {
    this.cache.clear();
    console.log('OCR Cache: Cleared all entries');
  }

  getStats(): { size: number; maxSize: number; maxAge: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      maxAge: this.maxAge
    };
  }

  // Método para arquivos similares (baseado em tamanho e tipo)
  findSimilar(filePath: string, mimeType?: string): any | null {
    try {
      const stats = fs.statSync(filePath);
      const fileSize = stats.size;
      
      // Procurar arquivos com tamanho similar (+/- 5%)
      for (const [hash, entry] of this.cache.entries()) {
        const cachedResult = entry.result;
        if (cachedResult && cachedResult.fileSize) {
          const sizeDiff = Math.abs(cachedResult.fileSize - fileSize) / fileSize;
          if (sizeDiff < 0.05 && cachedResult.mimeType === mimeType) {
            console.log(`OCR Cache: Found similar file (size diff: ${(sizeDiff * 100).toFixed(1)}%)`);
            return cachedResult;
          }
        }
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }
}

// Instância global do cache
export const ocrCache = new OCRCache();