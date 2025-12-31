/**
 * Error logger pour tracker tous les retries et erreurs 429
 */
import * as fs from 'fs';
import * as path from 'path';

class ErrorLogger {
  private logFile: string;
  private retryCount = 0;
  private error429Count = 0;
  private error502Count = 0;
  private criticalErrors: string[] = [];

  constructor() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    this.logFile = path.join(process.cwd(), 'output', 'logs', `retry_errors_${timestamp}.log`);
    
    // Créer le fichier avec header
    this.writeLog('='.repeat(70));
    this.writeLog('🔍 RETRY & ERROR TRACKING LOG');
    this.writeLog(`Started: ${new Date().toISOString()}`);
    this.writeLog('='.repeat(70));
    this.writeLog('');
  }

  private writeLog(message: string) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, line);
  }

  logRetry(context: string, attempt: number, maxAttempts: number, errorType: string, delay: number) {
    this.retryCount++;
    if (errorType.includes('429')) this.error429Count++;
    if (errorType.includes('502')) this.error502Count++;
    
    const message = `⚠️  RETRY ${attempt}/${maxAttempts} | ${errorType} | Context: ${context} | Wait: ${delay/1000}s`;
    this.writeLog(message);
    console.log(`  ${message}`);
  }

  logCriticalError(context: string, error: string) {
    this.criticalErrors.push(`${context}: ${error}`);
    const message = `❌ CRITICAL ERROR | ${context} | ${error}`;
    this.writeLog(message);
    console.error(`\n${message}\n`);
  }

  logSuccess(context: string, attemptNumber: number) {
    if (attemptNumber > 1) {
      const message = `✅ SUCCESS after ${attemptNumber} attempts | ${context}`;
      this.writeLog(message);
    }
  }

  getSummary() {
    return {
      totalRetries: this.retryCount,
      error429Count: this.error429Count,
      error502Count: this.error502Count,
      criticalErrors: this.criticalErrors,
    };
  }

  writeFinalReport() {
    const summary = this.getSummary();
    
    this.writeLog('');
    this.writeLog('='.repeat(70));
    this.writeLog('📊 FINAL REPORT');
    this.writeLog(`Ended: ${new Date().toISOString()}`);
    this.writeLog('='.repeat(70));
    this.writeLog('');
    this.writeLog(`Total Retries: ${summary.totalRetries}`);
    this.writeLog(`  - 429 Errors: ${summary.error429Count}`);
    this.writeLog(`  - 502 Errors: ${summary.error502Count}`);
    this.writeLog('');
    
    if (summary.criticalErrors.length > 0) {
      this.writeLog(`❌ CRITICAL ERRORS (${summary.criticalErrors.length}):`);
      summary.criticalErrors.forEach(err => this.writeLog(`   ${err}`));
    } else {
      this.writeLog('✅ NO CRITICAL ERRORS - All retries succeeded');
    }
    
    this.writeLog('='.repeat(70));
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 RETRY SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Retries: ${summary.totalRetries} (429: ${summary.error429Count}, 502: ${summary.error502Count})`);
    console.log(`Critical Errors: ${summary.criticalErrors.length}`);
    console.log(`Log file: ${this.logFile}`);
    console.log('='.repeat(70) + '\n');
  }
}

export const errorLogger = new ErrorLogger();
